import { useState } from 'react'
import type { ClassData, Assignment } from './data'

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

export default function Marks({
  classes,
  updateClass,
}: {
  classes: ClassData[]
  updateClass: (id: string, updater: (c: ClassData) => ClassData) => void
}) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '')
  const [openAssignId, setOpenAssignId] = useState<string | null>(null)
  const [marksModal, setMarksModal] = useState<{ studentId: string; name: string; index: number; current: number | null } | null>(null)
  const [marksInput, setMarksInput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const cls = classes.find(c => c.id === selectedClassId)
  const openAssign: Assignment | undefined = cls?.assignments.find(a => a.id === openAssignId)

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(link)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const saveMark = () => {
    if (!marksModal || !cls || !openAssignId) return
    const val = parseFloat(marksInput)
    if (isNaN(val) || val < 0 || val > 100) return
    updateClass(cls.id, c => ({
      ...c,
      marks: {
        ...c.marks,
        [openAssignId]: { ...(c.marks[openAssignId] ?? {}), [marksModal.studentId]: val },
      },
    }))
    setMarksModal(null)
    setMarksInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Class selector */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5', boxShadow: '0 1px 8px rgba(20,54,125,0.05)', padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Select Class
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {classes.map(c => {
            const active = selectedClassId === c.id
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); setOpenAssignId(null) }}
                style={{
                  padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400,
                  border: `2px solid ${active ? c.color : '#E5E7EB'}`,
                  background: active ? `${c.color}12` : '#F9FAFB',
                  color: active ? c.color : '#6B7280',
                  transition: 'all 0.14s',
                }}
              >
                {c.grade} – {c.subject}
              </button>
            )
          })}
        </div>
      </div>

      {/* Assignment list */}
      {cls && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5', boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Assignments</h2>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Select an assignment to view and manage student marks.</div>
          </div>

          {cls.assignments.length === 0 && (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No assignments for this class.</div>
          )}

          {cls.assignments.map(a => {
            const aMarks = cls.marks[a.id] ?? {}
            const marked = Object.values(aMarks).filter(v => v != null).length
            const isOpen = openAssignId === a.id

            return (
              <div key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                {/* Assignment row */}
                <button
                  onClick={() => setOpenAssignId(isOpen ? null : a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                    width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isOpen ? `${cls.color}07` : 'transparent',
                    borderLeft: `3px solid ${isOpen ? cls.color : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#F8FAFD' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{a.date}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#374151' }}>{marked}</strong>/{cls.students.length} marked
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
                          {openAssign.portalLink}
                        </div>
                      </div>
                      <button
                        onClick={() => copyLink(openAssign.portalLink)}
                        style={{
                          padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                          border: `1px solid ${copied === openAssign.portalLink ? 'transparent' : '#14367D'}`,
                          background: copied === openAssign.portalLink ? '#14367D' : 'transparent',
                          color: copied === openAssign.portalLink ? '#fff' : '#14367D',
                          fontSize: 12, fontWeight: 600, flexShrink: 0, transition: 'all 0.15s',
                        }}
                      >
                        {copied === openAssign.portalLink ? '✓ Copied' : 'Copy Link'}
                      </button>
                    </div>

                    {/* Marks table */}
                    <div style={{ border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={th}>Index</th>
                            <th style={th}>Student ID</th>
                            <th style={th}>Username</th>
                            <th style={th}>Name</th>
                            <th style={th}>Marks (%)</th>
                            <th style={th} />
                          </tr>
                        </thead>
                        <tbody>
                          {cls.students.map((s, i) => {
                            const mark = aMarks[s.id] ?? null
                            return (
                              <tr
                                key={s.id}
                                style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td style={{ ...td, color: '#9CA3AF', width: 50 }}>{i + 1}</td>
                                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#6B7280' }}>{s.id}</td>
                                <td style={{ ...td, color: '#6B7280' }}>{s.username}</td>
                                <td style={{ ...td, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                                <td style={td}>
                                  {mark != null ? (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(mark) }}>{mark}%</span>
                                  ) : (
                                    <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                                  )}
                                </td>
                                <td style={{ ...td, textAlign: 'right' }}>
                                  <button
                                    onClick={() => { setMarksModal({ studentId: s.id, name: s.name, index: i + 1, current: mark }); setMarksInput(mark != null ? String(mark) : '') }}
                                    style={{
                                      fontSize: 11.5, padding: '4px 11px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                                      border: `1px solid ${cls.color}`, background: 'transparent', color: cls.color,
                                      transition: 'all 0.12s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = cls.color; e.currentTarget.style.color = '#fff' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cls.color }}
                                  >
                                    {mark != null ? 'Edit' : '+ Add Marks'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
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
            <p style={{ margin: '0 0 22px', fontSize: 12, color: '#9CA3AF' }}>{openAssign.title}</p>

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
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: cls.color, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                Save Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
