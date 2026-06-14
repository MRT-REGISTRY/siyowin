'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';
import OverviewCards from './OverviewCards';
import SubjectCards from './SubjectCards';
import ProgressChart from './ProgressChart';
import SubjectsPage from './pages/SubjectsPage';
import SubjectReportPage from './pages/SubjectReportPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { apiGet } from '@/utils/api';
import { ApiSubjectRecord, DashboardOverview, StudentProfile, SubjectRecord, SubjectModuleItem } from '@/types';
import { normalizeSubjects } from '@/utils/subjects';
import { useLanguage } from '@/components/LanguageProvider';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'layout-dashboard' },
  { id: 'subjects',    label: 'My Subjects',  icon: 'book-open' },
  { id: 'progress',    label: 'Progress',     icon: 'trending-up' },
  { id: 'settings',    label: 'Settings',     icon: 'settings' },
];

export default function StudentDashboard() {
  const { isSinhala } = useLanguage();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [latestModuleItems, setLatestModuleItems] = useState<SubjectModuleItem[]>([]);
  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [progress, setProgress] = useState<Array<{ month: string; score: number; classAvg: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleSubjects = useMemo(() => {
    if (!normalizedSearchQuery) return subjects;
    return subjects.filter((subject) => [
      subject.name,
      subject.subjectName,
      subject.teacher,
      subject.classLabel,
      subject.gradeId,
    ].some((value) => (value ?? '').toLowerCase().includes(normalizedSearchQuery)));
  }, [normalizedSearchQuery, subjects]);
  const selectedSubject = selectedSubjectId ? subjects.find((subject) => subject.id === selectedSubjectId) ?? null : null;

  useEffect(() => {
    let mounted = true;

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
        if (!mounted) return;
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
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleNavChange = (navId: string) => {
    setSelectedSubjectId(null);
    setActiveNav(navId);
  };

  const openSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveNav('subjects');
  };

  const closeSubjectReport = () => {
    setSelectedSubjectId(null);
  };

  return (
    <div className="sd-root">
      <DashboardSidebar
        navItems={NAV_ITEMS.map((item) => ({
          ...item,
          label: isSinhala
            ? item.id === 'dashboard'
              ? 'පුවරුව'
              : item.id === 'subjects'
                ? 'මගේ විෂයන්'
                : item.id === 'progress'
                  ? 'ප්‍රගතිය'
                  : 'සැකසුම්'
            : item.label,
        }))}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profile={profile}
      />
      {sidebarOpen && (
        <div className="sd-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="sd-main-wrapper">
        <DashboardNavbar
          onMenuToggle={() => setSidebarOpen(true)}
          profile={profile}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="sd-content">
          {loading && <p className="sdp-card">{isSinhala ? 'පුවරුව පූරණය වෙමින්...' : 'Loading dashboard...'}</p>}
          {!loading && error && <p className="sdp-card text-red-600">{error}</p>}
          {activeNav === 'dashboard' && (
            <div className="sd-dashboard-grid">
              <div className="sd-greeting">
                <div>
                  <h1 className="sd-greeting-title">
                    {isSinhala ? 'ආයුබෝවන්' : 'Good afternoon'}, <span className="sd-highlight">{profile?.name.split(' ')[0] ?? (isSinhala ? 'සිසුවා' : 'Student')}!</span>
                  </h1>
                  <p className="sd-greeting-sub">{isSinhala ? 'මෙම වාරයේ ඔබගේ අධ්‍යාපනික ප්‍රගතියේ සාරාංශය මෙන්න.' : 'Here is a summary of your academic performance this term.'}</p>
                </div>
                <div className="sd-term-badge">{profile ? `${profile.term} - ${profile.year}` : isSinhala ? 'වත්මන් වාරය' : 'Current term'}</div>
              </div>

              <div className="sd-dashboard-overview">
                <OverviewCards overview={overview} latestItems={latestModuleItems} latestResults={latestResults} onOpenSubject={openSubject} />
              </div>

              <div className="sd-dashboard-subjects">
                <SubjectCards
                  subjects={visibleSubjects}
                  onSelectSubject={openSubject}
                  onViewAll={() => {
                    setSelectedSubjectId(null);
                    setActiveNav('subjects');
                  }}
                />
              </div>

              <div className="sd-dashboard-progress">
                <ProgressChart data={progress} subjects={subjects} />
              </div>
            </div>
          )}

          {activeNav === 'subjects' && selectedSubject && (
            <SubjectReportPage subject={selectedSubject} onBack={closeSubjectReport} />
          )}

          {activeNav === 'subjects' && !selectedSubject && (
            <SubjectsPage subjects={visibleSubjects} onSelectSubject={openSubject} />
          )}
          
          {activeNav === 'progress'    && <ProgressPage overview={overview} subjects={subjects} progress={progress} />}
          {activeNav === 'settings'    && <SettingsPage profile={profile} />}
        </main>
      </div>
    </div>
  );
}
