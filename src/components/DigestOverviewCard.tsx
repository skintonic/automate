import React, { useState } from 'react';
import { 
  Newspaper, 
  Clock, 
  Flame, 
  Calendar, 
  HeartPulse, 
  Sparkles, 
  UserCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ExternalLink,
  Info
} from 'lucide-react';
import { HaroQuery } from '../types';
import { BRANDS } from '../data/brands';
import { getQueryPriority, getDeadlineTimeRemaining } from '../lib/priority';

interface DigestOverviewCardProps {
  queries: HaroQuery[];
  digestSubject?: string;
  digestDate?: string;
  onFilterChange?: (filter: string) => void;
  onSelectQuery?: (query: HaroQuery) => void;
  activeFilter?: string;
}

export const DigestOverviewCard: React.FC<DigestOverviewCardProps> = ({
  queries,
  digestSubject,
  digestDate,
  onFilterChange,
  onSelectQuery,
  activeFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (queries.length === 0) return null;

  const totalQueries = queries.length;
  const approvedQueries = queries.filter((q) => q.step1_status === 'APPROVED');
  const rejectedQueries = queries.filter((q) => q.step1_status === 'REJECTED');
  const manualQueries = queries.filter((q) => q.step3_hasAiRestriction);

  // Category & Brand counts
  const pwaveQueries = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Performance P-Wave');
  const skinTonicQueries = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Skin & Tonic');
  const croleyQueries = queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === "Dr. Croley's");

  // Deadline Urgency Breakdown
  const highPriorityQueries = queries.filter((q) => getQueryPriority(q) === 'HIGH');
  const mediumPriorityQueries = queries.filter((q) => getQueryPriority(q) === 'MEDIUM');
  const lowPriorityQueries = queries.filter((q) => getQueryPriority(q) === 'LOW');

  const pwavePercent = totalQueries > 0 ? Math.round((pwaveQueries.length / totalQueries) * 100) : 0;
  const skinTonicPercent = totalQueries > 0 ? Math.round((skinTonicQueries.length / totalQueries) * 100) : 0;
  const croleyPercent = totalQueries > 0 ? Math.round((croleyQueries.length / totalQueries) * 100) : 0;
  const rejectedPercent = totalQueries > 0 ? Math.round((rejectedQueries.length / totalQueries) * 100) : 0;

  const highPercent = totalQueries > 0 ? Math.round((highPriorityQueries.length / totalQueries) * 100) : 0;
  const mediumPercent = totalQueries > 0 ? Math.round((mediumPriorityQueries.length / totalQueries) * 100) : 0;
  const lowPercent = totalQueries > 0 ? Math.round((lowPriorityQueries.length / totalQueries) * 100) : 0;

  // Next Most Imminent Deadline
  const approvedWithDeadlines = [...approvedQueries].sort((a, b) => {
    const timeA = a.deadlineTimestamp || 9999999999999;
    const timeB = b.deadlineTimestamp || 9999999999999;
    return timeA - timeB;
  });
  const nearestQuery = approvedWithDeadlines[0] || null;

  const currentSubject = digestSubject || queries[0]?.sourceEmailSubject || 'HARO / Connectively Daily Digest';
  const currentDate = digestDate || queries[0]?.sourceEmailDate || new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden transition-all">
      {/* Digest Card Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                Digest Overview
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {currentDate}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              {currentSubject}
            </h3>
          </div>
        </div>

        {/* Quick Top Stats & Toggle */}
        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-400">Total Analyzed</div>
            <div className="text-lg font-black text-white">
              {totalQueries} <span className="text-xs font-normal text-slate-400">queries</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-400">Qualified Pitches</div>
            <div className="text-lg font-black text-emerald-400">
              {approvedQueries.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({Math.round((approvedQueries.length / totalQueries) * 100)}%)
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1 text-xs"
            title={isExpanded ? 'Collapse Digest Overview' : 'Expand Digest Overview'}
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Overview Body */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Proportional Brand Distribution Multi-Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Digest Category & Brand Breakdown</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                {approvedQueries.length} of {totalQueries} matched medical brands
              </span>
            </div>

            {/* Proportional bar */}
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              {pwavePercent > 0 && (
                <div
                  style={{ width: `${pwavePercent}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Performance P-Wave: ${pwaveQueries.length} (${pwavePercent}%)`}
                />
              )}
              {skinTonicPercent > 0 && (
                <div
                  style={{ width: `${skinTonicPercent}%` }}
                  className="bg-rose-500 transition-all"
                  title={`Skin & Tonic: ${skinTonicQueries.length} (${skinTonicPercent}%)`}
                />
              )}
              {croleyPercent > 0 && (
                <div
                  style={{ width: `${croleyPercent}%` }}
                  className="bg-blue-500 transition-all"
                  title={`Dr. Croley's: ${croleyQueries.length} (${croleyPercent}%)`}
                />
              )}
              {rejectedPercent > 0 && (
                <div
                  style={{ width: `${rejectedPercent}%` }}
                  className="bg-slate-300 dark:bg-slate-700 transition-all"
                  title={`Disqualified / Off-Scope: ${rejectedQueries.length} (${rejectedPercent}%)`}
                />
              )}
            </div>
          </div>

          {/* SECTION 1: MEDICAL BRAND & CATEGORY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Performance P-Wave */}
            <div
              onClick={() => onFilterChange && onFilterChange('pwave')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                activeFilter === 'pwave'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Performance P-Wave</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono">
                  {pwavePercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                {pwaveQueries.length}
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-1 leading-snug">
                Men's sexual health, ED, shockwave therapy
              </div>
              <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                Expert: Dr. Croley (Men's Specialist)
              </div>
            </div>

            {/* 2. Skin & Tonic */}
            <div
              onClick={() => onFilterChange && onFilterChange('skintonic')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                activeFilter === 'skintonic'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 hover:border-rose-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Skin & Tonic</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-mono">
                  {skinTonicPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-rose-950 dark:text-rose-100">
                {skinTonicQueries.length}
              </div>
              <div className="text-[11px] text-rose-800 dark:text-rose-300/80 mt-1 leading-snug">
                Botox, micro-tox, injectables, medspa aesthetics
              </div>
              <div className="mt-2 text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                Expert: Rixie (Aesthetics Director)
              </div>
            </div>

            {/* 3. Dr. Croley's Primary Care */}
            <div
              onClick={() => onFilterChange && onFilterChange('croley')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                activeFilter === 'croley'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dr. Croley's Care</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-mono">
                  {croleyPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-blue-950 dark:text-blue-100">
                {croleyQueries.length}
              </div>
              <div className="text-[11px] text-blue-800 dark:text-blue-300/80 mt-1 leading-snug">
                Annual checkups, blood tests, preventive medicine
              </div>
              <div className="mt-2 text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                Expert: Dr. Croley, MD
              </div>
            </div>

            {/* 4. Filtered / Disqualified */}
            <div
              onClick={() => onFilterChange && onFilterChange('rejected')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                activeFilter === 'rejected'
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Disqualified</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  {rejectedPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {rejectedQueries.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Banned PR or required non-medical specialist
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Filtered automatically
              </div>
            </div>
          </div>

          {/* SECTION 2: DEADLINE URGENCY & NEXT DEADLINE BANNER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            {/* Urgency Distribution Bar */}
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Overall Deadline Urgency Distribution</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {highPriorityQueries.length} urgent within 24h
                </span>
              </div>

              {/* Urgency Progress Bar */}
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                {highPercent > 0 && (
                  <div
                    style={{ width: `${highPercent}%` }}
                    className="bg-rose-500"
                    title={`High Priority (<24h): ${highPriorityQueries.length}`}
                  />
                )}
                {mediumPercent > 0 && (
                  <div
                    style={{ width: `${mediumPercent}%` }}
                    className="bg-amber-500"
                    title={`Medium Priority (1-3d): ${mediumPriorityQueries.length}`}
                  />
                )}
                {lowPercent > 0 && (
                  <div
                    style={{ width: `${lowPercent}%` }}
                    className="bg-slate-400"
                    title={`Low Priority (>3d): ${lowPriorityQueries.length}`}
                  />
                )}
              </div>

              {/* 3 Urgency Stat Chips */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
                  <div className="flex items-center space-x-1 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                    <Flame className="w-3 h-3 text-rose-600" />
                    <span>High Priority</span>
                  </div>
                  <div className="text-lg font-black text-rose-900 dark:text-rose-100 mt-0.5">
                    {highPriorityQueries.length}
                  </div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono">
                    Due &lt; 24h ({highPercent}%)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
                  <div className="flex items-center space-x-1 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Medium Priority</span>
                  </div>
                  <div className="text-lg font-black text-amber-900 dark:text-amber-100 mt-0.5">
                    {mediumPriorityQueries.length}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                    Due 1-3 days ({mediumPercent}%)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Low Priority</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {lowPriorityQueries.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Due &gt; 3 days ({lowPercent}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Next Imminent Deadline Spotlight */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 rounded-xl p-4 border border-amber-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Most Imminent Deadline</span>
                  </span>
                  {nearestQuery && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      {getDeadlineTimeRemaining(nearestQuery) || 'Urgent'}
                    </span>
                  )}
                </div>

                {nearestQuery ? (
                  <div className="space-y-1 mt-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {nearestQuery.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>{nearestQuery.mediaOutlet}</strong> • Reporter: {nearestQuery.journalist}
                    </p>
                    <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 mt-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{nearestQuery.deadline}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">
                    No active pending deadlines in this digest.
                  </p>
                )}
              </div>

              {nearestQuery && onSelectQuery && (
                <button
                  onClick={() => onSelectQuery(nearestQuery)}
                  className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs"
                >
                  <span>Review & Draft Pitch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
