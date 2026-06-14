'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, Link2, Trophy } from 'lucide-react';
import { ApiSubjectModule, SubjectRecord } from '@/types';
import { apiGet } from '@/utils/api';

interface Props {
  subject: SubjectRecord;
  onBack: () => void;
}

export default function SubjectReportPage({ subject, onBack }: Props) {
  const [modules, setModules] = useState<ApiSubjectModule[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const allExpanded = modules.length > 0 && expandedModules.length === modules.length;

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError('');
    setModules([]);
    setExpandedModules([]);

    Promise.all([
      apiGet<{ subjectId: string; modules: ApiSubjectModule[] }>(`/dashboard/subjects/${subject.id}/modules`),
      apiGet(`/dashboard/subjects/${subject.id}/results`).catch(() => ({ recentResults: [], results: [] })),
    ])
      .then(([response, resultResp]: any) => {
        if (!mounted) return;
        const nextModules = response.modules ?? [];
        const recentResults = (resultResp?.recentResults ?? resultResp?.results ?? []) as any[];
        const nextModuleIds = new Set(nextModules.map((module) => module.id));

        const resultModules = recentResults
          .filter((r) => !r.isAbsent && r.marksObtained !== null)
          .filter((r, index, all) => all.findIndex((candidate) => candidate.examId === r.examId) === index)
          .map((r) => ({
            id: `result-${r.examId}`,
            title: r.examTitle,
            items: [{
              id: r.examId,
              title: `${r.examTitle}: ${r.marksObtained}/${r.totalMarks ?? 100}`,
              type: 'mark' as const,
              createdAt: r.createdAt ?? r.examDate ?? null,
            }],
          }));

        const mergedModules = [
          ...nextModules,
          ...resultModules.filter((module) => !nextModuleIds.has(module.id)),
        ];

        setModules(mergedModules);
        setResults(recentResults);
        setExpandedModules(mergedModules.slice(0, 3).map((module) => module.id));
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
  }, [subject.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedModules([]);
    } else {
      setExpandedModules(modules.map((module) => module.id));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header Area */}
      <div className="px-4 md:px-8 pt-4 md:pt-6">
        <div className="max-w-[1400px] mx-auto rounded-2xl bg-slate-200 border border-slate-300 shadow-sm px-6 py-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to My courses
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {subject.name} - {subject.teacher}
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 py-4 md:py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-[1400px] mx-auto">
          {!loading && !error && modules.length > 0 && (
            <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex justify-end">
              <button
                onClick={toggleAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}

          {loading && <p className="px-4 md:px-6 py-6 text-sm text-slate-500">Loading subject content...</p>}
          {!loading && error && <p className="px-4 md:px-6 py-6 text-sm text-rose-600">{error}</p>}
          {!loading && !error && modules.length === 0 && (
            <p className="px-4 md:px-6 py-6 text-sm text-slate-400 italic">No resources available.</p>
          )}

          <div className="divide-y divide-slate-100">
            {modules.map((module) => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <div key={module.id} className="group">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center px-4 md:px-6 py-5 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 mr-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">{module.title}</h2>
                  </button>

                  {isExpanded && (
                    <div className="px-4 md:px-6 pb-6 pl-14 md:pl-16">
                      {module.items.length > 0 ? (
                        <ul className="space-y-3">
                          {module.items.map((item) => (
                            <li key={item.id} className="flex items-start">
                              {item.type === 'mark' && (
                                <>
                                  <span className="mt-0.5 mr-3 text-amber-500">
                                    <Trophy size={18} />
                                  </span>
                                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[15px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                    {item.title}
                                  </span>
                                </>
                              )}

                              {item.type === 'link' && (
                                <>
                                  <span className="mt-0.5 mr-3 text-blue-600">
                                    <Link2 size={18} />
                                  </span>
                                  <a href={item.href} className="text-blue-600 hover:underline font-medium text-[15px]">
                                    {item.title}
                                  </a>
                                </>
                              )}

                              {item.type === 'text' && (
                                <>
                                  <span className="mt-0.5 mr-3 text-slate-500">
                                    <FileText size={18} />
                                  </span>
                                  <p className="text-[15px] leading-6 text-slate-700">{item.title}</p>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No resources available.</p>
                      )}
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
