import React from 'react';
import { Layers, ShieldAlert, AlertCircle, FileText, CheckCircle2, HeartPulse, Sparkles, UserCheck, Send } from 'lucide-react';
import { HaroQuery } from '../types';

interface StatsOverviewProps {
  queries: HaroQuery[];
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  queries,
  onFilterChange,
  activeFilter,
}) => {
  const total = queries.length;
  const rejected = queries.filter((q) => q.step1_status === 'REJECTED').length;
  const pwave = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Performance P-Wave').length;
  const skintonic = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Skin & Tonic').length;
  const croley = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === "Dr. Croley's").length;
  const manual = queries.filter((q) => q.step3_hasAiRestriction).length;
  const draftedToGmail = queries.filter((q) => !!q.gmailDraftId && !q.sentAt).length;
  const sentCount = queries.filter((q) => !!q.sentAt || q.overallStatus === 'SENT_TO_JOURNALIST').length;

  const cards = [
    {
      id: 'all',
      title: 'Total Analyzed',
      count: total,
      subtext: 'Queries Extracted',
      icon: Layers,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700',
    },
    {
      id: 'pwave',
      title: 'Performance P-Wave',
      count: pwave,
      subtext: "Men's Sexual Health",
      icon: HeartPulse,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'skintonic',
      title: 'Skin & Tonic',
      count: skintonic,
      subtext: 'Aesthetics & Spa',
      icon: Sparkles,
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    },
    {
      id: 'croley',
      title: "Dr. Croley's",
      count: croley,
      subtext: 'Primary Care MD',
      icon: UserCheck,
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    },
    {
      id: 'manual',
      title: 'Manual Pitch',
      count: manual,
      subtext: '"No AI" Journalist Rule',
      icon: AlertCircle,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    {
      id: 'rejected',
      title: 'Disqualified',
      count: rejected,
      subtext: 'Off-Scope / No PR',
      icon: ShieldAlert,
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    },
    {
      id: 'saved_drafts',
      title: 'Gmail Drafts',
      count: draftedToGmail,
      subtext: 'Waiting in Inbox',
      icon: CheckCircle2,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    },
    {
      id: 'sent',
      title: 'Approved & Sent',
      count: sentCount,
      subtext: 'Dispatched to Reporters',
      icon: Send,
      color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-800',
    },
  ];

  if (total === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;
        return (
          <button
            key={card.id}
            id={`filter-stat-${card.id}`}
            onClick={() => onFilterChange(card.id)}
            className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${card.color} ${
              isSelected ? 'ring-2 ring-indigo-500 scale-[1.02] shadow-sm' : 'hover:opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold truncate">{card.title}</span>
              <Icon className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black">{card.count}</div>
              <div className="text-[10px] opacity-75 truncate">{card.subtext}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
