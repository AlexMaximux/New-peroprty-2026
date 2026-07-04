'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConversations, getUnreadCount, type Conversation } from '@/lib/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [convs, unreadRes] = await Promise.all([
        getConversations(),
        getUnreadCount(),
      ]);
      setConversations(convs);
      setUnread(unreadRes.count);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded bg-deep-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          {unread > 0 && (
            <p className="mt-0.5 text-sm text-gold-400">
              {unread} unread {unread === 1 ? 'message' : 'messages'}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="glass-card mb-6 border border-red-400/20 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchData} className="btn-secondary mt-3 text-xs !px-4 !py-1.5">
            Retry
          </button>
        </div>
      )}

      {!error && conversations.length === 0 && (
        <div className="glass-card p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-slate-300">No conversations yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse listings and send an enquiry to start a conversation.
          </p>
          <Link href="/browse" className="btn-primary mt-6 inline-block text-sm">
            Browse Deals
          </Link>
        </div>
      )}

      {!error && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="glass-card group flex items-start gap-4 p-4 transition hover:border-gold-500/30"
            >
              {/* Avatar placeholder */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-deep-700 text-sm font-bold text-slate-400">
                {conv.buyer.displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold group-hover:text-gold-400 transition">
                      {conv.listing.title}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {conv.buyer.displayName} · {conv.listing.city}
                    </p>
                  </div>
                  {conv._count.messages > 0 && (
                    <span className="shrink-0 rounded-full bg-deep-700 px-2 py-0.5 text-xs text-slate-400">
                      {conv._count.messages}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Started {new Date(conv.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}