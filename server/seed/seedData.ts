import bcrypt from 'bcryptjs';
import {Beneficiary} from '../models/Beneficiary.ts';
import {Feedback} from '../models/Feedback.ts';
import {MessageLog} from '../models/MessageLog.ts';
import {MessageTemplate} from '../models/MessageTemplate.ts';
import {SchedulerRun} from '../models/SchedulerRun.ts';
import {User} from '../models/User.ts';
import {TWELVE_WEEK_MESSAGES} from './messageLibraryData.ts';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function seedDatabaseIfEmpty(force = false): Promise<{
  seeded: boolean;
  message: string;
}> {
  const userCount = await User.countDocuments();
  const templateCount = await MessageTemplate.countDocuments();

  if (!force && userCount > 0 && templateCount >= 56) {
    return {
      seeded: false,
      message: 'Database already populated; skipping seed.',
    };
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      MessageTemplate.deleteMany({}),
      Beneficiary.deleteMany({}),
      MessageLog.deleteMany({}),
      Feedback.deleteMany({}),
      SchedulerRun.deleteMany({}),
    ]);
  }

  // 1. Seed Volunteer and Coordinator accounts
  const [volHash, coordHash] = await Promise.all([
    bcrypt.hash('DignityVol2026!', 10),
    bcrypt.hash('DignityCoord2026!', 10),
  ]);

  const volunteer =
    (await User.findOne({email: 'amina.volunteer@dignitylink.org'})) ||
    (await User.create({
      name: 'Amina Musa',
      email: 'amina.volunteer@dignitylink.org',
      passwordHash: volHash,
      role: 'volunteer',
      assignedCommunity: 'Bakassi IDP Camp',
      active: true,
    }));

  const coordinator =
    (await User.findOne({email: 'grace.coordinator@dignitylink.org'})) ||
    (await User.create({
      name: 'Grace Okafor',
      email: 'grace.coordinator@dignitylink.org',
      passwordHash: coordHash,
      role: 'coordinator',
      assignedCommunity: 'All Communities',
      active: true,
    }));

  // 2. Upsert all 56 bilingual message templates (28 EN + 28 HA)
  for (const item of TWELVE_WEEK_MESSAGES) {
    if (item.en.length > 160 || item.ha.length > 160) {
      throw new Error(
        `Seed message seq ${item.sequenceNumber} exceeds 160 chars (en=${item.en.length}, ha=${item.ha.length})`,
      );
    }

    await MessageTemplate.findOneAndUpdate(
      {sequenceNumber: item.sequenceNumber, language: 'en'},
      {
        weekNumber: item.weekNumber,
        slotInWeek: item.slotInWeek,
        sequenceNumber: item.sequenceNumber,
        dayOfWeek: item.dayOfWeek,
        theme: item.theme,
        language: 'en',
        content: item.en,
        isFeedbackPrompt: item.isFeedbackPrompt,
        contentReviewStatus: 'prototype_draft',
        active: true,
      },
      {upsert: true, new: true},
    );

    await MessageTemplate.findOneAndUpdate(
      {sequenceNumber: item.sequenceNumber, language: 'ha'},
      {
        weekNumber: item.weekNumber,
        slotInWeek: item.slotInWeek,
        sequenceNumber: item.sequenceNumber,
        dayOfWeek: item.dayOfWeek,
        theme: item.theme,
        language: 'ha',
        content: item.ha,
        isFeedbackPrompt: item.isFeedbackPrompt,
        contentReviewStatus: 'prototype_draft',
        active: true,
      },
      {upsert: true, new: true},
    );
  }

  // 3. Seed realistic beneficiaries if none exist
  const existingBeneficiaries = await Beneficiary.countDocuments();
  if (existingBeneficiaries === 0) {
    const seededBeneficiaries = await Beneficiary.insertMany([
      {
        fullName: 'Zainab Ibrahim',
        phoneNumber: '+2348031110001',
        preferredChannel: 'sms',
        preferredLanguage: 'ha',
        community: 'Bakassi IDP Camp',
        startDate: daysAgo(10),
        isMinor: false,
        age: 24,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Zainab Ibrahim',
          recordedByUserId: volunteer._id,
          recordedAt: daysAgo(10),
        },
        guardianConsent: {
          required: false,
          given: false,
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(10)},
        status: 'active',
        registeredByUserId: volunteer._id,
      },
      {
        fullName: 'Fatima Abubakar',
        phoneNumber: '+2348031110002',
        preferredChannel: 'whatsapp',
        preferredLanguage: 'en',
        community: 'Bakassi IDP Camp',
        startDate: daysAgo(17),
        isMinor: true,
        age: 15,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Fatima Abubakar & Parent',
          recordedByUserId: volunteer._id,
          recordedAt: daysAgo(17),
        },
        guardianConsent: {
          required: true,
          given: true,
          guardianName: 'Hauwa Abubakar',
          relationship: 'Mother',
          recordedAt: daysAgo(17),
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(17)},
        status: 'active',
        registeredByUserId: volunteer._id,
      },
      {
        fullName: 'Maryam Sani',
        phoneNumber: '+2348031110003',
        preferredChannel: 'sms',
        preferredLanguage: 'ha',
        community: 'Muna Garage Settlement',
        startDate: daysAgo(24),
        isMinor: false,
        age: 29,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Maryam Sani',
          recordedByUserId: coordinator._id,
          recordedAt: daysAgo(24),
        },
        guardianConsent: {
          required: false,
          given: false,
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(24)},
        status: 'active',
        registeredByUserId: coordinator._id,
      },
      {
        fullName: 'Blessing Daniel',
        phoneNumber: '+2348031110004',
        preferredChannel: 'whatsapp',
        preferredLanguage: 'en',
        community: 'Gwange Rural Clinic',
        startDate: daysAgo(45),
        isMinor: false,
        age: 21,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Blessing Daniel',
          recordedByUserId: coordinator._id,
          recordedAt: daysAgo(45),
        },
        guardianConsent: {
          required: false,
          given: false,
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(45)},
        status: 'active',
        registeredByUserId: coordinator._id,
      },
      {
        fullName: 'Aisha Bukar',
        phoneNumber: '+2348031110005',
        preferredChannel: 'sms',
        preferredLanguage: 'ha',
        community: 'Muna Garage Settlement',
        startDate: daysAgo(14),
        isMinor: true,
        age: 16,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Aisha Bukar & Guardian',
          recordedByUserId: volunteer._id,
          recordedAt: daysAgo(14),
        },
        guardianConsent: {
          required: true,
          given: true,
          guardianName: 'Kaltum Bukar',
          relationship: 'Aunt / Legal Guardian',
          recordedAt: daysAgo(14),
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(14)},
        status: 'opted_out',
        optedOutAt: daysAgo(3),
        optOutReason: 'Replied "STOP" via SMS',
        registeredByUserId: volunteer._id,
      },
      {
        fullName: 'Hadiza Lawan',
        phoneNumber: '+2348031110006',
        preferredChannel: 'sms',
        preferredLanguage: 'en',
        community: 'Bakassi IDP Camp',
        startDate: daysAgo(3),
        isMinor: false,
        age: 27,
        consent: {
          given: true,
          explanationConfirmed: true,
          givenBy: 'Hadiza Lawan',
          recordedByUserId: volunteer._id,
          recordedAt: daysAgo(3),
        },
        guardianConsent: {
          required: false,
          given: false,
        },
        kitDistributed: {padsCount: 3, soapIncluded: true, pouchIncluded: true, distributedAt: daysAgo(3)},
        status: 'active',
        registeredByUserId: volunteer._id,
      },
    ]);

    const templates = await MessageTemplate.find({});
    const tplMap = new Map(templates.map((t) => [`${t.sequenceNumber}_${t.language}`, t]));

    const seedRun = await SchedulerRun.create({
      triggeredBy: 'manual',
      triggeredByUserId: coordinator._id,
      programDayLabel: 'Initial Program Distribution Run',
      totalEvaluated: 6,
      sentCount: 8,
      skippedOptOutCount: 1,
      skippedAlreadySentCount: 0,
      skippedCompletedCount: 0,
      failedCount: 0,
      summaryNotes: 'Seeded initial multi-community delivery history for demonstration.',
      startedAt: daysAgo(2),
      finishedAt: daysAgo(2),
    });

    const logDocs: Array<Record<string, unknown>> = [];

    const addLessonLog = (
      b: (typeof seededBeneficiaries)[number],
      seq: number,
      daysBack: number,
    ) => {
      const tpl = tplMap.get(`${seq}_${b.preferredLanguage}`);
      if (!tpl) return;
      const ts = daysAgo(daysBack);
      const isWa = b.preferredChannel === 'whatsapp';
      const extId = isWa ? `wamid.seed_${seq}_${b.phoneNumber.slice(-4)}` : `sms_seed_${seq}_${b.phoneNumber.slice(-4)}`;
      logDocs.push({
        beneficiaryId: b._id,
        messageTemplateId: tpl._id,
        phoneNumber: b.phoneNumber,
        channel: b.preferredChannel,
        providerName: isWa ? 'mock-whatsapp' : 'mock-sms',
        direction: 'outbound',
        messageType: 'scheduled_lesson',
        body: tpl.content,
        weekNumber: tpl.weekNumber,
        sequenceNumber: tpl.sequenceNumber,
        status: 'delivered',
        externalMessageId: extId,
        providerRequestPayload: {simulated: true, to: b.phoneNumber, channel: b.preferredChannel},
        providerResponsePayload: {simulated: true, messageId: extId, status: 'delivered'},
        schedulerRunId: seedRun._id,
        createdAt: ts,
        updatedAt: ts,
      });
    };

    // Zainab: seq 1, 2, 3
    addLessonLog(seededBeneficiaries[0], 1, 8);
    addLessonLog(seededBeneficiaries[0], 2, 5);
    addLessonLog(seededBeneficiaries[0], 3, 2);

    // Fatima: seq 1, 2, 3, 4
    addLessonLog(seededBeneficiaries[1], 1, 14);
    addLessonLog(seededBeneficiaries[1], 2, 11);
    addLessonLog(seededBeneficiaries[1], 3, 8);
    addLessonLog(seededBeneficiaries[1], 4, 4);

    // Maryam: seq 1, 2
    addLessonLog(seededBeneficiaries[2], 1, 12);
    addLessonLog(seededBeneficiaries[2], 2, 7);

    // Blessing: seq 1, 2, 3
    addLessonLog(seededBeneficiaries[3], 1, 20);
    addLessonLog(seededBeneficiaries[3], 2, 15);
    addLessonLog(seededBeneficiaries[3], 3, 9);

    // Aisha (opted out after seq 1)
    addLessonLog(seededBeneficiaries[4], 1, 10);

    // Inbound & Feedback records
    logDocs.push(
      {
        beneficiaryId: seededBeneficiaries[0]._id,
        phoneNumber: seededBeneficiaries[0].phoneNumber,
        channel: 'sms',
        providerName: 'mock-sms',
        direction: 'inbound',
        messageType: 'inbound_reply',
        body: '1',
        status: 'received',
        externalMessageId: 'in_sms_seed_01',
        providerRequestPayload: {simulatedWebhook: true, body: '1'},
        providerResponsePayload: {parsedCode: '1', category: 'helpful'},
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        beneficiaryId: seededBeneficiaries[1]._id,
        phoneNumber: seededBeneficiaries[1].phoneNumber,
        channel: 'whatsapp',
        providerName: 'mock-whatsapp',
        direction: 'inbound',
        messageType: 'inbound_reply',
        body: '2',
        status: 'received',
        externalMessageId: 'in_wa_seed_02',
        providerRequestPayload: {simulatedWebhook: true, body: '2'},
        providerResponsePayload: {parsedCode: '2', category: 'question'},
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        beneficiaryId: seededBeneficiaries[4]._id,
        phoneNumber: seededBeneficiaries[4].phoneNumber,
        channel: 'sms',
        providerName: 'mock-sms',
        direction: 'inbound',
        messageType: 'inbound_reply',
        body: 'STOP',
        status: 'received',
        externalMessageId: 'in_sms_seed_03',
        providerRequestPayload: {simulatedWebhook: true, body: 'STOP'},
        providerResponsePayload: {parsedCode: 'STOP', category: 'opt_out'},
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    );

    await MessageLog.insertMany(logDocs);

    await Feedback.insertMany([
      {
        beneficiaryId: seededBeneficiaries[0]._id,
        beneficiaryName: seededBeneficiaries[0].fullName,
        phoneNumber: seededBeneficiaries[0].phoneNumber,
        community: seededBeneficiaries[0].community,
        channel: 'sms',
        rawReply: '1',
        code: '1',
        category: 'helpful',
        resolved: true,
        createdAt: daysAgo(2),
      },
      {
        beneficiaryId: seededBeneficiaries[1]._id,
        beneficiaryName: seededBeneficiaries[1].fullName,
        phoneNumber: seededBeneficiaries[1].phoneNumber,
        community: seededBeneficiaries[1].community,
        channel: 'whatsapp',
        rawReply: '2',
        code: '2',
        category: 'question',
        resolved: false,
        createdAt: daysAgo(1),
      },
      {
        beneficiaryId: seededBeneficiaries[3]._id,
        beneficiaryName: seededBeneficiaries[3].fullName,
        phoneNumber: seededBeneficiaries[3].phoneNumber,
        community: seededBeneficiaries[3].community,
        channel: 'whatsapp',
        rawReply: '1',
        code: '1',
        category: 'helpful',
        resolved: true,
        createdAt: daysAgo(5),
      },
      {
        beneficiaryId: seededBeneficiaries[4]._id,
        beneficiaryName: seededBeneficiaries[4].fullName,
        phoneNumber: seededBeneficiaries[4].phoneNumber,
        community: seededBeneficiaries[4].community,
        channel: 'sms',
        rawReply: 'STOP',
        code: 'STOP',
        category: 'opt_out',
        resolved: true,
        volunteerNotes: 'Opted out via SMS STOP keyword.',
        createdAt: daysAgo(3),
      },
    ]);
  }

  return {
    seeded: true,
    message: 'DignityLink seed data (users, 56 bilingual templates, beneficiaries, logs, feedback) loaded.',
  };
}
