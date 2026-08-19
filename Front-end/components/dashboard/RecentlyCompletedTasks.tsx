'use client';

import { CheckCircle2, Award } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type CompletedTaskItem = {
  id: string;
  subjectName: string;
  title: string;
  dueDate: string;
  completedDate?: string;
  status: 'completed' | 'pending';
  color?: string;
};

export default function RecentlyCompletedTasks({ tasks }: { tasks: CompletedTaskItem[] }) {
  const { isSinhala } = useLanguage();
  const visibleTasks = tasks.slice(0, 5);

  return (
    <section className="sd-recently-completed-section">
      <div className="sd-section-header">
        <div>
          <h2 className="sd-section-title">
            {isSinhala ? 'මෑතකදී සම්පූර්ණ කළ කාර්යයන්' : 'Recently Completed Tasks'}
          </h2>
          <p className="sd-section-sub">
            {isSinhala 
              ? `අවසන් වරට සම්පූර්ණ කළ කාර්යයන් ${visibleTasks.length} ක්` 
              : `Your last ${visibleTasks.length} completed items`}
          </p>
        </div>
        <div className="sd-completed-badge-icon">
          <Award size={20} className="sd-completed-award-icon" />
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="sd-no-tasks">
          <p>{isSinhala ? 'තවමත් සම්පූර්ණ කළ කාර්යයන් නොමැත.' : 'No completed tasks yet.'}</p>
        </div>
      ) : (
        <ul className="sd-hw-list">
          {visibleTasks.map((task) => (
            <li key={task.id} className="sd-hw-item sd-hw-done">
              <div className="sd-hw-status-icon">
                <CheckCircle2 size={18} className="sd-hw-check" />
              </div>
              <div className="sd-hw-body">
                <div className="sd-hw-top-row">
                  <span className="sd-hw-dot" style={{ backgroundColor: task.color ?? '#9CA3AF' }} />
                  <span className="sd-hw-subject">{task.subjectName}</span>
                  <span className="sd-hw-badge sd-badge-done">
                    {isSinhala ? 'සම්පූර්ණයි' : 'Completed'}
                  </span>
                </div>
                <p className="sd-hw-task sd-hw-task-done">{task.title}</p>
              </div>
              <span className="sd-hw-due">
                {isSinhala ? 'අවසන් දිනය: ' : 'Due '} {task.dueDate}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
