import React, { useState } from 'react';
import { 
  Clock, 
  Send, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Download, 
  Check, 
  Inbox, 
  Lock, 
  Copy, 
  Filter, 
  CheckCheck, 
  Link as LinkIcon, 
  Globe, 
  AtSign, 
  UserCheck,
  Flame,
  Calendar
} from 'lucide-react';
import { HaroQuery, QueryPriority } from '../types';
import { BRANDS } from '../data/brands';
import { getQueryPriority, getDeadlineTimeRemaining } from '../lib/priority';

interface QuerySummaryTableProps {
  queries: HaroQuery[];
  defaultCcEmail?: string;
  onSelectQuery: (query: HaroQuery) => void;
  onSaveToGmailDraft: (query: HaroQuery, customCc?: string) => Promise<void>;
  onBatchSaveDrafts: (queriesToSave: HaroQuery[]) => Promise<void>;
  onSendPitch?: (queryId: string, customCc?: string) => Promise<void>;
  onOpenLinkChecker?: (query: HaroQuery) => void;
  onSwitchToBossPortal?: () => void;
  hasGmailToken: boolean;
  isSavingDraft: boolean;
  savingQueryId: string | null;
  activeFilter: string;
  onLogin: () => void;
}

export const QuerySummaryTable: React.FC<QuerySummaryTableProps> = ({
  queries,
  defaultCcEmail = 'rixie@skinandtonic.pro',
  onSelectQuery,
  onSaveToGmailDraft,
  onBatchSaveDrafts,
  onSendPitch,
  onOpenLinkChecker,
  onSwitchToBossPortal,
  hasGmailToken,
  isSavingDraft,
  savingQueryId,
  activeFilter,
  onLogin,
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchFilter, setSearchFilter] = useState('');
  const [hideSkipped, setHideSkipped] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  
  // NEW: Priority Filter State ('all' | 'HIGH' | 'MEDIUM' | 'LOW')
  const [priorityFilter, setPriorityFilter] = useState<'all' | QueryPriority>('all');

  // Count priorities across all available queries
  const highPriorityCount = queries.filter((q) => getQueryPriority(q) === 'HIGH').length;
  const mediumPriorityCount = queries.filter((q) => getQueryPriority(q) === 'MEDIUM').length;
  const lowPriorityCount = queries.filter((q) => getQueryPriority(q) === 'LOW').length;

  // Filter queries based on active stat tab, priority filter, search input, and hideSkipped toggle
  const filteredQueries = queries
    .filter((q) => {
      if (hideSkipped && q.step1_status === 'REJECTED') return false;
      if (activeFilter === 'pwave') return q.step1_status === 'APPROVED' && q.step2_brand === 'Performance P-Wave';
      if (activeFilter === 'skintonic') return q.step1_status === 'APPROVED' && q.step2_brand === 'Skin & Tonic';
      if (activeFilter === 'croley') return q.step1_status === 'APPROVED' && q.step2_brand === "Dr. Croley's";
      if (activeFilter === 'manual') return q.step3_hasAiRestriction;
      if (activeFilter === 'rejected') return q.step1_status === 'REJECTED';
      if (activeFilter === 'saved_drafts') return !!q.gmailDraftId;
      if (activeFilter === 'sent') return !!q.sentAt;
      return true;
    })
    .filter((q) => {
      // Apply Priority filter
      if (priorityFilter !== 'all') {
        const p = getQueryPriority(q);
        if (p !== priorityFilter) return false;
      }
      return true;
    })
    .filter((q) => {
      if (!searchFilter.trim()) return true;
      const term = searchFilter.toLowerCase();
      const p = getQueryPriority(q).toLowerCase();
      return (
        q.title.toLowerCase().includes(term) ||
        q.journalist.toLowerCase().includes(term) ||
        q.mediaOutlet.toLowerCase().includes(term) ||
        q.email.toLowerCase().includes(term) ||
        p.includes(term) ||
        (q.queryUrl && q.queryUrl.toLowerCase().includes(term)) ||
        (q.step4_teaserInsight && q.step4_teaserInsight.toLowerCase().includes(term))
      );
    });

  // Sort by deadline timestamp (ascending by nearest deadline by default)
  const sortedQueries = [...filteredQueries].sort((a, b) => {
    const timeA = a.deadlineTimestamp || (a.deadline ? new Date(a.deadline).getTime() : 0) || 9999999999999;
    const timeB = b.deadlineTimestamp || (b.deadline ? new Date(b.deadline).getTime() : 0) || 9999999999999;
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const survivingDraftableQueries = queries.filter(
    (q) => q.step1_status === 'APPROVED' && !q.step3_hasAiRestriction && !q.gmailDraftId && !q.sentAt
  );

  const formatDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return 'No deadline specified';
    return deadlineStr;
  };

  const getBrandBadge = (brandName: string) => {
    const config = BRANDS[brandName];
    if (!config) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Unassigned
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${config.badgeBg}`}>
        {config.shortName}
      </span>
    );
  };

  const getPriorityBadge = (priority: QueryPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs">
            <Flame className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>High</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
            <Clock className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Medium</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-2xs">
            <Calendar className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
            <span>Low</span>
          </span>
        );
    }
  };

  const copyCleanSummaryOutput = () => {
    const approvedQueries = queries.filter((q) => q.step1_status === 'APPROVED' && !q.step3_hasAiRestriction);
    if (approvedQueries.length === 0) return;

    const formattedOutput = approvedQueries
      .map((q, idx) => {
        const priority = getQueryPriority(q);
        return `QUERY #${idx + 1}: ${q.title}
• Priority: ${priority} (${getDeadlineTimeRemaining(q)})
• Outlet: ${q.mediaOutlet}
• Journalist: ${q.journalist}
• Deadline: ${q.deadline}
• Brand Assigned: ${q.step2_brand} (${q.step2_expertTitle || 'Medical Director'})
• Reply+ Email (To): ${q.email}
• Executive CC: ${q.ccEmails || defaultCcEmail}
${q.queryUrl ? `• Query URL: ${q.queryUrl}` : ''}
${q.sentAt ? `• Dispatched via Gmail at: ${q.sentAt}` : ''}

DRAFT PITCH (Hedged & Compliant):
Subject: ${q.step4_pitchSubject}

${q.userEditedPitch || q.step4_pitchBody}
------------------------------------------------------------`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(formattedOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const exportAsJson = () => {
    const enriched = queries.map((q) => ({
      ...q,
      priority: getQueryPriority(q),
      timeRemaining: getDeadlineTimeRemaining(q),
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(enriched, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `haro-pitches-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const rejectedCount = queries.filter((q) => q.step1_status === 'REJECTED').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              HARO Opportunities & Pitch Summary
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {filteredQueries.length} of {queries.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Surviving queries mapped to medical brands. Priority tagged by deadline urgency. CC to <span className="text-indigo-600 dark:text-indigo-400 font-mono">{defaultCcEmail}</span>.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onSwitchToBossPortal && (
            <button
              onClick={onSwitchToBossPortal}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition flex items-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Executive Approval Portal</span>
            </button>
          )}

          <button
            id="copy-summary-btn"
            onClick={copyCleanSummaryOutput}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied with CC!' : 'Copy Pitches'}</span>
          </button>

          {survivingDraftableQueries.length > 0 && (
            <button
              id="bulk-save-drafts-btn"
              onClick={() => {
                if (!hasGmailToken) {
                  onLogin();
                } else {
                  onBatchSaveDrafts(survivingDraftableQueries);
                }
              }}
              disabled={isSavingDraft}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {hasGmailToken 
                  ? `Save All (${survivingDraftableQueries.length}) Drafts` 
                  : 'Connect Gmail to Save'}
              </span>
            </button>
          )}

          <button
            id="export-summary-btn"
            onClick={exportAsJson}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Scope Filtering, Priority Filter & Sort Controls Bar */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyword search input */}
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by keyword, priority, reporter, URL..."
            className="w-full sm:w-56 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* PRIORITY FILTER PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 text-[11px] font-medium px-1 flex items-center">
              <Flame className="w-3 h-3 mr-1 text-rose-500" />
              Priority:
            </span>

            {[
              { id: 'all', label: 'All', count: queries.length },
              { id: 'HIGH', label: '🔥 High', count: highPriorityCount },
              { id: 'MEDIUM', label: '⚡ Medium', count: mediumPriorityCount },
              { id: 'LOW', label: '⏳ Low', count: lowPriorityCount },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPriorityFilter(p.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                  priorityFilter === p.id
                    ? p.id === 'HIGH'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : p.id === 'MEDIUM'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : p.id === 'LOW'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[10px] opacity-75">({p.count})</span>
              </button>
            ))}
          </div>

          {/* Hide skipped checkbox */}
          <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideSkipped}
              onChange={(e) => setHideSkipped(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-[11px]">
              Hide Skipped ({rejectedCount})
            </span>
          </label>
        </div>

        {/* Sort by Deadline */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 self-end lg:self-center">
          <span className="text-[11px]">Sort:</span>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center space-x-1 text-xs font-medium transition border border-slate-200 dark:border-slate-700"
          >
            <span>{sortOrder === 'asc' ? 'Urgent Deadline First' : 'Latest Deadline First'}</span>
            {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="py-3 px-4 w-28">Priority</th>
              <th className="py-3 px-4 w-36">Deadline</th>
              <th className="py-3 px-4 w-36">Brand Assigned</th>
              <th className="py-3 px-4">Query Topic & Direct Source Link</th>
              <th className="py-3 px-4 w-48">Outlet, Recipient & CC</th>
              <th className="py-3 px-4 w-28">Status</th>
              <th className="py-3 px-4 w-32 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedQueries.map((query) => {
              const priority = getQueryPriority(query);
              const timeRemaining = getDeadlineTimeRemaining(query);
              const isRejected = query.step1_status === 'REJECTED';
              const isManual = query.step3_hasAiRestriction;
              const hasDraft = !!query.gmailDraftId;
              const isSent = !!query.sentAt || query.overallStatus === 'SENT_TO_JOURNALIST';
              const isCurrentlySaving = savingQueryId === query.id;
              const currentCc = query.ccEmails || defaultCcEmail;

              return (
                <tr
                  key={query.id}
                  onClick={() => onSelectQuery(query)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                    isRejected ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                  }`}
                >
                  {/* Priority Column */}
                  <td className="py-3 px-4 align-top">
                    <div className="space-y-1">
                      {getPriorityBadge(priority)}
                      {timeRemaining && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {timeRemaining}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Deadline */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-start space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {formatDeadline(query.deadline)}
                        </span>
                        {query.sourceEmailDate && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            Received: {query.sourceEmailDate.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Brand & Expert */}
                  <td className="py-3 px-4 align-top">
                    <div className="space-y-1">
                      <div>{getBrandBadge(query.step2_brand)}</div>
                      {query.step2_expertTitle && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                          {query.step2_expertTitle}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Query Title, Direct URL & Teaser Insight */}
                  <td className="py-3 px-4 align-top max-w-md">
                    <div className="space-y-1.5">
                      <div className="flex flex-col space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {query.title}
                        </div>

                        {/* Query Link & Check Link Button */}
                        {query.queryUrl && (
                          <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={query.queryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/80 dark:border-indigo-800/80 transition"
                              title="Open original query on HARO / Connectively in a new tab"
                            >
                              <LinkIcon className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[190px]">View Query Online</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>

                            {onOpenLinkChecker && (
                              <button
                                onClick={() => onOpenLinkChecker(query)}
                                className="inline-flex items-center space-x-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition"
                                title="Inspect and verify source link status"
                              >
                                <Globe className="w-2.5 h-2.5" />
                                <span>Check</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isRejected ? (
                        <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                          <strong>Skipped / Disqualified:</strong> {query.step1_rejectionReason || 'Irrelevant or PR-banned'}
                        </div>
                      ) : isManual ? (
                        <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>MANUAL PITCH REQUIRED — do not auto-draft AI-style</span>
                        </div>
                      ) : (
                        query.step4_teaserInsight && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 p-2 rounded border border-slate-200 dark:border-slate-700">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1">Hedged Lead:</span>
                            "{query.step4_teaserInsight}"
                          </div>
                        )
                      )}
                    </div>
                  </td>

                  {/* Media Outlet, Email & CC */}
                  <td className="py-3 px-4 align-top">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {query.mediaOutlet || 'General Media'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Rep: {query.journalist || 'Staff Reporter'}
                      </div>
                      <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate max-w-[190px]" title={query.email}>
                        To: {query.email}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[190px]" title={currentCc}>
                        Cc: {currentCc}
                      </div>
                    </div>
                  </td>

                  {/* Status & Sent / Draft Badge */}
                  <td className="py-3 px-4 align-top">
                    <div className="space-y-1">
                      {isSent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-2.5 h-2.5 mr-1" />
                          Sent
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <ShieldAlert className="w-2.5 h-2.5 mr-1" />
                          Skipped
                        </span>
                      ) : isManual ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-2.5 h-2.5 mr-1" />
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Ready
                        </span>
                      )}

                      {hasDraft && !isSent && (
                        <div className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3 mr-0.5" />
                          <span>Draft in Gmail</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end space-y-1.5">
                      {isSent ? (
                        <div className="flex items-center space-x-1">
                          <a
                            href="https://mail.google.com/mail/u/0/#sent"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-medium border border-emerald-300 flex items-center space-x-1"
                          >
                            <span>Sent Items</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ) : isRejected ? (
                        <button
                          onClick={() => onSelectQuery(query)}
                          className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                        >
                          View Reason
                        </button>
                      ) : isManual ? (
                        <button
                          onClick={() => onSelectQuery(query)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 rounded"
                        >
                          Manual Notes
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {onSendPitch && (
                            <button
                              onClick={() => {
                                if (!hasGmailToken) {
                                  onLogin();
                                } else {
                                  onSendPitch(query.id, currentCc);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-sm transition flex items-center space-x-1"
                              title="Approve and send immediately to journalist"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send</span>
                            </button>
                          )}

                          <button
                            id={`save-draft-${query.id}`}
                            onClick={() => {
                              if (!hasGmailToken) {
                                onLogin();
                              } else {
                                onSaveToGmailDraft(query, currentCc);
                              }
                            }}
                            disabled={isCurrentlySaving}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded text-[11px] font-medium border border-indigo-200 dark:border-indigo-800 transition flex items-center space-x-1"
                            title="Save as draft only"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isCurrentlySaving ? '...' : 'Draft'}</span>
                          </button>

                          <button
                            onClick={() => onSelectQuery(query)}
                            title="Edit / Preview Pitch"
                            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
