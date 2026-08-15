import React from 'react'
import { useLanguage } from '@/components/LanguageProvider'

export default function LmsStudentSubjects({ subjects, openSubject }: { subjects: any[], openSubject: (id: string) => void }) {
  const { isSinhala } = useLanguage()

  return (
    <div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 22, marginTop: 0 }}>
        {isSinhala ? `${subjects.length} විෂයන් සඳහා ලියාපදිංචි වී ඇත · විෂය අන්තර්ගතය නැරඹීමට විෂය මත ක්ලික් කරන්න.` : `${subjects.length} subjects enrolled · Click a subject to view its materials and marks.`}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {subjects.map(subject => (
          <button
            key={subject.id}
            onClick={() => openSubject(subject.id)}
            style={{
              background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
              boxShadow: '0 1px 8px rgba(20,54,125,0.05)',
              padding: 0, cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.18s', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(20,54,125,0.13)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 1px 8px rgba(20,54,125,0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ height: 5, background: subject.color || '#14367D' }} />
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 32, lineHeight: 1 }}>{subject.emoji}</div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                  background: `${subject.color || '#14367D'}15`, color: subject.color || '#14367D',
                }}>
                  {subject.classLabel || 'Class'}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{subject.name}</div>
              <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 14 }}>{subject.teacher}</div>
              
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>
                  {isSinhala ? 'ඇතුල් වන්න' : 'View Subject'}
                </span>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#4B5563" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
