'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

export interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface StagedPhotoUploaderProps {
  photos: StagedPhoto[];
  onPhotosChange: (photos: StagedPhoto[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

let _counter = 0;
function uid(): string {
  _counter++;
  return `sp-${_counter}-${Date.now()}`;
}

export function StagedPhotoUploader({
  photos,
  onPhotosChange,
  maxFiles = 20,
  disabled = false,
}: StagedPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss validation error
  useEffect(() => {
    if (validationError) {
      const t = setTimeout(() => setValidationError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [validationError]);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      setValidationError(null);

      const fileArray = Array.from(files);
      const remaining = maxFiles - photos.length;
      if (remaining <= 0) {
        setValidationError(`Maximum ${maxFiles} photos allowed`);
        return;
      }

      const newPhotos: StagedPhoto[] = [];
      const errors: string[] = [];

      for (const file of fileArray.slice(0, remaining)) {
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Only image files allowed`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: Max 10MB`);
          continue;
        }

        newPhotos.push({
          id: uid(),
          file,
          previewUrl: URL.createObjectURL(file),
          isPrimary: photos.length === 0 && newPhotos.length === 0,
        });
      }

      if (errors.length > 0) {
        setValidationError(errors.join('. '));
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }

      if (inputRef.current) inputRef.current.value = '';
    },
    [photos, onPhotosChange, maxFiles, disabled],
  );

  const removePhoto = useCallback(
    (index: number) => {
      const removed = photos[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = photos.filter((_, i) => i !== index);
      if (removed?.isPrimary && next.length > 0) {
        const first = next[0]!;
        next[0] = { ...first, isPrimary: true };
      }
      onPhotosChange(next);
    },
    [photos, onPhotosChange],
  );

  const setPrimary = useCallback(
    (index: number) => {
      onPhotosChange(photos.map((p, i) => ({ ...p, isPrimary: i === index })));
    },
    [photos, onPhotosChange],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...photos];
      const tmp = next[index]!;
      next[index] = next[index - 1]!;
      next[index - 1] = tmp;
      onPhotosChange(next);
    },
    [photos, onPhotosChange],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= photos.length - 1) return;
      const next = [...photos];
      const tmp = next[index]!;
      next[index] = next[index + 1]!;
      next[index + 1] = tmp;
      onPhotosChange(next);
    },
    [photos, onPhotosChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Property Photos
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
          dragOver
            ? 'border-gold-500 bg-gold-500/5'
            : 'border-deep-600 bg-deep-800/50 hover:border-deep-500'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <svg
          className="mb-2 h-8 w-8 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-slate-400">
          {disabled ? 'Uploading...' : 'Drop images here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {photos.length}/{maxFiles} · JPG, PNG, WebP · Max 10MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{validationError}</p>
      )}

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`group relative overflow-hidden rounded-lg border ${
                photo.isPrimary ? 'border-gold-500 ring-1 ring-gold-500/50' : 'border-deep-700'
              }`}
            >
              <img
                src={photo.previewUrl}
                alt={`Photo ${i + 1}`}
                className="h-24 w-full object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  {!photo.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimary(i);
                      }}
                      className="rounded bg-gold-500/20 px-2 py-1 text-[10px] text-gold-400 hover:bg-gold-500/30"
                      title="Set as primary"
                    >
                      ★ Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(i);
                    }}
                    className="rounded bg-red-500/20 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/30"
                    title="Remove"
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(i);
                      }}
                      className="rounded bg-deep-700/80 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-deep-600"
                      title="Move up"
                    >
                      ▲
                    </button>
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(i);
                      }}
                      className="rounded bg-deep-700/80 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-deep-600"
                      title="Move down"
                    >
                      ▼
                    </button>
                  )}
                </div>
              </div>

              {/* Primary badge */}
              {photo.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-gold-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-deep-950">
                  PRIMARY
                </span>
              )}

              {/* Number badge */}
              <span className="absolute bottom-1 right-1 rounded bg-deep-900/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty hint */}
      {photos.length === 0 && !validationError && (
        <p className="py-2 text-center text-xs text-slate-500">No photos added yet</p>
      )}
    </div>
  );
}
