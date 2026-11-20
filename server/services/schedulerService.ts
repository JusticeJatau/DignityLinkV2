import cron, {ScheduledTask} from 'node-cron';
import {env} from '../config/env.ts';
import {Beneficiary} from '../models/Beneficiary.ts';
import {MessageLog} from '../models/MessageLog.ts';
import {MessageTemplate} from '../models/MessageTemplate.ts';
import {SchedulerRun} from '../models/SchedulerRun.ts';
import {dispatchOutboundMessage} from './messagingService.ts';

export type SchedulerMode = 'next_due' | 'calendar_today' | 'override';

export interface RunSchedulerOptions {
  triggeredBy: 'cron' | 'manual';
  triggeredByUserId?: string;
  mode?: SchedulerMode;
  weekNumber?: number;
  slotInWeek?: number;
}

let cronTask: ScheduledTask | null = null;
let lastCronStatus = {
  active: false,
  cronExpression: env.schedulerCron,
  lastRunAt: null as string | null,
};

export function getSequenceNumber(weekNumber: number, slotInWeek: number): number {
  if (weekNumber <= 4) {
    return (weekNumber - 1) * 3 + slotInWeek;
  }
  return 12 + (weekNumber - 5) * 2 + slotInWeek;
}

export function getWeekAndSlotFromSequence(sequenceNumber: number): {
  weekNumber: number;
  slotInWeek: number;
} {
  if (sequenceNumber <= 12) {
    const weekNumber = Math.ceil(sequenceNumber / 3);
    const slotInWeek = ((sequenceNumber - 1) % 3) + 1;
    return {weekNumber, slotInWeek};
  }
  const offset = sequenceNumber - 12;
  const weekNumber = 4 + Math.ceil(offset / 2);
  const slotInWeek = ((offset - 1) % 2) + 1;
  return {weekNumber, slotInWeek};
}

export function getBeneficiaryCurrentWeek(startDate: Date, referenceDate = new Date()): number {
  const diffMs = Math.max(0, referenceDate.getTime() - new Date(startDate).getTime());
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(daysElapsed / 7) + 1;
}

function getCalendarSlotForDay(weekNumber: number, dayIndex: number): number | null {
  // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (weekNumber <= 4) {
    if (dayIndex === 1) return 1; // Mon
    if (dayIndex === 3) return 2; // Wed
    if (dayIndex === 5) return 3; // Fri
    return null;
  }
  if (weekNumber <= 12) {
    if (dayIndex === 2) return 1; // Tue
    if (dayIndex === 5) return 2; // Fri
    return null;
  }
  return null;
}

