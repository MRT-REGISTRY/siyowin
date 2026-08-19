'use client';

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { apiGet, getStoredUser } from '@/utils/api';
import LmsDashboard from './pages/LmsDashboard';
import LmsClasses from './pages/LmsClasses';
import LmsClassDetail from './pages/LmsClassDetail';
import LmsMarks from './pages/LmsMarks';

type View = { page: 'dashboard' | 'classes' | 'marks' } | { page: 'class-detail'; classId: string };

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

export default function TeacherDashboard() {
  const [view, setView] = useState<View>({ page: 'dashboard' })
  
  const [teacher, setTeacher] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const u = getStoredUser();
      if (u && u.role === 'teacher') {
        return { name: u.name };
      }
    }
    return null;
  });
  const [overview, setOverview] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [dbExams, setDbExams] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    apiGet<any>('/teacher/dashboard')
      .then((data) => {
        setTeacher(data.teacher);
        setOverview(data.overview);
        setSubjects(data.subjects || []);
        setStudents(data.students || []);
        setRecentAssignments(data.recentAssignments || []);
        setExamTypes(data.examTypes || []);
        setDbExams(data.dbExams || []);
        setError('');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const refreshData = () => loadData(false);

  useEffect(() => {
    loadData();
  }, []);

  const navigate = (v: View) => {
    setView(v);
    if (v.page === 'class-detail') {
      localStorage.setItem('siyowin_teacher_nav', 'class-detail');
      localStorage.setItem('siyowin_teacher_class', v.classId);
    } else {
      localStorage.setItem('siyowin_teacher_nav', v.page);
      localStorage.removeItem('siyowin_teacher_class');
    }
  }

  function logout(event: ReactMouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    localStorage.removeItem('siyowin_teacher_nav');
    localStorage.removeItem('siyowin_teacher_class');
    localStorage.removeItem('siyowin_user');
    sessionStorage.clear();
    window.location.href = '/login';
  }

  const activeNav = view.page === 'class-detail' ? 'classes' : view.page

  const pageTitle = (() => {
    if (view.page === 'dashboard') return 'Dashboard'
    if (view.page === 'classes') return 'My Classes'
    if (view.page === 'marks') return 'Marks'
    if (view.page === 'class-detail') {
      const cls = subjects.find(c => c.id === view.classId)
      return cls ? `${cls.grade} – ${cls.medium} – ${cls.name}` : 'Class'
    }
    return ''
  })()

  const initials = (teacher?.name || 'Teacher').split(' ')
    .filter((w: string) => /^[A-Z]/.test(w))
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0D2558' }}>
        <div style={{ padding: '24px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/photos/logo.png" alt="Siyowin" style={{ height: 72, width: 'auto', objectFit: 'contain' }} />
          <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
            onClick={logout}
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
              {initials || 'T'}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#374151' }}>{teacher?.name || 'Teacher'}</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading && <p style={{ fontSize: 13, color: '#6B7280' }}>Loading dashboard...</p>}
          {!loading && error && <p style={{ fontSize: 13, color: '#C0182E' }}>{error}</p>}
          
          {!loading && !error && view.page === 'dashboard' && (
            <LmsDashboard 
              overview={overview} 
              recentAssignments={recentAssignments} 
              dbExams={dbExams} 
              students={students} 
              subjects={subjects} 
            />
          )}
          
          {!loading && !error && view.page === 'classes' && (
            <LmsClasses 
              subjects={subjects} 
              dbExams={dbExams} 
              navigate={navigate} 
            />
          )}
          
          {!loading && !error && view.page === 'class-detail' && subjects.find(c => c.id === view.classId) && (
            <LmsClassDetail
              classData={subjects.find(c => c.id === view.classId)!}
              students={students}
            />
          )}
          
          {!loading && !error && view.page === 'marks' && (
            <LmsMarks 
              subjects={subjects} 
              students={students} 
              examTypes={examTypes}
              dbExams={dbExams} 
              onRefresh={refreshData} 
            />
          )}
        </main>
      </div>
    </div>
  )
}
