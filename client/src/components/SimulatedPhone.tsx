import {CheckCheck, MessageSquare, RefreshCw, Send, Signal, Smartphone} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {apiRequest} from '../lib/api.ts';
import {BeneficiaryRecord, MessageLogRecord} from '../types/index.ts';

interface SimulatedPhoneProps {
  selectedBeneficiaryId: string | null;
  onSelectBeneficiaryId: (id: string) => void;
  refreshSignal: number;
  onActivityChange?: () => void;
  compact?: boolean;
}

export function SimulatedPhone({
  selectedBeneficiaryId,
  onSelectBeneficiaryId,
  refreshSignal,
  onActivityChange,
  compact = false,
}: SimulatedPhoneProps) {
  const [contacts, setContacts] = useState<BeneficiaryRecord[]>([]);
  const [activeBeneficiary, setActiveBeneficiary] = useState<BeneficiaryRecord | null>(null);
  const [messages, setMessages] = useState<MessageLogRecord[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const res = await apiRequest<{beneficiaries: BeneficiaryRecord[]}>('/api/phone/beneficiaries');
      setContacts(res.beneficiaries);
      if (!selectedBeneficiaryId && res.beneficiaries.length > 0) {
        onSelectBeneficiaryId(res.beneficiaries[0]._id);
      }
    } catch {
      // handled gracefully
    } finally {
      setLoadingContacts(false);
    }
  }, [selectedBeneficiaryId, onSelectBeneficiaryId]);

  const loadInbox = useCallback(async (id: string) => {
    setLoadingInbox(true);
    try {
      const res = await apiRequest<{
        beneficiary: BeneficiaryRecord;
        messages: MessageLogRecord[];
      }>(`/api/phone/inbox/${id}`);
      setActiveBeneficiary(res.beneficiary);
      setMessages(res.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts, refreshSignal]);

  useEffect(() => {
    if (selectedBeneficiaryId) {
      loadInbox(selectedBeneficiaryId);
    }
  }, [selectedBeneficiaryId, refreshSignal, loadInbox]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages.length]);

  const sendReply = async (text: string) => {
    if (!selectedBeneficiaryId || !text.trim() || sendingReply) return;
    setSendingReply(true);
    setStatusNotice(null);
    try {
      const res = await apiRequest<{
        beneficiary: BeneficiaryRecord;
        parsed: {code: string; category: string; isOptOut: boolean};
      }>('/api/phone/reply', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: selectedBeneficiaryId,
          rawReply: text.trim(),
        }),
      });
      setReplyText('');
      if (res.parsed.isOptOut) {
        setStatusNotice('STOP processed: Beneficiary is now opted out of future scheduler runs.');
      } else if (res.parsed.code === '2') {
        setStatusNotice('Reply 2 logged: Flagged as an open question on the Volunteer Dashboard.');
      } else if (res.parsed.code === '1') {
        setStatusNotice('Reply 1 logged: Recorded as helpful feedback.');
      } else {
        setStatusNotice('Reply logged via mock inbound webhook.');
      }
      await loadInbox(selectedBeneficiaryId);
      await loadContacts();
      onActivityChange?.();
    } catch (err) {
      setStatusNotice(err instanceof Error ? err.message : 'Failed to send simulated reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendReply(replyText);
  };

  const isWhatsApp = activeBeneficiary?.preferredChannel === 'whatsapp';

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'gap-5 lg:flex-row lg:items-start'}`}>
      {/* Beneficiary Switcher & Handset Controls */}
      <div className={compact ? 'mb-3 space-y-2.5' : 'w-full space-y-4 lg:w-80 lg:shrink-0'}>
        <div className="rounded-xl border border-[#DDD5C7] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={compact ? 'drawer-phone-select' : 'tab-phone-select'}
              className="text-xs font-semibold text-[#172323]"
            >
              Simulated Beneficiary Handset
            </label>
            <button
              type="button"
              onClick={() => selectedBeneficiaryId && loadInbox(selectedBeneficiaryId)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F5C5C] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <select
            id={compact ? 'drawer-phone-select' : 'tab-phone-select'}
            value={selectedBeneficiaryId || ''}
            onChange={(e) => {
              setStatusNotice(null);
              onSelectBeneficiaryId(e.target.value);
            }}
            disabled={loadingContacts || contacts.length === 0}
            className="mt-2 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-sm text-[#172323] focus:border-[#0F5C5C] focus:outline-none"
          >
            {contacts.length === 0 && <option value="">No beneficiaries found</option>}
            {contacts.map((c) => (
              <option key={c._id} value={c._id}>
                {c.fullName} ({c.preferredChannel.toUpperCase()} · {c.preferredLanguage.toUpperCase()})
                {c.status === 'opted_out' ? ' [Opted Out]' : ''}
              </option>
            ))}
          </select>

          {activeBeneficiary && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#556363]">
              <span className="font-mono-tabular text-[#172323]">{activeBeneficiary.phoneNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{activeBeneficiary.community}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  activeBeneficiary.status === 'opted_out'
                    ? 'font-semibold text-[#B85A3A]'
                    : 'font-semibold text-[#1F6E4A]'
                }
              >
                {activeBeneficiary.status === 'opted_out' ? 'Opted Out' : 'Active'}
              </span>
            </div>
          )}
        </div>

        {!compact && (
          <div className="rounded-xl border border-[#DDD5C7] bg-white p-4 text-xs leading-relaxed text-[#556363]">
            <p className="font-semibold text-[#172323]">How to demonstrate end-to-end flow</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4">
              <li>Select any beneficiary above (SMS feature phone or WhatsApp view).</li>
              <li>Click &ldquo;Run Scheduler Now&rdquo; in the top bar or Dashboard to watch a lesson arrive.</li>
              <li>
                Send <span className="font-mono-tabular font-semibold text-[#172323]">1</span> (Helpful),{' '}
                <span className="font-mono-tabular font-semibold text-[#172323]">2</span> (Question), or{' '}
                <span className="font-mono-tabular font-semibold text-[#172323]">STOP</span> to test live
                feedback capture and opt-out protection.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Physical / Mobile Handset Frame */}
      <div className={`mx-auto w-full ${compact ? 'flex-1 min-h-0 flex flex-col' : 'max-w-md'}`}>
        <div
          className={`flex flex-col overflow-hidden rounded-[26px] border-4 border-[#1F2D2D] bg-[#1F2D2D] shadow-lg ${
            compact ? 'h-full min-h-[430px]' : 'h-[610px]'
          }`}
        >
          {/* Phone Status Bar */}
          <div className="flex items-center justify-between bg-[#152020] px-5 py-2 text-[11px] font-mono-tabular text-[#D9E0DE]">
            <div className="flex items-center gap-1.5">
              <Signal className="h-3.5 w-3.5" />
              <span>{isWhatsApp ? '3G / Mobile Data' : '2G GSM'}</span>
            </div>
            <span>{isWhatsApp ? 'WhatsApp' : 'SMS Inbox'}</span>
          </div>

          {/* App Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 ${
              isWhatsApp
                ? 'bg-[#0F5C5C] text-white'
                : 'border-b border-[#D0D7D5] bg-[#E8ECEA] text-[#172323]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isWhatsApp ? 'bg-white/15 text-white' : 'bg-[#0F5C5C] text-white'
                }`}
              >
                {isWhatsApp ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">DignityLink</p>
                <p
                  className={`text-[11px] ${
                    isWhatsApp ? 'text-white/80' : 'text-[#556363]'
                  }`}
                >
                  {isWhatsApp ? 'Mock WhatsApp Business' : 'Mock SMS · Sender ID: DignityLink'}
                </p>
              </div>
            </div>
            <span
              className={`font-mono-tabular text-[11px] ${
                isWhatsApp ? 'text-white/85' : 'text-[#556363]'
              }`}
            >
              {activeBeneficiary?.preferredLanguage === 'ha' ? 'HA' : 'EN'}
            </span>
          </div>

          {/* Thread Canvas */}
          <div
            className={`flex-1 space-y-3 overflow-y-auto p-4 ${
              isWhatsApp ? 'bg-[#ECE5DD]' : 'bg-[#F4F6F5]'
            }`}
          >
            {loadingInbox && messages.length === 0 && (
              <p className="py-8 text-center text-xs text-[#556363]">Loading handset messages...</p>
            )}

            {!loadingInbox && messages.length === 0 && (
              <div className="rounded-lg border border-[#DDD5C7] bg-white p-4 text-center text-xs text-[#556363]">
                No messages delivered to this handset yet. Run the scheduler or register a new
                beneficiary to receive messages.
              </div>
            )}

            {messages.map((msg) => {
              const isInboundFromBeneficiary = msg.direction === 'inbound';
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${
                    isInboundFromBeneficiary ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-xs ${
                      isInboundFromBeneficiary
                        ? isWhatsApp
                          ? 'bg-[#D9FDD3] text-[#172323]'
                          : 'bg-[#0F5C5C] text-white'
                        : 'border border-[#DDD5C7] bg-white text-[#172323]'
                    }`}
                  >
                    {msg.weekNumber && msg.sequenceNumber && !isInboundFromBeneficiary && (
                      <p className="mb-1 font-mono-tabular text-[10px] font-semibold text-[#0F5C5C]">
                        Week {msg.weekNumber} · Lesson {msg.sequenceNumber}/28
                      </p>
                    )}
                    <p>{msg.body}</p>
                    <div
                      className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono-tabular text-[10px] ${
                        isInboundFromBeneficiary && !isWhatsApp
                          ? 'text-white/75'
                          : 'text-[#556363]'
                      }`}
                    >
                      <span>{msg.body.length} ch</span>
                      <span>·</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!isInboundFromBeneficiary && (
                        <CheckCheck className="h-3 w-3 text-[#0F5C5C]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </div>

          {/* Quick Reply Bar + Composer */}
          <div className="border-t border-[#DDD5C7] bg-white p-3">
            {statusNotice && (
              <p className="mb-2 rounded-md bg-[#F7F4EE] px-2.5 py-1.5 text-[11px] font-medium text-[#0F5C5C]">
                {statusNotice}
              </p>
            )}

            <div className="mb-2 flex items-center gap-1.5">
              <button
                type="button"
                disabled={!selectedBeneficiaryId || sendingReply}
                onClick={() => sendReply('1')}
                className="flex-1 rounded-md border border-[#DDD5C7] bg-[#F7F4EE] px-2 py-1.5 text-xs font-semibold text-[#1F6E4A] transition-colors hover:border-[#1F6E4A] disabled:opacity-50 whitespace-nowrap"
              >
                1 · Helpful
              </button>
              <button
                type="button"
                disabled={!selectedBeneficiaryId || sendingReply}
                onClick={() => sendReply('2')}
                className="flex-1 rounded-md border border-[#DDD5C7] bg-[#F7F4EE] px-2 py-1.5 text-xs font-semibold text-[#0F5C5C] transition-colors hover:border-[#0F5C5C] disabled:opacity-50 whitespace-nowrap"
              >
                2 · Question
              </button>
              <button
                type="button"
                disabled={!selectedBeneficiaryId || sendingReply}
                onClick={() => sendReply('STOP')}
                className="flex-1 rounded-md border border-[#E5B8A8] bg-[#FDF4F0] px-2 py-1.5 text-xs font-semibold text-[#B85A3A] transition-colors hover:border-[#B85A3A] disabled:opacity-50 whitespace-nowrap"
              >
                STOP
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type 1, 2, STOP or message..."
                disabled={!selectedBeneficiaryId || sendingReply}
                className="min-w-0 flex-1 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs text-[#172323] focus:border-[#0F5C5C] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!selectedBeneficiaryId || !replyText.trim() || sendingReply}
                aria-label="Send simulated reply"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F5C5C] text-white transition-colors hover:bg-[#0B4646] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
