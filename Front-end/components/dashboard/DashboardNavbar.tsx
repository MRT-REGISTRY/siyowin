'use client';

import { Search, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { StudentProfile } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';

interface Props {
  onMenuToggle: () => void;
  profile: StudentProfile | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function DashboardNavbar({ onMenuToggle, profile, searchValue = '', onSearchChange, showSearch = true }: Props) {
  const { isSinhala, toggleLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const avatar = profile?.avatar || profile?.name.charAt(0).toUpperCase() || 'S';
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sd-navbar">
      <div className="sd-navbar-left">
        <button
          className="sd-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
        {showSearch && (
          <div className="sd-search-bar">
            <Search size={15} className="sd-search-icon" />
            <input
              type="text"
              placeholder={isSinhala ? 'විෂයන්, පැවරුම් සොයන්න...' : 'Search subjects, assignments...'}
              className="sd-search-input"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="sd-navbar-right">
        <button
          type="button"
          className="sd-notif-btn sd-theme-toggle"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button type="button" className="sd-notif-btn" onClick={toggleLanguage} aria-label="Change language">
          <span className="text-xs font-bold">{isSinhala ? 'EN' : 'සිං'}</span>
        </button>

        <div className="sd-navbar-profile">
          <div className="sd-navbar-avatar">{avatar}</div>
          <div className="sd-navbar-profile-info">
            <p className="sd-navbar-name">{profile?.name ?? (isSinhala ? 'සිසුවා' : 'Student')}</p>
            <p className="sd-navbar-role">{(profile as any)?.role ?? (isSinhala ? 'සිසුවා' : 'Student')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
