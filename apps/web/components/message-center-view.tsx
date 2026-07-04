'use client';

import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@propvest/api-client';

export function MessageCenterView() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        {conversations?.length === 0 ? (
          <p className="text-muted-foreground">No conversations yet</p>
        ) : (
          conversations?.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4 mb-3">
              <p className="font-semibold">{c.listing?.title ?? 'Property'}</p>
              <p className="text-sm text-muted-foreground">
                {c._count?.messages ?? 0} messages
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}