// @propvest/api-client — Typed fetch wrapper
// App is empty stub; client will be built in Phase 1+.

export const PACKAGE_NAME = '@propvest/api-client';

// Mock functions for development
export async function createListing(listingData: any): Promise<any> {
  return {
    id: 'mock-listing-id',
    ...listingData,
  };
}

export async function getConversations(): Promise<any[]> {
  return [];
}

export async function getListing(_id: string): Promise<any> {
  return { id: _id };
}

export async function getMessages(_conversationId: string, _page = 1): Promise<any> {
  return {
    data: [],
    meta: { total: 0, page: _page, limit: 50, totalPages: 0 },
  };
}

export async function sendMessage(_conversationId: string, _body: string): Promise<any> {
  return { id: 'mock-message-id', conversationId: _conversationId, body: _body, createdAt: new Date().toISOString() };
}

export async function markAsRead(_conversationId: string): Promise<void> {
  return;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return { count: 0 };
}

export async function getAgencyListings(): Promise<any[]> {
  return [];
}

export async function getFavourites(): Promise<any[]> {
  return [];
}

export async function addFavourite(_listingId: string): Promise<any> {
  return { userId: 'mock-user-id', listingId: _listingId };
}

export async function removeFavourite(_listingId: string): Promise<void> {
  return;
}

export async function startConversation(_listingId: string): Promise<any> {
  return { id: 'mock-conversation-id', listingId: _listingId, buyerUserId: 'mock-user-id', agencyUserId: 'mock-agency-id', createdAt: new Date().toISOString() };
}

export async function updateListing(_id: string, _body: Record<string, unknown>): Promise<any> {
  return { id: _id, ..._body };
}

export async function presignUpload(_listingId: string, _fileName: string, _mimeType: string): Promise<{ uploadUrl: string; fileKey: string }> {
  return {
    uploadUrl: 'https://example.com/upload',
    fileKey: 'mock-file-key',
  };
}

export async function confirmMedia(_listingId: string, _fileKey: string, _mimeType: string, _isPrimary?: boolean): Promise<{ id: string }> {
  return { id: 'mock-media-id' };
}

export async function deleteMedia(_listingId: string, _mediaId: string): Promise<{ deleted: boolean }> {
  return { deleted: true };
}

export async function uploadImage(_listingId: string, _file: File, _isPrimary?: boolean): Promise<{ id: string; fileKey: string }> {
  return {
    id: 'mock-media-id',
    fileKey: 'mock-file-key',
  };
}

export async function searchListings(_filters?: any): Promise<any> {
  return {
    data: [],
    meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
  };
}