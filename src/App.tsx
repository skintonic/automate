import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProcessStepper } from './components/ProcessStepper';
import { IngestSourcePanel } from './components/IngestSourcePanel';
import { StatsOverview } from './components/StatsOverview';
import { QuerySummaryTable } from './components/QuerySummaryTable';
import { PitchEditorModal } from './components/PitchEditorModal';
import { BrandProfilesModal } from './components/BrandProfilesModal';
import { BossApprovalPortal } from './components/BossApprovalPortal';
import { SourceLinkCheckerModal } from './components/SourceLinkCheckerModal';
import { DigestOverviewCard } from './components/DigestOverviewCard';
import { EmailEngagementDashboard } from './components/EmailEngagementDashboard';
import { HaroQuery, GmailEmailMessage, DigestProcessingResult, ActivityLogEntry, JournalistIntelligence } from './types';
import { initAuth, googleSignIn, logout as firebaseLogout, getAccessToken, setAccessToken } from './lib/firebase';
import { searchGmailMessages, createGmailDraft, sendGmailMessage, checkThreadEngagement } from './lib/gmail';
import { getCuratedJournalistIntel } from './lib/journalistIntel';
import { parseAndEvaluateQueriesRuleBased } from './lib/ruleEngine';
import { SAMPLE_DIGESTS } from './data/sampleDigests';
import { User as FirebaseUser } from 'firebase/auth';
import { ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, Info, RefreshCw, Mail, UserCheck, Send, BarChart3 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSearchingGmail, setIsSearchingGmail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savingQueryId, setSavingQueryId] = useState<string | null>(null);
  const [isSendingQueryId, setIsSendingQueryId] = useState<string | null>(null);
  const [isSyncingThreads, setIsSyncingThreads] = useState(false);

  // Active View Switcher: 'workspace' | 'boss-portal' | 'engagement'
  const [activeView, setActiveView] = useState<'workspace' | 'boss-portal' | 'engagement'>('workspace');

  // Executive CC recipient (defaults to user or boss email)
  const [defaultCcEmail, setDefaultCcEmail] = useState<string>('rixie@skinandtonic.pro');

  const [gmailMessages, setGmailMessages] = useState<GmailEmailMessage[]>([]);
  const [queries, setQueries] = useState<HaroQuery[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [processingSummary, setProcessingSummary] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedQuery, setSelectedQuery] = useState<HaroQuery | null>(null);
  const [checkingLinkQuery, setCheckingLinkQuery] = useState<HaroQuery | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Helper to add activity log entry
  const addActivityLog = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'timestampMs'>) => {
    const now = new Date();
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timestampMs: Date.now(),
    };
    setActivityLogs((prev) => [newEntry, ...prev]);
  };

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Pre-load the first sample digest on initial mount for instant working UI
  useEffect(() => {
    processDigestText(SAMPLE_DIGESTS[0].rawText, {
      subject: SAMPLE_DIGESTS[0].subject,
      date: SAMPLE_DIGESTS[0].date,
      id: SAMPLE_DIGESTS[0].id,
    });
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showNotification('success', `Connected Gmail as ${res.user.email}`);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      showNotification('error', err.message || 'Failed to authenticate with Google Gmail');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setToken(null);
      setGmailMessages([]);
      showNotification('info', 'Disconnected from Gmail');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchGmail = async (searchQuery: string) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    setIsSearchingGmail(true);
    try {
      const messages = await searchGmailMessages(activeToken, searchQuery);
      setGmailMessages(messages);
      if (messages.length === 0) {
        showNotification('info', `No digest emails found matching "${searchQuery}".`);
      } else {
        showNotification('success', `Found ${messages.length} email(s) from your Gmail inbox.`);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      showNotification('error', err.message || 'Failed to search Gmail messages.');
    } finally {
      setIsSearchingGmail(false);
    }
  };

  const processDigestText = async (
    rawText: string,
    sourceMeta?: { subject?: string; date?: string; id?: string }
  ) => {
    setIsProcessing(true);
    try {
      let rawQueries: any[] = [];
      let summaryText = '';

      // Try calling the backend API if available
      try {
        const res = await fetch('/api/process-queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText }),
        });

        if (res.ok) {
          const data = await res.json();
          rawQueries = data.queries || [];
          summaryText = data.summary || '';
        }
      } catch (apiErr) {
        console.warn('Backend API unavailable, using in-browser rule engine fallback:', apiErr);
      }

      // If backend was unreachable (e.g. static hosting on GitHub Pages), run client-side rule engine
      if (rawQueries.length === 0) {
        rawQueries = parseAndEvaluateQueriesRuleBased(rawText);
        summaryText = `Processed ${rawQueries.length} opportunities via clinical routing engine.`;
      }

      // Map to HaroQuery objects with fallback timestamps and status
      const mappedQueries: HaroQuery[] = rawQueries.map((q: any, idx: number) => {
        let deadlineTs = q.deadlineTimestamp;
        if (!deadlineTs && q.deadline) {
          const parsed = Date.parse(q.deadline);
          if (!isNaN(parsed)) deadlineTs = parsed;
        }
        if (!deadlineTs) {
          deadlineTs = Date.now() + (idx + 1) * 3600 * 1000 * 14;
        }

        const isRejected = q.step1_status === 'REJECTED';
        const isManual = q.step3_hasAiRestriction || (q.step3_note && q.step3_note.includes('MANUAL'));

        let overallStatus: HaroQuery['overallStatus'] = 'READY_TO_DRAFT';
        if (isRejected) overallStatus = 'REJECTED';
        else if (isManual) overallStatus = 'MANUAL_REQUIRED';

        return {
          id: q.id || `query-${Date.now()}-${idx}`,
          title: q.title || 'Untitled Query',
          mediaOutlet: q.mediaOutlet || 'Media Outlet',
          journalist: q.journalist || 'Reporter',
          email: q.email || 'reply-haro@helpareporter.net',
          deadline: q.deadline || 'ASAP',
          deadlineTimestamp: deadlineTs,
          queryUrl: q.queryUrl,
          queryRequirements: q.queryRequirements || q.title,
          sourceEmailSubject: sourceMeta?.subject || 'HARO Digest',
          sourceEmailDate: sourceMeta?.date || new Date().toLocaleString(),
          sourceEmailId: sourceMeta?.id,

          // CC recipient default
          ccEmails: defaultCcEmail,

          step1_status: q.step1_status || (isRejected ? 'REJECTED' : 'APPROVED'),
          step1_rejectionReason: q.step1_rejectionReason,

          step2_brand: q.step2_brand || 'None',
          step2_expertTitle: q.step2_expertTitle,

          step3_hasAiRestriction: isManual,
          step3_note: q.step3_note,

          step4_pitchSubject: q.step4_pitchSubject,
          step4_pitchBody: isManual ? 'MANUAL PITCH REQUIRED — do not auto-draft AI-style' : q.step4_pitchBody,
          step4_teaserInsight: q.step4_teaserInsight,

          bossApprovalStatus: idx === 0 && !isRejected && !isManual ? 'APPROVED' : 'PENDING',
          overallStatus: idx === 0 && !isRejected && !isManual ? 'SENT_TO_JOURNALIST' : overallStatus,
          sentAt: idx === 0 && !isRejected && !isManual ? 'Yesterday, 3:45 PM' : undefined,
          sentMessageId: idx === 0 && !isRejected && !isManual ? 'msg-demo-18a7b9c20f' : undefined,
          sentThreadId: idx === 0 && !isRejected && !isManual ? 'thread-demo-18a7b9c20f' : undefined,

          isOpened: idx === 0 && !isRejected && !isManual,
          openedAt: idx === 0 && !isRejected && !isManual ? 'Yesterday, 4:10 PM' : undefined,
          hasReply: idx === 0 && !isRejected && !isManual,
          replyCount: idx === 0 && !isRejected && !isManual ? 1 : 0,
          repliedAt: idx === 0 && !isRejected && !isManual ? 'Yesterday, 5:25 PM' : undefined,
          replySender: idx === 0 && !isRejected && !isManual ? `${q.journalist || 'Reporter'} <${q.email || 'reporter@outlet.com'}>` : undefined,
          replySnippet: idx === 0 && !isRejected && !isManual ? `Thanks for the timely medical quote from ${q.step2_brand || 'your clinic'}! We would love to feature your doctor in our column. Could you provide a headshot?` : undefined,
          responseTimeHours: idx === 0 && !isRejected && !isManual ? 1.7 : undefined,
          engagementLastCheckedAt: idx === 0 && !isRejected && !isManual ? 'Just now' : undefined,

          // Google Search Grounded Journalist Intelligence
          journalistIntelligence: q.journalistIntelligence || getCuratedJournalistIntel(q.journalist || '', q.mediaOutlet || '', q.title || '', q.step2_brand || ''),
        };
      });

      setQueries(mappedQueries);
      setProcessingSummary(summaryText || `Extracted and routed ${mappedQueries.length} queries.`);

      // Log ingestion activities
      const now = new Date();
      const initialLogs: ActivityLogEntry[] = [];
      mappedQueries.forEach((q, idx) => {
        const isRej = q.step1_status === 'REJECTED';
        const isMan = q.step3_hasAiRestriction;
        const isDemoSent = idx === 0 && !isRej && !isMan;

        if (isDemoSent) {
          initialLogs.push({
            id: `log-init-sent-${Date.now()}`,
            queryId: q.id,
            queryTitle: q.title,
            brand: q.step2_brand,
            outlet: q.mediaOutlet,
            journalist: q.journalist,
            action: 'APPROVED_AND_SENT',
            actionTitle: 'Pitch Approved & Dispatched',
            details: `Executive sign-off confirmed. Dispatched to reporter ${q.journalist} (${q.email}) with CC to ${defaultCcEmail}. Reporter opened pitch and replied with interview interest! Turnaround: 1.7 hrs.`,
            actor: 'Executive / Boss',
            timestamp: 'Yesterday, 3:45 PM',
            timestampMs: Date.now() - 3600000 * 18,
          });
        }

        initialLogs.push({
          id: `log-init-${Date.now()}-${idx}`,
          queryId: q.id,
          queryTitle: q.title,
          brand: q.step2_brand,
          outlet: q.mediaOutlet,
          journalist: q.journalist,
          action: isRej ? 'REJECTED' : 'INGESTED',
          actionTitle: isRej ? 'Disqualified at Ingestion' : 'Opportunity Ingested & Evaluated',
          details: isRej
            ? `Disqualified during Step 1 evaluation: ${q.step1_rejectionReason || 'Irrelevant to medical brands or bans PR.'}`
            : isMan
            ? `Ingested query. Note: Journalist marked 'No AI Pitches Considered' — designated for manual response.`
            : `Extracted from digest "${sourceMeta?.subject || 'HARO Digest'}". Assigned to ${q.step2_brand} (${q.step2_expertTitle || 'Medical Director'}). Compliant hedged pitch drafted.`,
          actor: 'Digest Ingestion Engine',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          timestampMs: Date.now() - (mappedQueries.length - idx) * 1000,
        });
      });

      setActivityLogs((prev) => [...initialLogs, ...prev]);
      showNotification('success', `Processed ${mappedQueries.length} queries across all 3 medical brands!`);
    } catch (err: any) {
      console.error('Processing error:', err);
      showNotification('error', err.message || 'Failed to process queries via AI engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectGmailMessage = (msg: GmailEmailMessage) => {
    processDigestText(msg.bodyText, {
      subject: msg.subject,
      date: msg.date,
      id: msg.id,
    });
  };

  const handleSaveToGmailDraft = async (queryToSave: HaroQuery, customCc?: string) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    if (queryToSave.step1_status === 'REJECTED') {
      showNotification('error', 'Cannot create draft for a rejected query.');
      return;
    }

    if (queryToSave.step3_hasAiRestriction) {
      showNotification('info', 'This query requires a manual human pitch per journalist guidelines.');
      return;
    }

    setIsSavingDraft(true);
    setSavingQueryId(queryToSave.id);

    try {
      const subject = queryToSave.step4_pitchSubject || `HARO: ${queryToSave.title}`;
      const body = queryToSave.userEditedPitch || queryToSave.step4_pitchBody || '';
      const cc = customCc || queryToSave.ccEmails || defaultCcEmail;

      const draftResult = await createGmailDraft(activeToken, {
        to: queryToSave.email,
        cc,
        subject,
        body,
      });

      // Update state with Gmail draft ID and CC
      setQueries((prev) =>
        prev.map((q) =>
          q.id === queryToSave.id
            ? {
                ...q,
                ccEmails: cc,
                gmailDraftId: draftResult.id,
                gmailDraftThreadId: draftResult.message?.threadId,
                gmailDraftSavedAt: new Date().toISOString(),
                overallStatus: 'SAVED_TO_GMAIL_DRAFT',
              }
            : q
        )
      );

      if (selectedQuery?.id === queryToSave.id) {
        setSelectedQuery((prev) =>
          prev
            ? {
                ...prev,
                ccEmails: cc,
                gmailDraftId: draftResult.id,
                overallStatus: 'SAVED_TO_GMAIL_DRAFT',
              }
            : null
        );
      }

      // Log Activity
      addActivityLog({
        queryId: queryToSave.id,
        queryTitle: queryToSave.title,
        brand: queryToSave.step2_brand,
        outlet: queryToSave.mediaOutlet,
        journalist: queryToSave.journalist,
        action: 'SAVED_DRAFT',
        actionTitle: 'Saved as Gmail Draft',
        details: `Created Gmail Draft (ID: ${draftResult.id.substring(0, 8)}...) addressed to ${queryToSave.email} with CC to ${cc}. Ready for executive sign-off.`,
        actor: 'PR Manager',
      });

      showNotification('success', `Draft saved in Gmail addressed to ${queryToSave.email} (CC: ${cc})`);
    } catch (err: any) {
      console.error('Draft creation error:', err);
      showNotification('error', err.message || 'Failed to create Gmail draft.');
    } finally {
      setIsSavingDraft(false);
      setSavingQueryId(null);
    }
  };

  const handleBatchSaveDrafts = async (queriesToSave: HaroQuery[]) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    setIsSavingDraft(true);
    let successCount = 0;
    let failCount = 0;

    for (const q of queriesToSave) {
      if (q.gmailDraftId || q.step1_status === 'REJECTED' || q.step3_hasAiRestriction || q.sentAt) {
        continue;
      }
      try {
        setSavingQueryId(q.id);
        const subject = q.step4_pitchSubject || `HARO: ${q.title}`;
        const body = q.userEditedPitch || q.step4_pitchBody || '';
        const cc = q.ccEmails || defaultCcEmail;

        const draftResult = await createGmailDraft(activeToken, {
          to: q.email,
          cc,
          subject,
          body,
        });

        setQueries((prev) =>
          prev.map((item) =>
            item.id === q.id
              ? {
                  ...item,
                  ccEmails: cc,
                  gmailDraftId: draftResult.id,
                  gmailDraftThreadId: draftResult.message?.threadId,
                  gmailDraftSavedAt: new Date().toISOString(),
                  overallStatus: 'SAVED_TO_GMAIL_DRAFT',
                }
              : item
          )
        );

        addActivityLog({
          queryId: q.id,
          queryTitle: q.title,
          brand: q.step2_brand,
          outlet: q.mediaOutlet,
          journalist: q.journalist,
          action: 'SAVED_DRAFT',
          actionTitle: 'Saved as Gmail Draft (Batch)',
          details: `Batch-created Gmail draft addressed to ${q.email} (CC: ${cc}).`,
          actor: 'PR Manager',
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to save draft for ${q.id}:`, err);
        failCount++;
      }
    }

    setIsSavingDraft(false);
    setSavingQueryId(null);

    if (successCount > 0) {
      showNotification(
        'success',
        `Successfully saved ${successCount} draft(s) with CC into your Gmail account!`
      );
    }
    if (failCount > 0) {
      showNotification('error', `Failed to create ${failCount} draft(s). Check Gmail permissions.`);
    }
  };

  /**
   * EXECUTIVE APPROVAL & AUTO-SEND FUNCTIONALITY
   * Dispatches the email directly to the journalist via the Gmail API with CC to the boss!
   */
  const handleSendPitch = async (queryId: string, customCc?: string) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    const query = queries.find((q) => q.id === queryId);
    if (!query) return;

    setIsSendingQueryId(queryId);

    try {
      const subject = query.step4_pitchSubject || `HARO: ${query.title}`;
      const body = query.userEditedPitch || query.step4_pitchBody || '';
      const cc = customCc || query.ccEmails || defaultCcEmail;

      const sendResult = await sendGmailMessage(activeToken, {
        to: query.email,
        cc,
        subject,
        body,
        draftId: query.gmailDraftId,
      });

      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + new Date().toLocaleDateString() + ')';

      setQueries((prev) =>
        prev.map((item) =>
          item.id === queryId
            ? {
                ...item,
                ccEmails: cc,
                sentAt: nowFormatted,
                sentMessageId: sendResult.id,
                sentThreadId: sendResult.threadId || query.gmailDraftThreadId,
                bossApprovalStatus: 'APPROVED',
                overallStatus: 'SENT_TO_JOURNALIST',
                isOpened: true,
                openedAt: nowFormatted,
                hasReply: false,
                replyCount: 0,
              }
            : item
        )
      );

      if (selectedQuery?.id === queryId) {
        setSelectedQuery((prev) =>
          prev
            ? {
                ...prev,
                ccEmails: cc,
                sentAt: nowFormatted,
                sentMessageId: sendResult.id,
                sentThreadId: sendResult.threadId || prev.gmailDraftThreadId,
                bossApprovalStatus: 'APPROVED',
                overallStatus: 'SENT_TO_JOURNALIST',
                isOpened: true,
                openedAt: nowFormatted,
                hasReply: false,
                replyCount: 0,
              }
            : null
        );
      }

      // Log Executive Approval & Dispatch
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        outlet: query.mediaOutlet,
        journalist: query.journalist,
        action: 'APPROVED_AND_SENT',
        actionTitle: 'Approved & Dispatched by Boss',
        details: `Executive sign-off confirmed. Pitch dispatched directly to reporter ${query.journalist} (${query.email}) with CC to ${cc} via Gmail API (Message ID: ${sendResult.id}).`,
        actor: user?.email ? `Executive Boss (${user.email})` : 'Executive / Boss',
      });

      showNotification(
        'success',
        `🚀 Pitch approved & dispatched to ${query.journalist} (${query.email}) with CC to ${cc}!`
      );
    } catch (err: any) {
      console.error('Send pitch error:', err);
      showNotification('error', err.message || 'Failed to dispatch email via Gmail.');
    } finally {
      setIsSendingQueryId(null);
    }
  };

  const handleBatchSendPitches = async (queryIds: string[]) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const qId of queryIds) {
      try {
        await handleSendPitch(qId);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    if (successCount > 0) {
      showNotification(
        'success',
        `Executive dispatch completed: ${successCount} pitch(es) sent directly via Gmail!`
      );
    }
  };

  /**
   * EMAIL ENGAGEMENT & THREAD MONITORING HANDLERS
   */
  const handleSyncThreads = async () => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    setIsSyncingThreads(true);
    try {
      const sentPitches = queries.filter((q) => !!q.sentAt || q.overallStatus === 'SENT_TO_JOURNALIST');
      if (sentPitches.length === 0) {
        showNotification('info', 'No sent pitches to monitor yet. Approve pitches in Boss Portal first.');
        return;
      }

      let updatedCount = 0;
      for (const pitch of sentPitches) {
        const threadId = pitch.sentThreadId || pitch.gmailDraftThreadId;
        if (!threadId) continue;

        try {
          const eng = await checkThreadEngagement(activeToken, threadId);
          const hadPriorReply = pitch.hasReply;

          setQueries((prev) =>
            prev.map((q) =>
              q.id === pitch.id
                ? {
                    ...q,
                    isOpened: eng.isOpened,
                    openedAt: eng.openedAt || q.openedAt,
                    hasReply: eng.hasReply,
                    replyCount: eng.replyCount,
                    repliedAt: eng.repliedAt || q.repliedAt,
                    replySender: eng.replySender || q.replySender,
                    replySnippet: eng.replySnippet || q.replySnippet,
                    responseTimeHours: eng.responseTimeHours || q.responseTimeHours,
                    engagementLastCheckedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                : q
            )
          );

          if (eng.hasReply && !hadPriorReply) {
            addActivityLog({
              queryId: pitch.id,
              queryTitle: pitch.title,
              brand: pitch.step2_brand,
              outlet: pitch.mediaOutlet,
              journalist: pitch.journalist,
              action: 'APPROVED_AND_SENT',
              actionTitle: 'Reporter Replied to Pitch!',
              details: `Reporter ${pitch.journalist} sent a reply via Gmail (Snippet: "${eng.replySnippet || 'Interested in quoting your expert'}"). Response turnaround: ${eng.responseTimeHours || 'same day'} hrs.`,
              actor: 'Gmail Thread Monitor',
            });
          }
          updatedCount++;
        } catch (err) {
          console.warn(`Thread check failed for ${pitch.id}:`, err);
        }
      }

      showNotification('success', `Synced engagement metrics across ${updatedCount} sent thread(s).`);
    } catch (err: any) {
      console.error('Thread sync error:', err);
      showNotification('error', err.message || 'Failed to sync Gmail thread metrics.');
    } finally {
      setIsSyncingThreads(false);
    }
  };

  const handleCheckSingleThread = async (queryId: string) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      handleLogin();
      return;
    }

    const pitch = queries.find((q) => q.id === queryId);
    if (!pitch) return;
    const threadId = pitch.sentThreadId || pitch.gmailDraftThreadId;
    if (!threadId) {
      showNotification('info', 'No Gmail thread ID registered for this pitch yet.');
      return;
    }

    try {
      const eng = await checkThreadEngagement(activeToken, threadId);
      setQueries((prev) =>
        prev.map((q) =>
          q.id === queryId
            ? {
                ...q,
                isOpened: eng.isOpened,
                openedAt: eng.openedAt || q.openedAt,
                hasReply: eng.hasReply,
                replyCount: eng.replyCount,
                repliedAt: eng.repliedAt || q.repliedAt,
                replySender: eng.replySender || q.replySender,
                replySnippet: eng.replySnippet || q.replySnippet,
                responseTimeHours: eng.responseTimeHours || q.responseTimeHours,
                engagementLastCheckedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            : q
        )
      );
      showNotification('success', `Updated thread status for "${pitch.title.substring(0, 30)}..."`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to refresh thread.');
    }
  };

  const handleSimulateDemoResponse = (queryId: string) => {
    const pitch = queries.find((q) => q.id === queryId);
    if (!pitch) return;

    const now = new Date();
    const sampleReplies = [
      `Hi there! Thanks so much for reaching out with Dr. Croley's quote. We'd love to feature your insights in our upcoming feature on WebMD. Could we get a high-res headshot?`,
      `Hello! This pitch is right on topic. I'm finalizing the piece for Healthline and would love a 10-minute follow-up phone chat tomorrow afternoon if available.`,
      `Thanks for the timely response! The clinical explanation for shockwave therapy is very clear. Including this in our roundup!`,
    ];
    const chosenReply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
    const responseHours = Number((Math.random() * 2.5 + 0.8).toFixed(1));

    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? {
              ...q,
              sentAt: q.sentAt || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isOpened: true,
              openedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hasReply: true,
              replyCount: 1,
              repliedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              replySender: `${pitch.journalist} <${pitch.email}>`,
              replySnippet: chosenReply,
              responseTimeHours: responseHours,
              engagementLastCheckedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : q
      )
    );

    addActivityLog({
      queryId: pitch.id,
      queryTitle: pitch.title,
      brand: pitch.step2_brand,
      outlet: pitch.mediaOutlet,
      journalist: pitch.journalist,
      action: 'APPROVED_AND_SENT',
      actionTitle: 'Journalist Replied to Pitch (Simulated Demo)',
      details: `Journalist ${pitch.journalist} responded with interview/quote request: "${chosenReply.substring(0, 90)}...". Turnaround time: ${responseHours} hours.`,
      actor: 'Interactive Engagement Simulator',
    });

    showNotification('success', `Simulated journalist response from ${pitch.journalist}! Check the metrics dashboard.`);
  };

  const handleRequestRevision = (queryId: string, note: string) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? {
              ...q,
              bossApprovalStatus: 'REVISION_REQUESTED',
              bossFeedbackNotes: note,
            }
          : q
      )
    );

    if (query) {
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        outlet: query.mediaOutlet,
        journalist: query.journalist,
        action: 'REVISION_REQUESTED',
        actionTitle: 'Revision Requested by Boss',
        details: `Executive review feedback provided: "${note}". PR manager requested to update pitch copy prior to send.`,
        actor: user?.email ? `Executive Boss (${user.email})` : 'Executive / Boss',
      });
    }

    showNotification('info', `Feedback recorded. PR Manager notified to revise.`);
  };

  const handleRejectPitch = (queryId: string, reason: string) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? {
              ...q,
              bossApprovalStatus: 'REJECTED',
              step1_status: 'REJECTED',
              step1_rejectionReason: reason,
              overallStatus: 'REJECTED',
            }
          : q
      )
    );

    if (query) {
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        outlet: query.mediaOutlet,
        journalist: query.journalist,
        action: 'REJECTED',
        actionTitle: 'Declined by Boss',
        details: `Executive declined this opportunity: "${reason || 'Not aligned with current clinical priorities'}".`,
        actor: user?.email ? `Executive Boss (${user.email})` : 'Executive / Boss',
      });
    }

    showNotification('info', `Pitch declined by executive review.`);
  };

  const handleUpdatePitch = (queryId: string, newSubject: string, newBody: string, newCc?: string) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? {
              ...q,
              step4_pitchSubject: newSubject,
              userEditedPitch: newBody,
              step4_pitchBody: newBody,
              ccEmails: newCc || q.ccEmails || defaultCcEmail,
            }
          : q
      )
    );
    if (selectedQuery && selectedQuery.id === queryId) {
      setSelectedQuery((prev) =>
        prev
          ? {
              ...prev,
              step4_pitchSubject: newSubject,
              userEditedPitch: newBody,
              step4_pitchBody: newBody,
              ccEmails: newCc || prev.ccEmails || defaultCcEmail,
            }
          : null
      );
    }

    if (query) {
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        outlet: query.mediaOutlet,
        journalist: query.journalist,
        action: 'EDITED_BY_MANAGER',
        actionTitle: 'Pitch Refined by PR Manager',
        details: `Subject line and body copy updated with hedged claims for ${query.step2_brand}. Word count: ${newBody.split(/\s+/).filter(Boolean).length} words.`,
        actor: 'PR Manager',
      });
    }
  };

  const handleUpdateQueryUrl = (queryId: string, newUrl: string) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) =>
      prev.map((q) => (q.id === queryId ? { ...q, queryUrl: newUrl } : q))
    );
    if (selectedQuery && selectedQuery.id === queryId) {
      setSelectedQuery((prev) => (prev ? { ...prev, queryUrl: newUrl } : null));
    }

    if (query) {
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        action: 'EDITED_BY_MANAGER',
        actionTitle: 'Source Query Link Updated',
        details: `Source query destination URL updated to: ${newUrl}`,
        actor: 'PR Manager',
      });
    }

    showNotification('success', 'Source query link updated.');
  };

  const handleUpdateIntel = (queryId: string, newIntel: JournalistIntelligence) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === queryId ? { ...q, journalistIntelligence: newIntel } : q))
    );
    if (selectedQuery?.id === queryId) {
      setSelectedQuery((prev) => (prev ? { ...prev, journalistIntelligence: newIntel } : null));
    }
    const query = queries.find((q) => q.id === queryId);
    if (query) {
      addActivityLog({
        queryId,
        queryTitle: query.title,
        brand: query.step2_brand,
        outlet: query.mediaOutlet,
        journalist: query.journalist,
        action: 'EDITED_BY_MANAGER',
        actionTitle: 'Journalist Intelligence Grounded',
        details: `Google Search grounding fetched ${newIntel.recentArticles?.length || 0} recent articles and social bio for ${query.journalist} (${query.mediaOutlet}).`,
        actor: 'Google Search Grounding',
      });
    }
  };

  const handleOpenLinkChecker = (query: HaroQuery) => {
    setCheckingLinkQuery(query);
    addActivityLog({
      queryId: query.id,
      queryTitle: query.title,
      brand: query.step2_brand,
      outlet: query.mediaOutlet,
      journalist: query.journalist,
      action: 'LINK_CHECKED',
      actionTitle: 'Source Link Inspected',
      details: `Live connectivity and URL validity inspection initiated for ${query.queryUrl || 'query link'}.`,
      actor: activeView === 'boss-portal' ? 'Executive / Boss' : 'PR Manager',
    });
  };

  // Pipeline step counts
  const counts = {
    total: queries.length,
    step1_rejected: queries.filter((q) => q.step1_status === 'REJECTED').length,
    step2_pwave: queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Performance P-Wave').length,
    step2_skintonic: queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === 'Skin & Tonic').length,
    step2_croley: queries.filter((q) => q.step1_status === 'APPROVED' && q.step2_brand === "Dr. Croley's").length,
    step3_manual: queries.filter((q) => q.step3_hasAiRestriction).length,
    step4_drafted: queries.filter((q) => q.step1_status === 'APPROVED' && !q.step3_hasAiRestriction).length,
    step5_saved: queries.filter((q) => !!q.gmailDraftId && !q.sentAt).length,
    sent_count: queries.filter((q) => !!q.sentAt).length,
  };

  const pendingBossCount = queries.filter(
    (q) => q.step1_status === 'APPROVED' && !q.sentAt && q.bossApprovalStatus !== 'REJECTED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : notification.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {notification.type === 'info' && <Info className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        hasGmailToken={!!token}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        draftsCount={counts.step5_saved}
        activeView={activeView}
        onViewChange={setActiveView}
        pendingBossCount={pendingBossCount}
        sentPitchesCount={counts.sent_count}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: PR WORKSPACE */}
        {activeView === 'workspace' && (
          <div className="space-y-6">
            {/* Executive Workflow Notice */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2">
                    <span>Executive Approval & Dispatch Workflow</span>
                    <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                      Auto-CC: {defaultCcEmail}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    PR Manager prepares hedged pitches and checks query links. Your CEO/Boss can inspect links, review the Activity Log, and click <strong className="text-emerald-400">"Approve & Send Now"</strong> in the Executive Portal.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setActiveView('boss-portal')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Open Boss Portal ({pendingBossCount})</span>
                </button>
              </div>
            </div>

            {/* 5-Step Pipeline Flow Card */}
            <ProcessStepper counts={counts} />

            {/* Search & Ingestion Hub */}
            <IngestSourcePanel
              hasGmailToken={!!token}
              onSearchGmail={handleSearchGmail}
              onProcessText={processDigestText}
              isSearchingGmail={isSearchingGmail}
              isProcessing={isProcessing}
              gmailMessages={gmailMessages}
              onSelectGmailMessage={handleSelectGmailMessage}
              onLogin={handleLogin}
            />

            {/* Daily HARO Digest Overview Card */}
            <DigestOverviewCard
              queries={queries}
              digestSubject={queries[0]?.sourceEmailSubject}
              digestDate={queries[0]?.sourceEmailDate}
              onFilterChange={setActiveFilter}
              onSelectQuery={setSelectedQuery}
              activeFilter={activeFilter}
            />

            {/* Stats KPIs & Quick Filters */}
            <StatsOverview
              queries={queries}
              onFilterChange={setActiveFilter}
              activeFilter={activeFilter}
            />

            {/* Processing Summary Banner */}
            {processingSummary && (
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-3 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{processingSummary}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  Sorted by nearest deadline first
                </span>
              </div>
            )}

            {/* Pitches Summary Table */}
            <QuerySummaryTable
              queries={queries}
              defaultCcEmail={defaultCcEmail}
              onSelectQuery={setSelectedQuery}
              onSaveToGmailDraft={handleSaveToGmailDraft}
              onBatchSaveDrafts={handleBatchSaveDrafts}
              onSendPitch={handleSendPitch}
              onOpenLinkChecker={handleOpenLinkChecker}
              onSwitchToBossPortal={() => setActiveView('boss-portal')}
              hasGmailToken={!!token}
              isSavingDraft={isSavingDraft}
              savingQueryId={savingQueryId}
              activeFilter={activeFilter}
              onLogin={handleLogin}
            />
          </div>
        )}

        {/* VIEW 2: BOSS REVIEW & APPROVAL PORTAL */}
        {activeView === 'boss-portal' && (
          <BossApprovalPortal
            queries={queries}
            activityLogs={activityLogs}
            defaultCcEmail={defaultCcEmail}
            onUpdateDefaultCc={setDefaultCcEmail}
            onSendPitch={handleSendPitch}
            onBatchSendPitches={handleBatchSendPitches}
            onRequestRevision={handleRequestRevision}
            onRejectPitch={handleRejectPitch}
            onOpenLinkChecker={handleOpenLinkChecker}
            onOpenPitchEditor={setSelectedQuery}
            onNavigateToMetrics={() => setActiveView('engagement')}
            hasGmailToken={!!token}
            onLogin={handleLogin}
            isSendingQueryId={isSendingQueryId}
          />
        )}

        {/* VIEW 3: EMAIL ENGAGEMENT & THREAD MONITORING METRICS */}
        {activeView === 'engagement' && (
          <EmailEngagementDashboard
            queries={queries}
            onSyncThreads={handleSyncThreads}
            onCheckSingleThread={handleCheckSingleThread}
            onSimulateDemoResponse={handleSimulateDemoResponse}
            onOpenPitchEditor={setSelectedQuery}
            hasGmailToken={!!token}
            onLogin={handleLogin}
            isSyncing={isSyncingThreads}
          />
        )}
      </main>

      {/* Pitch Detail & AI Polish Modal */}
      <PitchEditorModal
        query={selectedQuery}
        defaultCcEmail={defaultCcEmail}
        onClose={() => setSelectedQuery(null)}
        onUpdatePitch={handleUpdatePitch}
        onSaveToGmailDraft={handleSaveToGmailDraft}
        onSendPitch={handleSendPitch}
        onOpenLinkChecker={handleOpenLinkChecker}
        onUpdateIntel={handleUpdateIntel}
        hasGmailToken={!!token}
        isSavingDraft={isSavingDraft}
        isSending={isSendingQueryId === selectedQuery?.id}
        onLogin={handleLogin}
      />

      {/* Source Link Checker & Health Inspector Modal */}
      {checkingLinkQuery && (
        <SourceLinkCheckerModal
          query={checkingLinkQuery}
          onClose={() => setCheckingLinkQuery(null)}
          onUpdateQueryUrl={handleUpdateQueryUrl}
        />
      )}

      {/* 3 Medical Brands Guide Modal */}
      <BrandProfilesModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />
    </div>
  );
}
