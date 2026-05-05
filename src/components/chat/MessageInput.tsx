import { useState, useRef, type KeyboardEvent } from "react"

type MessageInputProps = {
  onSend: (text: string) => void
  isSending: boolean
}

export function MessageInput({ onSend, isSending }: MessageInputProps) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setText("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex shrink-0 items-end gap-2 bg-[#202C33] px-3 py-3 sm:px-4">
      <div className="flex-1 touch-manipulation rounded-2xl bg-[#2A3942] px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message"
          rows={1}
          disabled={isSending}
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#E9EDEF] placeholder-[#8696A0] outline-none disabled:opacity-50"
          style={{ maxHeight: "120px" }}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!text.trim() || isSending}
        className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#00A884] transition-all hover:bg-[#06CF9C] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSending ? (
          <svg
            className="h-4 w-4 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 translate-x-0.5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
