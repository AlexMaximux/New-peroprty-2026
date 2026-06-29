'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadImage, deleteMedia } from '@/lib/api';

export interface UploadedImage {
  id: string;
  fileKey: string;
  isPrimary: boolean;
  url?: string | null;
}

interface ImageUploaderProps {
  listingId: string;
  existingImages?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

export function ImageUploader({
  listingId,
  existingImages = [],
  onImagesChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback(
    (next: UploadedImage[]) => {
      setImages(next);
      onImagesChange?.(next);
    },
    [onImagesChange],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);

    const fileArray = Array.from(files).slice(0, 10); // max 10 per batch
    const isFirst = images.length === 0;

    for (const file of fileArray) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: Only image files allowed`);
        continue;
      }
      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: Max 10MB`);
        continue;
      }

      try {
        const result = await uploadImage(listingId, file, isFirst && images.length === 0);
        updateImages([
          ...images,
          { id: result.id, fileKey: result.fileKey, isPrimary: images.length === 0 && images.length === 0 },
        ]);
      } catch (err: any) {
        setError(`${file.name}: ${err.message ?? 'Upload failed'}`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (mediaId: string) => {
    try {
      await deleteMedia(listingId, mediaId);
      const next = images.filter((img) => img.id !== mediaId);
      // If we removed the primary, make the first remaining primary
      const removed = images.find((img) => img.id === mediaId);
      const nextUpdated = (removed?.isPrimary && next.length > 0)
        ? next.map((img, i) => (i === 0 ? { ...img, isPrimary: true } : img))
        : next;
      updateImages(nextUpdated);
    } catch (err: any) {
      setError(err.message ?? 'Delete failed');
    }
  };

  const handleSetPrimary = (mediaId: string) => {
    const next = images.map((img) => ({
      ...img,
      isPrimary: img.id === mediaId,
    }));
    updateImages(next);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Property Images
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
          dragOver
            ? 'border-gold-500 bg-gold-500/5'
            : 'border-deep-600 bg-deep-800/50 hover:border-deep-500'
        }`}
      >
        <svg className="mb-2 h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-slate-400">
          {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-600">Supports JPG, PNG, WebP · Max 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={`group relative overflow-hidden rounded-lg border ${
                img.isPrimary ? 'border-gold-500 ring-1 ring-gold-500/50' : 'border-deep-700'
              }`}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={`Upload ${i + 1}`}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center bg-deep-800 text-xs text-slate-500">
                  #{i + 1}
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(img.id);
                    }}
                    className="rounded bg-gold-500/20 px-2 py-1 text-[10px] text-gold-400 hover:bg-gold-500/30"
                    title="Set as primary"
                  >
                    ★ Primary
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(img.id);
                  }}
                  className="rounded bg-red-500/20 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/30"
                  title="Delete"
                >
                  ✕ Delete
                </button>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-gold-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-deep-950">
                  PRIMARY
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
