import crypto from 'crypto';
import {Types} from 'mongoose';
import {Beneficiary, IBeneficiary} from '../models/Beneficiary.ts';
import {Feedback} from '../models/Feedback.ts';
import {LogMessageType, MessageLog} from '../models/MessageLog.ts';
import {getMessagingProvider} from '../providers/providerFactory.ts';

interface DispatchInput {
  beneficiary: IBeneficiary;
  body: string;
  messageType: LogMessageType & ('scheduled_lesson' | 'welcome' | 'feedback_ack' | 'opt_out_confirm');
  messageTemplateId?: Types.ObjectId | string;
  weekNumber?: number;
  sequenceNumber?: number;
  schedulerRunId?: Types.ObjectId | string;
}

export async function dispatchOutboundMessage(input: DispatchInput) {
  const {beneficiary, body, messageType, messageTemplateId, weekNumber, sequenceNumber, schedulerRunId} =
    input;
  const provider = getMessagingProvider(beneficiary.preferredChannel);

  const result = await provider.sendMessage({
    to: beneficiary.phoneNumber,
    body,
    beneficiaryId: String(beneficiary._id),
    language: beneficiary.preferredLanguage,
    messageType,
    weekNumber,
    sequenceNumber,
  });

  const log = await MessageLog.create({
    beneficiaryId: beneficiary._id,
    messageTemplateId: messageTemplateId || undefined,
    phoneNumber: beneficiary.phoneNumber,
    channel: beneficiary.preferredChannel,
    providerName: result.providerName,
    direction: 'outbound',
    messageType,
    body,
    weekNumber,
    sequenceNumber,
    status: result.status,
    externalMessageId: result.externalMessageId,
    providerRequestPayload: result.requestPayload,
    providerResponsePayload: result.responsePayload,
    schedulerRunId: schedulerRunId || undefined,
    errorMessage: result.errorMessage,
  });

  return {log, result};
}

export function buildDiscreetWelcomeMessage(beneficiary: IBeneficiary): string {
  if (beneficiary.preferredLanguage === 'ha') {
    return 'Barka da shigowa shirin kula da tsafta. Za a rika turo gajerun sakonni a kowane mako. Amsa 1=Mai amfani, 2=Tambaya, STOP=Tsayarwa.';
  }
  return 'Welcome to DignityLink hygiene tips. You will receive short weekly tips. Reply 1=Helpful, 2=I have a question, or STOP anytime to opt out.';
}

export async function processInboundReply(beneficiaryId: string, rawReply: string) {
  const beneficiary = await Beneficiary.findById(beneficiaryId);
  if (!beneficiary) {
    throw new Error('Beneficiary not found');
  }

  const trimmed = rawReply.trim();
  if (!trimmed) {
    throw new Error('Reply text cannot be empty');
  }

  const provider = getMessagingProvider(beneficiary.preferredChannel);
  const parsed = provider.parseInboundReply(trimmed);
  const inboundId = `in_${beneficiary.preferredChannel}_${crypto.randomBytes(5).toString('hex')}`;

  const inboundLog = await MessageLog.create({
    beneficiaryId: beneficiary._id,
    phoneNumber: beneficiary.phoneNumber,
    channel: beneficiary.preferredChannel,
    providerName: provider.providerName,
    direction: 'inbound',
    messageType: 'inbound_reply',
    body: parsed.rawReply,
    status: 'received',
    externalMessageId: inboundId,
    providerRequestPayload: {
      simulatedWebhook: true,
      from: beneficiary.phoneNumber,
      channel: beneficiary.preferredChannel,
      body: parsed.rawReply,
    },
    providerResponsePayload: {
      parsedCode: parsed.code,
      category: parsed.category,
      receivedAt: new Date().toISOString(),
    },
  });

  const feedback = await Feedback.create({
    beneficiaryId: beneficiary._id,
    beneficiaryName: beneficiary.fullName,
    phoneNumber: beneficiary.phoneNumber,
    community: beneficiary.community,
    channel: beneficiary.preferredChannel,
    rawReply: parsed.rawReply,
    code: parsed.code,
    category: parsed.category,
    resolved: parsed.category !== 'question',
  });

  let confirmationBody: string;
  let confirmationType: 'feedback_ack' | 'opt_out_confirm' = 'feedback_ack';

  if (parsed.isOptOut) {
    beneficiary.status = 'opted_out';
    beneficiary.optedOutAt = new Date();
    beneficiary.optOutReason = `Replied "${parsed.rawReply}" via ${beneficiary.preferredChannel.toUpperCase()}`;
    await beneficiary.save();

    confirmationType = 'opt_out_confirm';
    confirmationBody =
      beneficiary.preferredLanguage === 'ha'
        ? 'An tsayar da sakonni kamar yadda kuka bukata. Mun gode.'
        : 'You have been opted out and will no longer receive scheduled tips. Thank you.';
  } else if (parsed.code === '1') {
    confirmationBody =
      beneficiary.preferredLanguage === 'ha'
        ? 'Mun gode da amsar ku (1). Muna muku fatan alheri.'
        : 'Thank you for your feedback (1). We are glad the tips are helpful.';
  } else if (parsed.code === '2') {
    confirmationBody =
      beneficiary.preferredLanguage === 'ha'
        ? 'Mun karbi tambayar ku (2). Wakilinmu na unguwa zai tuntube ku.'
        : 'Thank you (2). A local volunteer has been notified and will follow up with you.';
  } else {
    confirmationBody =
      beneficiary.preferredLanguage === 'ha'
        ? 'Mun karbi sakon ku. Amsa 1=Mai amfani, 2=Tambaya, ko STOP don tsayarwa.'
        : 'Message received. Reply 1=Helpful, 2=Question, or STOP to unsubscribe.';
  }

  const {log: outboundAckLog} = await dispatchOutboundMessage({
    beneficiary,
    body: confirmationBody,
    messageType: confirmationType,
  });

  return {
    beneficiary,
    parsed,
    inboundLog,
    feedback,
    outboundAckLog,
  };
}
