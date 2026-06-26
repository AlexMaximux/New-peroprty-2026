'use client';

import { useRouter } from 'next/navigation';
import NewListingForm from '@/components/listings/new-listing-form';

export default function NewListingPage() {
  const router = useRouter();

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">New Property Listing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create a listing to showcase an investment opportunity
          </p>
        </div>
      </div>

      <NewListingForm
        onDraftSaved={(id, failedFiles) => {
          if (failedFiles && failedFiles.length > 0) {
            try {
              sessionStorage.setItem(`uploadErrors-${id}`, JSON.stringify(failedFiles));
            } catch { /* ignore quota */ }
          }
          router.push(`/agency/listings/${id}`);
        }}
      />
    </div>
  );
}