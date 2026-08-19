'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink, FileText, Link2, Trophy, Video } from 'lucide-react';
import { ApiSubjectModule, SubjectHomeworkItem, SubjectRecord } from '@/types';
import { apiGet } from '@/utils/api';

interface Props {
  subject: SubjectRecord;
  onBack: () => void;
}

type FeedItem = {
  id: string;
  title: string;
  date: string | null;
  kind: 'document' | 'video' | 'link' | 'mark' | 'homework';
  href?: string;
  topic?: string;
  meta?: string;
  status?: 'completed' | 'pending';
};

const dateValue = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'No date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getItemLabel = (item: FeedItem) => {
  if (item.kind === 'mark') return 'Assignment result';
  if (item.kind === 'homework') return 'Homework';
  if (item.kind === 'document') return 'Document';
  if (item.kind === 'video') return 'Video';
  return 'Link';
};

const getItemTone = (item: FeedItem) => {
  if (item.kind === 'mark') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (item.kind === 'video') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (item.kind === 'document') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (item.kind === 'link') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (item.status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export default function SubjectReportPage({ subject, onBack }: Props) {
  const [modules, setModules] = useState<ApiSubjectModule[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [homework, setHomework] = useState<SubjectHomeworkItem[]>(subject.recentHomeworks);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError('');
    setModules([]);
    setResults([]);
    setHomework(subject.recentHomeworks);
    setExpandedItems([]);

    Promise.all([
      apiGet<{ subjectId: string; modules: ApiSubjectModule[] }>(`/dashboard/subjects/${subject.id}/modules`),
      apiGet(`/dashboard/subjects/${subject.id}/results`).catch(() => ({ recentResults: [], results: [] })),
      apiGet<{ subjectId: string; homework: SubjectHomeworkItem[] }>(`/dashboard/subjects/${subject.id}/homework`).catch(() => ({ homework: subject.recentHomeworks })),
    ])
      .then(([response, resultResp, homeworkResp]: any) => {
        if (!mounted) return;
        setModules(response.modules ?? []);
        setResults((resultResp?.results ?? resultResp?.recentResults ?? []) as any[]);
        setHomework((homeworkResp?.homework ?? subject.recentHomeworks) as SubjectHomeworkItem[]);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load subject content.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [subject.id, subject.recentHomeworks]);

  const feedItems = useMemo<FeedItem[]>(() => {
    const resourceItems = modules.flatMap((module) =>
      module.items
        .filter((item) => item.type === 'document' || item.type === 'video' || item.type === 'link')
        .map((item) => ({
          id: item.id,
          title: item.title,
          date: item.createdAt ?? null,
          kind: item.type,
          href: item.href,
        } satisfies FeedItem)),
    );

    const markItems = results
      .filter((result, index, all) =>
        !result.isAbsent &&
        result.marksObtained !== null &&
        all.findIndex((candidate) => candidate.examId === result.examId) === index,
      )
      .map((result) => ({
        id: `result-${result.examId}`,
        title: result.examTitle,
        date: result.createdAt ?? result.examDate ?? null,
        kind: 'mark' as const,
        meta: `${result.marksObtained}/${result.totalMarks ?? 100}`,
      }));

    const homeworkItems = homework.map((item) => ({
      id: `homework-${item.id}`,
      title: item.title,
      date: item.createdAt ?? item.dueDate ?? null,
      kind: 'homework' as const,
      status: item.status,
    }));

    return [...resourceItems, ...markItems, ...homeworkItems]
      .sort((a, b) => dateValue(b.date) - dateValue(a.date));
  }, [homework, modules, results]);

  const allExpanded = feedItems.length > 0 && expandedItems.length === feedItems.length;

  const toggleItem = (itemId: string) => {
    setExpandedItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  const toggleAll = () => {
    setExpandedItems(allExpanded ? [] : feedItems.map((item) => item.id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <div className="px-4 pt-4 md:px-8 md:pt-6">
        <div className="mx-auto max-w-[1400px] rounded-2xl border border-slate-300 bg-slate-200 px-6 py-5 shadow-sm">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to My courses
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {subject.name} - {subject.teacher}
          </h1>
        </div>
      </div>

      <div className="w-full flex-1 px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Subject Activity</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Newest items are shown first.</p>
            </div>
            {!loading && !error && feedItems.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:self-center sm:text-sm"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {loading && <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">Loading subject content...</p>}
          {!loading && error && <p className="rounded-xl border border-rose-100 bg-white px-4 py-6 text-sm text-rose-600">{error}</p>}
          {!loading && !error && feedItems.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm italic text-slate-400">No subject activity available.</p>
          )}

          <div className="space-y-3">
            {feedItems.map((item) => {
              const isExpanded = expandedItems.includes(item.id);
              return (
                <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                      {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950 sm:text-xl">{item.title}</h3>
                        <span className={`w-fit rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${getItemTone(item)}`}>
                          {getItemLabel(item)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 px-4 pb-4 sm:px-5">
                      <div className="divide-y divide-slate-200">
                        <div className="flex items-center gap-3 py-4">
                          <FeedIcon item={item} />
                          <div className="min-w-0 flex-1">
                            {item.href ? (
                              <a href={item.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 hover:underline sm:text-[15px]">
                                {item.title}
                              </a>
                            ) : (
                              <p className="text-sm font-semibold text-slate-800 sm:text-[15px]">{item.title}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                              {formatDate(item.date)}
                            </p>
                          </div>
                          <ActivityAction item={item} />
                        </div>

                        {(item.meta || item.kind === 'homework') && (
                          <div className="grid gap-2 py-3 text-xs text-slate-600 sm:grid-cols-3">
                            <p><span className="font-black text-slate-500">Added:</span> {formatDate(item.date)}</p>
                            {item.meta && <p><span className="font-black text-slate-500">Details:</span> {item.meta}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedIcon({ item }: { item: FeedItem }) {
  const className = 'mt-0.5 h-9 w-9 flex-shrink-0 rounded-xl border p-2 shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl sm:p-2.5';

  if (item.kind === 'mark') return <Trophy className={`${className} border-amber-200 bg-amber-50 text-amber-600`} />;
  if (item.kind === 'video') return <Video className={`${className} border-rose-200 bg-rose-50 text-rose-600`} />;
  if (item.kind === 'document') return <FileText className={`${className} border-emerald-200 bg-emerald-50 text-emerald-600`} />;
  if (item.kind === 'link') return <Link2 className={`${className} border-sky-200 bg-sky-50 text-sky-600`} />;
  if (item.status === 'completed') return <CheckCircle2 className={`${className} border-emerald-200 bg-emerald-50 text-emerald-600`} />;
  return <Circle className={`${className} border-slate-200 bg-slate-50 text-slate-500`} />;
}

function ActivityAction({ item }: { item: FeedItem }) {
  if (item.kind === 'homework') {
    return (
      <span className={item.status === 'completed' ? 'shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900' : 'shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900'}>
        {item.status === 'completed' ? 'Done' : 'Pending'}
      </span>
    );
  }

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900 transition hover:bg-slate-50 sm:inline-flex">
        Open <ExternalLink size={13} />
      </a>
    );
  }

  if (item.kind === 'mark') {
    return (
      <span className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900">
        {item.meta ?? 'Result'}
      </span>
    );
  }

  return null;
}
