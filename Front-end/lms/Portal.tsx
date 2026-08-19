import { useState } from 'react'
import logoImg from '@/imports/logo.png'
import { initialClasses, TEACHER_NAME, type ClassData } from './data'
import type { View } from './types'
import Dashboard from './Dashboard'
import Classes from './Classes'
import ClassDetail from './ClassDetail'
import Marks from './Marks'

function IconDashboard() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconClasses() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function IconMarks() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', Icon: IconDashboard },
  { id: 'classes' as const, label: 'My Classes', Icon: IconClasses },
  { id: 'marks' as const, label: 'Marks', Icon: IconMarks },
]

export default function Portal({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>({ page: 'dashboard' })
  const [classes, setClasses] = useState<ClassData[]>(initialClasses)

  const navigate = (v: View) => setView(v)

  const updateClass = (id: string, updater: (c: ClassData) => ClassData) => {
    setClasses(prev => prev.map(c => (c.id === id ? updater(c) : c)))
  }

  const activeNav = view.page === 'class-detail' ? 'classes' : view.page

  const pageTitle = (() => {
    if (view.page === 'dashboard') return 'Dashboard'
    if (view.page === 'classes') return 'My Classes'
    if (view.page === 'marks') return 'Marks'
    if (view.page === 'class-detail') {
      const cls = classes.find(c => c.id === view.classId)
      return cls ? `${cls.grade} – ${cls.language} – ${cls.subject}` : 'Class'
    }
    return ''
  })()

  const initials = TEACHER_NAME.split(' ')
    .filter(w => /^[A-Z]/.test(w))
    .map(w => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0D2558' }}>
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="Siyowin" style={{ height: 38, width: 38, objectFit: 'contain' }} />
            <span style={{ color: '#fff', fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17 }}>Siyowin</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: 48 }}>
            Teacher Portal
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = activeNav === id
            return (
              <button
                key={id}
                onClick={() => navigate({ page: id })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                  borderRadius: 9, width: '100%', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontSize: 13.5, fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(192,24,46,0.22)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.52)',
                  borderLeft: `3px solid ${active ? '#C0182E' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)' } }}
              >
                <Icon />
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '10px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 9, width: '100%', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 13.5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
          >
            <IconLogout />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: '#F5F7FC' }}>
        {/* Top bar */}
        <header style={{
          height: 62, background: '#fff', borderBottom: '1px solid #E8EDF5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0,
          boxShadow: '0 1px 4px rgba(20,54,125,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {view.page === 'class-detail' && (
              <button
                onClick={() => navigate({ page: 'classes' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: '#9CA3AF', fontSize: 13, borderRadius: 7, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#14367D' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                My Classes
              </button>
            )}
            {view.page === 'class-detail' && <span style={{ color: '#E5E7EB', fontSize: 14 }}>›</span>}
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{pageTitle}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#14367D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#374151' }}>{TEACHER_NAME}</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {view.page === 'dashboard' && <Dashboard classes={classes} navigate={navigate} />}
          {view.page === 'classes' && <Classes classes={classes} navigate={navigate} />}
          {view.page === 'class-detail' && (
            <ClassDetail
              classData={classes.find(c => c.id === view.classId)!}
              updateClass={updater => updateClass(view.classId, updater)}
            />
          )}
          {view.page === 'marks' && <Marks classes={classes} updateClass={updateClass} />}
        </main>
      </div>
    </div>
  )
}
