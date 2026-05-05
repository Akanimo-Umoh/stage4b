import {
  deriveAesKwKey,
  fromBase64,
  generateRegistrationKeys,
  importPublicKey,
  unwrapPrivateKey,
} from "@/crypto/keyPair"
import api from "./api"
import { storeKeyPair } from "@/crypto/storage"

type SignupPayload = {
  username: string
  display_name: string
  password: string
}

type LoginPayload = {
  username: string
  password: string
}

export const signup = async (payload: SignupPayload) => {
  // generate all key material from password before hitting the api
  const keys = await generateRegistrationKeys(payload.password)

  const { data } = await api.post("/auth/register", {
    username: payload.username,
    display_name: payload.display_name,
    password: payload.password,
    public_key: keys.publicKey,
    wrapped_private_key: keys.wrappedPrivateKey,
    pbkdf2_salt: keys.pbkdf2Salt,
  })

  // store the raw crypto key objects in IndexedDB - never serialized
  await storeKeyPair(data.user.id, keys.rawPublicKey, keys.rawPrivateKey)

  // store token
  sessionStorage.setItem("token", data.access_token)

  return data
}

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post("/auth/login", payload)

  const { user, access_token } = data

  // re-derive the AES-KW key from the password + salt returned by server
  const salt = fromBase64(user.pbkdf2_salt)
  const saltArray = new Uint8Array(salt) as Uint8Array<ArrayBuffer>
  const aesKwKey = await deriveAesKwKey(payload.password, saltArray)

  // unwrap the private key back into a CryptoKey
  const wrappedBuffer = fromBase64(user.wrapped_private_key)
  const privateKey = await unwrapPrivateKey(wrappedBuffer, aesKwKey)

  // import the public key back into a CryptoKey
  const publicKey = await importPublicKey(user.public_key)

  // store both in IndexedDB
  await storeKeyPair(user.id, publicKey, privateKey)

  sessionStorage.setItem("token", access_token)

  return data
}
