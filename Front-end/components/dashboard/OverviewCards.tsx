'use client';

import { BookOpen, FileText, Star } from 'lucide-react';
import { DashboardOverview, SubjectModuleItem, SubjectExamResult } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';

interface Props {
  overview: DashboardOverview | null;
  latestItems?: SubjectModuleItem[];
  latestResults?: SubjectExamResult[];
  onOpenSubject?: (subjectId: string) => void;
}

export default function OverviewCards({ overview, latestItems, latestResults, onOpenSubject }: Props) {
  const { isSinhala } = useLanguage();
  const average = overview?.averageMark ?? 0;
  const recentResultSlots = Array.from({ length: 3 }, (_, index) => {
    const res = latestResults?.[index];

    if (!res) {
      return {
        id: `result-${index}`,
        label: `Previous mark ${index + 1}`,
        value: isSinhala ? 'පෙර ලකුණු නොමැත' : 'No previous mark available',
        sub: '',
        icon: FileText,
        color: index === 0 ? 'red' : index === 1 ? 'orange' : 'dark',
        classId: undefined,
        empty: true,
      };
    }

    return {
      id: `result-${index}`,
      label: res.examTitle,
      value:
        res.marksObtained !== null && res.marksObtained !== undefined
          ? `${res.marksObtained}/${res.totalMarks ?? '100'}`
          : (isSinhala ? 'වාර්ථකයි' : 'Absent'),
      sub: res.examDate ?? res.createdAt ?? '',
      icon: FileText,
      color: index === 0 ? 'red' : index === 1 ? 'orange' : 'dark',
      classId: (res as any).classId,
      empty: false,
    };
  });

  const cards = recentResultSlots;

  return (
    <section className="sd-overview-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            className={`sd-overview-card sd-card-${card.color} ${(card as any).empty ? 'sd-overview-card--empty' : ''} text-left`}
            onClick={() => {
              if ((card as any).empty) return;
              if ((card as any).classId && onOpenSubject) {
                onOpenSubject((card as any).classId);
                return;
              }
            }}
          >
            <div className="sd-overview-card-header">
              <div className={`sd-overview-icon sd-icon-${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="sd-overview-card-body">
              <p className="sd-overview-label">{card.label}</p>
              <p className="sd-overview-value">{card.value}</p>
              {card.sub ? <p className="sd-overview-sub">{card.sub}</p> : null}
            </div>
            <div className={`sd-card-glow sd-glow-${card.color}`} />
          </button>
        );
      })}
    </section>
  );
}
