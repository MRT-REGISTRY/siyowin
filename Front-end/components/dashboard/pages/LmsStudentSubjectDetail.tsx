import React, { useEffect, useState, useMemo } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { apiGet } from '@/utils/api'
import { ApiSubjectModule, SubjectHomeworkItem } from '@/types'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden', marginBottom: 20,
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
        {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function LmsStudentSubjectDetail({ subject, onBack }: { subject: any, onBack: () => void }) {
  const { isSinhala } = useLanguage()
  const [modules, setModules] = useState<ApiSubjectModule[]>([])
  const [results, setResults] = useState<any[]>([])
  const [homework, setHomework] = useState<SubjectHomeworkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      apiGet<{ modules: ApiSubjectModule[] }>(`/dashboard/subjects/${subject.id}/modules`).catch(() => ({ modules: [] })),
      apiGet(`/dashboard/subjects/${subject.id}/results`).catch(() => ({ recentResults: [], results: [] })),
      apiGet<{ homework: SubjectHomeworkItem[] }>(`/dashboard/subjects/${subject.id}/homework`).catch(() => ({ homework: subject.recentHomeworks || [] })),
    ])
      .then(([modRes, resRes, hwRes]: any) => {
        if (!mounted) return
        setModules(modRes.modules || [])
        setResults((resRes.results || resRes.recentResults || []) as any[])
        setHomework((hwRes.homework || subject.recentHomeworks || []) as SubjectHomeworkItem[])
      })
      .catch(err => {
        if (!mounted) return
        setError(err.message || 'Error loading subject details')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [subject.id])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{subject.emoji}</div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{subject.name}</h2>
          <div style={{ fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{subject.teacher}</span>
            <span>•</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: `${subject.color || '#14367D'}15`, color: subject.color || '#14367D',
            }}>{subject.classLabel || 'Class'}</span>
          </div>
        </div>
      </div>

      {loading && <p style={{ fontSize: 13, color: '#6B7280' }}>Loading details...</p>}
      {error && <p style={{ fontSize: 13, color: '#C0182E' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
          
          {/* Modules / Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {modules.length === 0 ? (
              <div style={cardStyle}>
                <div style={{ padding: 30, textAlign: 'center', color: '#6B7280', fontSize: 13.5 }}>
                  {isSinhala ? 'මෙම විෂය සඳහා කිසිදු පාඩමක් මෙතෙක් එක් කර නොමැත.' : 'No modules or materials have been added for this subject yet.'}
                </div>
              </div>
            ) : modules.map(mod => (
              <div key={mod.id} style={cardStyle}>
                <SectionHeader title={mod.title} sub={mod.description} />
                <div style={{ padding: '0 20px 20px' }}>
                  {mod.items.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '20px 0 0' }}>{isSinhala ? 'අන්තර්ගතයක් නොමැත' : 'No items'}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                      {mod.items.map(item => (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                            borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB',
                            textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#D1D5DB' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: item.type === 'video' ? '#FFE4E6' : item.type === 'document' ? '#D1FAE5' : '#E0F2FE',
                            color: item.type === 'video' ? '#E11D48' : item.type === 'document' ? '#059669' : '#0284C7',
                          }}>
                            {item.type === 'video' ? '▶' : item.type === 'document' ? '📄' : '🌐'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>{item.title}</div>
                            {item.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.description}</div>}
                          </div>
                          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Marks & Homework */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Homework */}
            <div style={cardStyle}>
              <SectionHeader title={isSinhala ? 'ගෙදර වැඩ' : 'Homework & Assignments'} />
              <div style={{ padding: 16 }}>
                {homework.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', padding: '10px 0' }}>
                    {isSinhala ? 'පවරන ලද ගෙදර වැඩ නොමැත' : 'No homework assigned'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {homework.map(hw => (
                      <div key={hw.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, background: '#F8FAFC' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FCE7F3', color: '#BE185D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                          📝
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 2 }}>{hw.title}</div>
                          {hw.dueDate && <div style={{ fontSize: 11, color: '#64748B' }}>Due: {new Date(hw.dueDate).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div style={cardStyle}>
              <SectionHeader title={isSinhala ? 'මගේ ප්‍රතිඵල' : 'My Results'} />
              <div style={{ padding: 16 }}>
                {results.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', padding: '10px 0' }}>
                    {isSinhala ? 'ප්‍රතිඵල නොමැත' : 'No results found'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {results.map((res, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: i < results.length - 1 ? '1px dashed #E2E8F0' : 'none', marginBottom: i < results.length - 1 ? 12 : 0 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{res.examTitle}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{res.examDate || res.createdAt}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: res.marksObtained != null ? '#14367D' : '#94A3B8' }}>
                          {res.marksObtained != null ? `${res.marksObtained}/${res.totalMarks || 100}` : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
