import { toBase64, fromBase64, importPublicKey } from "./keyPair"

type EncryptedPayload = {
  ciphertext: string
  iv: string
  encryptedKey: string
  encryptedKeyForSelf: string
}

// encrypt a plaintext message for a recipient
export const encryptMessage = async (
  plaintext: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<EncryptedPayload> => {
  const encoder = new TextEncoder()

  // generate a one-time AES-GCM key and IV
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // encrypt the plaintext with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(plaintext)
  )

  // export the raw AES key so we can wrap it
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey)

  // wrap AES key with recipient's public key (so they can decrypt)
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey
  )

  // wrap AES key with sender's own public key (so sender can read sent messages)
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPublicKey,
    rawAesKey
  )

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv.buffer as ArrayBuffer),
    encryptedKey: toBase64(encryptedKey),
    encryptedKeyForSelf: toBase64(encryptedKeyForSelf),
  }
}

// decrypt a received message using your private key
export const decryptMessage = async (
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  isSender: boolean
): Promise<string> => {
  const decoder = new TextDecoder()

  // use encryptedKeyForSelf if we are the sender, encryptedKey if recipient
  const keyBlob = isSender ? payload.encryptedKeyForSelf : payload.encryptedKey

  // decrypt the AES key with our RSA private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    fromBase64(keyBlob)
  )

  // import the raw AES key back into a CryptoKey
  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )

  // decrypt the ciphertext
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    aesKey,
    fromBase64(payload.ciphertext)
  )

  return decoder.decode(plaintext)
}

// import a recipient's public key from base64 string fetched from API
export const importRecipientPublicKey = async (
  base64: string
): Promise<CryptoKey> => {
  return importPublicKey(base64)
}
