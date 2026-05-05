import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { useWebSocket } from "./useWebSocket"
import { getPrivateKey, getPublicKey } from "@/crypto/storage"
import {
  encryptMessage,
  decryptMessage,
  importRecipientPublicKey,
} from "@/crypto/messaging"
import {
  getConversations,
  getMessages,
  sendMessageRest,
  getRecipientPublicKey,
  type ConversationSummary,
  type Message,
  type UserSearchResult,
} from "@/services/chat.service"
import { searchUsers } from "@/services/chat.service"

// decrypted message — what the UI actually renders
export type DecryptedMessage = {
  id: string
  from_user_id: string
  to_user_id: string
  text: string
  created_at: string
  decryptionFailed?: boolean
}

export const useChat = () => {
  const { user } = useAuth()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversation, setActiveConversation] =
    useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // cache recipient public keys so we don't fetch on every message
  const publicKeyCache = useRef<Map<string, CryptoKey>>(new Map())

  // ── helpers ──────────────────────────────────────────────────────────────

  const getOrFetchRecipientKey = useCallback(
    async (userId: string): Promise<CryptoKey> => {
      if (publicKeyCache.current.has(userId)) {
        return publicKeyCache.current.get(userId)!
      }
      const base64 = await getRecipientPublicKey(userId)
      const key = await importRecipientPublicKey(base64)
      publicKeyCache.current.set(userId, key)
      return key
    },
    []
  )

  const decryptOne = useCallback(
    async (msg: Message): Promise<DecryptedMessage> => {
      if (!user) throw new Error("No user")

      const privateKey = await getPrivateKey(user.id)
      if (!privateKey) throw new Error("Private key not found")

      const isSender = msg.from_user_id === user.id

      try {
        const text = await decryptMessage(msg.payload, privateKey, isSender)
        return {
          id: msg.id,
          from_user_id: msg.from_user_id,
          to_user_id: msg.to_user_id,
          text,
          created_at: msg.created_at,
        }
      } catch {
        // decryption failed — show placeholder instead of crashing
        return {
          id: msg.id,
          from_user_id: msg.from_user_id,
          to_user_id: msg.to_user_id,
          text: "",
          created_at: msg.created_at,
          decryptionFailed: true,
        }
      }
    },
    [user]
  )

  // ── conversations ─────────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const data = await getConversations()
      setConversations(data)
    } catch {
      setError("Failed to load conversations")
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  // initial load on mount — inline to avoid calling setState via a callback in an effect
  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      setIsLoadingConversations(true)
      try {
        const data = await getConversations()
        if (!cancelled) setConversations(data)
      } catch {
        if (!cancelled) setError("Failed to load conversations")
      } finally {
        if (!cancelled) setIsLoadingConversations(false)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [])

  // ── messages ──────────────────────────────────────────────────────────────

  const loadMessages = useCallback(
    async (userId: string) => {
      setIsLoadingMessages(true)
      setMessages([])
      try {
        // API returns newest first — reverse so oldest is at top
        const raw = await getMessages(userId)
        const decrypted = await Promise.all(raw.map(decryptOne))
        setMessages(decrypted.reverse())
      } catch {
        setError("Failed to load messages")
      } finally {
        setIsLoadingMessages(false)
      }
    },
    [decryptOne]
  )

  const selectConversation = useCallback(
    (conversation: ConversationSummary) => {
      setActiveConversation(conversation)
      loadMessages(conversation.user_id)
    },
    [loadMessages]
  )

  // ── websocket ─────────────────────────────────────────────────────────────

  const handleIncomingMessage = useCallback(
    async (msg: {
      id: string
      from_user_id: string
      to_user_id: string
      payload: Message["payload"]
      created_at: string
    }) => {
      const decrypted = await decryptOne({
        id: msg.id,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        payload: msg.payload,
        delivered: true,
        created_at: msg.created_at,
      })

      // only append to messages if this conversation is active
      setMessages((prev) => {
        const isActive =
          activeConversation?.user_id === msg.from_user_id ||
          activeConversation?.user_id === msg.to_user_id
        if (!isActive) return prev
        return [...prev, decrypted]
      })

      // refresh conversation list so latest message timestamp updates
      loadConversations()
    },
    [decryptOne, activeConversation, loadConversations]
  )

  const { sendMessage: wsSend, disconnect } = useWebSocket({
    onMessage: handleIncomingMessage,
    onError: (detail) => setError(detail),
  })

  // ── send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeConversation || !user) return
      setIsSending(true)
      setError(null)

      try {
        const recipientKey = await getOrFetchRecipientKey(
          activeConversation.user_id
        )
        const senderKey = await getPublicKey(user.id)
        if (!senderKey) throw new Error("Sender public key not found")

        const payload = await encryptMessage(text, recipientKey, senderKey)

        // try WebSocket first, fall back to REST
        const sent = wsSend(activeConversation.user_id, payload)
        if (!sent) await sendMessageRest(activeConversation.user_id, payload)

        // optimistically append own message
        const optimistic: DecryptedMessage = {
          id: crypto.randomUUID(),
          from_user_id: user.id,
          to_user_id: activeConversation.user_id,
          text,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimistic])
        loadConversations()
      } catch {
        setError("Failed to send message")
      } finally {
        setIsSending(false)
      }
    },
    [
      activeConversation,
      user,
      getOrFetchRecipientKey,
      wsSend,
      loadConversations,
    ]
  )

  // ── user search ───────────────────────────────────────────────────────────

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    try {
      const results = await searchUsers(q)
      setSearchResults(results)
    } catch {
      setError("Search failed")
    }
  }, [])

  const startConversation = useCallback(
    (result: UserSearchResult) => {
      // check if conversation already exists in the list
      const existing = conversations.find((c) => c.user_id === result.id)

      const conversation: ConversationSummary = existing ?? {
        user_id: result.id,
        display_name: result.display_name,
        username: result.username,
        last_message_at: new Date().toISOString(),
      }

      setSearchResults([])
      selectConversation(conversation)
    },
    [conversations, selectConversation]
  )

  return {
    // state
    conversations,
    activeConversation,
    messages,
    searchResults,
    isLoadingMessages,
    isLoadingConversations,
    isSending,
    error,
    // actions
    selectConversation,
    sendMessage,
    search,
    startConversation,
    disconnect,
  }
}
