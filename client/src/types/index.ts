export type UserRole = 'volunteer' | 'coordinator';
export type MessagingChannel = 'sms' | 'whatsapp';
export type LanguageCode = 'en' | 'ha';
export type BeneficiaryStatus = 'active' | 'completed' | 'opted_out';
export type MessageTheme =
  | 'pad_care'
  | 'personal_hygiene'
  | 'health_warning_signs'
  | 'myths_dignity'
  | 'understanding_body'
  | 'feedback_prompt';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  assignedCommunity: string;
}

export interface HealthStatus {
  service: string;
  status: 'ok' | 'degraded';
  database: {
    state: 'connected' | 'connecting' | 'disconnected' | 'missing_uri' | 'error';
    configured: boolean;
    databaseName: string | null;
    lastError: string | null;
  };
  scheduler: {
    active: boolean;
    cronExpression: string;
    lastRunAt: string | null;
  };
  providers: {
    configuredMode: string;
    providers: Array<{
      channel: MessagingChannel;
      providerName: string;
      mode: 'mock' | 'live';
      maxRecommendedChars: number;
      supportsTwoWayReplies: boolean;
      futureProductionAdapters: string[];
      requiredEnvKeysForLive: string[];
    }>;
  };
}

export interface BeneficiaryRecord {
  _id: string;
  fullName: string;
  phoneNumber: string;
  preferredChannel: MessagingChannel;
  preferredLanguage: LanguageCode;
  community: string;
  startDate: string;
  isMinor: boolean;
  age?: number;
  consent: {
    given: boolean;
    explanationConfirmed: boolean;
    givenBy: string;
    recordedAt: string;
  };
  guardianConsent: {
    required: boolean;
    given: boolean;
    guardianName?: string;
    relationship?: string;
    recordedAt?: string;
  };
  kitDistributed?: {
    padsCount: number;
    soapIncluded: boolean;
    pouchIncluded: boolean;
    distributedAt: string;
  };
  status: BeneficiaryStatus;
  optedOutAt?: string;
  optOutReason?: string;
  currentWeek: number;
  lessonsSent: number;
  lastSentAt?: string | null;
  createdAt: string;
}

export interface MessageTemplateRecord {
  _id: string;
  weekNumber: number;
  slotInWeek: number;
  sequenceNumber: number;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Fri';
  theme: MessageTheme;
  language: LanguageCode;
  content: string;
  isFeedbackPrompt: boolean;
  contentReviewStatus: 'prototype_draft' | 'clinical_reviewed';
  active: boolean;
}

export interface MessageLogRecord {
  _id: string;
  beneficiaryId:
    | string
    | {
        _id: string;
        fullName: string;
        community: string;
        preferredLanguage: LanguageCode;
      };
  phoneNumber: string;
  channel: MessagingChannel;
  providerName: string;
  direction: 'outbound' | 'inbound';
  messageType: string;
  body: string;
  weekNumber?: number;
  sequenceNumber?: number;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  externalMessageId: string;
  providerRequestPayload: Record<string, unknown>;
  providerResponsePayload: Record<string, unknown>;
  createdAt: string;
}

export interface FeedbackRecord {
  _id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  phoneNumber: string;
  community: string;
  channel: MessagingChannel;
  rawReply: string;
  code: '1' | '2' | 'STOP' | 'OTHER';
  category: 'helpful' | 'question' | 'opt_out' | 'other';
  resolved: boolean;
  volunteerNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SchedulerRunRecord {
  _id: string;
  triggeredBy: 'cron' | 'manual';
  programDayLabel: string;
  totalEvaluated: number;
  sentCount: number;
  skippedOptOutCount: number;
  skippedAlreadySentCount: number;
  skippedCompletedCount: number;
  failedCount: number;
  summaryNotes: string;
  startedAt: string;
  finishedAt: string;
}

export interface DashboardStatsResponse {
  summary: {
    totalBeneficiaries: number;
    activeBeneficiaries: number;
    optedOutBeneficiaries: number;
    minorBeneficiaries: number;
    totalOutboundMessages: number;
    scheduledLessonsSent: number;
    totalFeedback: number;
    helpfulCount: number;
    questionCount: number;
    unresolvedQuestionsCount: number;
  };
  channelBreakdown: {sms: number; whatsapp: number};
  languageBreakdown: {en: number; ha: number};
  communityBreakdown: Array<{
    community: string;
    registrations: number;
    active: number;
    optedOut: number;
    messagesSent: number;
    helpfulFeedback: number;
    openQuestions: number;
  }>;
  recentFeedback: FeedbackRecord[];
  recentRuns: SchedulerRunRecord[];
  providerArchitecture: HealthStatus['providers'];
}
