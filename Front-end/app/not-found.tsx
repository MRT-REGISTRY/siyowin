'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex h-full items-center justify-center">
        {/* Main Card */}
        <div className="w-full max-w-md rounded-3xl border border-white bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.15)]">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <Image
              src="/photos/logo.png"
              alt="Institute Logo"
              width={180}
              height={100}
              onClick={() => router.push('/')}
              className="h-auto w-32 object-contain cursor-pointer transition hover:scale-105"
            />
          </div>

          {/* 404 Content */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-6xl font-black text-[#1B3A8C]">404</h1>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">Page Not Found</h2>
            <p className="text-sm text-slate-600">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Error Details */}
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              What happened?
            </p>
            <p className="mt-2 text-sm text-amber-800">
              The link you followed may be broken or the page may have been removed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#152C6A]"
            >
              <Home size={16} />
              Go to Home
            </button>

            <button
              onClick={() => router.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#1B3A8C] hover:text-[#1B3A8C]"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
