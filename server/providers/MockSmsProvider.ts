import crypto from 'crypto';
import {env} from '../config/env.ts';
import {
  IMessagingProvider,
  OutboundMessageRequest,
  ParsedInboundReply,
  ProviderCapabilities,
  ProviderSendResult,
  parseStandardReply,
} from './MessagingProvider.ts';

export class MockSmsProvider implements IMessagingProvider {
  readonly channel = 'sms' as const;
  readonly providerName = 'mock-sms';
  readonly mode = 'mock' as const;

  async sendMessage(request: OutboundMessageRequest): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    const externalMessageId = `sms_mock_${crypto.randomBytes(6).toString('hex')}`;
    const characterCount = request.body.length;
    const segmentCount = Math.max(1, Math.ceil(characterCount / 160));

    const requestPayload = {
      endpoint: 'https://mock-gateway.dignitylink.local/v1/sms/send',
      senderId: env.mockSmsSenderId,
      to: request.to,
      message: request.body,
      encoding: 'GSM-7',
      characterCount,
      segmentCount,
      metadata: {
        beneficiaryId: request.beneficiaryId,
        messageType: request.messageType,
        weekNumber: request.weekNumber ?? null,
        sequenceNumber: request.sequenceNumber ?? null,
      },
    };

    // Simulate realistic asynchronous gateway dispatch
    await new Promise((resolve) => setTimeout(resolve, 25));

    const responsePayload = {
      simulated: true,
      gateway: 'DignityLink Mock SMS Gateway',
      messageId: externalMessageId,
      status: 'delivered',
      statusCode: 202,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[MockSmsProvider] -> ${request.to} (${characterCount} chars, id=${externalMessageId}): "${request.body}"`,
    );

    return {
      success: true,
      providerName: this.providerName,
      channel: this.channel,
      status: 'delivered',
      externalMessageId,
      requestPayload,
      responsePayload,
    };
  }

  parseInboundReply(rawBody: string): ParsedInboundReply {
    return parseStandardReply(rawBody);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      channel: this.channel,
      providerName: this.providerName,
      mode: this.mode,
      maxRecommendedChars: 160,
      supportsTwoWayReplies: true,
      futureProductionAdapters: ["Africa's Talking SMS API", 'Twilio Programmable Messaging'],
      requiredEnvKeysForLive: ['AFRICASTALKING_API_KEY', 'AFRICASTALKING_USERNAME', 'SMS_SENDER_ID'],
    };
  }
}
