import { ChatWindow } from "@/components/chat/ChatWindow"
import { Sidebar } from "@/components/chat/Sidebar"
import { useChat } from "@/hooks/useChat"

export default function Chat() {
  const chat = useChat()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111B21]">
      <Sidebar
        conversations={chat.conversations}
        activeConversation={chat.activeConversation}
        searchResults={chat.searchResults}
        isLoadingConversations={chat.isLoadingConversations}
        onSelectConversation={chat.selectConversation}
        onSearch={chat.search}
        onStartConversation={chat.startConversation}
      />

      <ChatWindow
        activeConversation={chat.activeConversation}
        messages={chat.messages}
        isLoadingMessages={chat.isLoadingMessages}
        isSending={chat.isSending}
        error={chat.error}
        onSend={chat.sendMessage}
        currentUserId={chat.messages[0]?.from_user_id ?? ""}
      />
    </div>
  )
}
