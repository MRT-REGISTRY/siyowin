import React from 'react'

export default function LmsClasses({ 
  subjects, 
  dbExams, 
  navigate 
}: { 
  subjects: any[], 
  dbExams: any[], 
  navigate: (v: any) => void 
}) {
  return (
    <div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 22, marginTop: 0 }}>
        {subjects.length} classes assigned · Click a class to manage resources, homework and students.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {subjects.map(cls => {
          const assignmentsCount = dbExams.filter(e => e.classId === cls.id).length
          const studentCount = cls.studentCount || 0
          
          return (
            <button
              key={cls.id}
              onClick={() => navigate({ page: 'class-detail', classId: cls.id })}
              style={{
                background: '#fff', borderRadius: 14, border: '1px solid #E8EDF5',
                boxShadow: '0 1px 8px rgba(20,54,125,0.05)',
                padding: 0, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.18s', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(20,54,125,0.13)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 8px rgba(20,54,125,0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Color bar */}
              <div style={{ height: 5, background: cls.color || '#14367D' }} />

              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{cls.name}</div>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>{cls.grade}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: `${cls.color || '#14367D'}15`, color: cls.color || '#14367D', flexShrink: 0,
                  }}>
                    {cls.medium}
                  </span>
                </div>

                {/* Student count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <svg style={{ flexShrink: 0 }} width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>{studentCount}</strong> students enrolled
                  </span>
                </div>

                {/* Divider + meta */}
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{assignmentsCount} assignments</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
