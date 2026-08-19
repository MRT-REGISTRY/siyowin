import { Suspense } from 'react';
import MarksSheetPortal from '@/components/marksheet/MarksSheetPortal';

export default function MarksSheetPage() {
  return (
    <Suspense
      fallback={(
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading marksheet portal...
          </div>
        </main>
      )}
    >
      <MarksSheetPortal />
    </Suspense>
  );
}