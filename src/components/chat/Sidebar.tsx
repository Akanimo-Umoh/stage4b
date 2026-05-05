import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import type {
  ConversationSummary,
  UserSearchResult,
} from "@/services/chat.service"

type SidebarProps = {
  conversations: ConversationSummary[]
  activeConversation: ConversationSummary | null
  searchResults: UserSearchResult[]
  isLoadingConversations: boolean
  onSelectConversation: (c: ConversationSummary) => void
  onSearch: (q: string) => void
  onStartConversation: (u: UserSearchResult) => void
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const formatTime = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
}

export function Sidebar({
  conversations,
  activeConversation,
  searchResults,
  isLoadingConversations,
  onSelectConversation,
  onSearch,
  onStartConversation,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [query, setQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setShowDropdown(true)
    onSearch(val)
  }

  const handleSelectUser = (u: UserSearchResult) => {
    setQuery("")
    setShowDropdown(false)
    onStartConversation(u)
  }

  return (
    <aside className="flex h-full w-full flex-col">
      {/* header */}
      <div className="flex items-center justify-between bg-[#202C33] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-sm font-semibold text-white">
            {user?.display_name ? getInitials(user.display_name) : "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-medium text-[#E9EDEF]">
              {user?.display_name}
            </p>
            <p className="truncate text-xs text-[#8696A0]">@{user?.username}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex min-h-[44px] shrink-0 cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[#8696A0] transition-colors hover:bg-[#2A3942] hover:text-[#E9EDEF]"
        >
          Logout
        </button>
      </div>

      {/* search */}
      <div className="bg-[#111B21] px-3 py-2" ref={searchRef}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              className="h-4 w-4 text-[#8696A0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            onFocus={() => query && setShowDropdown(true)}
            placeholder="Search or start new chat"
            className="min-h-[44px] w-full rounded-lg bg-[#202C33] py-2.5 pr-4 pl-9 text-sm text-[#E9EDEF] placeholder-[#8696A0] outline-none focus:ring-1 focus:ring-[#00A884]"
          />

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-[#2A3942] bg-[#202C33] shadow-xl">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#2A3942]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-xs font-semibold text-white">
                    {getInitials(u.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#E9EDEF]">
                      {u.display_name}
                    </p>
                    <p className="truncate text-xs text-[#8696A0]">
                      @{u.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && query && searchResults.length === 0 && (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-lg border border-[#2A3942] bg-[#202C33] shadow-xl">
              <p className="px-4 py-3 text-sm text-[#8696A0]">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* e2ee indicator */}
      <div className="flex items-center justify-center gap-1.5 border-b border-[#2A3942] bg-[#111B21] py-2">
        <svg
          className="h-3 w-3 text-[#8696A0]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 8c2 0 6 1 6 3v1H6v-1c0-2 4-3 6-3z" />
        </svg>
        <span className="text-[11px] text-[#8696A0]">End-to-end encrypted</span>
      </div>

      {/* conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-[#2A3942] px-4 py-3"
              >
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-[#2A3942]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#2A3942]" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[#2A3942]" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#202C33]">
              <svg
                className="h-8 w-8 text-[#8696A0]"
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
            <p className="text-sm text-[#8696A0]">No conversations yet</p>
            <p className="text-xs text-[#8696A0]">
              Search for a user to start chatting
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.user_id}
              onClick={() => onSelectConversation(c)}
              className={`flex min-h-[72px] w-full cursor-pointer items-center gap-3 border-b border-[#2A3942] px-4 py-3 text-left transition-colors hover:bg-[#2A3942] ${
                activeConversation?.user_id === c.user_id ? "bg-[#2A3942]" : ""
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A884] font-semibold text-white">
                {getInitials(c.display_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-[#E9EDEF]">
                    {c.display_name}
                  </p>
                  <span className="ml-2 shrink-0 text-[11px] text-[#8696A0]">
                    {formatTime(c.last_message_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <svg
                    className="h-3 w-3 shrink-0 text-[#8696A0]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <p className="truncate text-xs text-[#8696A0]">
                    Encrypted message
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
