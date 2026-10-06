import React, { useState } from 'react';
import { Mail, Search, Sparkles, RefreshCw, FileText, UploadCloud, CheckCircle, AlertCircle, ArrowRight, BookOpen, Inbox } from 'lucide-react';
import { SAMPLE_DIGESTS, SampleDigest } from '../data/sampleDigests';
import { GmailEmailMessage } from '../types';

interface IngestSourcePanelProps {
  hasGmailToken: boolean;
  onSearchGmail: (query: string) => Promise<void>;
  onProcessText: (rawText: string, sourceMeta?: { subject?: string; date?: string; id?: string }) => Promise<void>;
  isSearchingGmail: boolean;
  isProcessing: boolean;
  gmailMessages: GmailEmailMessage[];
  onSelectGmailMessage: (msg: GmailEmailMessage) => void;
  onLogin: () => void;
}

export const IngestSourcePanel: React.FC<IngestSourcePanelProps> = ({
  hasGmailToken,
  onSearchGmail,
  onProcessText,
  isSearchingGmail,
  isProcessing,
  gmailMessages,
  onSelectGmailMessage,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'samples' | 'paste'>('gmail');
  const [gmailQuery, setGmailQuery] = useState('from:helpareporter.com OR "HARO" OR "Connectively"');
  const [customText, setCustomText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_DIGESTS[0].id);

  const handleGmailSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasGmailToken) {
      onSearchGmail(gmailQuery);
    } else {
      onLogin();
    }
  };

  const handleProcessSample = (sample: SampleDigest) => {
    onProcessText(sample.rawText, {
      subject: sample.subject,
      date: sample.date,
      id: sample.id,
    });
  };

  const handleProcessCustomText = () => {
    if (!customText.trim()) return;
    onProcessText(customText, {
      subject: 'Custom Pasted Digest / Query',
      date: new Date().toLocaleString(),
      id: 'custom-' + Date.now(),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 pt-3 flex flex-wrap gap-2 sm:gap-4">
        <button
          id="tab-gmail-inbox"
          onClick={() => setActiveTab('gmail')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'gmail'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Live Gmail Digest Search</span>
          {gmailMessages.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              {gmailMessages.length} found
            </span>
          )}
        </button>

        <button
          id="tab-sample-digests"
          onClick={() => setActiveTab('samples')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'samples'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Sample Medical Digests</span>
        </button>

        <button
          id="tab-paste-digest"
          onClick={() => setActiveTab('paste')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'paste'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Custom Text / Queries</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4 sm:p-6">
        {/* Tab 1: Live Gmail Search */}
        {activeTab === 'gmail' && (
          <div>
            {!hasGmailToken ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Connect Gmail to Search Real HARO & Connectively Emails
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-4">
                  Authenticate your account to search for incoming digests from <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">helpareporter.com</code> and create drafts directly in your Gmail inbox.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="connect-gmail-prompt-btn"
                    onClick={onLogin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition flex items-center space-x-2"
                  >
                    <span>Connect Gmail with Google</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('samples')}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    Try Sample Digest First
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleGmailSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="gmail-query-input"
                      type="text"
                      value={gmailQuery}
                      onChange={(e) => setGmailQuery(e.target.value)}
                      placeholder="Gmail search query (e.g., from:helpareporter.com)"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    id="search-gmail-btn"
                    type="submit"
                    disabled={isSearchingGmail}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition flex items-center justify-center space-x-1.5"
                  >
                    {isSearchingGmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Searching Inbox...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Search Gmail</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Email Results List */}
                {gmailMessages.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Found HARO/Connectively Emails ({gmailMessages.length})</span>
                      <span className="text-[11px] lowercase text-slate-400 font-normal">Click to analyze with 5-step pipeline</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                      {gmailMessages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => onSelectGmailMessage(msg)}
                          className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-lg cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                {msg.subject}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {msg.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              From: {msg.from} — {msg.snippet}
                            </p>
                          </div>
                          <button
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-sm transition flex items-center space-x-1"
                          >
                            <span>Process</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No HARO digest emails fetched yet. Click <strong>Search Gmail</strong> above or try a pre-loaded sample digest to see the full 5-step assistant in action.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sample Digests */}
        {activeTab === 'samples' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DIGESTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => setSelectedSampleId(sample.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    selectedSampleId === sample.id
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {sample.name}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {sample.date.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-400">From: {sample.sender}</span>
                    <button
                      id={`load-sample-${sample.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProcessSample(sample);
                      }}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-sm transition flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span>Run Pipeline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Paste Digest / Custom Query */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="custom-text-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paste Raw HARO / Connectively Email Text or Individual Query:
              </label>
              <textarea
                id="custom-text-input"
                rows={6}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={`Paste the entire HARO digest or a single query like:
Summary: Looking for medical expert on erectile dysfunction shockwave treatments
Outlet: Men's Health Weekly
Journalist: John Doe
Email: reply-12345@helpareporter.net
Deadline: 2026-08-20 5:00 PM EST
Query: Looking for insights on acoustic wave therapy vs medications for ED...`}
                className="w-full p-3 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {customText.length > 0 ? `${customText.length} characters` : 'Paste text from your inbox or clipboard'}
              </span>
              <button
                id="process-custom-btn"
                onClick={handleProcessCustomText}
                disabled={!customText.trim() || isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Analyzing & Routing...' : 'Process with 5-Step Pipeline'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
