'use client';

import { useState } from 'react';
import { StagedPhotoUploader, type StagedPhoto } from '@/components/listings/staged-photo-uploader';

interface Props {
  initialData?: StagedPhoto[];
  onNext: (photos: StagedPhoto[]) => void;
  onBack: () => void;
}

export default function MediaSection({ initialData, onNext, onBack }: Props) {
  const [photos, setPhotos] = useState<StagedPhoto[]>(initialData ?? []);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Property Photos</h2>
      <p className="text-sm text-slate-400">
        Add photos of the property. Photos are uploaded after the listing is saved.
      </p>
      <StagedPhotoUploader photos={photos} onPhotosChange={setPhotos} maxFiles={20} />
      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={() => onNext(photos)} className="btn-primary">Next</button>
      </div>
    </div>
  );
}
