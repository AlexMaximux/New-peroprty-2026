# Frontend-Backend API Contract

This document outlines all API endpoints called by the frontend (web) of the PropVest application, including request/response shapes and where they are invoked.

## Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Base URL for the backend API | `http://localhost:3001/api/v1` |

> Defined in `apps/web/.env.local` (used via `process.env.NEXT_PUBLIC_API_URL`).

---

## API Endpoints (via `@propvest/api-client` / `~/lib/api`)

These functions are wrappers around `fetch` that handle authentication and JSON encoding/decoding.

| Method | Endpoint | Function | Request Type | Response Type | Usage (File / Location) |
|--------|----------|----------|--------------|---------------|--------------------------|
| POST | `/auth/refresh` | `refreshAccessToken()` | `{ refreshToken: string }` (read from `localStorage.pv_refresh_token`) | `{ accessToken: string; refreshToken?: string } \| null` | - `components/listings/new-listing-form.tsx` (dynamic import) <br> - `components/listings/wizard/rent-to-rent-wizard.tsx` (local wrapper & call) |
| GET | `/listings/search?{filters}` | `searchListings(filters)` | `SearchFilters` (query parameters) | `SearchResponse` { <br> `data: ListingSearchResult[]` <br> `meta: { total: number, page: number, limit: number, totalPages: number }` <br> } | - `app/browse/page.tsx` (browse page) <br> - `components/marketplace-view.tsx` (marketplace view) <br> - `components/investor-dashboard.tsx` (investor dashboard) |
| GET | `/listings/{id}` | `getListing(id)` | `id: string` (path param) | `ListingDetail` | - `app/listings/[id]/page.tsx` (listing detail page) <br> - `components/property-detail-view.tsx` (via `@propvest/api-client`) |
| GET | `/listings` | `getAgencyListings()` | (none) | `AgencyListingSummary[]` | - `app/agency/listings/page.tsx` (agency listings overview) |
| PATCH | `/listings/{id}` | `updateListing(id, body)` | `body: Record<string, unknown>` (patch payload) | `ListingDetail` | *(No direct calls found in frontend; likely used via admin/agency interfaces not yet implemented.)* |
| POST | `/listings/{listingId}/media/presign` | `presignUpload(listingId, fileName, mimeType)` | `{ fileName: string; mimeType: string }` | `{ uploadUrl: string; fileKey: string }` | - `components/listings/new-listing-form.tsx` <br> - `components/listings/wizard/rent-to-rent-wizard.tsx` <br> - `components/listings/image-uploader.tsx` (via `uploadImage`) |
| POST | `/listings/{listingId}/media/confirm` | `confirmMedia(listingId, fileKey, mimeType, isPrimary?)` | `{ fileKey: string; mimeType: string; isPrimary?: boolean }` | `{ id: string }` | - Same as above (used after PUT to S3) |
| DELETE | `/listings/{listingId}/media/{mediaId}` | `deleteMedia(listingId, mediaId)` | (none) | `{ deleted: boolean }` | - `components/listings/image-uploader.tsx` |
| POST | `/favourites/{listingId}` | `addFavourite(listingId)` | (none) | `{ userId: string; listingId: string }` | - `app/listings/[id]/page.tsx` (favorite toggle) |
| DELETE | `/favourites/{listingId}` | `removeFavourite(listingId)` | (none) | `void` | - `app/listings/[id]/page.tsx` |
| GET | `/favourites` | `getFavourites()` | (none) | `FavouriteResult[]` <br> where `FavouriteResult = { userId, listingId, createdAt, listing: ListingSearchResult }` | - `app/favourites/page.tsx` (favorites page) |
| POST | `/conversations` | `startConversation(listingId)` | `{ listingId: string }` | `Conversation` | - `app/listings/[id]/page.tsx` (start conversation) |
| GET | `/conversations` | `getConversations()` | (none) | `Conversation[]` | - `app/messages/page.tsx` (conversations list) <br> - `components/message-center-view.tsx` <br> - `components/sidebar.tsx` (unread badge) |
| GET | `/conversations/{conversationId}/messages?page={page}&limit=50` | `getMessages(conversationId, page)` | `conversationId: string` (path), `page: number` (query) | `MessagesResponse` { <br> `data: MessageResult[]` <br> `meta: { total, page, limit, totalPages }` <br> } | - `app/messages/[id]/page.tsx` (message thread) |
| POST | `/conversations/{conversationId}/messages` | `sendMessage(conversationId, body)` | `{ body: string }` | `MessageResult` | - `app/messages/[id]/page.tsx` (send message) |
| POST | `/conversations/{conversationId}/read` | `markAsRead(conversationId)` | (none) | `void` | - `app/messages/[id]/page.tsx` (mark as read) |
| GET | `/conversations/unread-count` | `getUnreadCount()` | (none) | `{ count: number }` | - `components/sidebar.tsx` (unread badge) |

