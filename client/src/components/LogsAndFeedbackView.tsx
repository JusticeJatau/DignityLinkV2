import {CheckCircle2, ChevronDown, ChevronUp, MessageSquare, Smartphone} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {apiRequest} from '../lib/api.ts';
import {FeedbackRecord, MessageLogRecord} from '../types/index.ts';

interface LogsAndFeedbackViewProps {
  refreshSignal: number;
  onDataChanged: () => void;
  onOpenPhone: (beneficiaryId: string) => void;
}

export function LogsAndFeedbackView({
  refreshSignal,
  onDataChanged,
  onOpenPhone,
}: LogsAndFeedbackViewProps) {
  const [subTab, setSubTab] = useState<'feedback' | 'logs'>('feedback');

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Provider Logs state
  const [logs, setLogs] = useState<MessageLogRecord[]>([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (resolvedFilter !== 'all') params.set('resolved', resolvedFilter);
      const res = await apiRequest<{feedbacks: FeedbackRecord[]}>(
        `/api/dashboard/feedback?${params.toString()}`,
      );
      setFeedbacks(res.feedbacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback queue.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, resolvedFilter]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (directionFilter !== 'all') params.set('direction', directionFilter);
      const res = await apiRequest<{logs: MessageLogRecord[]}>(
        `/api/dashboard/logs?${params.toString()}`,
      );
      setLogs(res.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider logs.');
    } finally {
      setLoading(false);
    }
  }, [channelFilter, directionFilter]);

  useEffect(() => {
    if (subTab === 'feedback') {
      loadFeedback();
    } else {
      loadLogs();
    }
  }, [subTab, refreshSignal, loadFeedback, loadLogs]);

  const handleResolveFeedback = async (fb: FeedbackRecord) => {
    setResolvingId(fb._id);
    try {
      await apiRequest(`/api/dashboard/feedback/${fb._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resolved: !fb.resolved,
          volunteerNotes: noteDrafts[fb._id] ?? fb.volunteerNotes ?? '',
        }),
      });
      await loadFeedback();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback status.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
            Feedback &amp; Mock Provider Delivery Logs
          </h1>
          <p className="mt-1 text-sm text-[#556363]">
            Review beneficiary replies (1 = helpful, 2 = question, STOP = opt-out) and inspect
            simulated SMS/WhatsApp API payloads.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#DDD5C7] bg-white p-1">
          <button
            type="button"
            onClick={() => setSubTab('feedback')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'feedback'
                ? 'bg-[#0F5C5C] text-white'
                : 'text-[#556363] hover:text-[#172323]'
            }`}
          >
            Beneficiary Feedback
          </button>
          <button
            type="button"
            onClick={() => setSubTab('logs')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'logs'
                ? 'bg-[#0F5C5C] text-white'
                : 'text-[#556363] hover:text-[#172323]'
            }`}
          >
            Provider Request Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] p-3 text-xs text-[#7A321C]">
          {error}
        </div>
      )}

      {subTab === 'feedback' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DDD5C7] bg-white p-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
            >
              <option value="all">All Categories</option>
              <option value="question">Questions (Reply 2)</option>
              <option value="helpful">Helpful (Reply 1)</option>
              <option value="opt_out">Opt-Outs (STOP)</option>
              <option value="other">Other Replies</option>
            </select>

            <select
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
            >
              <option value="all">All Resolution States</option>
              <option value="false">Needs Follow-Up</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-xl border border-[#DDD5C7] bg-white p-6 text-center text-sm text-[#556363]">
                Loading feedback...
              </div>
            )}

            {!loading && feedbacks.length === 0 && (
              <div className="rounded-xl border border-[#DDD5C7] bg-white p-8 text-center text-sm text-[#556363]">
                No feedback entries match your filters. Send a reply from the Simulated Phone to
                test feedback capture.
              </div>
            )}

            {!loading &&
              feedbacks.map((fb) => (
                <div
                  key={fb._id}
                  className="rounded-xl border border-[#DDD5C7] bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-sm font-bold text-[#172323]">
                          {fb.beneficiaryName}
                        </span>
                        <span className="text-[#556363]">·</span>
                        <span className="font-mono-tabular text-[#556363]">{fb.phoneNumber}</span>
                        <span className="text-[#556363]">·</span>
                        <span className="text-[#556363]">{fb.community}</span>
                        <span className="text-[#556363]">·</span>
                        <span className="font-mono-tabular text-[#556363]">
                          {fb.channel.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2.5 text-sm">
                        <MessageSquare className="h-4 w-4 text-[#0F5C5C]" />
                        <span className="font-mono-tabular font-semibold text-[#172323]">
                          Reply &ldquo;{fb.rawReply}&rdquo;
                        </span>
                        <span className="text-[#556363]">—</span>
                        <span
                          className={`text-xs font-semibold ${
                            fb.category === 'question' && !fb.resolved
                              ? 'text-[#B85A3A]'
                              : fb.category === 'helpful'
                                ? 'text-[#1F6E4A]'
                                : 'text-[#556363]'
                          }`}
                        >
                          {fb.category === 'question'
                            ? fb.resolved
                              ? 'Question (Followed Up)'
                              : 'Question (Needs Follow-Up)'
                            : fb.category === 'helpful'
                              ? 'Marked Helpful (1)'
                              : fb.category === 'opt_out'
                                ? 'Opted Out (STOP)'
                                : 'Custom Message'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-[11px] text-[#556363]">
                        {new Date(fb.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenPhone(fb.beneficiaryId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-2.5 py-1.5 text-xs font-medium text-[#0F5C5C] hover:border-[#0F5C5C] whitespace-nowrap"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Open Phone</span>
                      </button>
                    </div>
                  </div>

                  {fb.category === 'question' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#EFEAE0] pt-3">
                      <input
                        type="text"
                        value={noteDrafts[fb._id] ?? fb.volunteerNotes ?? ''}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({...prev, [fb._id]: e.target.value}))
                        }
                        placeholder="Record volunteer follow-up note (optional)..."
                        className="min-w-[220px] flex-1 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-1.5 text-xs text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={resolvingId === fb._id}
                        onClick={() => handleResolveFeedback(fb)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          fb.resolved
                            ? 'border border-[#DDD5C7] bg-white text-[#556363]'
                            : 'bg-[#0F5C5C] text-white hover:bg-[#0B4646]'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {resolvingId === fb._id
                            ? 'Saving...'
                            : fb.resolved
                              ? 'Re-open'
                              : 'Mark Resolved'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DDD5C7] bg-white p-4">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
            >
              <option value="all">All Channels</option>
              <option value="sms">Mock SMS Provider</option>
              <option value="whatsapp">Mock WhatsApp Provider</option>
            </select>

            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
            >
              <option value="all">Outbound &amp; Inbound</option>
              <option value="outbound">Outbound Dispatches</option>
              <option value="inbound">Inbound Replies</option>
            </select>

            <span className="ml-auto font-mono-tabular text-xs text-[#556363]">
              {logs.length} provider records
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DDD5C7] bg-white">
            <div className="divide-y divide-[#EFEAE0]">
              {loading && (
                <p className="p-6 text-center text-sm text-[#556363]">
                  Loading provider delivery logs...
                </p>
              )}

              {!loading && logs.length === 0 && (
                <p className="p-6 text-center text-sm text-[#556363]">
                  No messaging logs recorded yet.
                </p>
              )}

              {!loading &&
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const beneficiaryObj =
                    typeof log.beneficiaryId === 'object' ? log.beneficiaryId : null;
                  return (
                    <div key={log._id} className="p-4 hover:bg-[#F7F4EE]/40">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-[#172323]">
                              {beneficiaryObj?.fullName || log.phoneNumber}
                            </span>
                            <span className="text-[#556363]">·</span>
                            <span className="font-mono-tabular text-[#0F5C5C]">
                              {log.providerName}
                            </span>
                            <span className="text-[#556363]">·</span>
                            <span className="font-mono-tabular text-[#556363]">
                              {log.direction.toUpperCase()} ({log.status})
                            </span>
                            <span className="text-[#556363]">·</span>
                            <span className="font-mono-tabular text-[11px] text-[#556363]">
                              {log.externalMessageId}
                            </span>
                          </div>
                          <p className="text-sm text-[#172323]">{log.body}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono-tabular text-[11px] text-[#556363]">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="inline-flex items-center gap-1 rounded border border-[#DDD5C7] bg-[#F7F4EE] px-2.5 py-1 text-xs font-medium text-[#172323] hover:border-[#0F5C5C] whitespace-nowrap"
                          >
                            <span>Payload</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] p-3 lg:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold text-[#556363]">
                              Simulated Request Payload
                            </p>
                            <pre className="mt-1 overflow-x-auto rounded bg-white p-2.5 font-mono-tabular text-[11px] text-[#172323]">
                              {JSON.stringify(log.providerRequestPayload, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-[#556363]">
                              Simulated Provider Outcome
                            </p>
                            <pre className="mt-1 overflow-x-auto rounded bg-white p-2.5 font-mono-tabular text-[11px] text-[#172323]">
                              {JSON.stringify(log.providerResponsePayload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
