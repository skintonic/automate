import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  Copy, 
  Bookmark, 
  Newspaper, 
  AtSign, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  UserCheck,
  Search
} from 'lucide-react';
import { JournalistIntelligence } from '../types';

interface JournalistIntelCardProps {
  intel?: JournalistIntelligence;
  journalist: string;
  mediaOutlet: string;
  queryTitle: string;
  brand: string;
  onApplyHookToBody?: (hookText: string) => void;
  onApplyHookToSubject?: (hookText: string) => void;
  onRefreshIntel?: () => Promise<void>;
  isLoading?: boolean;
}

export const JournalistIntelCard: React.FC<JournalistIntelCardProps> = ({
  intel,
  journalist,
  mediaOutlet,
  queryTitle,
  brand,
  onApplyHookToBody,
  onApplyHookToSubject,
  onRefreshIntel,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedHook, setCopiedHook] = useState(false);
  const [appliedBody, setAppliedBody] = useState(false);
  const [appliedSubject, setAppliedSubject] = useState(false);

  const handleCopyHook = () => {
    if (intel?.recommendedHookAngle) {
      navigator.clipboard.writeText(intel.recommendedHookAngle);
      setCopiedHook(true);
      setTimeout(() => setCopiedHook(false), 2000);
    }
  };

  const handleApplyBody = () => {
    if (intel?.recommendedHookAngle && onApplyHookToBody) {
      onApplyHookToBody(intel.recommendedHookAngle);
      setAppliedBody(true);
      setTimeout(() => setAppliedBody(false), 2000);
    }
  };

  const handleApplySubject = () => {
    if (intel?.recommendedHookAngle && onApplyHookToSubject) {
      // Craft a punchy subject using the hook or beat
      const hookSubject = `HARO: ${intel.recommendedHookAngle.split('.')[0]} — ${brand}`;
      onApplyHookToSubject(hookSubject);
      setAppliedSubject(true);
      setTimeout(() => setAppliedSubject(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-slate-200 shadow-md transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>Journalist Intelligence</span>
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <Globe className="w-3 h-3 mr-1 text-emerald-400" />
                Google Search Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded articles & Twitter bios to craft high-conversion tailored hooks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onRefreshIntel && (
            <button
              onClick={onRefreshIntel}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 flex items-center space-x-1 transition disabled:opacity-50"
              title="Search Google live to update recent articles and social bio"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Searching...' : 'Refresh Intel'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
            aria-label="Toggle section"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-indigo-300 font-medium">
                Searching Google for recent articles and Twitter profiles for {journalist}...
              </p>
            </div>
          ) : (
            <>
              {/* Journalist Profile Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Beat & Reporting Focus */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>Reporting Beat & Coverage Focus</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {intel?.beatFocus || `Covers health, medical science, and consumer lifestyle at ${mediaOutlet}.`}
                  </p>
                  {intel?.bioSnippet && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                      "{intel.bioSnippet}"
                    </p>
                  )}
                </div>

                {/* Twitter / Social Profile */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                      <AtSign className="w-3.5 h-3.5" />
                      <span>Twitter / X Profile & Bio</span>
                    </div>
                    {intel?.twitterHandle ? (
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={`https://x.com/${intel.twitterHandle.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 hover:underline flex items-center space-x-1"
                          >
                            <span>{intel.twitterHandle}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {intel.twitterBio && (
                          <p className="text-[11px] text-slate-300">
                            {intel.twitterBio}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 pt-1">
                        No public Twitter bio indexed for this reporter.
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Outlet: {mediaOutlet} • Reporter: {journalist}
                  </div>
                </div>
              </div>

              {/* Recent Articles Section (Google Search Grounded) */}
              {intel?.recentArticles && intel.recentArticles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                      <span>Recent Articles by {journalist}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Click to inspect tone & quoting style
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {intel.recentArticles.map((art, idx) => (
                      <a
                        key={idx}
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group bg-slate-900/60 hover:bg-slate-800/90 rounded-xl p-2.5 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-1.5 text-left"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                            {art.title}
                          </div>
                          {art.snippet && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 pt-1 leading-normal">
                              {art.snippet}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 group-hover:text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>{art.date || 'Recent Story'}</span>
                          <span className="inline-flex items-center space-x-0.5 text-indigo-400 group-hover:text-indigo-300">
                            <span>Read</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Hook Angle & 1-Click Action Bar */}
              {intel?.recommendedHookAngle && (
                <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Tailored Hook Recommendation
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {onApplyHookToBody && (
                        <button
                          onClick={handleApplyBody}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition flex items-center space-x-1"
                        >
                          {appliedBody ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{appliedBody ? 'Hook Inserted!' : 'Insert Hook into Opening'}</span>
                        </button>
                      )}

                      {onApplyHookToSubject && (
                        <button
                          onClick={handleApplySubject}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center space-x-1"
                        >
                          {appliedSubject ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <AtSign className="w-3.5 h-3.5" />}
                          <span>{appliedSubject ? 'Subject Updated!' : 'Apply to Subject'}</span>
                        </button>
                      )}

                      <button
                        onClick={handleCopyHook}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Copy hook to clipboard"
                      >
                        {copiedHook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-indigo-100 bg-slate-950/60 rounded-lg p-2.5 border border-indigo-900/60 leading-relaxed font-sans">
                    {intel.recommendedHookAngle}
                  </p>
                </div>
              )}

              {/* Grounding Attribution Footnote */}
              {intel?.groundingSources && intel.groundingSources.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>Google Grounded Sources:</span>
                    {intel.groundingSources.slice(0, 3).map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline truncate max-w-[180px] inline-flex items-center space-x-0.5"
                      >
                        <span>{source.title.split('|')[0].trim()}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>

                  {intel.fetchedAt && (
                    <span className="font-mono">Updated: {intel.fetchedAt}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
