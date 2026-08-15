import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { apiGet } from '@/utils/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { DashboardOverview, SubjectRecord } from '@/types'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden', marginBottom: 20,
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111827', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#9CA3AF' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: 0, color: p.color }}>
          {p.name}: <strong style={{ color: '#fff' }}>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

export default function LmsStudentProgress({ overview, subjects, progress }: { overview: any, subjects: any[], progress: any[] }) {
  const { isSinhala } = useLanguage()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [subjectProgress, setSubjectProgress] = useState<any[]>([])
  const [loadingSubject, setLoadingSubject] = useState(false)

  const selectedSubject = useMemo(
    () => subjects.find(s => s.id === selectedSubjectId) ?? null,
    [selectedSubjectId, subjects],
  )

  useEffect(() => {
    if (!subjects.length) return
    if (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [selectedSubjectId, subjects])

  useEffect(() => {
    let mounted = true
    if (!selectedSubjectId) {
      setSubjectProgress([])
      return () => { mounted = false }
    }

    setLoadingSubject(true)
    apiGet<{ results: any[] }>(`/dashboard/subjects/${selectedSubjectId}/results`)
      .then(response => {
        if (!mounted) return
        const results = response.results
          .filter(r => !r.isAbsent && r.marksObtained !== null)
          .sort((a, b) => String(a.examDate).localeCompare(String(b.examDate)))
          .map(r => ({
            examDate: r.examTitle || new Date(r.examDate).toLocaleDateString(),
            score: Number(r.marksObtained),
            total: r.totalMarks ?? 100,
          }))
        setSubjectProgress(results)
      })
      .catch(() => { if (mounted) setSubjectProgress([]) })
      .finally(() => { if (mounted) setLoadingSubject(false) })

    return () => { mounted = false }
  }, [selectedSubjectId])

  const homeworkRadarData = subjects.map(subject => {
    const done = subject.recentHomeworks?.filter((h: any) => h.status === 'completed').length || 0
    const total = subject.recentHomeworks?.length || 0
    return {
      subject: subject.name,
      value: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  })

  const displayProgress = selectedSubjectId && subjectProgress.length > 0 ? subjectProgress : progress
  const firstScore = displayProgress[0]?.score ?? 0
  const latestScore = displayProgress[displayProgress.length - 1]?.score ?? firstScore
  const trend = latestScore - firstScore

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            {isSinhala ? 'ප්‍රගතිය' : 'Progress Tracker'}
          </h2>
          <div style={{ fontSize: 14, color: '#6B7280' }}>
            {isSinhala ? 'ඔබගේ අධ්‍යාපනික ගමන' : 'Your academic journey'}
          </div>
        </div>
        
        {subjects.length > 0 && (
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, background: '#fff' }}
          >
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20, marginBottom: 0 }}>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
            {isSinhala ? 'සාමාන්‍ය ලකුණු' : 'Latest Score'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 4 }}>{latestScore}%</div>
          <div style={{ fontSize: 13, color: trend >= 0 ? '#059669' : '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {isSinhala ? 'වෙනස' : 'difference'}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 20, marginBottom: 0 }}>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
            {isSinhala ? 'පැමිණීම' : 'Attendance'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 4 }}>{overview?.attendance ?? 0}%</div>
          <div style={{ fontSize: 13, color: '#14367D', marginTop: 4 }}>{isSinhala ? 'සමස්ත' : 'Overall'}</div>
        </div>

        <div style={{ ...cardStyle, padding: 20, marginBottom: 0 }}>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
            {isSinhala ? 'ගෙදර වැඩ ප්‍රගතිය' : 'Homework Completion'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 4 }}>{overview?.homeworkCompletion ?? 0}%</div>
          <div style={{ fontSize: 13, color: '#14367D', marginTop: 4 }}>{isSinhala ? 'සමස්ත' : 'Overall'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{isSinhala ? 'කාර්ය සාධන ප්‍රවණතාව' : 'Performance Trend'}</h3>
          </div>
          <div style={{ padding: 20, height: 320 }}>
            {loadingSubject ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6B7280', fontSize: 13 }}>
                {isSinhala ? 'පූරණය වෙමින්...' : 'Loading chart...'}
              </div>
            ) : displayProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayProgress}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey={displayProgress[0]?.examDate ? 'examDate' : 'month'} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                  <Line type="monotone" name="Your Score" dataKey="score" stroke="#14367D" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                  {!displayProgress[0]?.examDate && (
                    <Line type="monotone" name="Class Average" dataKey="classAvg" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6B7280', fontSize: 13 }}>
                {isSinhala ? 'ප්‍රමාණවත් දත්ත නොමැත' : 'Not enough data to display trend'}
              </div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{isSinhala ? 'විෂය ශේෂය' : 'Subject Balance'}</h3>
          </div>
          <div style={{ padding: 20, height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {homeworkRadarData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={homeworkRadarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name="Homework %" dataKey="value" stroke="#C0182E" fill="#C0182E" fillOpacity={0.2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center' }}>
                {isSinhala ? 'මෙම ප්‍රස්තාරය සඳහා අවම වශයෙන් විෂයයන් 3ක් අවශ්‍ය වේ' : 'Need at least 3 subjects for radar chart'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
