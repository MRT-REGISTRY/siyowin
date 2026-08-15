export interface Student {
  id: string
  username: string
  name: string
}

export interface Resource {
  id: string
  title: string
  link: string
  type: 'drive' | 'youtube' | 'web'
  addedAt: string
}

export interface Homework {
  id: string
  title: string
  dueDate: string
  completedIds: string[]
  createdAt: string
}

export interface Assignment {
  id: string
  title: string
  portalLink: string
  date: string
}

export interface ClassData {
  id: string
  grade: string
  language: string
  subject: string
  color: string
  students: Student[]
  resources: Resource[]
  homework: Homework[]
  assignments: Assignment[]
  marks: Record<string, Record<string, number | null>>
}

export const TEACHER_NAME = 'Mr. Asanka Jayasuriya'

const namePool: [string, string][] = [
  ['Kamal', 'Perera'], ['Nimali', 'Silva'], ['Ruwan', 'Fernando'], ['Chamari', 'Dias'],
  ['Isuru', 'Bandara'], ['Dilini', 'Mendis'], ['Suresh', 'Rajapaksa'], ['Amaya', 'Wickramasinghe'],
  ['Nuwan', 'Herath'], ['Sachini', 'Perera'], ['Dinesh', 'Kumar'], ['Priya', 'Fernando'],
  ['Lasith', 'Jayasuriya'], ['Madushi', 'Senanayake'], ['Ashan', 'Bandara'],
  ['Kavindi', 'Perera'], ['Thilina', 'Rajapaksa'], ['Sanduni', 'Silva'],
  ['Kasun', 'Fernando'], ['Dilshan', 'Dias'], ['Roshani', 'Herath'], ['Janith', 'Perera'],
  ['Chandani', 'Silva'], ['Malith', 'Kumar'], ['Nimal', 'Wickramasinghe'],
]

function makeStudents(prefix: string, count: number, year: number): Student[] {
  return Array.from({ length: count }, (_, i) => {
    const [first, last] = namePool[i % namePool.length]
    return {
      id: `${prefix}${String(i + 1).padStart(3, '0')}`,
      username: `${first.toLowerCase()}.${last.toLowerCase()}.${year}`,
      name: `${first} ${last}`,
    }
  })
}

const markSeed = [85, 72, 91, 68, 77, 88, 95, 60, 82, 74, 90, 63, 78, 86, 71, 93, 67, 80, 84, 76]

function makeMarks(
  students: Student[],
  assignIds: string[],
  filledCount = students.length,
): Record<string, Record<string, number | null>> {
  const result: Record<string, Record<string, number | null>> = {}
  assignIds.forEach((aid, ai) => {
    result[aid] = {}
    students.forEach((s, si) => {
      result[aid][s.id] = si < filledCount ? markSeed[(si + ai * 3) % markSeed.length] : null
    })
  })
  return result
}

