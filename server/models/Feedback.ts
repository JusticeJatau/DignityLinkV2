import mongoose, {Document, Schema, Types} from 'mongoose';

export type FeedbackCode = '1' | '2' | 'STOP' | 'OTHER';
export type FeedbackCategory = 'helpful' | 'question' | 'opt_out' | 'other';

export interface IFeedback extends Document {
  beneficiaryId: Types.ObjectId;
  beneficiaryName: string;
  phoneNumber: string;
  community: string;
  channel: 'sms' | 'whatsapp';
  rawReply: string;
  code: FeedbackCode;
  category: FeedbackCategory;
  resolved: boolean;
  volunteerNotes?: string;
  resolvedByUserId?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true,
      index: true,
    },
    beneficiaryName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    community: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
    },
    rawReply: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      enum: ['1', '2', 'STOP', 'OTHER'],
      required: true,
    },
    category: {
      type: String,
      enum: ['helpful', 'question', 'opt_out', 'other'],
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    volunteerNotes: {
      type: String,
      trim: true,
    },
    resolvedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.index({createdAt: -1});

export const Feedback =
  mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', feedbackSchema);
