import { useCallback, useEffect, useRef } from "react"

const WS_BASE_URL = "wss://whisperbox.koyeb.app/ws"

type EncryptedPayload = {
  ciphertext: string
  iv: string
  encryptedKey: string
  encryptedKeyForSelf: string
}

type IncomingMessage = {
  event: "message.receive"
  id: string
  from_user_id: string
  to_user_id: string
  payload: EncryptedPayload
  created_at: string
}

type PresenceEvent = {
  event: "user.online" | "user.offline"
  user_id: string
}

type ErrorEvent = {
  event: "error"
  detail: string
}

type ServerEvent = IncomingMessage | PresenceEvent | ErrorEvent

type UseWebSocketOptions = {
  onMessage: (msg: IncomingMessage) => void
  onPresence?: (event: PresenceEvent) => void
  onError?: (detail: string) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isManuallyClosed = useRef(false)
  const optionsRef = useRef(options)
  const connectRef = useRef<() => void>(() => {})

  // keep options ref current without re-running the effect
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    connectRef.current = () => {
      const token = sessionStorage.getItem("token")
      if (!token) return

      const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        optionsRef.current.onConnected?.()
      }

      ws.onmessage = (event) => {
        try {
          const data: ServerEvent = JSON.parse(event.data)
          if (data.event === "message.receive") {
            optionsRef.current.onMessage(data as IncomingMessage)
          } else if (
            data.event === "user.online" ||
            data.event === "user.offline"
          ) {
            optionsRef.current.onPresence?.(data as PresenceEvent)
          } else if (data.event === "error") {
            optionsRef.current.onError?.((data as ErrorEvent).detail)
          }
        } catch {
          console.error("Failed to parse WebSocket message")
        }
      }

      ws.onclose = () => {
        optionsRef.current.onDisconnected?.()
        if (!isManuallyClosed.current) {
          reconnectTimer.current = setTimeout(() => connectRef.current(), 3000)
        }
      }

      ws.onerror = () => {
        optionsRef.current.onError?.("WebSocket connection error")
      }
    }
  }, [])

  // send an encrypted message via WebSocket
  const sendMessage = useCallback((to: string, payload: EncryptedPayload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open — message not sent")
      return false
    }

    wsRef.current.send(
      JSON.stringify({
        event: "message.send",
        to,
        payload,
      })
    )

    return true
  }, [])

  // disconnect manually (on logout)
  const disconnect = useCallback(() => {
    isManuallyClosed.current = true
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    isManuallyClosed.current = false
    connectRef.current()

    return () => {
      isManuallyClosed.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [])

  return { sendMessage, disconnect }
}
