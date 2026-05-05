import api from "./api"

export type ConversationSummary = {
  user_id: string
  display_name: string
  username: string
  last_message_at: string
}

export type EncryptedPayload = {
  ciphertext: string
  iv: string
  encryptedKey: string
  encryptedKeyForSelf: string
}

export type Message = {
  id: string
  from_user_id: string
  to_user_id: string
  payload: EncryptedPayload
  delivered: boolean
  created_at: string
}

export type UserSearchResult = {
  id: string
  username: string
  display_name: string
}

// get conversations
export const getConversations = async (): Promise<ConversationSummary[]> => {
  const { data } = await api.get("/conversations")
  return data
}

// get conversations with a particular user
export const getMessages = async (
  userId: string,
  limit = 50,
  before?: string
): Promise<Message[]> => {
  const { data } = await api.get(`/conversations/${userId}/messages`, {
    params: { limit, ...(before && { before }) },
  })
  return data
}

// messages — offline fallback
export const sendMessageRest = async (
  to: string,
  payload: EncryptedPayload
): Promise<Message> => {
  const { data } = await api.post("/messages", { to, payload })
  return data
}

// get users search
export const searchUsers = async (q: string): Promise<UserSearchResult[]> => {
  const { data } = await api.get("/users/search", { params: { q } })
  return data
}

// get users userid public key
export const getRecipientPublicKey = async (
  userId: string
): Promise<string> => {
  const { data } = await api.get(`/users/${userId}/public-key`)
  return data.public_key
}
