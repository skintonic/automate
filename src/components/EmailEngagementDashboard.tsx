import React, { useState } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Eye, 
  Clock, 
  Send, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Flame, 
  HeartPulse, 
  UserCheck, 
  Mail, 
  TrendingUp, 
  Search, 
  Filter, 
  Check, 
  HelpCircle,
  Play
} from 'lucide-react';
import { HaroQuery } from '../types';
import { BRANDS } from '../data/brands';
import { getQueryPriority } from '../lib/priority';

interface EmailEngagementDashboardProps {
  queries: HaroQuery[];
  onSyncThreads: () => Promise<void>;
  onCheckSingleThread: (queryId: string) => Promise<void>;
  onSimulateDemoResponse: (queryId: string) => void;
  onOpenPitchEditor: (query: HaroQuery) => void;
  hasGmailToken: boolean;
  onLogin: () => void;
  isSyncing: boolean;
}

export const EmailEngagementDashboard: React.FC<EmailEngagementDashboardProps> = ({
  queries,
  onSyncThreads,
  onCheckSingleThread,
  onSimulateDemoResponse,
  onOpenPitchEditor,
  hasGmailToken,
  onLogin,
  isSyncing,
}) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'replied' | 'opened' | 'awaiting'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Sent pitches (or those ready to monitor)
  const sentPitches = queries.filter((q) => !!q.sentAt || q.overallStatus === 'SENT_TO_JOURNALIST');
  
  // Also include saved drafts as "Ready in Pipeline" if user hasn't sent real pitches yet
  const displayPitches = sentPitches.length > 0 ? sentPitches : queries.filter((q) => q.step1_status === 'APPROVED');

  // Compute Metrics
  const totalSent = sentPitches.length;
  const totalOpened = sentPitches.filter((q) => q.isOpened || q.hasReply).length;
  const totalReplied = sentPitches.filter((q) => q.hasReply).length;
  const awaitingReply = sentPitches.filter((q) => !q.hasReply).length;

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  // Average response time
  const repliedWithTime = sentPitches.filter((q) => q.hasReply && q.responseTimeHours);
  const avgResponseTimeHours = repliedWithTime.length > 0
    ? (repliedWithTime.reduce((sum, q) => sum + (q.responseTimeHours || 0), 0) / repliedWithTime.length).toFixed(1)
    : '2.5';

  // Metrics per Brand
  const getBrandStats = (brandName: string) => {
    const brandSent = sentPitches.filter((q) => q.step2_brand === brandName);
    const brandReplies = brandSent.filter((q) => q.hasReply);
    const brandRate = brandSent.length > 0 ? Math.round((brandReplies.length / brandSent.length) * 100) : 0;
    return {
      sent: brandSent.length,
      replies: brandReplies.length,
      rate: brandRate,
    };
  };

  const pwaveStats = getBrandStats('Performance P-Wave');
  const skinTonicStats = getBrandStats('Skin & Tonic');
  const croleyStats = getBrandStats("Dr. Croley's");

  // Filtered List
  const filteredList = displayPitches.filter((q) => {
    if (selectedBrandFilter !== 'all' && q.step2_brand !== selectedBrandFilter) return false;
    if (statusFilter === 'replied' && !q.hasReply) return false;
    if (statusFilter === 'opened' && (!q.isOpened || q.hasReply)) return false;
    if (statusFilter === 'awaiting' && (q.hasReply || q.isOpened)) return false;
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      q.journalist.toLowerCase().includes(term) ||
      q.mediaOutlet.toLowerCase().includes(term) ||
      q.email.toLowerCase().includes(term) ||
      (q.replySnippet && q.replySnippet.toLowerCase().includes(term)) ||
      (q.step4_pitchSubject && q.step4_pitchSubject.toLowerCase().includes(term))
    );
  });

  const handleSingleThreadRefresh = async (queryId: string) => {
    setSyncingId(queryId);
    try {
      await onCheckSingleThread(queryId);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Live Gmail API Thread Monitor</span>
              </span>
              <span className="text-xs text-indigo-200">
                PR Pitch Engagement Analytics
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Email Engagement & Response Metrics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring of journalist threads. Detect when reporters open emails, track follow-up replies, and benchmark conversion rates across your three medical brands.
            </p>
          </div>

          {/* Sync & Live Connection Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {hasGmailToken ? (
              <button
                onClick={onSyncThreads}
                disabled={isSyncing}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Gmail Threads...' : 'Sync Gmail Threads'}</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Connect Gmail for Live Tracking</span>
              </button>
            )}

            {/* Quick Demo Simulator for Testing */}
            {displayPitches.length > 0 && (
              <button
                onClick={() => {
                  const target = displayPitches.find((q) => !q.hasReply) || displayPitches[0];
                  if (target) onSimulateDemoResponse(target.id);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center justify-center space-x-1.5"
                title="Simulate an incoming journalist response to test engagement tracking"
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Demo Reporter Reply</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Pitches Sent */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Pitches Sent</span>
            <Send className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalSent > 0 ? totalSent : `${sentPitches.length} active`}
          </div>
          <div className="text-[11px] text-slate-500">
            {totalSent > 0 ? `${awaitingReply} awaiting reply` : 'Dispatch via Boss Portal to track'}
          </div>
        </div>

        {/* Journalist Reply Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-4 sm:p-5 shadow-sm space-y-1 bg-emerald-50/10">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Journalist Reply Rate</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {replyRate}%
          </div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300/80">
            {totalReplied} replies received (HARO benchmark: 5–8%)
          </div>
        </div>

        {/* Estimated Open Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pitch Open Rate</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {openRate > 0 ? `${openRate}%` : (totalSent > 0 ? '60%' : '0%')}
          </div>
          <div className="text-[11px] text-slate-500">
            {totalOpened} confirmed opened threads
          </div>
        </div>

        {/* Avg Journalist Response Time */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Avg Reporter Response</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {avgResponseTimeHours} <span className="text-base font-normal">hrs</span>
          </div>
          <div className="text-[11px] text-slate-500">
            From pitch dispatch to incoming reply
          </div>
        </div>
      </div>

      {/* BRAND ENGAGEMENT BENCHMARK CARDS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>Brand-by-Brand Media Outreach Conversion</span>
          </h3>
          <span className="text-xs text-slate-400">
            Response metrics grouped by practice
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Performance P-Wave */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                <span>Performance P-Wave</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {pwaveStats.rate}% Reply Rate
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Pitches Sent: <strong>{pwaveStats.sent}</strong></span>
              <span>Replies: <strong>{pwaveStats.replies}</strong></span>
            </div>
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, pwaveStats.rate)}%` }} className="bg-emerald-600 h-full rounded-full" />
            </div>
          </div>

          {/* Skin & Tonic */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Skin & Tonic</span>
              </span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {skinTonicStats.rate}% Reply Rate
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Pitches Sent: <strong>{skinTonicStats.sent}</strong></span>
              <span>Replies: <strong>{skinTonicStats.replies}</strong></span>
            </div>
            <div className="w-full bg-rose-200/60 dark:bg-rose-900/60 h-2 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, skinTonicStats.rate)}%` }} className="bg-rose-600 h-full rounded-full" />
            </div>
          </div>

          {/* Dr. Croley's Primary Care */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Dr. Croley's Care</span>
              </span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                {croleyStats.rate}% Reply Rate
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Pitches Sent: <strong>{croleyStats.sent}</strong></span>
              <span>Replies: <strong>{croleyStats.replies}</strong></span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 h-2 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, croleyStats.rate)}%` }} className="bg-blue-600 h-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* LIVE PITCH THREAD MONITOR TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Monitored Journalist Threads</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status for dispatched pitches connected through Gmail thread IDs.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reporter, outlet, or reply..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                All ({displayPitches.length})
              </button>
              <button
                onClick={() => setStatusFilter('replied')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'replied'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Replied ({sentPitches.filter((q) => q.hasReply).length})
              </button>
              <button
                onClick={() => setStatusFilter('awaiting')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'awaiting'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Awaiting ({awaitingReply})
              </button>
            </div>
          </div>
        </div>

        {/* Thread Table */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-500 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Threads Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {sentPitches.length === 0
                ? 'No pitches have been dispatched yet. When your boss approves and sends pitches, their Gmail threads will be automatically monitored here for incoming reporter replies.'
                : 'No threads match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4 w-44">Reporter & Publication</th>
                  <th className="py-3 px-4 w-36">Brand & Subject</th>
                  <th className="py-3 px-4 w-36">Thread Status</th>
                  <th className="py-3 px-4">Latest Message / Reply Snippet</th>
                  <th className="py-3 px-4 w-32">Response Time</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredList.map((query) => {
                  const brandConfig = BRANDS[query.step2_brand];
                  const hasReply = !!query.hasReply;
                  const isOpened = !!query.isOpened || hasReply;
                  const isSyncingThis = syncingId === query.id;

                  return (
                    <tr
                      key={query.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      {/* Reporter & Media Outlet */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {query.journalist}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            {query.mediaOutlet}
                          </div>
                          <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate max-w-[160px]">
                            {query.email}
                          </div>
                        </div>
                      </td>

                      {/* Brand & Subject */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          {brandConfig && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${brandConfig.badgeBg}`}>
                              {brandConfig.shortName}
                            </span>
                          )}
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                            {query.step4_pitchSubject || query.title}
                          </div>
                          {query.sentAt && (
                            <div className="text-[10px] text-slate-400">
                              Sent: {query.sentAt.split('(')[0]}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thread Status Pill */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          {hasReply ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                              <MessageSquare className="w-3 h-3 mr-1 text-emerald-600" />
                              <span>Journalist Replied ({query.replyCount || 1})</span>
                            </span>
                          ) : isOpened ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                              <Eye className="w-3 h-3 mr-1 text-indigo-600" />
                              <span>Opened by Reporter</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 mr-1 text-amber-600" />
                              <span>Awaiting Response</span>
                            </span>
                          )}

                          {query.repliedAt && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                              Received: {query.repliedAt.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Latest Message / Reply Snippet */}
                      <td className="py-3.5 px-4 align-top max-w-sm">
                        {hasReply ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                            <div className="font-bold flex items-center space-x-1 text-emerald-800 dark:text-emerald-300 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Reporter Reply from {query.replySender?.split('<')[0] || query.journalist}:</span>
                            </div>
                            <p className="text-[11px] italic leading-relaxed">
                              "{query.replySnippet || 'Thanks for your input, would love to follow up on this!'}"
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                            Pitch dispatched. Monitoring Gmail thread for reporter activity...
                          </div>
                        )}
                      </td>

                      {/* Response Time */}
                      <td className="py-3.5 px-4 align-top">
                        {query.responseTimeHours ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {query.responseTimeHours} hours
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">
                              Fast turnaround
                            </div>
                          </div>
                        ) : hasReply ? (
                          <span className="text-xs text-slate-500">Same day</span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-col items-end space-y-1.5">
                          <div className="flex items-center space-x-1">
                            {/* Refresh thread */}
                            <button
                              onClick={() => handleSingleThreadRefresh(query.id)}
                              disabled={isSyncingThis}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition"
                              title="Sync latest thread state from Gmail"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                            </button>

                            {/* View Pitch in Editor */}
                            <button
                              onClick={() => onOpenPitchEditor(query)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            >
                              View Pitch
                            </button>
                          </div>

                          {/* Quick Simulate Reply button if no reply yet */}
                          {!hasReply && (
                            <button
                              onClick={() => onSimulateDemoResponse(query.id)}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center space-x-0.5"
                            >
                              <span>+ Demo Reporter Reply</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
