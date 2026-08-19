'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Globe, Lock, Palette, ShieldCheck, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { StudentProfile } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { apiPatch } from '@/utils/api';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appear', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
];

const THEME_OPTIONS = ['Light', 'Dark', 'System'];

type ProfileForm = {
  name: string;
  address: string;
  school: string;
  parentName: string;
  parentPhone: string;
};

export default function SettingsPage({
  profile,
  onProfileUpdate,
}: {
  profile: StudentProfile | null;
  onProfileUpdate?: (profile: StudentProfile) => void;
}) {
  const { isSinhala, toggleLanguage } = useLanguage();
  const { theme: activeTheme, setTheme: setAppTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [theme, setTheme] = useState('Light');
  const [timezone, setTimezone] = useState('Asia/Colombo (UTC+5:30)');
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '',
    address: '',
    school: '',
    parentName: '',
    parentPhone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const rawPreferences = window.localStorage.getItem('student-dashboard-preferences');
    if (!rawPreferences) return;

    try {
      const preferences = JSON.parse(rawPreferences) as {
        theme?: string;
        timezone?: string;
      };
      setTimezone(preferences.timezone ?? 'Asia/Colombo (UTC+5:30)');
    } catch {
      window.localStorage.removeItem('student-dashboard-preferences');
    }
  }, []);

  useEffect(() => {
    if (!activeTheme) return;
    setTheme(activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1));
  }, [activeTheme]);

  useEffect(() => {
    setProfileForm({
      name: profile?.name ?? '',
      address: profile?.address ?? '',
      school: profile?.school ?? '',
      parentName: profile?.parentName ?? '',
      parentPhone: profile?.parentPhone ?? '',
    });
    setProfileMessage('');
    setProfileError('');
  }, [profile]);

  const savePreferences = (nextTimezone = timezone) => {
    window.localStorage.setItem('student-dashboard-preferences', JSON.stringify({
      timezone: nextTimezone,
    }));
  };

  const handleThemeChange = (nextTheme: string) => {
    setTheme(nextTheme);
    setAppTheme(nextTheme.toLowerCase());
  };

  const handleTimezoneChange = (nextTimezone: string) => {
    setTimezone(nextTimezone);
    savePreferences(nextTimezone);
  };

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profileForm.name.trim();
    if (!name) {
      setProfileError('Full name is required.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const response = await apiPatch<{ profile: StudentProfile }>('/dashboard/student/profile', {
        name,
        address: profileForm.address,
        school: profileForm.school,
        parentName: profileForm.parentName,
        parentPhone: profileForm.parentPhone,
      });
      onProfileUpdate?.(response.profile);
      setProfileForm({
        name: response.profile.name ?? '',
        address: response.profile.address ?? '',
        school: response.profile.school ?? '',
        parentName: response.profile.parentName ?? '',
        parentPhone: response.profile.parentPhone ?? '',
      });
      setProfileMessage('Profile updated.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="sdp-wrap">
      <div className="sdp-header">
        <div>
          <h1 className="sdp-title">{isSinhala ? 'Settings' : 'Settings'}</h1>
          <p className="sdp-sub">
            {isSinhala ? 'Manage your account and dashboard preferences.' : 'Manage your account and dashboard preferences.'}
          </p>
        </div>
      </div>

      <div className="stg-layout">
        <nav className="stg-nav">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`stg-nav-item ${activeSection === section.id ? 'stg-nav-active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <Icon size={16} />
                <span>{section.label}</span>
                <ChevronRight size={14} className="stg-nav-arrow" />
              </button>
            );
          })}
        </nav>

        <div className="stg-content sdp-card">
          {activeSection === 'profile' && (
            <div className="stg-section">
              <h2 className="stg-section-title">Profile Information</h2>
              <p className="stg-section-sub">
                Update your personal and parent contact details.
              </p>

              <form onSubmit={handleProfileSubmit}>
                <div className="stg-form-grid">
                  <EditableField label="Full Name" value={profileForm.name} onChange={(value) => handleProfileChange('name', value)} />
                  <ReadOnlyField label="Email Address" value={profile?.email ?? ''} />
                  <EditableField label="Address" value={profileForm.address} onChange={(value) => handleProfileChange('address', value)} full />
                  <EditableField label="School" value={profileForm.school} onChange={(value) => handleProfileChange('school', value)} />
                  <ReadOnlyField label="Grade" value={profile?.grade ?? ''} />
                  <ReadOnlyField label="Class" value={profile?.classId?.toUpperCase() ?? ''} />
                  <ReadOnlyField label="Index Number" value={profile?.index ?? ''} />
                  <EditableField label="Parent Name" value={profileForm.parentName} onChange={(value) => handleProfileChange('parentName', value)} />
                  <EditableField label="Parent Phone Number" value={profileForm.parentPhone} onChange={(value) => handleProfileChange('parentPhone', value)} />
                </div>

                {profileError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{profileError}</p>}
                {profileMessage && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{profileMessage}</p>}

                <button type="submit" disabled={profileSaving} className="stg-save-btn disabled:cursor-not-allowed disabled:opacity-60">
                  {profileSaving ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="stg-section">
              <h2 className="stg-section-title">Security</h2>
              <p className="stg-section-sub">
                Students cannot change their own password. Password resets are managed by the institute account admin.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <p className="text-sm leading-6 text-slate-700">
                    For login issues or password reset requests, contact the institute or technical support team.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appear' && (
            <div className="stg-section">
              <h2 className="stg-section-title">Appearance</h2>
              <p className="stg-section-sub">Choose how the dashboard should look.</p>
              <div className="stg-appear-grid">
                {THEME_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`stg-theme-card ${item.toLowerCase() === (activeTheme ?? theme.toLowerCase()) ? 'stg-theme-active' : ''}`}
                    onClick={() => handleThemeChange(item)}
                  >
                    <div className={`stg-theme-preview stg-preview-${item.toLowerCase()}`} />
                    <span className="stg-theme-label">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div className="stg-section">
              <h2 className="stg-section-title">Language & Region</h2>
              <p className="stg-section-sub">Set your preferred language and timezone.</p>
              <div className="stg-form-grid">
                <div className="stg-field">
                  <label className="stg-label">Language</label>
                  <button type="button" className="stg-input text-left" onClick={toggleLanguage}>
                    {isSinhala ? 'Sinhala' : 'English'}
                  </button>
                </div>
                <div className="stg-field">
                  <label className="stg-label">Timezone</label>
                  <select className="stg-input" value={timezone} onChange={(event) => handleTimezoneChange(event.target.value)}>
                    <option>Asia/Colombo (UTC+5:30)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="stg-field">
      <label className="stg-label">{label}</label>
      <input className="stg-input" value={value || '-'} readOnly />
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}) {
  return (
    <div className={`stg-field ${full ? 'stg-full' : ''}`}>
      <label className="stg-label">{label}</label>
      <input className="stg-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
