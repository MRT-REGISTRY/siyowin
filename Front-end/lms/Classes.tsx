import type { ClassData } from './data'
import type { View } from './types'

export default function Classes({ classes, navigate }: { classes: ClassData[]; navigate: (v: View) => void }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 22, marginTop: 0 }}>
        {classes.length} classes assigned · Click a class to manage resources, homework and students.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {classes.map(cls => {
          const pendingHw = cls.homework.reduce(
            (sum, h) => sum + (cls.students.length - h.completedIds.length),
            0,
          )
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
              <div style={{ height: 5, background: cls.color }} />

              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{cls.subject}</div>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>{cls.grade}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: `${cls.color}15`, color: cls.color, flexShrink: 0,
                  }}>
                    {cls.language}
                  </span>
                </div>

                {/* Student count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <svg style={{ flexShrink: 0 }} width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>{cls.students.length}</strong> students enrolled
                  </span>
                </div>

                {/* Divider + meta */}
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{cls.assignments.length} assignments</span>
                  <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{cls.resources.length} resources</span>
                  {pendingHw > 0 && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>
                      {pendingHw} pending
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