> Note: `uploadImage` is a helper that combines `presignUpload`, a `PUT` to the returned `uploadUrl` (S3), and `confirmMedia`. It is used in `components/listings/image-uploader.tsx`.

---

## Direct Fetch Endpoints (not wrapped via api-client)

The following endpoints are called directly via `fetch()` in various pages/components, often for admin/agency-specific routes not yet abstracted into the API client.

| Method | Endpoint | Description | Request Type | Response Type | Usage (File / Location) |
|--------|----------|-------------|--------------|---------------|--------------------------|
| GET | `/listings/{id}` | Fetch a single listing (public/agency view) | `id: string` (path) | `ListingDetail` (or similar) | - `app/agency/listings/[id]/edit/page.tsx` <br> - `app/agency/listings/[id]/page.tsx` |
| GET | `/admin/agencies/{id}` | Get agency detail (admin) | `id: string` (path) | Agency object (see `AgencyProfile` etc.) | - `app/admin/agencies/[id]/page.tsx` |
| GET | `/agency/profile` | Get current agency's profile | (none) | `AgencyProfile` (with `user`, `companyName`, etc.) | - `app/agency/onboarding/page.jsx` (load step) |
| POST | `/agency/profile` | Create/update agency profile (onboarding) | `FormData` (multipart) or JSON (see code) | `AgencyProfile` | - `app/agency/onboarding/page.jsx` (submit step) |
| POST | `/agency/documents/upload-url` | Get presigned URL for document upload (onboarding) | (none) | `{ uploadUrl: string; fileKey: string }` | - `app/agency/onboarding/page.jsx` |
| PUT | `<uploadUrl>` (from above) | Upload file to S3 (direct) | `body: File`; `headers: { "Content-Type": file.type }` | (S3 puts object) | - `app/agency/onboarding/page.jsx` |
| POST | `/agency/documents/confirm` | Confirm uploaded document (onboarding) | `{ fileKey: string }` | `{ id: string }` (document record) | - `app/agency/onboarding/page.jsx` |
| GET | `/admin/agencies` | List all agencies (admin) | (none) | `AgencyProfile[]` (paginated?) | - `app/admin/agencies/page.tsx` |
| POST | `/admin/agencies/{id}/approve` | Approve pending agency | `id: string` (path) | `{ success: boolean }` | - `app/admin/agencies/page.tsx` |
| POST | `/admin/agencies/{id}/reject` | Reject pending agency | `id: string` (path) | `{ success: boolean, reason?: string }` | - `app/admin/agencies/page.tsx` |
| GET | `/admin/listings` | List all listings (admin) | (none) | `Listing[]` (with admin fields) | - `app/admin/listings/page.tsx` |
| POST | `/admin/listings/{id}/moderate` | Moderate (hide/unhide) a listing | `id: string` (path); body: `{ action: 'hide' \| 'unhide' }` | `{ success: boolean }` | - `app/admin/listings/page.tsx` |
| GET | `/admin/audit-log` | Fetch admin audit log | (none) | `AdminAuditLogEntry[]` | - `app/admin/audit-log/page.tsx` |
| POST | `/auth/register` | Register new user | `{ email, password, displayName, role? }` | `{ userId: string }` | - `app/register/page.tsx` |
| POST | `/auth/login` | Login user | `{ email, password }` | `{ accessToken, refreshToken }` | - `app/login/page.tsx` |
| POST | `/auth/refresh` | Refresh access token (also used via wrapper) | `{ refreshToken: string }` | `{ accessToken: string; refreshToken?: string }` | - `components/listings/wizard/rent-to-rent-wizard.tsx` (direct fallback) |
| GET | `/listings` | Browse listings (used in wizard) | (query params?) | `ListingSearchResult[]` | - `components/listings/wizard/rent-to-rent-wizard.tsx` |
| POST | `/listings` | Create a new listing (wizard) | (see `new-listing-form.tsx`) | `Listing` | - `components/listings/wizard/rent-to-rent-wizard.tsx` <br> - `components/listings/new-listing-form.tsx` (dynamic path) |
| PATCH | `/listings/{id}` | Update a listing (wizard/form) | (see `new-listing-form.tsx`) | `Listing` | - `components/listings/new-listing-form.tsx` |

> **Note**: Some direct fetches use helper functions like `getHeaders()` (from `utils.ts`) to attach auth tokens. The request/response types above are inferred from usage and may not be exhaustive; refer to the source files for exact shapes.

---

## How to Read This Document

- Each endpoint lists the HTTP method, path, the function (if wrapped), TypeScript types for request/response (where available), and the files/components that invoke it.
- For direct fetches, the request/response types are derived from the surrounding code (e.g., what is sent and what is expected back).
- When an endpoint is used via both a wrapper and a direct fetch, both usages are noted.
- This document is intended to be a source of truth for frontend–backend integration; if you add or modify endpoints, please update this file accordingly.

--- 
*Generated on 2026-06-29 based on the source tree at `/Users/nersibayat/Desktop/Programing/claude code-sand`.*