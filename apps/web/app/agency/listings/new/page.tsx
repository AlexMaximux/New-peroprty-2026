'use client';

import RentToRentWizard from '@/components/listings/wizard/rent-to-rent-wizard';

export default function NewListingPage() {
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

      <RentToRentWizard />
    </div>
  );
}
