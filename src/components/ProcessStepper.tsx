import React from 'react';
import { Filter, Layers, AlertOctagon, Edit3, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface ProcessStepperProps {
  counts: {
    total: number;
    step1_rejected: number;
    step2_pwave: number;
    step2_skintonic: number;
    step2_croley: number;
    step3_manual: number;
    step4_drafted: number;
    step5_saved: number;
  };
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({ counts }) => {
  const steps = [
    {
      num: '1',
      title: 'Step 1: Filter & Reject',
      icon: Filter,
      desc: 'Bans PR pitches, strict unmatched credentials, or topically irrelevant.',
      stat: `${counts.step1_rejected} Rejected`,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    },
    {
      num: '2',
      title: 'Step 2: Brand Routing',
      icon: Layers,
      desc: 'Routes to P-Wave (ED/Sexual Health), Skin & Tonic (Aesthetics), Dr. Croley (Primary Care).',
      stat: `${counts.step2_pwave + counts.step2_skintonic + counts.step2_croley} Assigned`,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    },
    {
      num: '3',
      title: 'Step 3: AI Check',
      icon: AlertOctagon,
      desc: "Detects 'No AI Pitches Considered' -> Marks 'MANUAL PITCH REQUIRED'.",
      stat: `${counts.step3_manual} Manual Only`,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
      num: '4',
      title: 'Step 4: PR Pitch Draft',
      icon: Edit3,
      desc: 'Drafts human PR pitch with 1-2 sentence teaser insight, expert title, and deadline availability.',
      stat: `${counts.step4_drafted} Pitches Ready`,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
      num: '5',
      title: 'Step 5: Gmail Drafts',
      icon: FileText,
      desc: 'Saves directly to Gmail Drafts addressed to reply+ email. NEVER auto-sends.',
      stat: `${counts.step5_saved} In Gmail Drafts`,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          Standard 5-Step Editorial & Pitch Pipeline
        </h2>
        <span className="text-xs text-slate-400">
          Strict Compliance Mode Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="relative bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center space-x-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[11px] font-bold">
                      {step.num}
                    </span>
                    <span className="truncate">{step.title.split(':')[1]}</span>
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${step.badgeColor}`}>
                  {step.stat}
                </span>
                {idx < 4 && (
                  <ChevronRight className="hidden md:block w-3.5 h-3.5 text-slate-300 dark:text-slate-600 -mr-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