export const initialClasses: ClassData[] = (() => {
  const c1s = makeStudents('G10S-', 42, 25)
  const c2s = makeStudents('G11E-', 38, 25)
  const c3s = makeStudents('G12A-', 29, 24)
  const c4s = makeStudents('G10E-', 35, 25)

  return [
    {
      id: 'c1',
      grade: 'Grade 10',
      language: 'Sinhala',
      subject: 'Science',
      color: '#C0182E',
      students: c1s,
      resources: [
        { id: 'r1', title: 'Chapter 5 – Chemical Reactions', link: 'https://drive.google.com/file/d/1abc123', type: 'drive', addedAt: '2024-12-10' },
        { id: 'r2', title: 'Lab Safety Video', link: 'https://youtube.com/watch?v=example2', type: 'youtube', addedAt: '2024-12-12' },
      ],
      homework: [
        { id: 'hw1', title: 'Homework - 01', dueDate: '2024-12-20', completedIds: c1s.slice(0, 38).map(s => s.id), createdAt: '2024-12-13' },
        { id: 'hw2', title: 'Homework - 02', dueDate: '2024-12-27', completedIds: c1s.slice(0, 12).map(s => s.id), createdAt: '2024-12-20' },
      ],
      assignments: [
        { id: 'a1', title: 'Assignment 01 – Atomic Structure', portalLink: 'https://portal.siyowin.lk/assign/c1a1x7k2', date: '2024-12-08' },
        { id: 'a2', title: 'Assignment 02 – Periodic Table', portalLink: 'https://portal.siyowin.lk/assign/c1a2m9p4', date: '2024-12-15' },
      ],
      marks: makeMarks(c1s, ['a1', 'a2'], 10),
    },
    {
      id: 'c2',
      grade: 'Grade 11',
      language: 'English',
      subject: 'Chemistry',
      color: '#14367D',
      students: c2s,
      resources: [
        { id: 'r3', title: 'Organic Chemistry Notes', link: 'https://drive.google.com/file/d/1xyz789', type: 'drive', addedAt: '2024-12-11' },
      ],
      homework: [
        { id: 'hw3', title: 'Homework - 01', dueDate: '2024-12-22', completedIds: c2s.slice(0, 32).map(s => s.id), createdAt: '2024-12-15' },
        { id: 'hw4', title: 'Homework - 02', dueDate: '2024-12-29', completedIds: c2s.slice(0, 4).map(s => s.id), createdAt: '2024-12-22' },
      ],
      assignments: [
        { id: 'a3', title: 'Assignment 01 – Organic Compounds', portalLink: 'https://portal.siyowin.lk/assign/c2a1r3t8', date: '2024-12-10' },
        { id: 'a4', title: 'Assignment 02 – Chemical Reactions', portalLink: 'https://portal.siyowin.lk/assign/c2a2v6w1', date: '2024-12-17' },
      ],
      marks: makeMarks(c2s, ['a3', 'a4'], 8),
    },
    {
      id: 'c3',
      grade: 'Grade 12 (A/L)',
      language: 'English',
      subject: 'Chemistry',
      color: '#0F7B3A',
      students: c3s,
      resources: [
        { id: 'r4', title: 'A/L Chemistry Revision Pack', link: 'https://drive.google.com/file/d/1rev456', type: 'drive', addedAt: '2024-12-09' },
        { id: 'r5', title: 'Past Papers 2022–2023', link: 'https://drive.google.com/file/d/1pp789', type: 'drive', addedAt: '2024-12-10' },
        { id: 'r6', title: 'Thermodynamics Explained', link: 'https://youtube.com/watch?v=thermo1', type: 'youtube', addedAt: '2024-12-14' },
      ],
      homework: [
        { id: 'hw5', title: 'Homework - 01', dueDate: '2024-12-18', completedIds: c3s.map(s => s.id), createdAt: '2024-12-11' },
      ],
      assignments: [
        { id: 'a5', title: 'Assignment 01 – Thermodynamics', portalLink: 'https://portal.siyowin.lk/assign/c3a1k4n2', date: '2024-12-12' },
        { id: 'a6', title: 'Assignment 02 – Equilibrium', portalLink: 'https://portal.siyowin.lk/assign/c3a2p7q9', date: '2024-12-19' },
      ],
      marks: makeMarks(c3s, ['a5', 'a6'], 5),
    },
    {
      id: 'c4',
      grade: 'Grade 10',
      language: 'English',
      subject: 'ICT',
      color: '#7B2D8B',
      students: c4s,
      resources: [],
      homework: [
        { id: 'hw6', title: 'Homework - 01', dueDate: '2024-12-25', completedIds: c4s.slice(0, 20).map(s => s.id), createdAt: '2024-12-18' },
      ],
      assignments: [
        { id: 'a7', title: 'Assignment 01 – Introduction to Programming', portalLink: 'https://portal.siyowin.lk/assign/c4a1z2x5', date: '2024-12-14' },
      ],
      marks: makeMarks(c4s, ['a7']),
    },
  ]
})()

export function computeTopPerformers(classes: ClassData[], limit = 3) {
  const scores: { name: string; username: string; classLabel: string; classColor: string; avg: number }[] = []
  for (const cls of classes) {
    const perStudent: Record<string, number[]> = {}
    for (const sm of Object.values(cls.marks)) {
      for (const [sid, val] of Object.entries(sm)) {
        if (val == null) continue
        ;(perStudent[sid] ??= []).push(val)
      }
    }
    for (const [sid, vals] of Object.entries(perStudent)) {
      if (!vals.length) continue
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const student = cls.students.find(s => s.id === sid)
      if (!student) continue
      scores.push({ name: student.name, username: student.username, classLabel: `${cls.grade} – ${cls.subject}`, classColor: cls.color, avg })
    }
  }
  return scores.sort((a, b) => b.avg - a.avg).slice(0, limit)
}

export function getRecentAssignments(classes: ClassData[], limit = 5) {
  const all: { assignment: Assignment; classLabel: string; classColor: string }[] = []
  for (const cls of classes) {
    for (const a of cls.assignments) {
      all.push({ assignment: a, classLabel: `${cls.grade} – ${cls.subject}`, classColor: cls.color })
    }
  }
  return all
    .sort((a, b) => new Date(b.assignment.date).getTime() - new Date(a.assignment.date).getTime())
    .slice(0, limit)
}
