import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Mail, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  UserCheck, 
  Globe, 
  Check, 
  Copy, 
  MessageSquare, 
  X, 
  Edit3, 
  ThumbsUp, 
  ChevronRight, 
  RefreshCw,
  Search,
  Users,
  Building,
  AtSign,
  History,
  FileText,
  ShieldAlert,
  Download,
  Filter,
  Flame,
  Calendar,
  BarChart3
} from 'lucide-react';
import { HaroQuery, ActivityLogEntry, ActivityActionType, QueryPriority } from '../types';
import { BRANDS } from '../data/brands';
import { getQueryPriority, getDeadlineTimeRemaining } from '../lib/priority';

interface BossApprovalPortalProps {
  queries: HaroQuery[];
  activityLogs: ActivityLogEntry[];
  defaultCcEmail: string;
  onUpdateDefaultCc: (email: string) => void;
  onSendPitch: (queryId: string, customCc?: string) => Promise<void>;
  onBatchSendPitches: (queryIds: string[]) => Promise<void>;
  onRequestRevision: (queryId: string, note: string) => void;
  onRejectPitch: (queryId: string, reason: string) => void;
  onOpenLinkChecker: (query: HaroQuery) => void;
  onOpenPitchEditor: (query: HaroQuery) => void;
  onNavigateToMetrics?: () => void;
  hasGmailToken: boolean;
  onLogin: () => void;
  isSendingQueryId: string | null;
}

