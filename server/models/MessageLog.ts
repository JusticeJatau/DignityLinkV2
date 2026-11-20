import mongoose, {Document, Schema, Types} from 'mongoose';

export type LogDirection = 'outbound' | 'inbound';
export type LogStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
export type LogMessageType =
  | 'scheduled_lesson'
  | 'welcome'
  | 'feedback_ack'
  | 'opt_out_confirm'
  | 'inbound_reply';

export interface IMessageLog extends Document {
  beneficiaryId: Types.ObjectId;
  messageTemplateId?: Types.ObjectId;
  phoneNumber: string;
  channel: 'sms' | 'whatsapp';
  providerName: string;
  direction: LogDirection;
  messageType: LogMessageType;
  body: string;
  weekNumber?: number;
  sequenceNumber?: number;
  status: LogStatus;
  externalMessageId: string;
  providerRequestPayload: Record<string, unknown>;
  providerResponsePayload: Record<string, unknown>;
  schedulerRunId?: Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageLogSchema = new Schema<IMessageLog>(
  {
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true,
      index: true,
    },
    messageTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'MessageTemplate',
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['outbound', 'inbound'],
      required: true,
    },
    messageType: {
      type: String,
      enum: ['scheduled_lesson', 'welcome', 'feedback_ack', 'opt_out_confirm', 'inbound_reply'],
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    weekNumber: {
      type: Number,
      min: 1,
      max: 12,
    },
    sequenceNumber: {
      type: Number,
      min: 1,
      max: 28,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'received'],
      required: true,
    },
    externalMessageId: {
      type: String,
      required: true,
    },
    providerRequestPayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    providerResponsePayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    schedulerRunId: {
      type: Schema.Types.ObjectId,
      ref: 'SchedulerRun',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

messageLogSchema.index({beneficiaryId: 1, sequenceNumber: 1, direction: 1});
messageLogSchema.index({createdAt: -1});

export const MessageLog =
  mongoose.models.MessageLog || mongoose.model<IMessageLog>('MessageLog', messageLogSchema);
