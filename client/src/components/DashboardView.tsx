import {Calendar, CheckCircle2, HelpCircle, Play, Users} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext.tsx';
import {apiRequest} from '../lib/api.ts';
import {DashboardStatsResponse, SchedulerRunRecord} from '../types/index.ts';

interface DashboardViewProps {
  refreshSignal: number;
  onSchedulerExecuted: () => void;
  onOpenPhone: (beneficiaryId?: string) => void;
  onNavigateTab: (tab: 'beneficiaries' | 'messages' | 'logs' | 'phone') => void;
}

export function DashboardView({
  refreshSignal,
  onSchedulerExecuted,
  onOpenPhone,
  onNavigateTab,
}: DashboardViewProps) {
  const {user} = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schedulerMode, setSchedulerMode] = useState<'next_due' | 'calendar_today' | 'override'>(
    'next_due',
  );
  const [overrideWeek, setOverrideWeek] = useState(1);
  const [overrideSlot, setOverrideSlot] = useState(1);
  const [runningScheduler, setRunningScheduler] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<{
    run: SchedulerRunRecord;
    sentDetails: Array<{
      beneficiaryId: string;
      fullName: string;
      channel: string;
      language: string;
      weekNumber: number;
      sequenceNumber: number;
      externalMessageId: string;
    }>;
  } | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<DashboardStatsResponse>('/api/dashboard/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshSignal]);

  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    setError(null);
    try {
      const body =
        schedulerMode === 'override'
          ? {mode: 'override', weekNumber: overrideWeek, slotInWeek: overrideSlot}
          : {mode: schedulerMode};
      const result = await apiRequest<{
        run: SchedulerRunRecord;
        sentDetails: Array<{
          beneficiaryId: string;
          fullName: string;
          channel: string;
          language: string;
          weekNumber: number;
          sequenceNumber: number;
          externalMessageId: string;
        }>;
      }>('/api/scheduler/run', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setLastRunResult(result);
      await loadStats();
      onSchedulerExecuted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scheduler run failed.');
    } finally {
      setRunningScheduler(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[#DDD5C7] bg-white" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-xl border border-[#DDD5C7] bg-white" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-xl border border-[#E5B8A8] bg-[#FDF4F0] p-6 text-sm text-[#7A321C]">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const {summary} = stats;
  const maxSlotsForOverrideWeek = overrideWeek <= 4 ? 3 : 2;

  return (
    <div className="space-y-6">
      {/* Scope Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
            Program Overview &amp; Scheduler
          </h1>
          <p className="mt-1 text-sm text-[#556363]">
            {user?.role === 'coordinator'
              ? 'Coordinator view · Monitoring all communities and provider delivery logs'
              : `Volunteer view · Scoped to ${user?.assignedCommunity}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('beneficiaries')}
            className="rounded-lg border border-[#DDD5C7] bg-white px-3.5 py-2 text-xs font-semibold text-[#172323] transition-colors hover:border-[#0F5C5C] whitespace-nowrap shrink-0"
          >
            Register Beneficiary
          </button>
          <button
            type="button"
            onClick={() => onOpenPhone()}
            className="rounded-lg bg-[#0F5C5C] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
          >
            Open Simulated Phone
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#DDD5C7] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#556363]">
            <span>Registered Beneficiaries</span>
            <Users className="h-4 w-4 text-[#0F5C5C]" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#172323]">
            {summary.totalBeneficiaries}
          </p>
          <p className="mt-1.5 text-xs text-[#556363]">
            <span className="font-semibold text-[#1F6E4A] tabular-nums">
              {summary.activeBeneficiaries} active
            </span>{' '}
            ·{' '}
            <span className="tabular-nums">{summary.minorBeneficiaries} minors (guardian consent)</span>
          </p>
        </div>

        <div className="rounded-xl border border-[#DDD5C7] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#556363]">
            <span>Messages Dispatched</span>
            <Calendar className="h-4 w-4 text-[#0F5C5C]" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#172323]">
            {summary.totalOutboundMessages}
          </p>
          <p className="mt-1.5 text-xs text-[#556363]">
            <span className="tabular-nums">{summary.scheduledLessonsSent} scheduled lessons</span> ·{' '}
            <span className="tabular-nums">
              {stats.channelBreakdown.sms} SMS / {stats.channelBreakdown.whatsapp} WA
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-[#DDD5C7] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#556363]">
            <span>Helpful Feedback (1)</span>
            <CheckCircle2 className="h-4 w-4 text-[#1F6E4A]" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#172323]">
            {summary.helpfulCount}
          </p>
          <p className="mt-1.5 text-xs text-[#556363]">
            Out of <span className="tabular-nums">{summary.totalFeedback} total replies</span>{' '}
            captured
          </p>
        </div>

        <div className="rounded-xl border border-[#DDD5C7] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#556363]">
            <span>Open Questions (2) &amp; Opt-Outs</span>
            <HelpCircle className="h-4 w-4 text-[#B85A3A]" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#172323]">
            {summary.unresolvedQuestionsCount}
          </p>
          <p className="mt-1.5 text-xs text-[#556363]">
            <span className="font-semibold text-[#B85A3A] tabular-nums">
              {summary.optedOutBeneficiaries} opted out
            </span>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => onNavigateTab('logs')}
              className="font-medium text-[#0F5C5C] hover:underline"
            >
              Review queue
            </button>
          </p>
        </div>
      </div>

      {/* Scheduler Control & Demo Runner */}
      <div className="rounded-xl border border-[#DDD5C7] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#EFEAE0] pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-lg font-bold text-[#172323]">
              Daily Education Scheduler (node-cron + Demo Trigger)
            </h2>
            <p className="mt-1 text-xs text-[#556363]">
              Evaluates active consented beneficiaries, skips opted-out contacts, matches week &amp;
              language templates, and dispatches through Mock SMS / Mock WhatsApp providers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunScheduler}
            disabled={runningScheduler}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F5C5C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Play className="h-4 w-4" />
            <span>{runningScheduler ? 'Running Scheduler...' : 'Run Scheduler Now'}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-7">
            <p className="text-xs font-semibold text-[#172323]">Execution Mode</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSchedulerMode('next_due')}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  schedulerMode === 'next_due'
                    ? 'border-[#0F5C5C] bg-[#0F5C5C]/10 text-[#0F5C5C]'
                    : 'border-[#DDD5C7] bg-[#F7F4EE] text-[#556363] hover:text-[#172323]'
                }`}
              >
                Next Unsent Lesson (Demo)
              </button>
              <button
                type="button"
                onClick={() => setSchedulerMode('calendar_today')}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  schedulerMode === 'calendar_today'
                    ? 'border-[#0F5C5C] bg-[#0F5C5C]/10 text-[#0F5C5C]'
                    : 'border-[#DDD5C7] bg-[#F7F4EE] text-[#556363] hover:text-[#172323]'
                }`}
              >
                Today&apos;s Calendar Rule (M/W/F or T/F)
              </button>
              <button
                type="button"
                onClick={() => setSchedulerMode('override')}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  schedulerMode === 'override'
                    ? 'border-[#0F5C5C] bg-[#0F5C5C]/10 text-[#0F5C5C]'
                    : 'border-[#DDD5C7] bg-[#F7F4EE] text-[#556363] hover:text-[#172323]'
                }`}
              >
                Target Specific Week &amp; Slot
              </button>
            </div>

            {schedulerMode === 'override' && (
              <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] p-3 text-xs">
                <label className="flex items-center gap-2">
                  <span className="font-medium text-[#172323]">Week:</span>
                  <select
                    value={overrideWeek}
                    onChange={(e) => {
                      const wk = Number(e.target.value);
                      setOverrideWeek(wk);
                      if (wk > 4 && overrideSlot > 2) setOverrideSlot(2);
                    }}
                    className="rounded border border-[#DDD5C7] bg-white px-2 py-1 text-[#172323]"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map((wk) => (
                      <option key={wk} value={wk}>
                        Week {wk}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2">
                  <span className="font-medium text-[#172323]">Message Slot:</span>
                  <select
                    value={Math.min(overrideSlot, maxSlotsForOverrideWeek)}
                    onChange={(e) => setOverrideSlot(Number(e.target.value))}
                    className="rounded border border-[#DDD5C7] bg-white px-2 py-1 text-[#172323]"
                  >
                    {Array.from({length: maxSlotsForOverrideWeek}, (_, i) => i + 1).map((slot) => (
                      <option key={slot} value={slot}>
                        Message {slot} of {maxSlotsForOverrideWeek}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] p-4 text-xs lg:col-span-5">
            <p className="font-semibold text-[#172323]">Configured Provider &amp; Cron State</p>
            <div className="mt-2 space-y-1 text-[#556363]">
              <p>
                Provider Mode:{' '}
                <span className="font-mono-tabular font-semibold text-[#172323]">
                  {stats.providerArchitecture.configuredMode}
                </span>{' '}
                (mock-sms, mock-whatsapp)
              </p>
              <p>
                Daily Cron:{' '}
                <span className="font-mono-tabular font-semibold text-[#172323]">0 8 * * *</span>{' '}
                (08:00 AM daily)
              </p>
              <p>
                Language Split:{' '}
                <span className="font-mono-tabular text-[#172323]">
                  {stats.languageBreakdown.en} EN · {stats.languageBreakdown.ha} HA
                </span>
              </p>
            </div>
          </div>
        </div>

        {lastRunResult && (
          <div className="mt-4 rounded-lg border border-[#B8DEC9] bg-[#F2F9F5] p-4 text-xs text-[#172323]">
            <p className="font-semibold text-[#1F6E4A]">
              Scheduler run completed · {lastRunResult.run.programDayLabel}
            </p>
            <p className="mt-1 text-[#556363]">{lastRunResult.run.summaryNotes}</p>
            {lastRunResult.sentDetails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {lastRunResult.sentDetails.map((d) => (
                  <button
                    key={d.externalMessageId}
                    type="button"
                    onClick={() => onOpenPhone(d.beneficiaryId)}
                    className="rounded-md border border-[#B8DEC9] bg-white px-2.5 py-1.5 text-left transition-colors hover:border-[#0F5C5C]"
                  >
                    <span className="font-semibold text-[#172323]">{d.fullName}</span>
                    <span className="ml-1.5 font-mono-tabular text-[11px] text-[#556363]">
                      Wk {d.weekNumber} #{d.sequenceNumber} ({d.channel.toUpperCase()}) → View Phone
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Monitoring Table */}
      <div className="rounded-xl border border-[#DDD5C7] bg-white">
        <div className="flex items-center justify-between border-b border-[#EFEAE0] px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#172323]">
              Monitoring by Community
            </h2>
            <p className="text-xs text-[#556363]">
              Registrations, messages sent, and feedback counts per IDP camp or settlement
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EFEAE0] text-xs font-semibold text-[#556363]">
                <th className="px-6 py-3">Community</th>
                <th className="px-4 py-3 text-right">Registered</th>
                <th className="px-4 py-3 text-right">Active</th>
                <th className="px-4 py-3 text-right">Opted Out</th>
                <th className="px-4 py-3 text-right">Messages Sent</th>
                <th className="px-4 py-3 text-right">Helpful (1)</th>
                <th className="px-6 py-3 text-right">Open Questions (2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {stats.communityBreakdown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#556363]">
                    No community registrations yet. Register a beneficiary to begin tracking.
                  </td>
                </tr>
              )}
              {stats.communityBreakdown.map((row) => (
                <tr key={row.community} className="hover:bg-[#F7F4EE]/60">
                  <td className="px-6 py-3.5 font-medium text-[#172323]">{row.community}</td>
                  <td className="px-4 py-3.5 text-right font-mono-tabular">{row.registrations}</td>
                  <td className="px-4 py-3.5 text-right font-mono-tabular text-[#1F6E4A]">
                    {row.active}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono-tabular text-[#B85A3A]">
                    {row.optedOut}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono-tabular">{row.messagesSent}</td>
                  <td className="px-4 py-3.5 text-right font-mono-tabular">{row.helpfulFeedback}</td>
                  <td className="px-6 py-3.5 text-right font-mono-tabular font-semibold text-[#B85A3A]">
                    {row.openQuestions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