export const BossApprovalPortal: React.FC<BossApprovalPortalProps> = ({
  queries,
  activityLogs,
  defaultCcEmail,
  onUpdateDefaultCc,
  onSendPitch,
  onBatchSendPitches,
  onRequestRevision,
  onRejectPitch,
  onOpenLinkChecker,
  onOpenPitchEditor,
  onNavigateToMetrics,
  hasGmailToken,
  onLogin,
  isSendingQueryId,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'sent' | 'revisions' | 'activity' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [revisionModalQuery, setRevisionModalQuery] = useState<HaroQuery | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [copiedPitchId, setCopiedPitchId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  // Activity Log Sub-Filters
  const [activityActionFilter, setActivityActionFilter] = useState<string>('all');
  const [activityBrandFilter, setActivityBrandFilter] = useState<string>('all');
  const [copiedLogNotice, setCopiedLogNotice] = useState(false);

  // Eligible queries for boss approval (in-scope and approved in Step 1)
  const approvedQueries = queries.filter((q) => q.step1_status === 'APPROVED');

  const pendingApprovalQueries = approvedQueries.filter(
    (q) => !q.sentAt && q.bossApprovalStatus !== 'REVISION_REQUESTED' && q.bossApprovalStatus !== 'REJECTED'
  );

  const sentQueries = approvedQueries.filter((q) => !!q.sentAt || q.overallStatus === 'SENT_TO_JOURNALIST');
  const revisionQueries = approvedQueries.filter((q) => q.bossApprovalStatus === 'REVISION_REQUESTED');

  const getFilteredQueries = () => {
    let list = approvedQueries;
    if (filterTab === 'pending') {
      list = pendingApprovalQueries;
    } else if (filterTab === 'sent') {
      list = sentQueries;
    } else if (filterTab === 'revisions') {
      list = revisionQueries;
    }

    if (!searchQuery.trim()) return list;
    const term = searchQuery.toLowerCase();
    return list.filter(
      (q) =>
        q.title.toLowerCase().includes(term) ||
        q.mediaOutlet.toLowerCase().includes(term) ||
        q.journalist.toLowerCase().includes(term) ||
        q.step2_brand.toLowerCase().includes(term) ||
        (q.step4_pitchSubject && q.step4_pitchSubject.toLowerCase().includes(term))
    );
  };

  const currentQueries = getFilteredQueries();

  // Filtered Activity Logs
  const filteredActivityLogs = [...activityLogs]
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .filter((log) => {
      if (activityActionFilter !== 'all' && log.action !== activityActionFilter) return false;
      if (activityBrandFilter !== 'all' && log.brand !== activityBrandFilter) return false;
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase();
      return (
        log.queryTitle.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.actor.toLowerCase().includes(term) ||
        log.brand.toLowerCase().includes(term) ||
        (log.journalist && log.journalist.toLowerCase().includes(term)) ||
        (log.outlet && log.outlet.toLowerCase().includes(term))
      );
    });

  const handleCopyPitch = (query: HaroQuery) => {
    const pitchText = `To: ${query.email}\nCc: ${query.ccEmails || defaultCcEmail}\nSubject: ${query.step4_pitchSubject}\n\n${query.userEditedPitch || query.step4_pitchBody}`;
    navigator.clipboard.writeText(pitchText);
    setCopiedPitchId(query.id);
    setTimeout(() => setCopiedPitchId(null), 2000);
  };

  const handleOpenRevisionModal = (query: HaroQuery) => {
    setRevisionModalQuery(query);
    setRevisionNote(query.bossFeedbackNotes || '');
  };

  const handleSaveRevision = () => {
    if (revisionModalQuery) {
      onRequestRevision(revisionModalQuery.id, revisionNote);
      setRevisionModalQuery(null);
      setRevisionNote('');
    }
  };

  const handleBatchSendConfirm = async () => {
    setShowBatchConfirm(false);
    setIsBatchSending(true);
    try {
      const idsToSend = pendingApprovalQueries.map((q) => q.id);
      await onBatchSendPitches(idsToSend);
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleCopyActivityLogSummary = () => {
    const summary = filteredActivityLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.actor}] ${l.actionTitle} - ${l.brand} ("${l.queryTitle}")\nDetails: ${l.details}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(summary);
    setCopiedLogNotice(true);
    setTimeout(() => setCopiedLogNotice(false), 2000);
  };

  const handleExportActivityCsv = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Brand', 'Query Title', 'Outlet', 'Journalist', 'Details'];
    const rows = filteredActivityLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actor}"`,
      `"${l.actionTitle}"`,
      `"${l.brand}"`,
      `"${l.queryTitle.replace(/"/g, '""')}"`,
      `"${(l.outlet || '').replace(/"/g, '""')}"`,
      `"${(l.journalist || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `executive-activity-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionBadge = (action: ActivityActionType) => {
    switch (action) {
      case 'APPROVED_AND_SENT':
        return {
          icon: Send,
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'EDITED_BY_MANAGER':
        return {
          icon: Edit3,
          bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
          dot: 'bg-indigo-500',
        };
      case 'REVISION_REQUESTED':
        return {
          icon: MessageSquare,
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'SAVED_DRAFT':
        return {
          icon: FileText,
          bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300',
          dot: 'bg-cyan-500',
        };
      case 'LINK_CHECKED':
        return {
          icon: Globe,
          bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
          dot: 'bg-sky-500',
        };
      case 'REJECTED':
        return {
          icon: ShieldAlert,
          bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
          dot: 'bg-rose-500',
        };
      case 'INGESTED':
      default:
        return {
          icon: Sparkles,
          bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
          dot: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Portal Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Executive Sign-Off & Dispatch Desk</span>
              </span>
              <span className="text-xs text-indigo-200">
                Medical Director & CEO Control Center
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pitch Review & One-Click Dispatch
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verify the reporter's source link, recipient emails, and drafted clinical commentary. 
              When you click <strong className="text-emerald-400">"Approve & Send Now"</strong>, the pitch is immediately dispatched via Gmail to the journalist with CC to your inbox.
            </p>
          </div>

          {/* Quick Boss Settings: Default CC */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3.5 border border-slate-700/80 flex flex-col space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center space-x-1.5">
                <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive CC Recipient:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Auto-CCed</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                value={defaultCcEmail}
                onChange={(e) => onUpdateDefaultCc(e.target.value)}
                placeholder="e.g. rixie@skinandtonic.pro"
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Every approved pitch will CC this address so your executive team receives a copy.
            </p>
          </div>
        </div>

        {/* Tab Filters & Batch Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                filterTab === 'pending'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Waiting for Approval</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900/80 text-indigo-200">
                {pendingApprovalQueries.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('sent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                filterTab === 'sent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Approved & Sent</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/80 text-emerald-200">
                {sentQueries.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('revisions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                filterTab === 'revisions'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Revisions Requested</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900/80 text-amber-200">
                {revisionQueries.length}
              </span>
            </button>

            {/* NEW ACTIVITY LOG TAB */}
            <button
              id="boss-activity-log-tab"
              onClick={() => setFilterTab('activity')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                filterTab === 'activity'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Activity Log</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/80 text-purple-200">
                {activityLogs.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All In-Scope ({approvedQueries.length})</span>
            </button>
          </div>

          {/* Search & Batch Approval Button */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={filterTab === 'activity' ? 'Search activity log entries...' : 'Search pitches by reporter or topic...'}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56 sm:w-64"
              />
            </div>

            {pendingApprovalQueries.length > 0 && filterTab === 'pending' && (
              <button
                onClick={() => setShowBatchConfirm(true)}
                disabled={isBatchSending}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center space-x-1.5"
              >
                {isBatchSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="w-3.5 h-3.5" />
                )}
                <span>Approve & Send All ({pendingApprovalQueries.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: ACTIVITY LOG TAB */}
      {filterTab === 'activity' ? (
        <div className="space-y-5">
          {/* Activity Log Header & Audit Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Executive Audit & Action History</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological history of every query ingested, edits by the PR manager, link checks, and approvals or rejections by the boss.
                </p>
              </div>

              {/* Export Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyActivityLogSummary}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
                >
                  {copiedLogNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLogNotice ? 'Copied Log' : 'Copy Log'}</span>
                </button>

                <button
                  onClick={handleExportActivityCsv}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Action and Brand Filter Chips */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-medium mr-1 flex items-center">
                  <Filter className="w-3 h-3 mr-1" />
                  Filter Action:
                </span>
                {[
                  { id: 'all', label: 'All Actions' },
                  { id: 'INGESTED', label: 'Ingested' },
                  { id: 'EDITED_BY_MANAGER', label: 'Manager Edits' },
                  { id: 'APPROVED_AND_SENT', label: 'Approved & Sent' },
                  { id: 'SAVED_DRAFT', label: 'Drafts Created' },
                  { id: 'LINK_CHECKED', label: 'Link Checks' },
                  { id: 'REVISION_REQUESTED', label: 'Revisions' },
                  { id: 'REJECTED', label: 'Declined' },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setActivityActionFilter(act.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      activityActionFilter === act.id
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 font-medium">Brand:</span>
                <select
                  value={activityBrandFilter}
                  onChange={(e) => setActivityBrandFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Brands</option>
                  <option value="Performance P-Wave">Performance P-Wave</option>
                  <option value="Skin & Tonic">Skin & Tonic</option>
                  <option value="Dr. Croley's">Dr. Croley's</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Log Timeline */}
          {filteredActivityLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No Log Entries Match Filters
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Actions taken by the PR manager and executive boss (ingesting digests, editing pitches, verifying links, and dispatching emails) will be logged here with timestamps.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {filteredActivityLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const queryMatch = queries.find((q) => q.id === log.queryId);

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot Icon */}
                      <div
                        className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs ${badge.bg}`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>

                      {/* Log Card */}
                      <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-900/60 transition space-y-2">
                        {/* Top row: Action Title, Actor, Timestamp */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center space-x-1 ${badge.bg}`}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              <span>{log.actionTitle}</span>
                            </span>

                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              Actor: {log.actor}
                            </span>

                            {log.brand && (
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                • {log.brand}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 font-mono flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{log.timestamp}</span>
                          </div>
                        </div>

                        {/* Query Title & Context */}
                        <div className="pt-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {log.queryTitle}
                          </h4>
                          {(log.outlet || log.journalist) && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {log.outlet && <span>Outlet: <strong>{log.outlet}</strong></span>}
                              {log.journalist && <span> • Reporter: <strong>{log.journalist}</strong></span>}
                            </div>
                          )}
                        </div>

                        {/* Details Text */}
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed font-sans">
                          {log.details}
                        </p>

                        {/* Interactive Context Links */}
                        {queryMatch && (
                          <div className="pt-1 flex flex-wrap items-center justify-end gap-2 text-xs">
                            {queryMatch.queryUrl && (
                              <a
                                href={queryMatch.queryUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <span>Source Query</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => onOpenPitchEditor(queryMatch)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition"
                            >
                              Open in Editor
                            </button>
                            {queryMatch.queryUrl && (
                              <button
                                onClick={() => onOpenLinkChecker(queryMatch)}
                                className="px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-md transition flex items-center space-x-1"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Check Link</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB CONTENT 2: PITCHES LIST (Waiting for Approval, Approved & Sent, etc.) */
        <>
          {filterTab === 'sent' && onNavigateToMetrics && (
            <div className="bg-purple-950/40 border border-purple-800/80 rounded-2xl p-4 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-700/80 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Email Engagement & Gmail Thread Monitoring</span>
                  </h4>
                  <p className="text-xs text-purple-200/80">
                    Track open rates, journalist reply rates, and response turnaround times for all sent pitches.
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateToMetrics}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
              >
                <span>View Engagement Metrics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {currentQueries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {filterTab === 'pending'
                  ? 'All Pitches Reviewed!'
                  : filterTab === 'sent'
                  ? 'No Sent Pitches Yet'
                  : 'No Queries in this View'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {filterTab === 'pending'
                  ? 'There are currently no pitches waiting for executive sign-off. When new digests are processed, qualifying opportunities will appear here for one-click approval.'
                  : 'Switch to the "Waiting for Approval" tab to review pending pitches or check the Activity Log tab.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentQueries.map((query) => {
                const brandConfig = BRANDS[query.step2_brand];
                const isSent = !!query.sentAt || query.overallStatus === 'SENT_TO_JOURNALIST';
                const isSendingThis = isSendingQueryId === query.id;
                const currentCc = query.ccEmails || defaultCcEmail;

                return (
                  <div
                    key={query.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-md overflow-hidden ${
                      isSent
                        ? 'border-emerald-300 dark:border-emerald-900/50 bg-emerald-50/10'
                        : query.bossApprovalStatus === 'REVISION_REQUESTED'
                        ? 'border-amber-300 dark:border-amber-900/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    {/* Card Top: Brand & Urgent Info Bar */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
                      <div className="flex flex-wrap items-center gap-2">
                        {brandConfig ? (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${brandConfig.badgeBg}`}>
                            {brandConfig.name}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {query.step2_brand}
                          </span>
                        )}

                        {/* Priority Badge */}
                        {(() => {
                          const priority = getQueryPriority(query);
                          const timeRemaining = getDeadlineTimeRemaining(query);
                          return (
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center space-x-1 border ${
                                priority === 'HIGH'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                                  : priority === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                              }`}
                            >
                              {priority === 'HIGH' ? (
                                <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : priority === 'MEDIUM' ? (
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span>{priority} Priority {timeRemaining ? `• ${timeRemaining}` : ''}</span>
                            </span>
                          );
                        })()}

                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center space-x-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Expert: <strong>{query.step2_expertTitle || brandConfig?.inHouseExpert.name}</strong></span>
                        </span>

                        <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deadline: {query.deadline}</span>
                        </span>

                        {/* Sent Confirmation Pill */}
                        {isSent && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sent via Gmail ({query.sentAt || 'Dispatched'})</span>
                          </span>
                        )}

                        {query.bossApprovalStatus === 'REVISION_REQUESTED' && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center space-x-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Changes Requested</span>
                          </span>
                        )}
                      </div>

                      {/* Actions: View Details / Edit */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenPitchEditor(query)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Pitch</span>
                        </button>
                        <button
                          onClick={() => handleCopyPitch(query)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                          title="Copy full email"
                        >
                          {copiedPitchId === query.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card Main Body */}
                    <div className="p-5 space-y-4">
                      {/* Journalist & Opportunity Context with SOURCE LINK */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {query.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Media Outlet: <strong className="text-slate-800 dark:text-slate-200">{query.mediaOutlet}</strong> • Reporter: <strong className="text-slate-800 dark:text-slate-200">{query.journalist}</strong>
                            </p>
                          </div>

                          {/* Source Link & Verification Tools */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => onOpenLinkChecker(query)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 transition flex items-center space-x-1.5"
                              title="Check source query link health and accessibility"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Check Link Status</span>
                            </button>

                            {query.queryUrl && (
                              <a
                                href={query.queryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5"
                              >
                                <span>Open Query</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Query Requirements preview */}
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                          <strong className="text-slate-700 dark:text-slate-300">Journalist Query Requirements:</strong>{' '}
                          {query.queryRequirements || query.title}
                        </div>

                        {/* Live Query URL Indicator */}
                        {query.queryUrl && (
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                            <span className="text-slate-500">Source:</span>
                            <span className="truncate max-w-md text-indigo-600 dark:text-indigo-400">
                              {query.queryUrl}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Revision notes if boss left them previously */}
                      {query.bossFeedbackNotes && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                          <div>
                            <strong>Executive Note:</strong> {query.bossFeedbackNotes}
                          </div>
                        </div>
                      )}

                      {/* The Actual Email That Will Be Dispatched */}
                      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                        {/* Email Headers: To, Cc, Subject */}
                        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 text-xs space-y-1.5 font-mono">
                          <div className="flex items-center">
                            <span className="text-slate-500 w-16 uppercase text-[10px]">To:</span>
                            <span className="text-indigo-300 font-semibold">{query.email}</span>
                          </div>

                          <div className="flex items-center">
                            <span className="text-slate-500 w-16 uppercase text-[10px]">Cc:</span>
                            <span className="text-emerald-400">{currentCc}</span>
                            <span className="ml-2 text-[10px] text-slate-500 font-sans">(Boss inbox copy)</span>
                          </div>

                          <div className="flex items-center">
                            <span className="text-slate-500 w-16 uppercase text-[10px]">Subject:</span>
                            <span className="text-slate-100 font-sans font-bold">
                              {query.step4_pitchSubject || `HARO: Response from ${query.step2_brand}`}
                            </span>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div className="p-4 bg-slate-900 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {query.userEditedPitch || query.step4_pitchBody || 'No pitch drafted yet.'}
                        </div>

                        {/* Email Footer & Compliance Seal */}
                        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">
                              Strict Medical Compliance Verified
                            </span>
                            <span className="text-slate-600">•</span>
                            <span>Hedged Claims Only</span>
                          </div>
                          <span className="font-mono text-slate-500">
                            {(query.userEditedPitch || query.step4_pitchBody || '').split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions: The Big "Approve & Send" Button */}
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenRevisionModal(query)}
                          className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center space-x-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                          <span>Request Changes</span>
                        </button>

                        <button
                          onClick={() => onRejectPitch(query.id, 'Declined by CEO during executive review.')}
                          className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
                        >
                          Decline Pitch
                        </button>
                      </div>

                      {/* Primary Dispath Button */}
                      <div className="flex items-center space-x-2">
                        {isSent ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                              <Check className="w-4 h-4" />
                              <span>Email Dispatched</span>
                            </span>
                            <a
                              href="https://mail.google.com/mail/u/0/#sent"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                            >
                              <span>View in Gmail Sent</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!hasGmailToken) {
                                onLogin();
                              } else {
                                onSendPitch(query.id, currentCc);
                              }
                            }}
                            disabled={isSendingThis}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition flex items-center space-x-2"
                          >
                            {isSendingThis ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Sending via Gmail API...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>
                                  {hasGmailToken 
                                    ? 'Approve & Send Now 🚀' 
                                    : 'Connect Gmail & Send'}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Revision Request Modal */}
      {revisionModalQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>Executive Feedback / Revision Request</span>
              </h3>
              <button
                onClick={() => setRevisionModalQuery(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide feedback for the PR manager to refine for <strong>{revisionModalQuery.title}</strong>:
            </p>

            <textarea
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please lead with Dr. Croley's 15 years in metabolic medicine, and clarify that the consultation includes full hormone lab review."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRevisionModalQuery(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevision}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Send Confirmation Modal */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Approve & Dispatch All {pendingApprovalQueries.length} Pitches?
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              This will automatically send all {pendingApprovalQueries.length} approved pitches to their respective journalists via your connected Gmail account and CC <strong className="text-slate-800 dark:text-slate-200">{defaultCcEmail}</strong>.
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              <strong>Check:</strong> All medical claims are strictly hedged and adhere to medical advertising compliance.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBatchConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchSendConfirm}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md flex items-center space-x-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Confirm & Send All Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
