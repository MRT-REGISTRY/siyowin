'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DashboardOverview, SubjectRecord } from '@/types';
import { apiGet } from '@/utils/api';

type ProgressPoint = { month: string; score: number; classAvg: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sd-chart-tooltip">
      <p className="sd-tooltip-label">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="sd-tooltip-value">
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

interface SubjectProgress {
  examDate: string;
  score: number;
  total: number;
}

export default function ProgressPage({
  overview,
  subjects,
  progress,
}: {
  overview: DashboardOverview | null;
  subjects: SubjectRecord[];
  progress: ProgressPoint[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState('');

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId, subjects],
  );

  useEffect(() => {
    if (!subjects.length) return;
    if (!selectedSubjectId || !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    let mounted = true;

    if (!selectedSubjectId) {
      setSubjectProgress([]);
      setSubjectError('');
      setLoadingSubject(false);
      return () => {
        mounted = false;
      };
    }

    setLoadingSubject(true);
    setSubjectError('');

    apiGet<{ results: Array<{ examTitle: string; marksObtained: number | null; totalMarks: number; examDate: string; isAbsent: boolean | null }> }>(
      `/dashboard/subjects/${selectedSubjectId}/results`
    )
      .then((response) => {
        if (!mounted) return;
        const results = response.results
          .filter((result) => !result.isAbsent && result.marksObtained !== null)
          .sort((a, b) => String(a.examDate).localeCompare(String(b.examDate)))
          .map((result) => ({
            examDate: result.examTitle || new Date(result.examDate).toLocaleDateString(),
            score: Number(result.marksObtained),
            total: result.totalMarks ?? 100,
          }));
        setSubjectProgress(results);
      })
      .catch((err) => {
        if (!mounted) return;
        setSubjectProgress([]);
        setSubjectError(err instanceof Error ? err.message : 'Unable to load subject progress.');
      })
      .finally(() => {
        if (mounted) setLoadingSubject(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedSubjectId]);

  const first = progress[0]?.score ?? 0;
  const latest = progress[progress.length - 1]?.score ?? first;
  const diff = latest - first;
  
  const firstSubject = subjectProgress[0]?.score ?? 0;
  const latestSubject = subjectProgress[subjectProgress.length - 1]?.score ?? firstSubject;
  const diffSubject = latestSubject - firstSubject;
  const selectedHomeworkDone = selectedSubject?.recentHomeworks.filter((homework) => homework.status === 'completed').length ?? 0;
  const selectedHomeworkTotal = selectedSubject?.recentHomeworks.length ?? 0;
  const selectedHomeworkPct = selectedHomeworkTotal > 0 ? Math.round((selectedHomeworkDone / selectedHomeworkTotal) * 100) : 0;
  const homeworkDisplayPct = selectedSubjectId && selectedSubject ? selectedHomeworkPct : overview?.homeworkCompletion ?? 0;
  const homeworkDisplayLabel = selectedSubjectId && selectedSubject ? `${selectedHomeworkDone}/${selectedHomeworkTotal} done` : 'Overall';

  const homeworkRadarData = subjects.map((subject) => {
    const done = subject.recentHomeworks.filter((homework) => homework.status === 'completed').length;
    const total = subject.recentHomeworks.length;
    return {
      subject: subject.name,
      value: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
  
  const displayProgress = selectedSubjectId && subjectProgress.length > 0 ? subjectProgress : progress;
  const displayDiff = selectedSubjectId && subjectProgress.length > 0 ? diffSubject : diff;

  return (
    <div className="sdp-wrap">
      <div className="sdp-header">
        <div>
          <h1 className="sdp-title">Progress Tracker</h1>
          <p className="sdp-sub">Your academic journey</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {subjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              <option value="">Overall Progress</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          )}
          <div className="sdp-trend-pill" style={{ background: displayDiff >= 0 ? '#f0fdf4' : '#fef2f2', color: displayDiff >= 0 ? '#16a34a' : '#dc2626' }}>
            {displayDiff >= 0 ? 'Up' : 'Down'} {Math.abs(displayDiff)}% {selectedSubjectId ? 'trend' : 'overall trend'}
          </div>
        </div>
      </div>

      <div className="sdp-strip">
        <div className="sdp-strip-item"><span className="sdp-strip-val">{overview?.averageMark ?? 0}%</span><span className="sdp-strip-label">Current Avg</span></div>
        <div className="sdp-strip-div" />
        <div className="sdp-strip-item"><span className="sdp-strip-val">{displayDiff > 0 ? '+' : ''}{displayDiff}%</span><span className="sdp-strip-label">Trend</span></div>
        <div className="sdp-strip-div" />
        <div className="sdp-strip-item"><span className="sdp-strip-val">#{overview?.classRank ?? '-'}</span><span className="sdp-strip-label">Class Rank</span></div>
        <div className="sdp-strip-div" />
        <div className="sdp-strip-item"><span className="sdp-strip-val">{homeworkDisplayPct}%</span><span className="sdp-strip-label">HW Completion</span></div>
      </div>

      {loadingSubject && selectedSubjectId && (
        <p className="text-sm text-slate-500 mb-4">Loading {selectedSubject?.name} progress...</p>
      )}
      {subjectError && (
        <p className="text-sm text-red-600 mb-4">{subjectError}</p>
      )}

      <div className="prg-grid">
        <div className="sdp-card prg-line-card">
          <h2 className="prg-card-title">
            {selectedSubjectId && selectedSubject ? `${selectedSubject.name} - Score Trend` : 'Monthly Score Trend'}
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={displayProgress} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey={selectedSubjectId ? 'examDate' : 'month'} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="score" name="Your Score" stroke="#D9232D" strokeWidth={3} dot={{ r: 5, fill: '#D9232D', strokeWidth: 0 }} activeDot={{ r: 7 }} />
              {!selectedSubjectId && <Line type="monotone" dataKey="classAvg" name="Class Avg" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 5, fill: '#94A3B8' }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="sdp-card prg-radar-card">
          <h2 className="prg-card-title">
            {selectedSubjectId && selectedSubject ? `${selectedSubject.name} - Homework` : 'Homework Completion'}
          </h2>
          <p className="mb-4 text-sm font-semibold text-slate-500">{homeworkDisplayLabel}</p>
          {selectedSubjectId && selectedSubject ? (
            <div className="space-y-3">
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#1B3A8C]" style={{ width: `${selectedHomeworkPct}%` }} />
              </div>
              <div className="space-y-2">
                {selectedSubject.recentHomeworks.map((homework) => (
                  <div key={homework.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{homework.title}</p>
                    </div>
                    <span className={homework.status === 'completed' ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700' : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500'}>
                      {homework.status === 'completed' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
                {selectedSubject.recentHomeworks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No homework added for this subject yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={homeworkRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#F0F0F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Radar name="Homework" dataKey="value" stroke="#1B3A8C" fill="#1B3A8C" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
