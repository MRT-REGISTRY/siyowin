'use client';

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { apiGet, getStoredUser } from '@/utils/api';
import { ApiSubjectRecord, DashboardOverview, StudentProfile, SubjectRecord, SubjectModuleItem } from '@/types';
import { normalizeSubjects } from '@/utils/subjects';
import { useLanguage } from '@/components/LanguageProvider';

import LmsStudentDashboard from './pages/LmsStudentDashboard';
import LmsStudentSubjects from './pages/LmsStudentSubjects';
import LmsStudentSubjectDetail from './pages/LmsStudentSubjectDetail';
import LmsStudentProgress from './pages/LmsStudentProgress';
import LmsStudentSettings from './pages/LmsStudentSettings';

type View = { page: 'dashboard' | 'subjects' | 'progress' | 'settings' } | { page: 'subject-detail'; subjectId: string };

function IconDashboard() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconSubjects() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function IconProgress() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3-3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export default function StudentDashboard() {
  const { isSinhala } = useLanguage();
  const [view, setView] = useState<View>({ page: 'dashboard' })

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [latestModuleItems, setLatestModuleItems] = useState<SubjectModuleItem[]>([]);
  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [progress, setProgress] = useState<Array<{ month: string; score: number; classAvg: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    apiGet<{
      overview: DashboardOverview;
      profile: StudentProfile;
      subjects: ApiSubjectRecord[];
      latestModuleItems?: SubjectModuleItem[];
      latestResults?: any[];
      progress: Array<{ month: string; score?: number; average?: number; classAvg?: number }>;
      homework: Array<any>;
    }>('/dashboard/student')
      .then((data) => {
        setOverview(data.overview);
        setProfile(data.profile);
        setSubjects(normalizeSubjects(data.subjects, data.homework));
        setLatestModuleItems(data.latestModuleItems ?? []);
        setLatestResults((data as any).latestResults ?? []);
        setProgress(data.progress.map((item) => ({
          month: item.month,
          score: item.score ?? item.average ?? 0,
          classAvg: item.classAvg ?? 0,
        })));
        setError('');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  const navigate = (newView: View) => setView(newView)

  function logout(event: ReactMouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    localStorage.removeItem('siyowin_user');
    sessionStorage.clear();
    window.location.href = '/login';
  }

  const navItems = [
    { id: 'dashboard' as const, label: isSinhala ? 'පුවරුව' : 'Dashboard', Icon: IconDashboard },
    { id: 'subjects' as const, label: isSinhala ? 'මගේ විෂයන්' : 'My Subjects', Icon: IconSubjects },
    { id: 'progress' as const, label: isSinhala ? 'ප්‍රගතිය' : 'Progress', Icon: IconProgress },
    { id: 'settings' as const, label: isSinhala ? 'සැකසුම්' : 'Settings', Icon: IconSettings },
  ]

  const activeNav = view.page === 'subject-detail' ? 'subjects' : view.page

  const pageTitle = (() => {
    if (view.page === 'dashboard') return isSinhala ? 'පුවරුව' : 'Dashboard'
    if (view.page === 'subjects') return isSinhala ? 'මගේ විෂයන්' : 'My Subjects'
    if (view.page === 'progress') return isSinhala ? 'ප්‍රගතිය' : 'Progress'
    if (view.page === 'settings') return isSinhala ? 'සැකසුම්' : 'Settings'
    if (view.page === 'subject-detail') {
      const cls = subjects.find(c => c.id === view.subjectId)
      return cls ? `${cls.gradeId || ''} – ${cls.name}` : 'Subject'
    }
    return ''
  })()

  const initials = (profile?.name || 'Student').split(' ')
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
            Student Portal
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
            {isSinhala ? 'ඉවත් වන්න' : 'Log Out'}
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
            {view.page === 'subject-detail' && (
              <button
                onClick={() => navigate({ page: 'subjects' })}
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
                {isSinhala ? 'මගේ විෂයන්' : 'My Subjects'}
              </button>
            )}
            {view.page === 'subject-detail' && <span style={{ color: '#E5E7EB', fontSize: 14 }}>›</span>}
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{pageTitle}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#14367D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
            }}>
              {initials || 'S'}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#374151' }}>{profile?.name || 'Student'}</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading && <p style={{ fontSize: 13, color: '#6B7280' }}>Loading dashboard...</p>}
          {!loading && error && <p style={{ fontSize: 13, color: '#C0182E' }}>{error}</p>}
          
          {!loading && !error && view.page === 'dashboard' && (
            <LmsStudentDashboard 
              overview={overview} 
              latestModuleItems={latestModuleItems} 
              latestResults={latestResults} 
              subjects={subjects} 
              openSubject={(id) => navigate({ page: 'subject-detail', subjectId: id })} 
            />
          )}
          
          {!loading && !error && view.page === 'subjects' && (
            <LmsStudentSubjects 
              subjects={subjects} 
              openSubject={(id) => navigate({ page: 'subject-detail', subjectId: id })} 
            />
          )}
          
          {!loading && !error && view.page === 'subject-detail' && subjects.find(c => c.id === view.subjectId) && (
            <LmsStudentSubjectDetail
              subject={subjects.find(c => c.id === view.subjectId)!}
              onBack={() => navigate({ page: 'subjects' })}
            />
          )}
          
          {!loading && !error && view.page === 'progress' && (
            <LmsStudentProgress 
              overview={overview} 
              subjects={subjects} 
              progress={progress} 
            />
          )}
          
          {!loading && !error && view.page === 'settings' && (
            <LmsStudentSettings 
              profile={profile} 
              setProfile={setProfile} 
            />
          )}
        </main>
      </div>
    </div>
  )
}

