'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, ShieldCheck, User } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import Image from 'next/image';

type PublicMarksheetResponse = {
  subject: {
    id: string;
    name: string;
    classLabel?: string | null;
    teacher?: string | null;
  };
  assignment: {
    subjectId: string;
    examType: string;
    examName: string;
    examDate: string;
    totalMarks: number | null;
  };
  student?: {
    id: string;
    name: string;
    username: string;
    index: string;
  };
  mark: number | null;
  rank: number | null;
  status: 'awaiting-username' | 'pending' | 'present' | 'absent';
};

const toQuery = (params: Record<string, string>) => new URLSearchParams(params).toString();

export default function MarksSheetPortal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get('subjectId')?.trim() ?? '';
  const examType = searchParams.get('examType')?.trim() ?? '';
  const examName = searchParams.get('examName')?.trim() ?? '';
  const examDate = searchParams.get('examDate')?.trim() ?? '';

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [result, setResult] = useState<PublicMarksheetResponse | null>(null);

  const assignmentQuery = useMemo(() => ({ subjectId, examType, examName, examDate }), [subjectId, examType, examName, examDate]);

  useEffect(() => {
    if (!subjectId || !examType || !examName || !examDate) {
      setPageError('This link is missing assignment details.');
      return;
    }

    setPageError('');
    setLoading(true);
    apiRequest<PublicMarksheetResponse>(`/public/marksheet?${toQuery(assignmentQuery)}`)
      .then((data) => {
        setResult(data);
        setLookupError('');
      })
      .catch((error) => {
        setLookupError(error instanceof Error ? error.message : 'Unable to load the marksheet portal.');
      })
      .finally(() => setLoading(false));
  }, [assignmentQuery, examDate, examName, examType, subjectId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim()) {
      setLookupError('Enter the student ID or index number.');
      return;
    }

    setLoading(true);
    setLookupError('');
    try {
      const data = await apiRequest<PublicMarksheetResponse>(`/public/marksheet?${toQuery({ ...assignmentQuery, username: username.trim() })}`);
      setResult(data);
    } catch (error) {
      setResult(null);
      setLookupError(error instanceof Error ? error.message : 'Unable to find that mark.');
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = result?.assignment.totalMarks ?? 100;
  const markValue = result?.mark;
  const scoreLabel = result?.status === 'absent' ? 'Absent' : markValue === null ? 'Pending' : `${markValue}/${totalMarks}`;

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-4 sm:h-screen sm:overflow-hidden sm:px-6 lg:px-8">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        {/* Main Card */}
        <div className="w-full max-w-5xl rounded-3xl border border-white bg-white p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.15)] sm:p-6 lg:p-7">
          <div className="mb-4 flex flex-col items-center gap-3 text-center">
            <Image
              src="/photos/logo.png"
              alt="Institute Logo"
              width={180}
              height={100}
              onClick={() => router.push('/')}
              className="h-auto w-36 object-contain sm:w-44 cursor-pointer"
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1B3A8C]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B3A8C]">
              <ShieldCheck size={14} />
              Student Mark Portal
            </div>
          </div>

          <div className="sm:max-h-[calc(100vh-7.5rem)] sm:overflow-y-auto sm:pr-1">
          {pageError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
              {pageError}
            </div>
          )}

          {lookupError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {lookupError}
            </div>
          )}

          {/* Assignment Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{result?.subject.name || 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assignment</p>
              <p className="mt-1.5 text-base font-bold text-slate-900">{examName || 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</p>
              <p className="mt-1.5 text-base font-bold text-slate-900">{examType || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
              <p className="mt-1.5 text-base font-bold text-slate-900">{examDate || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Teacher</p>
              <p className="mt-1.5 text-base font-bold text-slate-900">{result?.subject.teacher || 'N/A'}</p>
            </div>
          </div>

          {/* Search or Result Section */}
          <div className="mt-5 border-t border-slate-200 pt-5">
            {!result?.student ? (
              // Search Form
              <form className="space-y-3" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                  Student ID or Index Number
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 transition-all focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/10">
                    <User size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="e.g., A001"
                      className="w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B3A8C] px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#152C6A] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  View Mark
                </button>
              </form>
            ) : (
              // Result Display
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Student Result</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</p>
                    <p className="mt-1.5 text-base font-bold text-slate-900">{result.student.name}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Index Number</p>
                    <p className="mt-1.5 text-base font-bold text-slate-900">{result.student.index}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-[#1B3A8C] bg-[#1B3A8C]/5 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A8C]">Mark</p>
                    <p className="mt-1.5 text-2xl font-black text-[#1B3A8C]">{scoreLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rank</p>
                    <p className="mt-1.5 text-2xl font-black text-slate-900">{result.rank ? `#${result.rank}` : 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {result.status === 'present'
                        ? '✓ Mark published'
                        : result.status === 'absent'
                          ? '○ Absent'
                          : '⧗ Pending'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setResult(null);
                    setUsername('');
                    setLookupError('');
                  }}
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#1B3A8C] hover:text-[#1B3A8C]"
                >
                  Search Another Student
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}
