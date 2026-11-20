import mongoose, {Document, Schema, Types} from 'mongoose';

export interface ISchedulerRun extends Document {
  triggeredBy: 'cron' | 'manual';
  triggeredByUserId?: Types.ObjectId;
  programDayLabel: string;
  simulatedWeekOverride?: number;
  simulatedSlotOverride?: number;
  totalEvaluated: number;
  sentCount: number;
  skippedOptOutCount: number;
  skippedAlreadySentCount: number;
  skippedCompletedCount: number;
  failedCount: number;
  summaryNotes: string;
  startedAt: Date;
  finishedAt: Date;
}

const schedulerRunSchema = new Schema<ISchedulerRun>(
  {
    triggeredBy: {
      type: String,
      enum: ['cron', 'manual'],
      required: true,
    },
    triggeredByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    programDayLabel: {
      type: String,
      required: true,
    },
    simulatedWeekOverride: {
      type: Number,
      min: 1,
      max: 12,
    },
    simulatedSlotOverride: {
      type: Number,
      min: 1,
      max: 3,
    },
    totalEvaluated: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    skippedOptOutCount: {
      type: Number,
      default: 0,
    },
    skippedAlreadySentCount: {
      type: Number,
      default: 0,
    },
    skippedCompletedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    summaryNotes: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    finishedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
);

export const SchedulerRun =
  mongoose.models.SchedulerRun || mongoose.model<ISchedulerRun>('SchedulerRun', schedulerRunSchema);
