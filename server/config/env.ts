import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  jwtSecret: process.env.JWT_SECRET || 'dignitylink-hackathon-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  messagingProviderMode: (process.env.MESSAGING_PROVIDER_MODE || 'mock').toLowerCase(),
  mockSmsSenderId: process.env.MOCK_SMS_SENDER_ID || 'DignityLink',
  mockWhatsAppNumber: process.env.MOCK_WHATSAPP_NUMBER || '+2348000001234',
  schedulerCron: process.env.SCHEDULER_CRON || '0 8 * * *',
};
