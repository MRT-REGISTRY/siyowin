import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { apiPatch } from '@/utils/api'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)', overflow: 'hidden', marginBottom: 20,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 14, color: '#111827', outline: 'none', background: '#F9FAFB', width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6
}

export default function LmsStudentSettings({ profile, setProfile }: { profile: any, setProfile: (p: any) => void }) {
  const { isSinhala } = useLanguage()
  const [form, setForm] = useState({
    name: '', address: '', school: '', parentName: '', parentPhone: ''
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        address: profile.address || '',
        school: profile.school || '',
        parentName: profile.parentName || '',
        parentPhone: profile.parentPhone || '',
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErr(isSinhala ? 'නම ඇතුළත් කිරීම අනිවාර්යයි.' : 'Name is required.')
      return
    }

    setSaving(true)
    setErr('')
    setMsg('')

    try {
      const res = await apiPatch<{ profile: any }>('/dashboard/student/profile', form)
      setProfile(res.profile)
      setMsg(isSinhala ? 'ගිණුමේ තොරතුරු යාවත්කාලීන කරන ලදී.' : 'Profile updated successfully.')
    } catch (error: any) {
      setErr(error.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
          {isSinhala ? 'සැකසුම්' : 'Settings'}
        </h2>
        <div style={{ fontSize: 14, color: '#6B7280' }}>
          {isSinhala ? 'ඔබගේ ගිණුමේ තොරතුරු කළමනාකරණය කරන්න' : 'Manage your account details and preferences'}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            {isSinhala ? 'පුද්ගලික තොරතුරු' : 'Personal Information'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {msg && <div style={{ padding: '12px 16px', background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontSize: 13.5 }}>{msg}</div>}
          {err && <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 13.5 }}>{err}</div>}

          <div>
            <label style={labelStyle}>{isSinhala ? 'සම්පූර්ණ නම' : 'Full Name'}</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>{isSinhala ? 'ලිපිනය' : 'Address'}</label>
              <input 
                type="text" 
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>{isSinhala ? 'පාසල' : 'School'}</label>
              <input 
                type="text" 
                value={form.school} 
                onChange={e => setForm({...form, school: e.target.value})} 
                style={inputStyle} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>{isSinhala ? 'මව්පියන්ගේ/භාරකරුගේ නම' : 'Parent/Guardian Name'}</label>
              <input 
                type="text" 
                value={form.parentName} 
                onChange={e => setForm({...form, parentName: e.target.value})} 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>{isSinhala ? 'මව්පියන්ගේ/භාරකරුගේ දුරකථන අංකය' : 'Parent/Guardian Phone'}</label>
              <input 
                type="text" 
                value={form.parentPhone} 
                onChange={e => setForm({...form, parentPhone: e.target.value})} 
                style={inputStyle} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#14367D', color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s'
              }}
            >
              {saving ? (isSinhala ? 'සුරකිමින්...' : 'Saving...') : (isSinhala ? 'වෙනස්කම් සුරකින්න' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
