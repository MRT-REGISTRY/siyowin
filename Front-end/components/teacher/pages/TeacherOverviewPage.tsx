'use client';

import { useState } from 'react';
import { Users, BookOpen, Award, TrendingUp, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface Props {
  overview: any;
  recentAssignments: any[];
}

export default function TeacherOverviewPage({ overview, recentAssignments }: Props) {
  const { isSinhala } = useLanguage();
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());

  const cards = [
    {
      id: 'students',
      label: isSinhala ? 'සිසුන් ගණන' : 'Total Students',
      value: overview?.studentsCount ?? 0,
      sub: isSinhala ? 'ඔබගේ සියලුම පන්ති වල' : 'Across all your classes',
      icon: Users,
      color: 'navy',
    },
    {
      id: 'classes',
      label: isSinhala ? 'පන්ති ගණන' : 'Assigned Courses',
      value: overview?.subjectsCount ?? 0,
      sub: isSinhala ? 'ක්‍රියාකාරී' : 'Active classes',
      icon: BookOpen,
      color: 'orange',
    },
  ];

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAssignments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAssignments(newExpanded);
  };

  return (
    <div className="space-y-6">
      <section className="sd-overview-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className={`sd-overview-card sd-card-${card.color}`}>
              <div className="sd-overview-card-header">
                <div className={`sd-overview-icon sd-icon-${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="sd-overview-card-body">
                <p className="sd-overview-label">{card.label}</p>
                <p className="sd-overview-value">{card.value}</p>
                <p className="sd-overview-sub">{card.sub}</p>
              </div>
              <div className={`sd-card-glow sd-glow-${card.color}`} />
            </article>
          );
        })}
      </section>

      <section>
        <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award size={18} className="text-[#1B3A8C]" />
          {isSinhala ? 'මෑතකදී එකතු කළ පැවරුම්' : 'Recent Assignments & Top Performers'}
        </h3>
        <div className="flex flex-col gap-3">
          {recentAssignments && recentAssignments.map((assignment) => {
            const isExpanded = expandedAssignments.has(assignment.id);
            return (
              <div key={assignment.id} className="sdp-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(assignment.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-[#1B3A8C]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-slate-800">{assignment.examName}</strong>
                      <span className="text-xs text-slate-500 uppercase">{assignment.examType} • {assignment.examDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {assignment.markedStudentCount} {isSinhala ? 'ලකුණු' : 'Graded'}
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                      {isSinhala ? 'ඉහළම ලකුණු ලබාගත් සිසුන් 10' : 'Top 10 Highest Scores'}
                    </h4>
                    {assignment.topStudents && assignment.topStudents.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {assignment.topStudents.map((student: any, idx: number) => (
                          <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {idx + 1}
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-800">{student.name}</span>
                                <span className="text-xs text-slate-400 font-medium">{student.index}</span>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${student.mark >= 75 ? 'text-green-600' : student.mark >= 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                              {student.mark}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {isSinhala ? 'තවමත් ලකුණු එකතු කර නොමැත.' : 'No marks logged for this assignment yet.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {(!recentAssignments || recentAssignments.length === 0) && (
            <div className="sdp-card p-6 text-center text-sm text-slate-500">
              {isSinhala ? 'පැවරුම් කිසිවක් හමු නොවීය.' : 'No recent assignments found.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

