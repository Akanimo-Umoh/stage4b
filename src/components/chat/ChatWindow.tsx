import { useEffect, useRef } from "react"
import type { DecryptedMessage } from "@/hooks/useChat"
import type { ConversationSummary } from "@/services/chat.service"
import { MessageInput } from "./MessageInput"

type ChatWindowProps = {
  activeConversation: ConversationSummary | null
  messages: DecryptedMessage[]
  isLoadingMessages: boolean
  isSending: boolean
  error: string | null
  onSend: (text: string) => void
  currentUserId: string
  onBack: () => void
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

export function ChatWindow({
  activeConversation,
  messages,
  isLoadingMessages,
  isSending,
  error,
  onSend,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // empty state — only visible on md+ since mobile hides this panel when no conversation
  if (!activeConversation) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center gap-4 bg-[#222E35] md:flex">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2A3942]">
          <svg
            className="h-10 w-10 text-[#8696A0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <div className="px-8 text-center">
          <p className="text-lg font-medium text-[#E9EDEF]">WhisperBox</p>
          <p className="mt-1 text-sm text-[#8696A0]">
            Select a conversation or search for a user to start chatting
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-[#2A3942] px-4 py-2">
          <svg
            className="h-4 w-4 text-[#8696A0]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 8c2 0 6 1 6 3v1H6v-1c0-2 4-3 6-3z" />
          </svg>
          <span className="text-xs text-[#8696A0]">End-to-end encrypted</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#0B141A]">
      {/* chat header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#2A3942] bg-[#202C33] px-4 py-3">
        {/* back button — mobile only */}
        <button
          onClick={onBack}
          className="-ml-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#2A3942] md:hidden"
          aria-label="Back to conversations"
        >
          <svg
            className="h-5 w-5 text-[#8696A0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-sm font-semibold text-white">
          {getInitials(activeConversation.display_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#E9EDEF]">
            {activeConversation.display_name}
          </p>
          <p className="text-xs text-[#8696A0]">
            @{activeConversation.username}
          </p>
        </div>

        {/* e2ee badge */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#2A3942] px-3 py-1">
          <svg
            className="h-3 w-3 text-[#00A884]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
          <span className="hidden text-[11px] font-medium text-[#00A884] sm:inline">
            Encrypted
          </span>
        </div>
      </div>

      {/* error banner */}
      {error && (
        <div className="shrink-0 bg-[#8B0000] px-4 py-2">
          <p className="text-center text-xs text-white">{error}</p>
        </div>
      )}

      {/* message list */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4">
        {isLoadingMessages ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`h-10 animate-pulse rounded-2xl bg-[#2A3942] ${i % 2 === 0 ? "w-48" : "w-36"}`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm text-[#8696A0]">No messages yet</p>
            <p className="text-xs text-[#8696A0]">Say hello 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.from_user_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] md:max-w-[65%] ${
                    isOwn
                      ? "rounded-br-sm bg-[#005C4B]"
                      : "rounded-bl-sm bg-[#202C33]"
                  }`}
                >
                  {msg.decryptionFailed ? (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-3.5 w-3.5 shrink-0 text-[#8696A0]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <p className="text-xs text-[#8696A0] italic">
                        Message could not be decrypted
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed break-words text-[#E9EDEF]">
                      {msg.text}
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-[#8696A0]">
                      {formatTime(msg.created_at)}
                    </span>
                    {isOwn && (
                      <svg
                        className="h-3.5 w-3.5 text-[#8696A0]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} isSending={isSending} />
    </div>
  )
}
