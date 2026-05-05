// helpers
const toBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))

const fromBase64 = (b64: string): ArrayBuffer =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer

// generate RSA-OAEP key pair
export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  )
}

// derive AES-KW key from password using PBKDF2
export const deriveAesKwKey = async (
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> => {
  const encoder = new TextEncoder()

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310_000, // OWASP recommended minimum
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  )
}

// wrap private key with AES-KW
export const wrapPrivateKey = async (
  privateKey: CryptoKey,
  aesKwKey: CryptoKey
): Promise<ArrayBuffer> => {
  return crypto.subtle.wrapKey("pkcs8", privateKey, aesKwKey, "AES-KW")
}

// export public key as base64
export const exportPublicKey = async (
  publicKey: CryptoKey
): Promise<string> => {
  const exported = await crypto.subtle.exportKey("spki", publicKey)
  return toBase64(exported)
}

// main function called during register
export const generateRegistrationKeys = async (password: string) => {
  const salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(
    new Uint8Array(16)
  ) // 128-bit salt

  const keyPair = await generateKeyPair()
  const aesKwKey = await deriveAesKwKey(password, salt)
  const wrappedPrivateKey = await wrapPrivateKey(keyPair.privateKey, aesKwKey)
  const publicKey = await exportPublicKey(keyPair.publicKey)

  return {
    publicKey, // base64 — goes to server
    wrappedPrivateKey: toBase64(wrappedPrivateKey), // base64 — goes to server
    pbkdf2Salt: toBase64(salt.buffer), // base64 — goes to server
    rawPrivateKey: keyPair.privateKey, // CryptoKey — store in IndexedDB only
    rawPublicKey: keyPair.publicKey, // CryptoKey — store in IndexedDB only
  }
}

export { toBase64, fromBase64 }

// unwrap private key using AES-KW
export const unwrapPrivateKey = async (
  wrappedPrivateKey: ArrayBuffer,
  aesKwKey: CryptoKey
): Promise<CryptoKey> => {
  return crypto.subtle.unwrapKey(
    "pkcs8",
    wrappedPrivateKey,
    aesKwKey,
    "AES-KW",
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  )
}

// import public key from base64 spki back into a CryptoKey
export const importPublicKey = async (base64: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "spki",
    fromBase64(base64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  )
}
