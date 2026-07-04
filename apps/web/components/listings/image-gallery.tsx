"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: string[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-[var(--bg-card)]", className)}>
      {/* Main Image */}
      <div className="relative aspect-video">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] flex items-center justify-center"
          style={{ background: images[currentIndex] }}
        >
          <span className="text-[var(--text-faint)] text-lg">Property Image {currentIndex + 1}</span>
        </div>

        {/* Prev/Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                i === currentIndex
                  ? "border-[var(--accent)]"
                  : "border-transparent hover:border-[var(--border)]"
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === currentIndex ? "true" : "false"}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)]"
                style={{ background: image }}
              />
              {i === currentIndex && (
                <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
