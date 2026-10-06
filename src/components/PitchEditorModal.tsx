import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Mail, 
  User, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Link as LinkIcon,
  Globe,
  AtSign,
  Flame,
  Calendar
} from 'lucide-react';
import { HaroQuery, JournalistIntelligence } from '../types';
import { BRANDS } from '../data/brands';
import { getQueryPriority, getDeadlineTimeRemaining } from '../lib/priority';
import { JournalistIntelCard } from './JournalistIntelCard';
import { getCuratedJournalistIntel } from '../lib/journalistIntel';

interface PitchEditorModalProps {
  query: HaroQuery | null;
  defaultCcEmail?: string;
  onClose: () => void;
  onUpdatePitch: (queryId: string, newSubject: string, newBody: string, newCc?: string) => void;
  onSaveToGmailDraft: (query: HaroQuery, customCc?: string) => Promise<void>;
  onSendPitch?: (queryId: string, customCc?: string) => Promise<void>;
  onOpenLinkChecker?: (query: HaroQuery) => void;
  onUpdateIntel?: (queryId: string, intel: JournalistIntelligence) => void;
  hasGmailToken: boolean;
  isSavingDraft: boolean;
  isSending?: boolean;
  onLogin: () => void;
}

export const PitchEditorModal: React.FC<PitchEditorModalProps> = ({
  query,
  defaultCcEmail = 'rixie@skinandtonic.pro',
  onClose,
  onUpdatePitch,
  onSaveToGmailDraft,
  onSendPitch,
  onOpenLinkChecker,
  onUpdateIntel,
  hasGmailToken,
  isSavingDraft,
  isSending = false,
  onLogin,
}) => {
  if (!query) return null;

  const [subject, setSubject] = useState(query.step4_pitchSubject || `HARO Pitch: ${query.title}`);
  const [body, setBody] = useState(query.userEditedPitch || query.step4_pitchBody || '');
  const [ccEmail, setCcEmail] = useState(query.ccEmails || defaultCcEmail);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Journalist Intelligence State
  const [intel, setIntel] = useState<JournalistIntelligence | undefined>(
    query.journalistIntelligence || getCuratedJournalistIntel(query.journalist, query.mediaOutlet, query.title, query.step2_brand)
  );
  const [isSearchingIntel, setIsSearchingIntel] = useState(false);

  // Sync state when query prop updates
  React.useEffect(() => {
    setSubject(query.step4_pitchSubject || `HARO Pitch: ${query.title}`);
    setBody(query.userEditedPitch || query.step4_pitchBody || '');
    setCcEmail(query.ccEmails || defaultCcEmail);
    setIntel(query.journalistIntelligence || getCuratedJournalistIntel(query.journalist, query.mediaOutlet, query.title, query.step2_brand));
  }, [query.id]);

  const handleRefreshIntel = async () => {
    setIsSearchingIntel(true);
    try {
      const res = await fetch('/api/fetch-journalist-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalist: query.journalist,
          mediaOutlet: query.mediaOutlet,
          queryTitle: query.title,
          brand: query.step2_brand,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIntel(data);
        if (onUpdateIntel) {
          onUpdateIntel(query.id, data);
        }
      }
    } catch (e) {
      console.warn('Failed to refresh journalist intel:', e);
    } finally {
      setIsSearchingIntel(false);
    }
  };

  const handleApplyHookToBody = (hookText: string) => {
    const firstName = query.journalist ? query.journalist.split(' ')[0] : 'there';
    const greetingRegex = /^(Hi\s+[^,\n]+,\n\n)/i;
    const match = body.match(greetingRegex);
    let newBody = '';
    if (match) {
      const greeting = match[1];
      const rest = body.substring(greeting.length);
      newBody = `${greeting}Regarding your coverage for ${query.mediaOutlet || 'your publication'}: ${hookText}\n\n${rest}`;
    } else {
      newBody = `Hi ${firstName},\n\nRegarding your piece for ${query.mediaOutlet || 'your outlet'}: ${hookText}\n\n${body}`;
    }
    setBody(newBody);
    onUpdatePitch(query.id, subject, newBody, ccEmail);
  };

  const handleApplyHookToSubject = (newSubjectText: string) => {
    setSubject(newSubjectText);
    onUpdatePitch(query.id, newSubjectText, body, ccEmail);
  };

  const brandConfig = BRANDS[query.step2_brand];
  const isRejected = query.step1_status === 'REJECTED';
  const isManual = query.step3_hasAiRestriction;
  const isSent = !!query.sentAt || query.overallStatus === 'SENT_TO_JOURNALIST';

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  const handleCopy = () => {
    const fullText = `To: ${query.email}\nCc: ${ccEmail}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineFeedback.trim() && !body.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryTitle: query.title,
          queryRequirements: query.queryRequirements,
          brand: query.step2_brand,
          expertTitle: query.step2_expertTitle || brandConfig?.inHouseExpert.title,
          currentPitch: body,
          feedback: refineFeedback || 'Make it punchier, authoritative, and ensure it leads directly with a strong 1-2 sentence clinical insight.',
        }),
      });

      if (!res.ok) throw new Error('Refine failed');
      const data = await res.json();
      if (data.pitchSubject) setSubject(data.pitchSubject);
      if (data.pitchBody) {
        setBody(data.pitchBody);
        onUpdatePitch(query.id, data.pitchSubject || subject, data.pitchBody, ccEmail);
      }
      setRefineFeedback('');
    } catch (err) {
      console.warn('AI refine endpoint unavailable, applying in-browser polish:', err);
      // In-browser fallback so GitHub Pages users can still polish
      const feedbackText = refineFeedback.trim();
      let refined = body;
      if (feedbackText && !body.includes('available for follow-up')) {
        refined = `${body}\n\nClinical Note: Our medical director is available ahead of your deadline for brief commentary or quotes.`;
      }
      setBody(refined);
      onUpdatePitch(query.id, subject, refined, ccEmail);
      setRefineFeedback('');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveBodyChange = (newText: string) => {
    setBody(newText);
    onUpdatePitch(query.id, subject, newText, ccEmail);
  };

  const handleSaveSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    onUpdatePitch(query.id, newSubject, body, ccEmail);
  };

  const handleSaveCcChange = (newCc: string) => {
    setCcEmail(newCc);
    onUpdatePitch(query.id, subject, body, newCc);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {brandConfig ? (
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${brandConfig.badgeBg}`}>
                  {brandConfig.name}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Unassigned
                </span>
              )}
              {/* Priority Badge */}
              {(() => {
                const priority = getQueryPriority(query);
                const timeRemaining = getDeadlineTimeRemaining(query);
                return (
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center space-x-1 border ${
                      priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        : priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    {priority === 'HIGH' ? (
                      <Flame className="w-3 h-3 text-rose-600 shrink-0" />
                    ) : priority === 'MEDIUM' ? (
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    ) : (
                      <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                    <span>{priority} Priority {timeRemaining ? `(${timeRemaining})` : ''}</span>
                  </span>
                );
              })()}
              {isRejected && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                  Step 1 Rejected
                </span>
              )}
              {isManual && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                  No AI Allowed (Manual Only)
                </span>
              )}
              {isSent ? (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Dispatched to Journalist</span>
                </span>
              ) : query.gmailDraftId ? (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Draft in Gmail</span>
                </span>
              ) : null}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {query.title}
            </h2>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Outlet: <strong>{query.mediaOutlet || 'Media'}</strong></span>
              <span>Reporter: <strong>{query.journalist || 'Journalist'}</strong></span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Deadline: {query.deadline}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Query Context Box with Source Link Checker */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Original Query & Requirements:
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {query.queryRequirements || query.title}
            </p>

            {/* Source Link & Verification Row */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {query.queryUrl && (
                  <a
                    href={query.queryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>View Query on HARO / Connectively</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {onOpenLinkChecker && (
                  <button
                    onClick={() => onOpenLinkChecker(query)}
                    className="px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center space-x-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Check Link</span>
                  </button>
                )}
              </div>

              {query.queryUrl && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {query.queryUrl.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                To: {query.email}
              </span>
              <span className="text-slate-400">Step 2 Match: {query.step2_brand}</span>
            </div>
          </div>

          {/* Journalist Intelligence (Google Search Grounded) */}
          <JournalistIntelCard
            intel={intel}
            journalist={query.journalist}
            mediaOutlet={query.mediaOutlet}
            queryTitle={query.title}
            brand={query.step2_brand}
            isLoading={isSearchingIntel}
            onRefreshIntel={handleRefreshIntel}
            onApplyHookToBody={handleApplyHookToBody}
            onApplyHookToSubject={handleApplyHookToSubject}
          />

          {/* If Step 1 is Rejected */}
          {isRejected && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-rose-800 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4" />
                <span>Rejected during Step 1 Evaluation</span>
              </div>
              <p>
                <strong>Reason:</strong> {query.step1_rejectionReason || 'The query bans PR pitches, requires credentials unavailable across the 3 brands, or is completely off-topic.'}
              </p>
            </div>
          )}

          {/* If Step 3 is Manual AI Restriction */}
          {isManual && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>MANUAL PITCH REQUIRED — do not auto-draft AI-style</span>
              </div>
              <p>
                The journalist explicitly specified that AI-generated pitches will not be considered or will be discarded.
                To protect the reputation of our medical practices, no automated pitch was generated.
              </p>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>Manual Action Tip:</strong> Open Gmail, draft a direct personal message from your human email client referencing {brandConfig?.inHouseExpert.name} ({brandConfig?.inHouseExpert.title}), and send directly to <code className="font-mono text-indigo-600 dark:text-indigo-400">{query.email}</code>.
              </div>
            </div>
          )}

          {/* Pitch Editor Section */}
          {!isRejected && !isManual && (
            <div className="space-y-4">
              {/* Teaser Insight Highlight */}
              {query.step4_teaserInsight && (
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Lead Clinical Teaser Insight (Step 4 Core)</span>
                  </div>
                  <p className="text-xs text-indigo-800 dark:text-indigo-200 italic leading-relaxed">
                    "{query.step4_teaserInsight}"
                  </p>
                </div>
              )}

              {/* CC Feature: Recipient Row */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <AtSign className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cc: Executive / Team Inbox</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Will be copied on draft & dispatch
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={ccEmail}
                    onChange={(e) => handleSaveCcChange(e.target.value)}
                    placeholder="e.g. rixie@skinandtonic.pro, boss@clinic.com"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  />
                  {defaultCcEmail && ccEmail !== defaultCcEmail && (
                    <button
                      onClick={() => handleSaveCcChange(defaultCcEmail)}
                      className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg"
                      title="Reset to default CC"
                    >
                      Default
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Line Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleSaveSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Pitch Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Drafted Pitch Body (Human PR Marketing Tone):
                  </label>
                  <span className={`text-[11px] ${wordCount > 175 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                    {wordCount} words (Target: &lt; 150 words)
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={body}
                  onChange={(e) => handleSaveBodyChange(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* AI Polish / Refine Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Fine-tune pitch with AI (PR Expert Polish)</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refineFeedback}
                    onChange={(e) => setRefineFeedback(e.target.value)}
                    placeholder="e.g., Make the opening punchier, emphasize shockwave mechanism..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleRefine}
                    disabled={isRefining}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
                  >
                    {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isRefining ? 'Polishing...' : 'Refine'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied with CC' : 'Copy Pitch & CC'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Close
            </button>

            {!isRejected && !isManual && (
              <>
                {/* Save Draft Button */}
                <button
                  id="modal-save-draft-btn"
                  onClick={() => {
                    if (!hasGmailToken) {
                      onLogin();
                    } else {
                      onSaveToGmailDraft(query, ccEmail);
                    }
                  }}
                  disabled={isSavingDraft || isSent}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {isSavingDraft 
                      ? 'Saving Draft...' 
                      : query.gmailDraftId 
                        ? 'Update Gmail Draft' 
                        : 'Save Gmail Draft'}
                  </span>
                </button>

                {/* Approve & Send Button */}
                {onSendPitch && (
                  <button
                    onClick={() => {
                      if (!hasGmailToken) {
                        onLogin();
                      } else {
                        onSendPitch(query.id, ccEmail);
                      }
                    }}
                    disabled={isSending || isSent}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSending 
                        ? 'Sending...' 
                        : isSent 
                          ? 'Sent via Gmail' 
                          : 'Approve & Send Now'}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
