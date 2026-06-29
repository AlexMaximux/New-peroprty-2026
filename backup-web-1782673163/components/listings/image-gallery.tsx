'use client';

import { useState } from 'react';

export interface GalleryImage {
  id: string;
  url?: string | null;
  fileKey: string;
  isPrimary?: boolean;
  originalName?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const primary = images.findIndex((img) => img.isPrimary);
    return primary >= 0 ? primary : 0;
  });
  const current = images[selectedIndex];

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-deep-800 sm:h-80">
        <div className="text-center text-slate-500">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm">No images yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero image */}
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-deep-900 sm:h-80">
        {current?.url ? (
          <img
            src={current.url}
            alt={current.originalName ?? 'Property image'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-xs text-slate-600">Image preview unavailable</p>
            </div>
          </div>
        )}
        {images.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {selectedIndex + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === selectedIndex
                  ? 'border-gold-500 ring-1 ring-gold-500/50'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-16 w-20 object-cover sm:h-20 sm:w-24"
                />
              ) : (
                <div className="flex h-16 w-20 items-center justify-center bg-deep-700 text-xs text-slate-500 sm:h-20 sm:w-24">
                  #{i + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
