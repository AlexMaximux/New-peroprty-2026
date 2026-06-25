const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pv_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: options?.method ?? 'GET',
    headers: authHeaders(),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? `API error: ${res.status}`);
  }
  return data as T;
}

// ── Typed helpers ──

export interface ListingSearchResult {
  id: string;
  title: string;
  description: string | null;
  category: string;
  strategy: string | null;
  status: string;
  propertyType: string | null;
  postcode: string;
  city: string;
  region: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  askingPricePence: number | null;
  estimatedRoi: number | null;
  needsRefurb: boolean | null;
  isVacant: boolean | null;
  isTenanted: boolean | null;
  publishedAt: string | null;
  createdAt: string;
  media: { id: string; kind: string; fileKey: string; order: number }[];
  hmoRooms: { id: string; name: string; roomType: string; monthlyRentPence: number }[];
  portfolioAssets: { id: string; name: string; valuePence: number | null }[];
  agencyProfile: {
    companyName: string;
    contactName: string;
    user: { displayName: string };
  } | null;
  _count: { favourites: number };
}

export interface SearchResponse {
  data: ListingSearchResult[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SearchFilters {
  category?: string;
  strategy?: string;
  propertyType?: string;
  postcode?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  roiMin?: number;
  roiMax?: number;
  needsRefurb?: boolean;
  excludeSold?: boolean;
  excludeReserved?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function searchListings(filters: SearchFilters): Promise<SearchResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return apiFetch<SearchResponse>(`/listings/search${qs ? `?${qs}` : ''}`);
}

export interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  strategy: string | null;
  status: string;
  propertyType: string | null;
  addressLine1: string;
  city: string;
  postcode: string;
  region: string | null;
  nation: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floorArea: number | null;
  hasLivingRoom: boolean | null;
  hasGarden: boolean | null;
  gardenNotes: string | null;
  parking: string | null;
  furnishedStatus: string | null;
  isVacant: boolean | null;
  isTenanted: boolean | null;
  isLicensed: boolean | null;
  needsRefurb: boolean | null;
  refurbCostPence: number | null;
  askingPricePence: number | null;
  marketValuePence: number | null;
  estimatedRoi: number | null;
  strategySpecificData: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  media: { id: string; kind: string; fileKey: string; originalName: string; order: number }[];
  hmoRooms: { id: string; name: string; roomType: string; monthlyRentPence: number }[];
  portfolioAssets: { id: string; name: string; valuePence: number | null; notes: string | null }[];
  agencyProfile: {
    companyName: string;
    contactName: string;
    phone: string;
    user: { displayName: string };
  } | null;
  _count?: { favourites: number };
}

export async function getListing(id: string): Promise<ListingDetail> {
  return apiFetch<ListingDetail>(`/listings/${id}`);
}

// ── Favourites ──

export interface FavouriteResult {
  userId: string;
  listingId: string;
  createdAt: string;
  listing: ListingSearchResult;
}

export async function addFavourite(listingId: string): Promise<{ userId: string; listingId: string }> {
  return apiFetch(`/favourites/${listingId}`, { method: 'POST' });
}

export async function removeFavourite(listingId: string): Promise<void> {
  await apiFetch(`/favourites/${listingId}`, { method: 'DELETE' });
}

export async function getFavourites(): Promise<FavouriteResult[]> {
  return apiFetch<FavouriteResult[]>('/favourites');
}

// ── Messaging ──

export interface Conversation {
  id: string;
  listingId: string;
  buyerUserId: string;
  agencyUserId: string;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    postcode: string;
    media: { id: string; fileKey: string; order: number }[];
  };
  buyer: { id: string; displayName: string };
  _count: { messages: number };
}

export interface MessageResult {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; displayName: string };
}

export interface MessagesResponse {
  data: MessageResult[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function startConversation(listingId: string): Promise<Conversation> {
  return apiFetch<Conversation>('/conversations', {
    method: 'POST',
    body: { listingId },
  });
}

export async function getConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>('/conversations');
}

export async function getMessages(conversationId: string, page = 1): Promise<MessagesResponse> {
  return apiFetch<MessagesResponse>(`/conversations/${conversationId}/messages?page=${page}&limit=50`);
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageResult> {
  return apiFetch<MessageResult>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { body },
  });
}

export async function markAsRead(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/read`, { method: 'POST' });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/conversations/unread-count');
}

// ── Socket.IO helper ── (importable client-side only)
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (socketInstance?.connected) return socketInstance;

  const token = localStorage.getItem('pv_access_token');
  if (!token) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '');

  socketInstance = io(`${baseUrl}/ws`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}