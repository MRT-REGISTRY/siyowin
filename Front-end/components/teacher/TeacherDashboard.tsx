'use client';

import { useEffect, useState, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { LogOut } from 'lucide-react';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import DashboardNavbar from '../dashboard/DashboardNavbar';
import TeacherOverviewPage from './pages/TeacherOverviewPage';
import TeacherClassesPage from './pages/TeacherClassesPage';
import TeacherMarksPage from './pages/TeacherMarksPage';
import { apiGet, getStoredUser } from '@/utils/api';
import { useLanguage } from '@/components/LanguageProvider';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'classes', label: 'My Classes', icon: 'book-open' },
  { id: 'marks', label: 'Marks', icon: 'trophy' },
];

export default function TeacherDashboard() {
  const { isSinhala } = useLanguage();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
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
    const savedNav = localStorage.getItem('siyowin_teacher_nav');
    const savedClassId = localStorage.getItem('siyowin_teacher_class');
    if (savedNav) setActiveNav(savedNav);
    if (savedClassId) setSelectedClassId(savedClassId);
    
    loadData();
  }, []);


  const handleNavChange = (navId: string) => {
    if (navId !== 'marks') {
      setSelectedClassId(null);
      localStorage.removeItem('siyowin_teacher_class');
    }
    setActiveNav(navId);
    localStorage.setItem('siyowin_teacher_nav', navId);
  };

  const openClassMarks = (classId: string) => {
    setSelectedClassId(classId);
    setActiveNav('marks');
    localStorage.setItem('siyowin_teacher_class', classId);
    localStorage.setItem('siyowin_teacher_nav', 'marks');
  };

  const localizedNavItems = useMemo(() => NAV_ITEMS.map(item => ({
    ...item,
    label: isSinhala 
      ? (item.id === 'dashboard' ? 'පුවරුව' : item.id === 'classes' ? 'මගේ පන්ති' : 'ලකුණු') 
      : item.label
  })), [isSinhala]);

  // Create a synthetic profile for the Sidebar/Navbar to consume
  const profile = useMemo(() => {
    const name = teacher?.name || 'Teacher';
    return {
      name: name,
      avatar: name.charAt(0).toUpperCase(),
      grade: '',
      classId: '',
      role: isSinhala ? 'ගුරුවරයා' : 'Teacher',
      term: 'Term 1',
      year: new Date().getFullYear(),
    };
  }, [teacher, isSinhala]);

  function logout(event: ReactMouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    localStorage.removeItem('siyowin_teacher_nav');
    localStorage.removeItem('siyowin_teacher_class');
    localStorage.removeItem('siyowin_user');
    sessionStorage.clear();
    window.location.href = '/login';
  }

  return (
        <div className="sd-root">
          <DashboardSidebar
            navItems={localizedNavItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            profile={profile as any}
          />
          {sidebarOpen && (
            <div className="sd-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          )}
      <div className="sd-main-wrapper">
        <DashboardNavbar
          onMenuToggle={() => setSidebarOpen(true)}
          profile={profile as any}
          showSearch={false}
        />

        <main className="sd-content">
          {loading && <p className="sdp-card">{isSinhala ? 'පුවරුව පූරණය වෙමින්...' : 'Loading dashboard...'}</p>}
          {!loading && error && <p className="sdp-card text-red-600">{error}</p>}
          
          {activeNav === 'dashboard' && !loading && !error && (
            <>
              <div className="sd-greeting">
                <div>
                  <h1 className="sd-greeting-title">
                    {isSinhala ? 'ආයුබෝවන්' : 'Welcome'}, <span className="sd-highlight">{teacher?.name}!</span>
                  </h1>
                  <p className="sd-greeting-sub">
                    {isSinhala ? 'මෙන්න ඔබගේ පන්තිවල සාරාංශයක්.' : "Here's a summary of your classes."}
                  </p>
                </div>
              </div>
              <TeacherOverviewPage overview={overview} recentAssignments={recentAssignments} />
            </>
          )}

          {activeNav === 'classes' && !loading && !error && (
            <TeacherClassesPage subjects={subjects} students={students} />
          )}

          {activeNav === 'marks' && !loading && !error && (
            <TeacherMarksPage 
              subjects={subjects} 
              students={students} 
              examTypes={examTypes}
              dbExams={dbExams}
              initialSubjectId={selectedClassId} 
              onRefresh={refreshData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
