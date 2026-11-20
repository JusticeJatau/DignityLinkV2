import {env} from '../config/env.ts';
import {IMessagingProvider, MessagingChannel} from './MessagingProvider.ts';
import {MockSmsProvider} from './MockSmsProvider.ts';
import {MockWhatsAppProvider} from './MockWhatsAppProvider.ts';

const smsProvider = new MockSmsProvider();
const whatsappProvider = new MockWhatsAppProvider();

/**
 * Factory resolving messaging providers behind a shared interface.
 * Swapping to Africa's Talking, Twilio, or WhatsApp Cloud API only requires
 * registering live adapters here based on MESSAGING_PROVIDER_MODE and env keys.
 */
export function getMessagingProvider(channel: MessagingChannel): IMessagingProvider {
  if (env.messagingProviderMode === 'mock') {
    return channel === 'whatsapp' ? whatsappProvider : smsProvider;
  }

  // Fallback safely to mock providers in prototype if live mode is configured without live adapters
  return channel === 'whatsapp' ? whatsappProvider : smsProvider;
}

export function getProviderArchitectureStatus() {
  return {
    configuredMode: env.messagingProviderMode,
    providers: [smsProvider.getCapabilities(), whatsappProvider.getCapabilities()],
  };
}
