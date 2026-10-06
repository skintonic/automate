export type BrandId = 'pwave' | 'skintonic' | 'croley' | 'none';

export interface BrandConfig {
  id: BrandId;
  name: string;
  shortName: string;
  tagline: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  specialties: string[];
  inHouseExpert: {
    name: string;
    title: string;
    credentials: string;
    bioTeaser: string;
  };
  samplePitchAngles: string[];
}

export type Step1Status = 'APPROVED' | 'REJECTED';

export type Step3Status = 'AI_ALLOWED' | 'MANUAL_PITCH_REQUIRED';

export type OverallStatus = 
  | 'PENDING'
  | 'REJECTED'
  | 'MANUAL_REQUIRED'
  | 'READY_TO_DRAFT'
  | 'DRAFTED_LOCALLY'
  | 'SAVED_TO_GMAIL_DRAFT'
  | 'APPROVED_BY_BOSS'
  | 'SENT_TO_JOURNALIST';

export interface LinkCheckInfo {
  url: string;
  finalUrl?: string;
  domain: string;
  isHttps: boolean;
  status: number;
  statusText: string;
  ok: boolean;
  durationMs: number;
  sourceType: string;
  note: string;
  checkedAt: string;
}

export type ActivityActionType = 
  | 'INGESTED' 
  | 'EDITED_BY_MANAGER' 
  | 'SAVED_DRAFT' 
  | 'LINK_CHECKED' 
  | 'REVISION_REQUESTED' 
  | 'APPROVED_AND_SENT' 
  | 'REJECTED';

export interface ActivityLogEntry {
  id: string;
  queryId: string;
  queryTitle: string;
  brand: string;
  outlet?: string;
  journalist?: string;
  action: ActivityActionType;
  actionTitle: string;
  details: string;
  actor: string;
  timestamp: string;
  timestampMs: number;
}

export type QueryPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface JournalistArticle {
  title: string;
  url: string;
  date?: string;
  snippet?: string;
}

export interface JournalistIntelligence {
  journalistName: string;
  mediaOutlet: string;
  beatFocus?: string;
  bioSnippet?: string;
  twitterHandle?: string;
  twitterBio?: string;
  recentArticles?: JournalistArticle[];
  recommendedHookAngle?: string;
  groundingSources?: GroundingSource[];
  fetchedAt?: string;
  status: 'fetched' | 'loading' | 'fallback' | 'failed';
}

export interface HaroQuery {
  id: string;
  title: string;
  mediaOutlet: string;
  journalist: string;
  email: string;
  deadline: string;
  deadlineTimestamp?: number;
  priority?: QueryPriority;
  queryUrl?: string;
  queryRequirements: string;
  sourceEmailSubject?: string;
  sourceEmailDate?: string;
  sourceEmailId?: string;

  // CC Feature
  ccEmails?: string;

  // Step 1
  step1_status: Step1Status;
  step1_rejectionReason?: string;

  // Step 2
  step2_brand: 'Performance P-Wave' | 'Skin & Tonic' | "Dr. Croley's" | 'None';
  step2_expertTitle?: string;

  // Step 3
  step3_hasAiRestriction: boolean;
  step3_note?: string;

  // Step 4
  step4_pitchSubject?: string;
  step4_pitchBody?: string;
  step4_teaserInsight?: string;

  // Step 5 (Gmail Draft status)
  gmailDraftId?: string;
  gmailDraftThreadId?: string;
  gmailDraftSavedAt?: string;
  gmailDraftError?: string;

  // Boss Approval & Auto-Send Feature
  bossApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  bossFeedbackNotes?: string;
  sentMessageId?: string;
  sentThreadId?: string;
  sentAt?: string;

  // Email Engagement & Thread Monitoring
  isOpened?: boolean;
  openedAt?: string;
  hasReply?: boolean;
  replyCount?: number;
  repliedAt?: string;
  replySender?: string;
  replySnippet?: string;
  responseTimeHours?: number;
  engagementLastCheckedAt?: string;

  // Source Link Health / Check Status
  linkCheckStatus?: 'unchecked' | 'checking' | 'valid' | 'warning' | 'invalid';
  linkCheckDetails?: string;
  linkCheckedAt?: string;

  // Journalist Intelligence (Google Search Grounded)
  journalistIntelligence?: JournalistIntelligence;

  // Activity History
  activityHistory?: ActivityLogEntry[];

  overallStatus: OverallStatus;
  userEditedPitch?: string;
  userNotes?: string;
}

export interface DigestProcessingResult {
  summary: string;
  queries: HaroQuery[];
  totalFound: number;
  approvedCount: number;
  rejectedCount: number;
  manualCount: number;
  pwaveCount: number;
  skinTonicCount: number;
  croleyCount: number;
}

export interface GmailEmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
}
