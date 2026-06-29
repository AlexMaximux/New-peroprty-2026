'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getSocket,
  type MessageResult,
  type MessagesResponse,
} from '@/lib/api';

export default function ConversationThread() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [messages, setMessages] = useState<MessageResult[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError('');
    try {
      const res: MessagesResponse = await getMessages(conversationId);
      setMessages(res.data);
      // Mark as read
      await markAsRead(conversationId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('403')) {
        router.push('/messages');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, router]);

  useEffect(() => {
    loadMessages();
    // Get current user ID from stored user data
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pv_user') : null;
    if (stored) {
      try { setCurrentUserId(JSON.parse(stored).id); } catch { /* ignore */ }
    }
  }, [loadMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket connection for realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (data: { conversationId: string; message: MessageResult }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message]);
        // Auto-mark as read
        markAsRead(conversationId).catch(() => {});
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [conversationId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, text);
      setInput('');
      // Optimistically reload to get the new message with full data
      const res = await getMessages(conversationId);
      setMessages(res.data);
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-deep-700" />
                <div className={`h-16 w-2/3 rounded-lg bg-deep-700 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col">
      {/* Back link */}
      <button
        onClick={() => router.push('/messages')}
        className="mb-3 flex items-center gap-1 text-xs text-slate-500 hover:text-white transition"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Messages
      </button>

      {/* Messages area */}
      <div className="glass-card flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {error && (
            <div className="rounded-lg bg-red-400/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {!error && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-slate-500">
              <div>
                <p className="text-sm">No messages yet</p>
                <p className="mt-1 text-xs">Send a message to start the conversation.</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = currentUserId === msg.sender.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'rounded-br-sm bg-gold-500/20 text-slate-200'
                      : 'rounded-bl-sm bg-deep-700 text-slate-300'
                  }`}
                >
                  {!isMine && (
                    <p className="mb-0.5 text-xs font-medium text-gold-400/70">
                      {msg.sender.displayName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <span className="text-[10px] text-slate-500">
                        {msg.readAt ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 p-4">
          <div className="flex gap-2">
            <textarea
              className="input-field flex-1 resize-none text-sm"
              rows={2}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="btn-primary shrink-0 self-end text-sm !px-4 !py-2"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}