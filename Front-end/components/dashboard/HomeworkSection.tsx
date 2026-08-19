'use client';

import { CheckCircle2, Circle } from 'lucide-react';

type HomeworkItem = {
  id: string;
  subjectName: string;
  title: string;
  dueDate: string;
  status: 'completed' | 'pending';
  color?: string;
};

export default function HomeworkSection({ homework }: { homework: HomeworkItem[] }) {
  const visibleHomework = homework.slice(0, 6);
  const done = homework.filter((item) => item.status === 'completed').length;
  const total = homework.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="sd-hw-section">
      <div className="sd-section-header">
        <div>
          <h2 className="sd-section-title">Homework</h2>
          <p className="sd-section-sub">{total > 0 ? `${done}/${total} completed` : 'No homeworks at the moment'}</p>
        </div>
        <div className="sd-hw-ring-wrap">
          <svg viewBox="0 0 36 36" className="sd-hw-ring">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#F3F4F6" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#D9232D"
              strokeWidth="3"
              strokeDasharray={`${pct * 0.942} 94.2`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span className="sd-hw-ring-pct">{pct}%</span>
        </div>
      </div>

      {visibleHomework.length > 0 ? (
        <div className="space-y-3">
          {visibleHomework.map((item) => {
            const isDone = item.status === 'completed';
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
                {isDone ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" /> : <Circle size={18} className="mt-0.5 text-slate-400" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.subjectName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sd-hw-empty">No homeworks at the moment</div>
      )}
    </section>
  );
}
