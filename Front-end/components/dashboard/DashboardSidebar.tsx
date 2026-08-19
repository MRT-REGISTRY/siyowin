'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  TrendingUp,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { StudentProfile } from '@/types';
import { clearSession } from '@/utils/api';
import { useLanguage } from '@/components/LanguageProvider';

const ICON_MAP: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'book-open': BookOpen,
  trophy: Trophy,
  'trending-up': TrendingUp,
  settings: Settings,
};

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  navItems: NavItem[];
  activeNav: string;
  onNavChange: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile | null;
}

export default function DashboardSidebar({
  navItems,
  activeNav,
  onNavChange,
  isOpen,
  onClose,
  profile,
}: Props) {
  const { isSinhala } = useLanguage();
  const logout = () => {
    clearSession();
    window.location.href = '/';
  };

  return (
    <aside className={`sd-sidebar ${isOpen ? 'sd-sidebar-open' : ''}`}>
      <div className="sd-sidebar-logo">
        <Link href="/" className="sd-logo-img-wrap" aria-label="Go to home page">
          <Image
            src="/photos/logo.png"
            alt="Siyowin Logo"
            width={120}
            height={44}
            className="sd-logo-img"
            priority
          />
        </Link>
        <button
          className="sd-sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <p className="sd-sidebar-section-label">{isSinhala ? 'මෙනුව' : 'MENU'}</p>

      <nav className="sd-sidebar-nav">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`sd-nav-item ${isActive ? 'sd-nav-item-active' : ''}`}
              onClick={() => {
                onNavChange(item.id);
                onClose();
              }}
            >
              {Icon && <Icon size={18} />}
              <span>{item.label}</span>
              {isActive && <div className="sd-nav-active-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sd-sidebar-footer">
        <div className="sd-sidebar-avatar">{profile?.avatar ?? ''}</div>
        <div className="sd-sidebar-footer-info">
          <p className="sd-sidebar-footer-name">{profile?.name ?? 'Student'}</p>
          <p className="sd-sidebar-footer-role">
            {(profile as any)?.role ? (profile as any).role : profile ? `${profile.grade} - ${profile.classId.toUpperCase()}` : 'Student profile'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <LogOut size={16} />
        {isSinhala ? 'ඉවත් වන්න' : 'Logout'}
      </button>
    </aside>
  );
}
