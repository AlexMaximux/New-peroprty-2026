"use client"

import * as React from "react"
import { Send, X, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getConversations, getMessages, sendMessage, getMe } from "@/lib/api"
import { useSearchParams } from "next/navigation"

export default function MessagesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading messages...</div>}>
      <MessagesContent />
    </React.Suspense>
  )
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get("conversationId")

  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(initialConvId)
  const [message, setMessage] = React.useState("")
  const queryClient = useQueryClient()

  // Get current user to determine sender side (buyer vs agency)
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
  })

  // Fetch all conversations
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  })

  // Set initial selected conversation if none selected and data loaded
  React.useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]?.id || null)
    }
  }, [conversations, selectedConversation])

  const activeConversation = conversations.find((c) => c.id === selectedConversation)

  // Fetch messages for active conversation
  const { data: messagesResponse, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedConversation],
    queryFn: () => getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 5000, // simple polling
  })

  const messages = messagesResponse?.data || []

  const sendMessageMutation = useMutation({
    mutationFn: (body: string) => sendMessage(selectedConversation!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation] })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      setMessage("")
    },
  })

  const handleSend = () => {
    if (message.trim() && selectedConversation) {
      sendMessageMutation.mutate(message)
    }
  }

  // Auto-scroll to bottom of messages
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-primary)]">
      {/* Sidebar - Conversations */}
      <aside className="w-full sm:w-80 lg:w-[30%] border-r border-[var(--border)] flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-display text-xl font-normal text-[var(--text-primary)]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">No conversations yet.</div>
          ) : (
            conversations.map((convo) => {
              const otherUser = user?.id === convo.buyerUserId ? "Agency Agent" : (convo.buyer?.displayName || "Unknown Buyer");
              // Actually we should format date properly, for now use raw createdAt or updatedAt
              const dateStr = new Date(convo.updatedAt).toLocaleDateString()
              
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo.id)}
                  className={cn(
                    "w-full p-4 text-left border-b border-[var(--border)] transition-all duration-200 flex gap-3",
                    selectedConversation === convo.id ? "bg-[var(--accent-subtle)] border-l-4 border-[var(--accent)]" : "hover:bg-[var(--bg-card-hover)]"
                  )}
                  aria-selected={selectedConversation === convo.id}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {(convo.listing?.media?.[0] as any)?.url ? (
                      <img src={(convo.listing.media[0] as any).url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xs text-[var(--text-faint)] font-mono">Deal</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-[var(--text-primary)] truncate">{convo.listing?.title || "Unknown Listing"}</p>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] truncate">{otherUser}</p>
                    <p className="text-xs text-[var(--text-faint)] mt-1">{dateStr}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Main - Chat Thread */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Property Context Card */}
        {activeConversation && (
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                   {(activeConversation.listing?.media?.[0] as any)?.url ? (
                      <img src={(activeConversation.listing.media[0] as any).url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xs text-[var(--text-faint)]">Image</span>
                    )}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{activeConversation.listing?.title || "Unknown Listing"}</p>
                  <p className="text-sm text-[var(--text-muted)]">{activeConversation.listing?.postcode || ""}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConversation(null)}
                className="text-[var(--text-faint)] hover:text-[var(--text-primary)]" 
                aria-label="Close conversation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeConversation ? (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)]">Select a conversation</div>
          ) : loadingMessages ? (
             <div className="text-center text-sm text-[var(--text-muted)]">Loading messages...</div>
          ) : messages.length === 0 ? (
             <div className="text-center text-sm text-[var(--text-muted)]">No messages in this conversation. Say hi!</div>
          ) : (
            messages.map((msg) => {
              const isMe = user?.id === msg.senderUserId;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[70%] space-y-2",
                    isMe ? "items-end" : "items-start"
                  )}>
                    {!isMe && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium">
                          {msg.sender?.displayName?.[0] || "?"}
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <div className={cn(
                      "px-4 py-3 rounded-xl text-sm whitespace-pre-wrap",
                      isMe
                        ? "bg-[var(--accent)]/20 text-[var(--text-primary)] rounded-br-none"
                        : "bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-none"
                    )}>
                      {msg.body}
                    </div>
                    {isMe && (
                      <span className="text-xs text-[var(--text-faint)] block text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {activeConversation && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Type your message..."
                  className="w-full min-h-[80px] max-h-40 resize-none px-4 py-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all"
                  aria-label="Message input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Attach file">
                  <Paperclip className="w-5 h-5 text-[var(--text-muted)]" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="h-10 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
