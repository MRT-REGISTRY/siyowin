'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { apiGet } from '@/utils/api';
import { SubjectRecord, SubjectResultsResponse } from '@/types';

type ProgressPoint = { month: string; score: number; classAvg: number };
type SubjectProgressPoint = { label: string; score: number; examDate: string; totalMarks: number };

interface Props {
  data: ProgressPoint[];
  subjects?: SubjectRecord[];
}

const formatMonthRange = (chartData: ProgressPoint[]) =>
  chartData.length
    ? `${chartData[0]?.month} – ${chartData[chartData.length - 1]?.month}`
    : 'Recent months';

const buildSubjectProgress = (results: SubjectResultsResponse['results']): SubjectProgressPoint[] => {
  return results
    .filter((result) => !result.isAbsent && result.marksObtained !== null)
    .slice(0, 5)
    .map((result) => ({
      label: result.examTitle,
      score: Number(result.marksObtained),
      examDate: result.examDate,
      totalMarks: result.totalMarks ?? 100,
    }))
    .sort((a, b) => String(b.examDate).localeCompare(String(a.examDate)));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="sd-chart-tooltip">
        <p className="sd-tooltip-label">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="sd-tooltip-value">
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data, subjects = [] }: Props) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [subjectData, setSubjectData] = useState<SubjectProgressPoint[] | null>(null);
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
      setSubjectData(null);
      setSubjectError('');
      setLoadingSubject(false);
      return () => {
        mounted = false;
      };
    }

    setLoadingSubject(true);
    setSubjectError('');

    apiGet<SubjectResultsResponse>(`/dashboard/subjects/${selectedSubjectId}/results`)
      .then((response) => {
        if (!mounted) return;
        setSubjectData(buildSubjectProgress(response.results));
      })
      .catch((err) => {
        if (!mounted) return;
        setSubjectData([]);
        setSubjectError(err instanceof Error ? err.message : 'Unable to load subject progress.');
      })
      .finally(() => {
        if (mounted) setLoadingSubject(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedSubjectId]);

  const chartData = selectedSubjectId ? subjectData ?? [] : [];
  const rangeLabel = selectedSubject ? `${selectedSubject.name} · 5 most recent marks` : '5 most recent marks';
  const latest = chartData[0]?.score ?? 0;
  const first = chartData[chartData.length - 1]?.score ?? latest;
  const diff = latest - first;
  const trend = diff > 0 ? 'Improving' : diff < 0 ? 'Declining' : 'Stable';
  const trendColor = diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#F59E0B';
  const maxMarks = 100;

  const barColors = ['#D9232D', '#E85D3F', '#F59E0B', '#F97316', '#FB7185'];

  return (
    <section className="sd-chart-section">
      <div className="sd-section-header">
        <div>
          <h2 className="sd-section-title">📊 Recent Marks</h2>
          <p className="sd-section-sub">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {subjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              {/* <option value="overall">Overall</option> */}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          )}
          <div className="sd-trend-pill" style={{ backgroundColor: `${trendColor}18`, color: trendColor }}>
            {diff >= 0 ? '↑' : '↓'} {trend} · {diff > 0 ? '+' : ''}{diff}
          </div>
        </div>
      </div>

      {loadingSubject && selectedSubjectId && (
        <p className="text-sm text-slate-500 mb-3">Loading subject progress...</p>
      )}
      {!loadingSubject && subjectError && (
        <p className="text-sm text-red-600 mb-3">{subjectError}</p>
      )}

      <div className="sd-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, maxMarks]}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="score" name={selectedSubject?.name ?? 'Marks'} radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.label}-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject summary pills */}
      <div className="sd-chart-pills">
        {chartData.map((d, i) => (
          <div key={`${d.label}-${i}`} className={`sd-chart-pill ${i === 0 ? 'sd-chart-pill-active' : ''}`}>
            <span className="sd-pill-month">{d.label}</span>
            <span className="sd-pill-score">{d.score}/{d.totalMarks}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