export async function executeSchedulerRun(options: RunSchedulerOptions) {
  const startedAt = new Date();
  const mode: SchedulerMode = options.mode || (options.triggeredBy === 'cron' ? 'calendar_today' : 'next_due');

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayIndex = startedAt.getDay();

  let programDayLabel = 'Next Unsent Scheduled Lesson (Demo Mode)';
  if (mode === 'calendar_today') {
    programDayLabel = `Daily Calendar (${dayNames[todayDayIndex]} ${startedAt.toISOString().slice(0, 10)})`;
  } else if (mode === 'override' && options.weekNumber && options.slotInWeek) {
    programDayLabel = `Targeted Override · Week ${options.weekNumber}, Message ${options.slotInWeek}`;
  }

  const runRecord = await SchedulerRun.create({
    triggeredBy: options.triggeredBy,
    triggeredByUserId: options.triggeredByUserId || undefined,
    programDayLabel,
    simulatedWeekOverride: mode === 'override' ? options.weekNumber : undefined,
    simulatedSlotOverride: mode === 'override' ? options.slotInWeek : undefined,
    startedAt,
    finishedAt: startedAt,
  });

  const beneficiaries = await Beneficiary.find({}).sort({createdAt: 1});
  const sentDetails: Array<{
    beneficiaryId: string;
    fullName: string;
    phoneNumber: string;
    channel: string;
    language: string;
    weekNumber: number;
    sequenceNumber: number;
    externalMessageId: string;
  }> = [];

  let totalEvaluated = 0;
  let sentCount = 0;
  let skippedOptOutCount = 0;
  let skippedAlreadySentCount = 0;
  let skippedCompletedCount = 0;
  let failedCount = 0;

  for (const beneficiary of beneficiaries) {
    totalEvaluated += 1;

    if (beneficiary.status === 'opted_out') {
      skippedOptOutCount += 1;
      continue;
    }

    if (beneficiary.status === 'completed') {
      skippedCompletedCount += 1;
      continue;
    }

    const existingLogs = await MessageLog.find({
      beneficiaryId: beneficiary._id,
      direction: 'outbound',
      messageType: 'scheduled_lesson',
      status: {$in: ['sent', 'delivered']},
      sequenceNumber: {$exists: true},
    }).select('sequenceNumber');

    const sentSequenceSet = new Set(
      existingLogs.map((l) => l.sequenceNumber).filter((n): n is number => typeof n === 'number'),
    );

    let targetSequence: number | null = null;

    if (mode === 'override' && options.weekNumber && options.slotInWeek) {
      const maxSlots = options.weekNumber <= 4 ? 3 : 2;
      const clampedSlot = Math.min(options.slotInWeek, maxSlots);
      targetSequence = getSequenceNumber(options.weekNumber, clampedSlot);
      if (sentSequenceSet.has(targetSequence)) {
        skippedAlreadySentCount += 1;
        continue;
      }
    } else if (mode === 'calendar_today') {
      const currentWeek = getBeneficiaryCurrentWeek(beneficiary.startDate, startedAt);
      if (currentWeek > 12) {
        beneficiary.status = 'completed';
        await beneficiary.save();
        skippedCompletedCount += 1;
        continue;
      }
      const slotToday = getCalendarSlotForDay(currentWeek, todayDayIndex);
      if (!slotToday) {
        continue;
      }
      targetSequence = getSequenceNumber(currentWeek, slotToday);
      if (sentSequenceSet.has(targetSequence)) {
        skippedAlreadySentCount += 1;
        continue;
      }
    } else {
      // 'next_due' demo mode: find the next unsent message in 1..28
      for (let seq = 1; seq <= 28; seq += 1) {
        if (!sentSequenceSet.has(seq)) {
          targetSequence = seq;
          break;
        }
      }
      if (!targetSequence) {
        beneficiary.status = 'completed';
        await beneficiary.save();
        skippedCompletedCount += 1;
        continue;
      }
    }

    const {weekNumber} = getWeekAndSlotFromSequence(targetSequence);
    const template = await MessageTemplate.findOne({
      sequenceNumber: targetSequence,
      language: beneficiary.preferredLanguage,
      active: true,
    });

    if (!template) {
      failedCount += 1;
      continue;
    }

    try {
      const {result} = await dispatchOutboundMessage({
        beneficiary,
        body: template.content,
        messageType: 'scheduled_lesson',
        messageTemplateId: template._id,
        weekNumber,
        sequenceNumber: targetSequence,
        schedulerRunId: runRecord._id,
      });

      if (result.success) {
        sentCount += 1;
        sentDetails.push({
          beneficiaryId: String(beneficiary._id),
          fullName: beneficiary.fullName,
          phoneNumber: beneficiary.phoneNumber,
          channel: beneficiary.preferredChannel,
          language: beneficiary.preferredLanguage,
          weekNumber,
          sequenceNumber: targetSequence,
          externalMessageId: result.externalMessageId,
        });
      } else {
        failedCount += 1;
      }
    } catch {
      failedCount += 1;
    }
  }

  const finishedAt = new Date();
  const summaryNotes = `Evaluated ${totalEvaluated} beneficiaries: ${sentCount} sent, ${skippedOptOutCount} opted-out skipped, ${skippedAlreadySentCount} duplicates skipped, ${skippedCompletedCount} completed.`;

  runRecord.totalEvaluated = totalEvaluated;
  runRecord.sentCount = sentCount;
  runRecord.skippedOptOutCount = skippedOptOutCount;
  runRecord.skippedAlreadySentCount = skippedAlreadySentCount;
  runRecord.skippedCompletedCount = skippedCompletedCount;
  runRecord.failedCount = failedCount;
  runRecord.summaryNotes = summaryNotes;
  runRecord.finishedAt = finishedAt;
  await runRecord.save();

  lastCronStatus.lastRunAt = finishedAt.toISOString();

  return {
    run: runRecord,
    sentDetails,
  };
}

export function startDailyCronScheduler() {
  if (cronTask) {
    return;
  }

  if (!cron.validate(env.schedulerCron)) {
    console.warn(`[DignityLink Scheduler] Invalid cron expression: ${env.schedulerCron}`);
    return;
  }

  cronTask = cron.schedule(env.schedulerCron, async () => {
    console.log('[DignityLink Scheduler] Running scheduled daily hygiene message pass...');
    try {
      await executeSchedulerRun({
        triggeredBy: 'cron',
        mode: 'calendar_today',
      });
    } catch (err) {
      console.error('[DignityLink Scheduler] Cron execution error:', err);
    }
  });

  lastCronStatus.active = true;
  lastCronStatus.cronExpression = env.schedulerCron;
  console.log(`[DignityLink Scheduler] node-cron armed (${env.schedulerCron})`);
}

export function getSchedulerStatus() {
  return lastCronStatus;
}
