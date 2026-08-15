import { useState } from 'react'
import type { ClassData, Resource, Homework } from './data'

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

function AddBtn({ color, onClick, label }: { color: string; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
        background: color, color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.87')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> {label}
    </button>
  )
}

const resourceIcon = (type: Resource['type']) =>
  type === 'drive' ? '📁' : type === 'youtube' ? '▶️' : '🌐'

const resourceLabel = (type: Resource['type']) =>
  type === 'drive' ? 'Google Drive' : type === 'youtube' ? 'YouTube' : 'Website'

export default function ClassDetail({
  classData,
  updateClass,
}: {
  classData: ClassData
  updateClass: (updater: (c: ClassData) => ClassData) => void
}) {
  // Resources state
  const [showResForm, setShowResForm] = useState(false)
  const [resTitle, setResTitle] = useState('')
  const [resLink, setResLink] = useState('')
  const [resType, setResType] = useState<Resource['type']>('drive')

  // Homework state
  const [showHwForm, setShowHwForm] = useState(false)
  const [hwTitle, setHwTitle] = useState('')
  const [hwDue, setHwDue] = useState('')

  // Manage completion modal
  const [manageHwId, setManageHwId] = useState<string | null>(null)
  const manageHwData = manageHwId ? classData.homework.find(h => h.id === manageHwId) ?? null : null

  const addResource = () => {
    if (!resTitle.trim() || !resLink.trim()) return
    const r: Resource = {
      id: `r${Date.now()}`, title: resTitle.trim(), link: resLink.trim(),
      type: resType, addedAt: new Date().toISOString().slice(0, 10),
    }
    updateClass(c => ({ ...c, resources: [...c.resources, r] }))
    setResTitle(''); setResLink(''); setShowResForm(false)
  }

  const deleteResource = (id: string) =>
    updateClass(c => ({ ...c, resources: c.resources.filter(r => r.id !== id) }))

  const addHomework = () => {
    if (!hwTitle.trim()) return
    const hw: Homework = {
      id: `hw${Date.now()}`, title: hwTitle.trim(), dueDate: hwDue,
      completedIds: [], createdAt: new Date().toISOString().slice(0, 10),
    }
    updateClass(c => ({ ...c, homework: [...c.homework, hw] }))
    setHwTitle(''); setHwDue(''); setShowHwForm(false)
  }

  const deleteHomework = (id: string) =>
    updateClass(c => ({ ...c, homework: c.homework.filter(h => h.id !== id) }))

  const toggleCompletion = (hwId: string, studentId: string) => {
    updateClass(c => ({
      ...c,
      homework: c.homework.map(h => {
        if (h.id !== hwId) return h
        const has = h.completedIds.includes(studentId)
        return { ...h, completedIds: has ? h.completedIds.filter(id => id !== studentId) : [...h.completedIds, studentId] }
      }),
    }))
  }

  return (
    <>
      {/* Breadcrumb badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: `${classData.color}15`, color: classData.color, fontWeight: 600 }}>
          {classData.grade}
        </span>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 500 }}>
          {classData.language}
        </span>
        <span style={{ fontSize: 12.5, padding: '4px 11px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 500 }}>
          {classData.subject}
        </span>
        <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>· {classData.students.length} students enrolled</span>
      </div>

      {/* ── Resources ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Class Resources"
          sub="Share external Google Drive, YouTube, or website links with enrolled students."
          action={<AddBtn color="#14367D" onClick={() => setShowResForm(v => !v)} label="Add Resource" />}
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
              <select value={resType} onChange={e => setResType(e.target.value as Resource['type'])} style={{ ...inputSt, appearance: 'auto' }}>
                <option value="drive">Google Drive</option>
                <option value="youtube">YouTube</option>
                <option value="web">Website</option>
              </select>
            </div>
            <button onClick={addResource} style={{ padding: '9px 18px', background: '#14367D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>
              + Add
            </button>
            <button onClick={() => setShowResForm(false)} style={{ padding: '9px 14px', background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end' }}>
              Cancel
            </button>
          </div>
        )}

        {classData.resources.length === 0 && !showResForm && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No resources added yet.
          </div>
        )}
        {classData.resources.map(r => (
          <div key={r.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 19, flexShrink: 0 }}>{resourceIcon(r.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.title}</div>
              <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: '#14367D', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.link}
              </a>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280', flexShrink: 0 }}>{resourceLabel(r.type)}</span>
            <span style={{ fontSize: 11, color: '#D1D5DB' }}>{r.addedAt}</span>
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
      </div>

      {/* ── Homework ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Homework Completion"
          action={<AddBtn color="#C0182E" onClick={() => setShowHwForm(v => !v)} label="Add Homework" />}
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
            <button onClick={addHomework} style={{ padding: '9px 18px', background: '#C0182E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>
              + Add
            </button>
            <button onClick={() => setShowHwForm(false)} style={{ padding: '9px 14px', background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end' }}>
              Cancel
            </button>
          </div>
        )}

        {classData.homework.length === 0 && !showHwForm && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No homework added yet.
          </div>
        )}
        {classData.homework.map(hw => {
          const done = hw.completedIds.length
          const total = classData.students.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <div key={hw.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{hw.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#0F7B3A' : classData.color, borderRadius: 3, transition: 'width 0.4s' }} />
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
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, border: `1px solid ${classData.color}`, background: 'transparent', color: classData.color, cursor: 'pointer', fontWeight: 500, transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${classData.color}12` }}
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
      </div>

      {/* ── Enrolled Students ── */}
      <div style={cardStyle}>
        <SectionHeader title="Enrolled Students" sub={`${classData.students.length} students`} />
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
              {classData.students.map((s, i) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, color: '#9CA3AF', width: 40 }}>{i + 1}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5, color: '#6B7280' }}>{s.id}</td>
                  <td style={{ ...td, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                  <td style={{ ...td, color: '#6B7280' }}>{s.username}</td>
                </tr>
              ))}
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
                  {manageHwData.title} · <strong style={{ color: '#374151' }}>{manageHwData.completedIds.length}</strong>/{classData.students.length} done
                </div>
              </div>
              <button onClick={() => setManageHwId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {classData.students.map((s, i) => {
                const done = manageHwData.completedIds.includes(s.id)
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
                      onChange={() => toggleCompletion(manageHwData.id, s.id)}
                      style={{ width: 15, height: 15, accentColor: classData.color, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: '#9CA3AF', width: 22, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{s.username}</span>
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
                style={{ padding: '9px 22px', background: classData.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
