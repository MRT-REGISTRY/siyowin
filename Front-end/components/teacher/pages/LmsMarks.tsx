import React, { useState, useMemo, useEffect } from 'react'
import { apiPost } from '@/utils/api'

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #E8EDF5', background: '#F8FAFD',
}
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 12.5, color: '#374151' }

const labelSt: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
}
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box',
}
const readonlySt: React.CSSProperties = {
  ...inputSt, background: '#F9FAFB', color: '#6B7280',
}

function scoreColor(v: number) {
  return v >= 80 ? '#0F7B3A' : v >= 60 ? '#14367D' : '#C0182E'
}

export default function LmsMarks({
  subjects,
  students,
  examTypes,
  dbExams,
  onRefresh
}: {
  subjects: any[]
  students: any[]
  examTypes: any[]
  dbExams: any[]
  onRefresh: () => void
}) {
  const [selectedClassId, setSelectedClassId] = useState(subjects[0]?.id ?? '')
  const [openAssignKey, setOpenAssignKey] = useState<string | null>(null)
  const [marksModal, setMarksModal] = useState<{ studentId: string; name: string; index: string; current: number | null } | null>(null)
  const [marksInput, setMarksInput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [formExamName, setFormExamName] = useState('')
  const [formExamDate, setFormExamDate] = useState('')
  const [formExamType, setFormExamType] = useState('')

  const cls = subjects.find(c => c.id === selectedClassId)
  
  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students.filter(s => s.classId === selectedClassId || s.enrollments?.some((e: any) => e.classId === selectedClassId))
  }, [selectedClassId, students])

  const assignments = useMemo(() => {
    if (!selectedClassId) return []
    const combined = new Map<string, any>()
    dbExams.forEach(e => {
      if (e.classId === selectedClassId) {
        const key = `${e.examType}||${e.examName}||${e.examDate}`
        combined.set(key, { ...e, key })
      }
    })
    
    // Add assignments found in student marks
    classStudents.forEach(s => {
      if (s.marks) {
        s.marks.forEach((m: any) => {
          if (m.subjectId === selectedClassId) {
            const key = `${m.examType}||${m.examName}||${m.examDate}`
            if (!combined.has(key)) {
              combined.set(key, { examType: m.examType, examName: m.examName, examDate: m.examDate, key })
            }
          }
        })
      }
    })
    
    return Array.from(combined.values()).sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())
  }, [dbExams, classStudents, selectedClassId])

  const openAssign = assignments.find(a => a.key === openAssignKey)

  useEffect(() => {
    if (addModalOpen && examTypes.length > 0) {
      const typeLabel = examTypes.find(t => t.id === formExamType)?.label || 'Assignment'
      setFormExamName(`${typeLabel} ${formExamDate}`)
    }
  }, [formExamType, formExamDate, addModalOpen, examTypes])

  const handleCreateAssignment = async () => {
    if (!formExamName.trim()) return alert('Please enter an assignment name.')
    if (!selectedClassId) return
    
    setSaving(true)
    try {
      await apiPost('/teacher/assignment', {
        subjectId: selectedClassId,
        examType: formExamType,
        examName: formExamName.trim(),
        examDate: formExamDate,
      })
      setAddModalOpen(false)
      onRefresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const buildPortalLink = (a: any) => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams({
      subjectId: selectedClassId,
      examType: a.examType,
      examName: a.examName,
      examDate: a.examDate,
    })
    return `${window.location.origin}/marksheet?${params.toString()}`
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(link)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const saveMark = async () => {
    if (!marksModal || !selectedClassId || !openAssign) return
    const val = parseFloat(marksInput)
    if (isNaN(val) || val < 0 || val > 100) return
    
    setSaving(true)
    try {
      await apiPost('/teacher/marks', {
        studentId: marksModal.studentId,
        subjectId: selectedClassId,
        examType: openAssign.examType,
        examName: openAssign.examName,
        examDate: openAssign.examDate,
        mark: val
      })
      setMarksModal(null)
      setMarksInput('')
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to save mark')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Class selector */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5', boxShadow: '0 1px 8px rgba(20,54,125,0.05)', padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Select Class
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {subjects.map(c => {
            const active = selectedClassId === c.id
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); setOpenAssignKey(null) }}
                style={{
                  padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400,
                  border: `2px solid ${active ? (c.color || '#14367D') : '#E5E7EB'}`,
                  background: active ? `${c.color || '#14367D'}12` : '#F9FAFB',
                  color: active ? (c.color || '#14367D') : '#6B7280',
                  transition: 'all 0.14s',
                }}
              >
                {c.grade} – {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Assignment list */}
      {cls && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5', boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Assignments</h2>
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Select an assignment to view and manage student marks.</div>
            </div>
            <button
              onClick={() => {
                setFormExamDate(new Date().toISOString().split('T')[0])
                setFormExamType(examTypes[0]?.id ?? '')
                setAddModalOpen(true)
              }}
              style={{ padding: '8px 14px', background: '#14367D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              + Create Assignment
            </button>
          </div>

          {assignments.length === 0 && (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No assignments for this class.</div>
          )}

          {assignments.map(a => {
            const isOpen = openAssignKey === a.key
            let markedCount = 0
            
            // Calculate marked count
            classStudents.forEach(s => {
              const hasMark = s.marks?.some((m: any) => m.subjectId === selectedClassId && m.examType === a.examType && m.examName === a.examName && m.examDate === a.examDate)
              if (hasMark) markedCount++
            })

            const portalLink = buildPortalLink(a)

            return (
              <div key={a.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                {/* Assignment row */}
                <button
                  onClick={() => setOpenAssignKey(isOpen ? null : a.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                    width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isOpen ? `${cls.color || '#14367D'}07` : 'transparent',
                    borderLeft: `3px solid ${isOpen ? (cls.color || '#14367D') : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#F8FAFD' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{a.examName}</div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{a.examType} • {a.examDate}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#374151' }}>{markedCount}</strong>/{classStudents.length} marked
                  </div>
                  <svg
                    style={{ width: 16, height: 16, color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 } as React.CSSProperties}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded panel */}
                {isOpen && openAssign && (
                  <div style={{ padding: '0 20px 20px' }}>
                    {/* Portal link */}
                    <div style={{ margin: '16px 0 14px', padding: '12px 16px', background: '#F8FAFD', borderRadius: 10, border: '1px solid #E8EDF5', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Portal Link</div>
                        <div style={{ fontSize: 12.5, color: '#14367D', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {portalLink}
                        </div>
                      </div>
                      <button
                        onClick={() => copyLink(portalLink)}
                        style={{
                          padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                          border: `1px solid ${copied === portalLink ? 'transparent' : '#14367D'}`,
                          background: copied === portalLink ? '#14367D' : 'transparent',
                          color: copied === portalLink ? '#fff' : '#14367D',
                          fontSize: 12, fontWeight: 600, flexShrink: 0, transition: 'all 0.15s',
                        }}
                      >
                        {copied === portalLink ? '✓ Copied' : 'Copy Link'}
                      </button>
                    </div>

                    {/* Marks table */}
                    <div style={{ border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={th}>Index</th>
                            <th style={th}>Student ID</th>
                            <th style={th}>Name</th>
                            <th style={th}>Username</th>
                            <th style={th}>Marks (%)</th>
                            <th style={th} />
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map((s, i) => {
                            const markObj = s.marks?.find((m: any) => m.subjectId === selectedClassId && m.examType === openAssign.examType && m.examName === openAssign.examName && m.examDate === openAssign.examDate)
                            const mark = markObj ? markObj.mark : null
                            
                            return (
                              <tr
                                key={s.id}
                                style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td style={{ ...td, color: '#9CA3AF', width: 50 }}>{i + 1}</td>
                                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#6B7280' }}>{s.index}</td>
                                <td style={{ ...td, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                                <td style={{ ...td, color: '#6B7280' }}>{s.id}</td>
                                <td style={td}>
                                  {mark != null ? (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(mark) }}>{mark}%</span>
                                  ) : (
                                    <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                                  )}
                                </td>
                                <td style={{ ...td, textAlign: 'right' }}>
                                  <button
                                    onClick={() => { setMarksModal({ studentId: s.id, name: s.name, index: s.index, current: mark }); setMarksInput(mark != null ? String(mark) : '') }}
                                    style={{
                                      fontSize: 11.5, padding: '4px 11px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                                      border: `1px solid ${cls.color || '#14367D'}`, background: 'transparent', color: cls.color || '#14367D',
                                      transition: 'all 0.12s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = cls.color || '#14367D'; e.currentTarget.style.color = '#fff' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cls.color || '#14367D' }}
                                  >
                                    {mark != null ? 'Edit' : '+ Add Marks'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                          {classStudents.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No students enrolled.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Marks Modal */}
      {marksModal && cls && openAssign && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,37,88,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setMarksModal(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: 360, padding: '28px 28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {marksModal.current != null ? 'Edit Marks' : 'Add Marks'}
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 12, color: '#9CA3AF' }}>{openAssign.examName}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelSt}>Name</label>
                <div style={readonlySt}>{marksModal.name}</div>
              </div>
              <div>
                <label style={labelSt}>Index</label>
                <div style={readonlySt}>{marksModal.index}</div>
              </div>
              <div>
                <label style={labelSt}>Marks (%)</label>
                <input
                  type="number" min="0" max="100"
                  value={marksInput}
                  onChange={e => setMarksInput(e.target.value)}
                  placeholder="0 – 100"
                  style={inputSt}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveMark() }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setMarksModal(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={saveMark}
                disabled={saving}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: cls.color || '#14367D', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {addModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,37,88,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setAddModalOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: 360, padding: '28px 28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 22px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Create New Assignment
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelSt}>Type</label>
                <select style={inputSt} value={formExamType} onChange={e => setFormExamType(e.target.value)}>
                  {examTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Date</label>
                <input style={inputSt} type="date" value={formExamDate} onChange={e => setFormExamDate(e.target.value)} />
              </div>
              <div>
                <label style={labelSt}>Name</label>
                <input style={inputSt} type="text" value={formExamName} onChange={e => setFormExamName(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setAddModalOpen(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={saving}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: '#14367D', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
