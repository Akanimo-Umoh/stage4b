import { ChatWindow } from "@/components/chat/ChatWindow"
import { Sidebar } from "@/components/chat/Sidebar"
import { useChat } from "@/hooks/useChat"
import { useAuth } from "@/context/AuthContext"

export default function Chat() {
  const chat = useChat()
  const { user } = useAuth()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111B21]">
      <div
        className={`${
          chat.activeConversation ? "hidden md:flex" : "flex"
        } w-full h-full shrink-0 md:w-[280px] lg:w-[380px]`}
      >
        <Sidebar
          conversations={chat.conversations}
          activeConversation={chat.activeConversation}
          searchResults={chat.searchResults}
          isLoadingConversations={chat.isLoadingConversations}
          onSelectConversation={chat.selectConversation}
          onSearch={chat.search}
          onStartConversation={chat.startConversation}
        />
      </div>

      <div
        className={`${
          !chat.activeConversation ? "hidden md:flex" : "flex"
        } flex-1 h-full min-w-0`}
      >
        <ChatWindow
          activeConversation={chat.activeConversation}
          messages={chat.messages}
          isLoadingMessages={chat.isLoadingMessages}
          isSending={chat.isSending}
          error={chat.error}
          onSend={chat.sendMessage}
          currentUserId={user?.id ?? ""}
          onBack={() => chat.selectConversation(null)}
        />
      </div>
    </div>
  )
}
