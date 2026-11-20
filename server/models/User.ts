import mongoose, {Document, Schema} from 'mongoose';

export type UserRole = 'volunteer' | 'coordinator';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  assignedCommunity: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['volunteer', 'coordinator'],
      required: true,
      default: 'volunteer',
    },
    assignedCommunity: {
      type: String,
      required: true,
      trim: true,
      default: 'All Communities',
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

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
