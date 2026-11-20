import {CheckCircle2, Clock, Layers} from 'lucide-react';
import {useAuth} from '../context/AuthContext.tsx';

export function RoadmapView() {
  const {health} = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
          Provider Architecture &amp; Program Roadmap
        </h1>
        <p className="mt-1 text-sm text-[#556363]">
          Clear separation between implemented hackathon prototype features and next-phase field
          deployment capabilities.
        </p>
      </div>

      {/* Swappable Provider Interface Architecture */}
      <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
        <div className="flex items-start gap-3 border-b border-[#EFEAE0] pb-4">
          <Layers className="mt-0.5 h-5 w-5 text-[#0F5C5C]" />
          <div>
            <h2 className="font-display text-lg font-bold text-[#172323]">
              Swappable Messaging Provider Layer (IMessagingProvider)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#556363]">
              Both MockSmsProvider and MockWhatsAppProvider implement one shared TypeScript
              interface. Switching to Africa&apos;s Talking, Twilio, or WhatsApp Cloud API later
              only requires adding live adapter credentials in configuration—without rewriting the
              scheduler, registration workflow, or dashboard.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {(health?.providers.providers || []).map((p) => (
            <div
              key={p.providerName}
              className="rounded-xl border border-[#DDD5C7] bg-[#F7F4EE] p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[#172323]">
                  {p.providerName}
                </span>
                <span className="font-mono-tabular font-semibold text-[#0F5C5C]">
                  mode: {p.mode}
                </span>
              </div>
              <p className="mt-2 text-[#556363]">
                Channel: <span className="font-semibold text-[#172323]">{p.channel.toUpperCase()}</span>{' '}
                · Max SMS segment: <span className="font-mono-tabular">{p.maxRecommendedChars}</span>{' '}
                chars
              </p>
              <p className="mt-2 font-semibold text-[#172323]">Drop-in Production Adapters:</p>
              <ul className="mt-1 space-y-0.5 text-[#556363]">
                {p.futureProductionAdapters.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold text-[#172323]">Config Env Keys for Live Swap:</p>
              <p className="mt-1 font-mono-tabular text-[11px] text-[#556363]">
                {p.requiredEnvKeysForLive.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prototype vs Planned Scope */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
          <div className="flex items-center gap-2 text-[#1F6E4A]">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-[#172323]">
              Included in This Hackathon Prototype
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[#172323]">
            <li>• Volunteer &amp; coordinator JWT login with community role scoping</li>
            <li>• Beneficiary registration with informed consent &amp; under-18 guardian consent</li>
            <li>• 12-week, 28-lesson bilingual message library (English &amp; Hausa, &le; 160 chars)</li>
            <li>• Daily node-cron scheduler plus manual &ldquo;Run Scheduler Now&rdquo; demo control</li>
            <li>• Mock SMS and Mock WhatsApp providers with full MongoDB request/response logs</li>
            <li>• Simulated phone interface (slide-over drawer + dedicated tab)</li>
            <li>• Feedback capture (1 = helpful, 2 = question) &amp; automatic STOP opt-out</li>
            <li>• Community monitoring dashboard</li>
          </ul>
        </div>

        <div className="rounded-xl border border-[#DDD5C7] bg-[#EFEAE0]/60 p-6">
          <div className="flex items-center gap-2 text-[#556363]">
            <Clock className="h-5 w-5 text-[#0F5C5C]" />
            <h2 className="font-display text-lg font-bold text-[#172323]">
              Planned for Post-Hackathon Field Deployment
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[#556363]">
            <li>• Real SMS &amp; WhatsApp delivery via paid production gateways</li>
            <li>• WhatsApp bot self-registration (&ldquo;JOIN&rdquo; keyword) for unvisited areas</li>
            <li>• Expanded local languages &amp; voice messages for low-literacy accessibility</li>
            <li>• Two-way Q&amp;A routing between beneficiaries and health workers</li>
            <li>• Clinic referral links when medical warning signs are reported</li>
            <li>• Offline-friendly volunteer app syncing when connectivity returns</li>
            <li>• Longitudinal impact tracking &amp; local pad-making kit production inventory</li>
            <li>• Qualified health professional &amp; native-speaker review sign-off workflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
