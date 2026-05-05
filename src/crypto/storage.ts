import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "whisperbox_keys"
const DB_VERSION = 1
const STORE_NAME = "keys"

type KeyRecord = {
  userId: string
  publicKey: CryptoKey
  privateKey: CryptoKey
}

const getDb = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "userId" })
      }
    },
  })
}

export const storeKeyPair = async (
  userId: string,
  publicKey: CryptoKey,
  privateKey: CryptoKey
): Promise<void> => {
  const db = await getDb()
  const record: KeyRecord = { userId, publicKey, privateKey }
  await db.put(STORE_NAME, record)
}

export const getKeyPair = async (
  userId: string
): Promise<KeyRecord | undefined> => {
  const db = await getDb()
  return db.get(STORE_NAME, userId)
}

export const getPrivateKey = async (
  userId: string
): Promise<CryptoKey | null> => {
  const record = await getKeyPair(userId)
  return record?.privateKey ?? null
}

export const getPublicKey = async (
  userId: string
): Promise<CryptoKey | null> => {
  const record = await getKeyPair(userId)
  return record?.publicKey ?? null
}

export const clearKeys = async (userId: string): Promise<void> => {
  const db = await getDb()
  await db.delete(STORE_NAME, userId)
}