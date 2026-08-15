import React from 'react'
import { useLanguage } from '@/components/LanguageProvider'

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)',
  overflow: 'hidden',
}

function StatCard({ label, value, sub, color, Icon }: {
  label: string; value: string | number; sub: string; color: string; Icon: React.FC<{ color: string }>
}) {
  return (
    <div style={{ ...cardStyle, borderTop: `3px solid ${color}`, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={color} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', fontFamily: "'Fraunces', serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 5 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function IconCourses({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function IconAssignments({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function LmsStudentDashboard({
  overview,
  latestModuleItems,
  latestResults,
  subjects,
  openSubject
}: {
  overview: any
  latestModuleItems: any[]
  latestResults: any[]
  subjects: any[]
  openSubject: (id: string) => void
}) {
  const { isSinhala } = useLanguage()

  const totalClasses = overview?.subjectsCount ?? 0
  const attendance = overview?.attendance ?? 0
  const avgMark = overview?.averageMark ? Math.round(overview.averageMark) : 0
  const homeworkComp = overview?.homeworkCompletion ?? 0

  const stats = [
    { label: isSinhala ? 'විෂයන්' : 'Enrolled Subjects', value: totalClasses, sub: isSinhala ? 'මෙම වාරය සඳහා' : 'active this term', color: '#14367D', Icon: IconCourses },
    { label: isSinhala ? 'සාමාන්‍ය ලකුණු' : 'Average Marks', value: `${avgMark}%`, sub: isSinhala ? 'සියලුම විෂයන් සඳහා' : 'avg. across all subjects', color: '#C0182E', Icon: IconCheck },
    { label: isSinhala ? 'පැමිණීම' : 'Attendance', value: `${attendance}%`, sub: isSinhala ? 'සාමාන්‍ය පැමිණීම' : 'overall attendance', color: '#0F7B3A', Icon: IconCheck },
    { label: isSinhala ? 'ගෙදර වැඩ' : 'Homework', value: `${homeworkComp}%`, sub: isSinhala ? 'සම්පූර්ණ කරන ලදී' : 'completed this month', color: '#7B2D8B', Icon: IconAssignments },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Results */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{isSinhala ? 'මෑත ප්‍රතිඵල' : 'Recent Results'}</h3>
          </div>
          <div style={{ padding: 12 }}>
            {latestResults.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: 13, margin: 0 }}>
                {isSinhala ? 'ප්‍රතිඵල නොමැත' : 'No recent results available'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {latestResults.slice(0, 3).map((res, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>{res.examTitle}</div>
                      <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>{res.examDate || res.createdAt}</div>
                    </div>
                    <div style={{ background: '#14367D', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {res.marksObtained != null ? `${res.marksObtained}/${res.totalMarks || 100}` : 'Absent'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Materials */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{isSinhala ? 'නව පාඩම් අංග' : 'New Study Materials'}</h3>
          </div>
          <div style={{ padding: 12 }}>
            {latestModuleItems.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: 13, margin: 0 }}>
                {isSinhala ? 'නව පාඩම් නොමැත' : 'No new materials'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {latestModuleItems.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' }}>{item.type}</div>
                    </div>
                    <button
                      onClick={() => openSubject(item.classId)}
                      style={{ border: 'none', background: 'transparent', color: '#C0182E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
