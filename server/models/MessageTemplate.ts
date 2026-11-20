import mongoose, {Document, Schema} from 'mongoose';

export type MessageTheme =
  | 'pad_care'
  | 'personal_hygiene'
  | 'health_warning_signs'
  | 'myths_dignity'
  | 'understanding_body'
  | 'feedback_prompt';

export type MessageLanguage = 'en' | 'ha';

export interface IMessageTemplate extends Document {
  weekNumber: number;
  slotInWeek: number;
  sequenceNumber: number;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Fri';
  theme: MessageTheme;
  language: MessageLanguage;
  content: string;
  isFeedbackPrompt: boolean;
  contentReviewStatus: 'prototype_draft' | 'clinical_reviewed';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageTemplateSchema = new Schema<IMessageTemplate>(
  {
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    slotInWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },
    dayOfWeek: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Fri'],
      required: true,
    },
    theme: {
      type: String,
      enum: [
        'pad_care',
        'personal_hygiene',
        'health_warning_signs',
        'myths_dignity',
        'understanding_body',
        'feedback_prompt',
      ],
      required: true,
    },
    language: {
      type: String,
      enum: ['en', 'ha'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Each message must stay under 160 characters to fit in one SMS.'],
    },
    isFeedbackPrompt: {
      type: Boolean,
      default: false,
    },
    contentReviewStatus: {
      type: String,
      enum: ['prototype_draft', 'clinical_reviewed'],
      default: 'prototype_draft',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

messageTemplateSchema.index({sequenceNumber: 1, language: 1}, {unique: true});

export const MessageTemplate =
  mongoose.models.MessageTemplate ||
  mongoose.model<IMessageTemplate>('MessageTemplate', messageTemplateSchema);
