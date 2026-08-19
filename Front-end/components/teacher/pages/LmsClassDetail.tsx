import React, { useState, useEffect, FormEvent } from 'react'
import { apiGet, apiPost, apiDelete, apiPatch } from '@/utils/api'

const inputSt: React.CSSProperties = {
  padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 13, color: '#111827', outline: 'none', background: '#fff', width: '100%',
  boxSizing: 'border-box',
}

const th: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #E8EDF5', background: '#F8FAFD',
}

const td: React.CSSProperties = { padding: '11px 16px', fontSize: 13, color: '#374151' }

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden', marginBottom: 20,
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
        {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )
}

function AddBtn({ color, onClick, label, disabled }: { color: string; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
        background: color, color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.87' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> {label}
    </button>
  )
}

const resourceIcon = (type: string) =>
  type === 'drive' ? '📁' : type === 'youtube' ? '▶️' : '🌐'

const resourceLabel = (type: string) =>
  type === 'drive' ? 'Google Drive' : type === 'youtube' ? 'YouTube' : 'Website'

export default function LmsClassDetail({
  classData,
  students,
}: {
  classData: any
  students: any[]
}) {
  const classStudents = students.filter(student => 
    student.classId === classData.id || 
    student.enrollments?.some((e: any) => e.classId === classData.id)
  )

  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<any[]>([])
  const [homeworks, setHomeworks] = useState<any[]>([])

  // Resources state
  const [showResForm, setShowResForm] = useState(false)
  const [resTitle, setResTitle] = useState('')
  const [resLink, setResLink] = useState('')
  const [resType, setResType] = useState('link')
  const [resLoading, setResLoading] = useState(false)

  // Homework state
  const [showHwForm, setShowHwForm] = useState(false)
  const [hwTitle, setHwTitle] = useState('')
  const [hwDue, setHwDue] = useState('')
  const [hwLoading, setHwLoading] = useState(false)

  // Manage completion modal
  const [manageHwId, setManageHwId] = useState<string | null>(null)
  const manageHwData = manageHwId ? homeworks.find(h => h.id === manageHwId) ?? null : null
  const [manageLoading, setManageLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [resData, hwData] = await Promise.all([
        apiGet<any>(`/dashboard/subjects/${classData.id}/modules`),
        apiGet<any>(`/teacher/homework/${classData.id}`),
      ])
      
      const flatResources = (resData.modules || []).flatMap((m: any) => m.items || [])
      setResources(flatResources)
      setHomeworks(hwData.homeworks || [])
    } catch (e) {
      console.error('Failed to load class details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [classData.id])

  const addResource = async () => {
    if (!resTitle.trim() || !resLink.trim()) return
    setResLoading(true)
    try {
      // Create a default topic if none exists
      let moduleId = ''
      const resData = await apiGet<any>(`/dashboard/subjects/${classData.id}/modules`)
      if (resData.modules && resData.modules.length > 0) {
        moduleId = resData.modules[0].id
      } else {
        const topicRes = await apiPost<any>('/teacher/topics', { classId: classData.id, title: 'Resources' })
        moduleId = topicRes.topic.id
      }

      await apiPost('/teacher/resources', {
        classId: classData.id,
        moduleId,
        title: resTitle.trim(),
        href: resLink.trim(),
        type: resType,
      })
      await loadData()
      setResTitle(''); setResLink(''); setShowResForm(false)
    } catch (e) {
      console.error(e)
      alert('Failed to add resource')
    } finally {
      setResLoading(false)
    }
  }

  const deleteResource = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return
    try {
      await apiDelete(`/teacher/resources/${encodeURIComponent(classData.id)}/${encodeURIComponent(id)}`)
      await loadData()
    } catch (e) {
      console.error(e)
      alert('Failed to delete resource')
    }
  }

  const addHomework = async () => {
    if (!hwTitle.trim()) return
    setHwLoading(true)
    try {
      await apiPost('/teacher/homework', {
        classId: classData.id,
        title: hwTitle.trim(),
        dueDate: hwDue || new Date().toISOString().slice(0, 10),
      })
      await loadData()
      setHwTitle(''); setHwDue(''); setShowHwForm(false)
    } catch (e) {
      console.error(e)
      alert('Failed to add homework')
    } finally {
      setHwLoading(false)
    }
  }

  const deleteHomework = async (id: string) => {
    if (!window.confirm('Delete this homework?')) return
    try {
      await apiDelete(`/teacher/homework/${encodeURIComponent(classData.id)}/${encodeURIComponent(id)}`)
      await loadData()
    } catch (e) {
      console.error(e)
      alert('Failed to delete homework')
    }
  }

  const toggleCompletion = async (hwId: string, studentId: string, isCurrentlyDone: boolean) => {
    setManageLoading(true)
    try {
      await apiPatch('/teacher/homework/completion', {
        classId: classData.id,
        homeworkId: hwId,
        studentId,
        isDone: !isCurrentlyDone,
      })
      await loadData()
    } catch (e) {
      console.error(e)
      alert('Failed to update completion')
    } finally {
      setManageLoading(false)
    }
  }

  return (
    <>
      {/* Breadcrumb badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: `${classData.color || '#14367D'}15`, color: classData.color || '#14367D', fontWeight: 600 }}>
          {classData.grade}
        </span>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 500 }}>
          {classData.medium}
        </span>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 500 }}>
          {classData.name}
        </span>
        <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>· {classStudents.length} students enrolled</span>
      </div>

      {/* ── Resources ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Class Resources"
          sub="Share external Google Drive, YouTube, or website links with enrolled students."
          action={<AddBtn color="#14367D" onClick={() => setShowResForm(v => !v)} label="Add Resource" disabled={loading} />}
        />

        {showResForm && (
          <div style={{ padding: '14px 20px', background: '#F8FAFD', borderBottom: '1px solid #F0F3FA', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '2 1 160px' }}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Title</label>
              <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="e.g. Chapter 5 Notes" style={inputSt} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '3 1 200px' }}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Link</label>
              <input value={resLink} onChange={e => setResLink(e.target.value)} placeholder="https://..." style={inputSt} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 120px' }}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Type</label>
              <select value={resType} onChange={e => setResType(e.target.value)} style={{ ...inputSt, appearance: 'auto' }}>
                <option value="drive">Google Drive</option>
                <option value="youtube">YouTube</option>
                <option value="link">Website</option>
              </select>
            </div>
            <button onClick={addResource} disabled={resLoading} style={{ padding: '9px 18px', background: '#14367D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end', opacity: resLoading ? 0.6 : 1 }}>
              {resLoading ? 'Adding...' : '+ Add'}
            </button>
            <button onClick={() => setShowResForm(false)} style={{ padding: '9px 14px', background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end' }}>
              Cancel
            </button>
          </div>
        )}

        {!loading && resources.length === 0 && !showResForm && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No resources added yet.
          </div>
        )}
        {resources.map(r => (
          <div key={r.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 19, flexShrink: 0 }}>{resourceIcon(r.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.title}</div>
              <a href={r.href} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: '#14367D', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.href}
              </a>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280', flexShrink: 0 }}>{resourceLabel(r.type)}</span>
            <span style={{ fontSize: 11, color: '#D1D5DB' }}>{new Date(r.created_at || Date.now()).toLocaleDateString()}</span>
            <button
              onClick={() => deleteResource(r.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12, padding: '4px 8px', borderRadius: 6, fontWeight: 500, transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Remove
            </button>
          </div>
        ))}
        {loading && <div style={{ padding: 20, fontSize: 13, color: '#6B7280' }}>Loading resources...</div>}
      </div>

      {/* ── Homework ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Homework Completion"
          action={<AddBtn color="#C0182E" onClick={() => setShowHwForm(v => !v)} label="Add Homework" disabled={loading} />}
        />

        {showHwForm && (
          <div style={{ padding: '14px 20px', background: '#FFF8F8', borderBottom: '1px solid #F0F3FA', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '2 1 200px' }}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Homework Title</label>
              <input value={hwTitle} onChange={e => setHwTitle(e.target.value)} placeholder="e.g. Homework - 03" style={inputSt} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Due Date</label>
              <input type="date" value={hwDue} onChange={e => setHwDue(e.target.value)} style={inputSt} />
            </div>
            <button onClick={addHomework} disabled={hwLoading} style={{ padding: '9px 18px', background: '#C0182E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end', opacity: hwLoading ? 0.6 : 1 }}>
              {hwLoading ? 'Adding...' : '+ Add'}
            </button>
            <button onClick={() => setShowHwForm(false)} style={{ padding: '9px 14px', background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end' }}>
              Cancel
            </button>
          </div>
        )}

        {!loading && homeworks.length === 0 && !showHwForm && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No homework added yet.
          </div>
        )}
        {homeworks.map(hw => {
          const done = hw.completedCount || 0
          const total = classStudents.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <div key={hw.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{hw.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#0F7B3A' : (classData.color || '#C0182E'), borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#6B7280', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {done}/{total} done
                  </span>
                </div>
                {hw.dueDate && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Due: {hw.dueDate}</div>}
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button
                  onClick={() => setManageHwId(hw.id)}
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, border: `1px solid ${classData.color || '#14367D'}`, background: 'transparent', color: classData.color || '#14367D', cursor: 'pointer', fontWeight: 500, transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${classData.color || '#14367D'}12` }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Manage completion
                </button>
                <button
                  onClick={() => deleteHomework(hw.id)}
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 500, transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
        {loading && <div style={{ padding: 20, fontSize: 13, color: '#6B7280' }}>Loading homework...</div>}
      </div>

      {/* ── Enrolled Students ── */}
      <div style={cardStyle}>
        <SectionHeader title="Enrolled Students" sub={`${classStudents.length} students`} />
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Student ID</th>
                <th style={th}>Name</th>
                <th style={th}>Username</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, i) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, color: '#9CA3AF', width: 40 }}>{i + 1}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5, color: '#6B7280' }}>{s.index}</td>
                  <td style={{ ...td, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                  <td style={{ ...td, color: '#6B7280' }}>{s.id}</td>
                </tr>
              ))}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No students enrolled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Manage Completion Modal ── */}
      {manageHwData && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,37,88,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setManageHwId(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: 500, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Manage Completion</h3>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {manageHwData.title} · <strong style={{ color: '#374151' }}>{manageHwData.completedCount}</strong>/{classStudents.length} done
                </div>
              </div>
              <button onClick={() => setManageHwId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, opacity: manageLoading ? 0.6 : 1, pointerEvents: manageLoading ? 'none' : 'auto' }}>
              {classStudents.map((s, i) => {
                const record = manageHwData.records?.find((r: any) => r.studentId === s.id)
                const done = record?.isDone || false
                return (
                  <label
                    key={s.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCompletion(manageHwData.id, s.id, done)}
                      style={{ width: 15, height: 15, accentColor: classData.color || '#14367D', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: '#9CA3AF', width: 22, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{s.index}</span>
                    {done && (
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>Done</span>
                    )}
                  </label>
                )
              })}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setManageHwId(null)}
                style={{ padding: '9px 22px', background: classData.color || '#14367D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
