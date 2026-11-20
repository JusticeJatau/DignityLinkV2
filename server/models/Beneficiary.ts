import mongoose, {Document, Schema, Types} from 'mongoose';

export type PreferredChannel = 'sms' | 'whatsapp';
export type PreferredLanguage = 'en' | 'ha';
export type BeneficiaryStatus = 'active' | 'completed' | 'opted_out';

export interface IBeneficiary extends Document {
  fullName: string;
  phoneNumber: string;
  preferredChannel: PreferredChannel;
  preferredLanguage: PreferredLanguage;
  community: string;
  startDate: Date;
  isMinor: boolean;
  age?: number;
  consent: {
    given: boolean;
    explanationConfirmed: boolean;
    givenBy: string;
    recordedByUserId: Types.ObjectId;
    recordedAt: Date;
  };
  guardianConsent: {
    required: boolean;
    given: boolean;
    guardianName?: string;
    relationship?: string;
    recordedAt?: Date;
  };
  kitDistributed: {
    padsCount: number;
    soapIncluded: boolean;
    pouchIncluded: boolean;
    distributedAt: Date;
  };
  status: BeneficiaryStatus;
  optedOutAt?: Date;
  optOutReason?: string;
  registeredByUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const beneficiarySchema = new Schema<IBeneficiary>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    preferredChannel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
      default: 'sms',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ha'],
      required: true,
      default: 'en',
    },
    community: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    isMinor: {
      type: Boolean,
      required: true,
      default: false,
    },
    age: {
      type: Number,
      min: 8,
      max: 99,
    },
    consent: {
      given: {
        type: Boolean,
        required: true,
        validate: {
          validator: (v: boolean) => v === true,
          message: 'Informed consent must be explicitly granted before registration.',
        },
      },
      explanationConfirmed: {
        type: Boolean,
        required: true,
        validate: {
          validator: (v: boolean) => v === true,
          message: 'Plain-language service explanation must be confirmed.',
        },
      },
      givenBy: {
        type: String,
        required: true,
        trim: true,
      },
      recordedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      recordedAt: {
        type: Date,
        required: true,
        default: () => new Date(),
      },
    },
    guardianConsent: {
      required: {
        type: Boolean,
        required: true,
        default: false,
      },
      given: {
        type: Boolean,
        required: true,
        default: false,
      },
      guardianName: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      recordedAt: {
        type: Date,
      },
    },
    kitDistributed: {
      padsCount: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
      soapIncluded: {
        type: Boolean,
        default: true,
      },
      pouchIncluded: {
        type: Boolean,
        default: true,
      },
      distributedAt: {
        type: Date,
        default: () => new Date(),
      },
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'opted_out'],
      default: 'active',
      index: true,
    },
    optedOutAt: {
      type: Date,
    },
    optOutReason: {
      type: String,
      trim: true,
    },
    registeredByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

beneficiarySchema.pre('validate', function () {
  if (this.isMinor) {
    this.guardianConsent.required = true;
    if (!this.guardianConsent.given || !this.guardianConsent.guardianName?.trim()) {
      this.invalidate(
        'guardianConsent',
        'Parent or guardian consent and guardian name are mandatory for beneficiaries under 18.',
      );
    }
  } else {
    this.guardianConsent.required = false;
  }
});

export const Beneficiary =
  mongoose.models.Beneficiary || mongoose.model<IBeneficiary>('Beneficiary', beneficiarySchema);
