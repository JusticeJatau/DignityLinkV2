import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {useState} from 'react';
import {SignInModal} from './SignInModal.tsx';

export function ProgramOverviewPage() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [kitImgError, setKitImgError] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#172323]">
      {/* Strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[#DDD5C7] bg-[#F7F4EE]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#172323] whitespace-nowrap shrink-0"
          >
            DignityLink
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#556363]">
            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#172323] whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#message-plan"
              className="transition-colors hover:text-[#172323] whitespace-nowrap shrink-0"
            >
              Message Plan
            </a>
            <a
              href="#safeguards"
              className="transition-colors hover:text-[#172323] whitespace-nowrap shrink-0"
            >
              Safeguards
            </a>
            <a
              href="#roadmap"
              className="transition-colors hover:text-[#172323] whitespace-nowrap shrink-0"
            >
              Roadmap
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="rounded-lg bg-[#0F5C5C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split */}
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-12 lg:pt-16 lg:pb-14">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-sm font-medium text-[#0F5C5C]">
                  InnovateHER Hackathon · Women&apos;s Health &amp; Wellness
                </p>
                <h1
                  className="mt-3 font-display font-bold tracking-tight text-[#172323]"
                  style={{fontSize: 'clamp(2.25rem, 3.8vw, 3.4rem)', lineHeight: 1.1, textWrap: 'balance'}}
                >
                  Menstrual hygiene education delivered over basic SMS and WhatsApp.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-[#556363]">
                  DignityLink equips community volunteers distributing reusable menstrual hygiene
                  kits in IDP camps and rural communities to record informed consent, schedule 12
                  weeks of short English and Hausa guidance, and respond to beneficiary questions.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0F5C5C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
                >
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center rounded-lg border border-[#DDD5C7] bg-white px-5 py-3 text-sm font-medium text-[#172323] transition-colors hover:border-[#0F5C5C] whitespace-nowrap shrink-0"
                >
                  See Program Workflow
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[300px] overflow-hidden rounded-xl border border-[#DDD5C7] bg-[#EFEAE0]">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_community_distribution_1795136922613.jpg"
                    alt="Community health volunteers organizing reusable hygiene kits during community distribution"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
                    <Smartphone className="h-10 w-10 text-[#0F5C5C]" />
                    <p className="mt-3 font-display text-base font-semibold text-[#172323]">
                      Community Kit Distribution &amp; SMS Education
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-[#556363]">
                      Designed for basic feature phones and low-bandwidth rural networks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-column Program Facts Strip below Hero */}
          <div className="mt-10 grid grid-cols-1 divide-y divide-[#DDD5C7] rounded-xl border border-[#DDD5C7] bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <div className="p-5">
              <p className="text-xs font-medium text-[#556363]">Education Schedule</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#172323]">
                12 Weeks · 28 Messages
              </p>
              <p className="mt-1 text-xs text-[#556363]">
                3 per week (Wks 1–4), then 2 per week (Wks 5–12)
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-[#556363]">Low-Bandwidth Fit</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#172323]">
                &le; 160 Characters
              </p>
              <p className="mt-1 text-xs text-[#556363]">
                Every lesson fits cleanly inside one standard SMS
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-[#556363]">Prototype Languages</p>
              <p className="mt-1 font-display text-xl font-bold text-[#172323]">
                English &amp; Hausa
              </p>
              <p className="mt-1 text-xs text-[#556363]">
                Culturally grounded guidance with more languages planned
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-[#556363]">Program Target</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#172323]">
                2,500 Beneficiaries
              </p>
              <p className="mt-1 text-xs text-[#556363]">
                Across 3 LGAs in IDP camps and rural settlements
              </p>
            </div>
          </div>
        </section>

        {/* Three-Part Program Solution & Workflow */}
        <section id="how-it-works" className="border-t border-[#DDD5C7] bg-[#EFEAE0]/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-sm font-medium text-[#0F5C5C]">Three-Part Community Model</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172323]">
                  Combining physical hygiene kits with ongoing guidance.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#556363]">
                  Most digital health tools assume smartphones and steady mobile data. DignityLink
                  meets women and girls on the basic phones they already use, pairing durable
                  reusable pads with trusted community volunteers.
                </p>
                <div className="mt-6 overflow-hidden rounded-xl border border-[#DDD5C7] bg-white">
                  {!kitImgError ? (
                    <img
                      src="/src/assets/images/kit_reusable_pads_1795136922929.jpg"
                      alt="Reusable menstrual hygiene kit with three cloth pads, mild soap, and waterproof storage pouch"
                      referrerPolicy="no-referrer"
                      onError={() => setKitImgError(true)}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-sm text-[#556363]">
                      Reusable Hygiene Kit: 2–3 cloth pads, mild soap, waterproof pouch
                    </div>
                  )}
                  <div className="border-t border-[#EFEAE0] px-4 py-3 text-xs text-[#556363]">
                    Standard kit contents · 2–3 reusable cloth pads · Mild soap · Waterproof storage
                    pouch
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-7">
                <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
                  <p className="font-mono-tabular text-xs font-semibold text-[#0F5C5C]">
                    01. Distribution &amp; Informed Consent
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-[#172323]">
                    Plain-language briefing and guardian verification
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#556363]">
                    When handing out a reusable kit, a trained volunteer explains message frequency
                    and opt-out rights in simple language. Registration is blocked until consent is
                    recorded—and for girls under 18, parent or guardian consent is mandatory.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
                  <p className="font-mono-tabular text-xs font-semibold text-[#0F5C5C]">
                    02. Scheduled Bilingual Delivery
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-[#172323]">
                    Daily node-cron engine &amp; swappable provider layer
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#556363]">
                    A daily scheduler selects the exact lesson for each active beneficiary&apos;s
                    week and preferred language (`en` or `ha`) and dispatches it through a unified
                    provider interface. In this prototype, mock SMS and WhatsApp providers log every
                    request and simulated gateway response in MongoDB.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
                  <p className="font-mono-tabular text-xs font-semibold text-[#0F5C5C]">
                    03. Two-Way Feedback &amp; Volunteer Monitoring
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-[#172323]">
                    Numeric replies (1 / 2) and instant STOP opt-out
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#556363]">
                    Biweekly check-ins invite beneficiaries to reply <span className="font-mono-tabular font-semibold text-[#172323]">1</span> (Helpful),{' '}
                    <span className="font-mono-tabular font-semibold text-[#172323]">2</span> (I have a
                    question), or <span className="font-mono-tabular font-semibold text-[#172323]">STOP</span> to
                    unsubscribe immediately. Volunteers resolve questions and coordinators track
                    community progress on the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12-Week Message Plan */}
        <section id="message-plan" className="border-t border-[#DDD5C7] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#0F5C5C]">12-Week Curriculum</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172323]">
                28 short messages across six practical themes.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#556363]">
                Weeks 1–4 deliver three messages weekly (Monday, Wednesday, Friday) while habits
                form. Weeks 5–12 transition to two messages weekly (Tuesday, Friday) with biweekly
                feedback prompts.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Reusable Pad Care',
                  detail: 'Changing every 4–6 hours, cool-water rinsing, mild soap washing, full sunlight drying, and clean dry pouch storage.',
                },
                {
                  title: 'Personal Hygiene',
                  detail: 'Handwashing before and after changing, gentle front-to-back outer washing with clean water, and breathable underwear care.',
                },
                {
                  title: 'Health & Warning Signs',
                  detail: 'Recognizing fever, unusually heavy bleeding, or abnormal discharge and knowing when to seek a local health worker.',
                },
                {
                  title: 'Myths & Dignity',
                  detail: 'Reinforcing that menstruation is natural and healthy, countering food or water myths, and supporting school and work attendance.',
                },
                {
                  title: 'Understanding Your Body',
                  detail: 'Typical 21–35 day cycle ranges, simple tracking on paper or calendar, and safe comfort tips for mild cramps.',
                },
                {
                  title: 'Biweekly Feedback Prompts',
                  detail: 'Every two weeks (Weeks 2, 4, 6, 8, 10, 12), beneficiaries reply 1 for helpful, 2 for a volunteer follow-up, or STOP to end.',
                },
              ].map((theme) => (
                <div
                  key={theme.title}
                  className="rounded-xl border border-[#DDD5C7] bg-white p-5"
                >
                  <h3 className="font-display text-base font-semibold text-[#172323]">
                    {theme.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#556363]">{theme.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consent & Data Protection */}
        <section id="safeguards" className="border-t border-[#DDD5C7] bg-[#EFEAE0]/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#0F5C5C]">Consent &amp; Data Protection</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172323]">
                Privacy and consent built into every registration.
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: CheckCircle2,
                  title: 'Mandatory Informed Consent',
                  text: 'System blocks registration until plain-language explanation and explicit consent are recorded with volunteer ID and timestamp.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Under-18 Guardian Consent',
                  text: 'For girls under 18, parent or guardian name, relationship, and confirmation are enforced before enrollment.',
                },
                {
                  icon: Lock,
                  title: 'Data Minimization & RBAC',
                  text: 'Collects only name, phone number, language, community, and consent. No medical records stored; JWT scopes access by role.',
                },
                {
                  icon: MessageSquare,
                  title: 'Discreet Message Copy',
                  text: 'Messages avoid sensitive personal identifiers so beneficiaries stay protected if phones are shared at home.',
                },
                {
                  icon: Clock,
                  title: 'Instant STOP Opt-Out',
                  text: 'Replying STOP immediately marks the beneficiary opted out so future scheduler runs automatically skip her number.',
                },
                {
                  icon: Smartphone,
                  title: 'No Third-Party Sharing',
                  text: 'Phone numbers stay private within the program and are only passed to the configured delivery provider.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[#DDD5C7] bg-white p-5"
                  >
                    <Icon className="h-5 w-5 text-[#0F5C5C]" />
                    <h3 className="mt-3 font-display text-base font-semibold text-[#172323]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#556363]">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Prototype Scope vs Planned for Later */}
        <section id="roadmap" className="border-t border-[#DDD5C7] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#0F5C5C]">Transparency &amp; Scope</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172323]">
                Included in this prototype vs. planned for field deployment.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#556363]">
                This hackathon prototype implements the full MERN workflow using simulated SMS and
                WhatsApp providers. Before live deployment, health content undergoes clinical review,
                translations are verified by native speakers, and live messaging APIs are enabled via
                configuration.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
                <h3 className="font-display text-lg font-bold text-[#0F5C5C]">
                  Included in Hackathon Prototype
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[#172323]">
                  <li>• Volunteer &amp; Coordinator JWT authentication with role scoping</li>
                  <li>• Beneficiary registration with consent &amp; under-18 guardian verification</li>
                  <li>• 12-week, 28-message English &amp; Hausa library (all &le; 160 chars)</li>
                  <li>• Daily node-cron scheduler plus manual &ldquo;Run Scheduler Now&rdquo; demo control</li>
                  <li>• Shared provider interface with Mock SMS &amp; Mock WhatsApp request logging</li>
                  <li>• Interactive simulated handset (drawer &amp; tab) with 1, 2, and STOP replies</li>
                  <li>• Community dashboard tracking registrations, deliveries, and open questions</li>
                </ul>
              </div>

              <div className="rounded-xl border border-[#DDD5C7] bg-[#EFEAE0]/50 p-6">
                <h3 className="font-display text-lg font-bold text-[#172323]">
                  Planned for Next Phase
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[#556363]">
                  <li>• Live SMS &amp; WhatsApp delivery via Africa&apos;s Talking, Twilio, or WhatsApp Cloud API</li>
                  <li>• WhatsApp bot self-registration via &ldquo;JOIN&rdquo; keyword</li>
                  <li>• Additional local languages &amp; voice messages for low-literacy users</li>
                  <li>• Two-way Q&amp;A between beneficiaries and qualified health workers</li>
                  <li>• Automated clinic referral links when warning signs are reported</li>
                  <li>• Offline-first volunteer registration app with background sync</li>
                  <li>• Pad-making group production tracking &amp; longitudinal impact analytics</li>
                  <li>• Clinical &amp; native-speaker review sign-off workflow</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DDD5C7] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-bold text-[#172323]">DignityLink</p>
            <p className="mt-1 text-xs text-[#556363]">
              InnovateHER Hackathon (Girls Who Code) · Women&apos;s Health &amp; Wellness · Submitted
              by Justice Jatau
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="rounded-lg bg-[#0F5C5C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
          >
            Sign In to Demo
          </button>
        </div>
      </footer>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
