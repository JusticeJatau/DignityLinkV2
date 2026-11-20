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

export class MockWhatsAppProvider implements IMessagingProvider {
  readonly channel = 'whatsapp' as const;
  readonly providerName = 'mock-whatsapp';
  readonly mode = 'mock' as const;

  async sendMessage(request: OutboundMessageRequest): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    const externalMessageId = `wamid.mock_${crypto.randomBytes(6).toString('hex')}`;

    const requestPayload = {
      endpoint: 'https://mock-graph.dignitylink.local/v19.0/phone_number_id/messages',
      messaging_product: 'whatsapp',
      from: env.mockWhatsAppNumber,
      to: request.to,
      type: 'text',
      text: {
        preview_url: false,
        body: request.body,
      },
      metadata: {
        beneficiaryId: request.beneficiaryId,
        language: request.language,
        messageType: request.messageType,
        weekNumber: request.weekNumber ?? null,
        sequenceNumber: request.sequenceNumber ?? null,
      },
    };

    await new Promise((resolve) => setTimeout(resolve, 25));

    const responsePayload = {
      simulated: true,
      gateway: 'DignityLink Mock WhatsApp Cloud API',
      messaging_product: 'whatsapp',
      contacts: [{input: request.to, wa_id: request.to.replace(/\D/g, '')}],
      messages: [{id: externalMessageId, message_status: 'delivered'}],
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[MockWhatsAppProvider] -> ${request.to} (id=${externalMessageId}): "${request.body}"`,
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
      futureProductionAdapters: ['WhatsApp Cloud API (Meta)', 'Twilio WhatsApp Business API'],
      requiredEnvKeysForLive: ['WHATSAPP_CLOUD_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
    };
  }
}
