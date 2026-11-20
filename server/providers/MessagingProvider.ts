export type MessagingChannel = 'sms' | 'whatsapp';

export interface OutboundMessageRequest {
  to: string;
  body: string;
  beneficiaryId: string;
  language: 'en' | 'ha';
  messageType: 'scheduled_lesson' | 'welcome' | 'feedback_ack' | 'opt_out_confirm';
  weekNumber?: number;
  sequenceNumber?: number;
}

export interface ProviderSendResult {
  success: boolean;
  providerName: string;
  channel: MessagingChannel;
  status: 'sent' | 'delivered' | 'failed';
  externalMessageId: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  errorMessage?: string;
}

export interface ParsedInboundReply {
  rawReply: string;
  normalizedReply: string;
  code: '1' | '2' | 'STOP' | 'OTHER';
  category: 'helpful' | 'question' | 'opt_out' | 'other';
  isOptOut: boolean;
}

export interface ProviderCapabilities {
  channel: MessagingChannel;
  providerName: string;
  mode: 'mock' | 'live';
  maxRecommendedChars: number;
  supportsTwoWayReplies: boolean;
  futureProductionAdapters: string[];
  requiredEnvKeysForLive: string[];
}

export interface IMessagingProvider {
  readonly channel: MessagingChannel;
  readonly providerName: string;
  readonly mode: 'mock' | 'live';
  sendMessage(request: OutboundMessageRequest): Promise<ProviderSendResult>;
  parseInboundReply(rawBody: string): ParsedInboundReply;
  getCapabilities(): ProviderCapabilities;
}

export function parseStandardReply(rawBody: string): ParsedInboundReply {
  const rawReply = (rawBody || '').trim();
  const normalizedReply = rawReply.toUpperCase();

  if (
    normalizedReply === 'STOP' ||
    normalizedReply === 'UNSUBSCRIBE' ||
    normalizedReply === 'CANCEL' ||
    normalizedReply === 'DAINA'
  ) {
    return {
      rawReply,
      normalizedReply,
      code: 'STOP',
      category: 'opt_out',
      isOptOut: true,
    };
  }

  if (normalizedReply === '1' || normalizedReply.startsWith('1 ') || normalizedReply === 'YES') {
    return {
      rawReply,
      normalizedReply,
      code: '1',
      category: 'helpful',
      isOptOut: false,
    };
  }

  if (normalizedReply === '2' || normalizedReply.startsWith('2 ') || normalizedReply.includes('?')) {
    return {
      rawReply,
      normalizedReply,
      code: '2',
      category: 'question',
      isOptOut: false,
    };
  }

  return {
    rawReply,
    normalizedReply,
    code: 'OTHER',
    category: 'other',
    isOptOut: false,
  };
}
