import React from 'react'

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #E8EDF5',
  boxShadow: '0 1px 8px rgba(20,54,125,0.05)',
  overflow: 'hidden',
}

function StatCard({ label, value, sub, color, Icon }: {
  label: string; value: string | number; sub: string; color: string; Icon: React.FC<{ color: string }>
}) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}`, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={color} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', fontFamily: "'Fraunces', serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 5 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function IconStudents({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconCourses({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function IconAssignments({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width={19} height={19} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function LmsDashboard({ 
  overview, 
  recentAssignments, 
  dbExams, 
  students, 
  subjects 
}: { 
  overview: any, 
  recentAssignments: any[], 
  dbExams: any[], 
  students: any[], 
  subjects: any[] 
}) {
  const totalStudents = overview?.studentsCount ?? 0
  const totalClasses = overview?.subjectsCount ?? 0
  const totalAssignments = dbExams?.length ?? 0
  const completionPct = overview?.averageMark ? Math.round(overview.averageMark) : 0 // Using average mark as placeholder for completion

  const stats = [
    { label: 'Total Students', value: totalStudents, sub: 'across all classes', color: '#14367D', Icon: IconStudents },
    { label: 'Assigned Courses', value: totalClasses, sub: 'active this term', color: '#C0182E', Icon: IconCourses },
    { label: 'Total Assignments', value: totalAssignments, sub: 'published', color: '#0F7B3A', Icon: IconAssignments },
    { label: 'Average Marks', value: `${completionPct}%`, sub: 'avg. across all classes', color: '#7B2D8B', Icon: IconCheck },
  ]

  const medalColors = ['#B8860B', '#707070', '#8B4513']
  const medalBg = ['#FFF9E6', '#F5F5F5', '#FDF0E6']

  // Compute top performers based on student marks across all exams
  const topPerformers = React.useMemo(() => {
    const scores: { name: string; username: string; classLabel: string; classColor: string; avg: number }[] = []
    
    students.forEach((student) => {
      if (student.marks && student.marks.length > 0) {
        let total = 0
        let count = 0
        student.marks.forEach((m: any) => {
          if (m.mark != null) {
             total += m.mark
             count++
          }
        })
        if (count > 0) {
          const avg = total / count
          
          // Find class for color/label
          const studentClass = subjects.find(c => c.id === student.classId)
          
          scores.push({
            name: student.name,
            username: student.index,
            classLabel: studentClass ? `${studentClass.grade} - ${studentClass.name}` : 'Unknown Class',
            classColor: studentClass?.color || '#14367D',
            avg
          })
        }
      }
    })
    
    return scores.sort((a, b) => b.avg - a.avg).slice(0, 3)
  }, [students, subjects])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
        {/* Recent Assignments */}
        <div style={card}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Assignments</h2>
            <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>5 most recent</span>
          </div>
          <div>
            {recentAssignments.map((assignment, i) => {
              const cls = subjects.find(c => c.id === assignment.classId)
              return (
              <div
                key={assignment.id}
                style={{
                  padding: '13px 20px',
                  borderBottom: i < recentAssignments.length - 1 ? '1px solid #F9FAFB' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cls?.color || '#14367D', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {assignment.examName}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{cls ? `${cls.grade} - ${cls.name}` : ''}</div>
                </div>
                <div style={{ fontSize: 11.5, color: '#D1D5DB', flexShrink: 0 }}>{new Date(assignment.examDate).toLocaleDateString()}</div>
              </div>
            )})}
            {recentAssignments.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                No recent assignments found.
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div style={card}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Top Performers</h2>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Highest average marks</div>
          </div>
          <div style={{ padding: '6px 0' }}>
            {topPerformers.map((p, i) => (
              <div key={p.username} style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: medalBg[i] || '#F3F4F6', color: medalColors[i] || '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{p.classLabel}</div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800,
                  color: p.avg >= 88 ? '#0F7B3A' : p.avg >= 74 ? '#14367D' : '#C0182E',
                }}>
                  {Math.round(p.avg)}%
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                No graded students yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
