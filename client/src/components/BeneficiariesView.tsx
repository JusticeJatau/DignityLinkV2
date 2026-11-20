import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  ShieldAlert,
  Smartphone,
  UserCheck,
  X,
} from 'lucide-react';
import React, {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext.tsx';
import {apiRequest} from '../lib/api.ts';
import {
  BeneficiaryRecord,
  FeedbackRecord,
  LanguageCode,
  MessageLogRecord,
  MessagingChannel,
} from '../types/index.ts';

interface BeneficiariesViewProps {
  refreshSignal: number;
  onDataChanged: () => void;
  onOpenPhone: (beneficiaryId: string) => void;
}

const COMMUNITY_OPTIONS = [
  'Bakassi IDP Camp',
  'Muna Garage Settlement',
  'Gwange Rural Clinic',
  'Dalori IDP Camp',
];

export function BeneficiariesView({
  refreshSignal,
  onDataChanged,
  onOpenPhone,
}: BeneficiariesViewProps) {
  const {user} = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  // Registration Form
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<MessagingChannel>('sms');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
  const [community, setCommunity] = useState(
    user?.assignedCommunity && user.assignedCommunity !== 'All Communities'
      ? user.assignedCommunity
      : COMMUNITY_OPTIONS[0],
  );
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [age, setAge] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [explanationConfirmed, setExplanationConfirmed] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentGivenBy, setConsentGivenBy] = useState('');
  const [guardianConsentGiven, setGuardianConsentGiven] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Mother');
  const [padsCount, setPadsCount] = useState(3);
  const [soapIncluded, setSoapIncluded] = useState(true);
  const [pouchIncluded, setPouchIncluded] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newlyRegistered, setNewlyRegistered] = useState<BeneficiaryRecord | null>(null);

  // Timeline drawer
  const [timelineData, setTimelineData] = useState<{
    beneficiary: BeneficiaryRecord;
    logs: MessageLogRecord[];
    feedbacks: FeedbackRecord[];
  } | null>(null);

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (languageFilter !== 'all') params.set('language', languageFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);

      const res = await apiRequest<{beneficiaries: BeneficiaryRecord[]}>(
        `/api/beneficiaries?${params.toString()}`,
      );
      setBeneficiaries(res.beneficiaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, languageFilter, channelFilter]);

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries, refreshSignal]);

  const parsedAge = age.trim() ? Number(age) : undefined;
  const effectiveMinor = isMinor || (typeof parsedAge === 'number' && parsedAge < 18);

  const resetForm = () => {
    setFullName('');
    setPhoneNumber('');
    setPreferredChannel('sms');
    setPreferredLanguage('en');
    setAge('');
    setIsMinor(false);
    setExplanationConfirmed(false);
    setConsentGiven(false);
    setConsentGivenBy('');
    setGuardianConsentGiven(false);
    setGuardianName('');
    setGuardianRelationship('Mother');
    setPadsCount(3);
    setSoapIncluded(true);
    setPouchIncluded(true);
    setFormError(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!explanationConfirmed || !consentGiven) {
      setFormError(
        'Consent is mandatory: confirm that the service was explained in plain language and informed consent was given.',
      );
      return;
    }

    if (effectiveMinor && (!guardianConsentGiven || !guardianName.trim())) {
      setFormError(
        'Guardian consent and parent/guardian name are mandatory when registering a minor under 18.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{beneficiary: BeneficiaryRecord}>('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          preferredChannel,
          preferredLanguage,
          community,
          startDate,
          age: parsedAge,
          isMinor: effectiveMinor,
          consent: {
            given: consentGiven,
            explanationConfirmed,
            givenBy: consentGivenBy.trim() || fullName.trim(),
          },
          guardianConsent: effectiveMinor
            ? {
                given: guardianConsentGiven,
                guardianName: guardianName.trim(),
                relationship: guardianRelationship.trim() || 'Parent / Guardian',
              }
            : {given: false},
          kitDistributed: {
            padsCount,
            soapIncluded,
            pouchIncluded,
          },
        }),
      });
      setNewlyRegistered(res.beneficiary);
      resetForm();
      setShowForm(false);
      await loadBeneficiaries();
      onDataChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to register beneficiary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleOptOut = async (b: BeneficiaryRecord) => {
    const action = b.status === 'opted_out' ? 'reactivate' : 'opt_out';
    try {
      await apiRequest(`/api/beneficiaries/${b._id}/opt-out`, {
        method: 'PATCH',
        body: JSON.stringify({action}),
      });
      await loadBeneficiaries();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const openTimeline = async (id: string) => {
    try {
      const data = await apiRequest<{
        beneficiary: BeneficiaryRecord;
        logs: MessageLogRecord[];
        feedbacks: FeedbackRecord[];
      }>(`/api/beneficiaries/${id}/timeline`);
      setTimelineData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load beneficiary record.');
    }
  };

  const isCommunityLocked =
    user?.role === 'volunteer' &&
    user.assignedCommunity &&
    user.assignedCommunity !== 'All Communities';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
            Beneficiaries &amp; Consent Registry
          </h1>
          <p className="mt-1 text-sm text-[#556363]">
            Data-minimized enrollment with mandatory informed consent and under-18 guardian
            verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setNewlyRegistered(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F5C5C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? 'Close Form' : 'Register Beneficiary'}</span>
        </button>
      </div>

      {newlyRegistered && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#B8DEC9] bg-[#F2F9F5] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1F6E4A]" />
            <div>
              <p className="text-sm font-semibold text-[#172323]">
                {newlyRegistered.fullName} registered &amp; discreet welcome message dispatched
              </p>
              <p className="mt-0.5 text-xs text-[#556363]">
                {newlyRegistered.phoneNumber} · {newlyRegistered.preferredChannel.toUpperCase()} ·{' '}
                {newlyRegistered.preferredLanguage === 'ha' ? 'Hausa' : 'English'} ·{' '}
                {newlyRegistered.community}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenPhone(newlyRegistered._id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F5C5C] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0B4646] whitespace-nowrap shrink-0"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>View Welcome in Phone</span>
          </button>
        </div>
      )}

      {/* Registration & Consent Form */}
      {showForm && (
        <form
          onSubmit={handleRegisterSubmit}
          className="rounded-xl border border-[#DDD5C7] bg-white p-6 space-y-6"
        >
          <div className="border-b border-[#EFEAE0] pb-4">
            <h2 className="font-display text-lg font-bold text-[#172323]">
              New Beneficiary Registration &amp; Kit Distribution
            </h2>
            <p className="mt-1 text-xs text-[#556363]">
              Only essential contact and consent information is collected. No medical records are
              stored.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-[#172323]">
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Halima Bello"
                className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#172323]">
                Phone Number *
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2348031110099 or 08031110099"
                className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 font-mono-tabular text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-community" className="block text-xs font-semibold text-[#172323]">
                Community / IDP Camp *
              </label>
              {isCommunityLocked ? (
                <input
                  id="reg-community"
                  type="text"
                  value={community}
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#EFEAE0] px-3 py-2 text-sm text-[#556363]"
                />
              ) : (
                <select
                  id="reg-community"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
                >
                  {COMMUNITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="reg-channel" className="block text-xs font-semibold text-[#172323]">
                Delivery Channel *
              </label>
              <select
                id="reg-channel"
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as MessagingChannel)}
                className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              >
                <option value="sms">SMS (Basic Phone)</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label htmlFor="reg-lang" className="block text-xs font-semibold text-[#172323]">
                Preferred Language *
              </label>
              <select
                id="reg-lang"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ha">Hausa</option>
              </select>
            </div>

            <div>
              <label htmlFor="reg-start" className="block text-xs font-semibold text-[#172323]">
                Program Start Date *
              </label>
              <input
                id="reg-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 font-mono-tabular text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Reusable Kit + Age / Minor Check */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#DDD5C7] bg-[#F7F4EE] p-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[#172323]">
                Reusable Hygiene Kit Handed Out
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[#172323]">
                <label className="flex items-center gap-1.5">
                  <span>Reusable Pads:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={padsCount}
                    onChange={(e) => setPadsCount(Number(e.target.value))}
                    className="w-14 rounded border border-[#DDD5C7] bg-white px-2 py-1 font-mono-tabular"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={soapIncluded}
                    onChange={(e) => setSoapIncluded(e.target.checked)}
                    className="h-4 w-4 accent-[#0F5C5C]"
                  />
                  <span>Mild Soap</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={pouchIncluded}
                    onChange={(e) => setPouchIncluded(e.target.checked)}
                    className="h-4 w-4 accent-[#0F5C5C]"
                  />
                  <span>Waterproof Pouch</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#172323]">Age Verification &amp; Minor Rule</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-2">
                  <span>Age (optional):</span>
                  <input
                    type="number"
                    min={8}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 16"
                    className="w-20 rounded border border-[#DDD5C7] bg-white px-2 py-1 font-mono-tabular"
                  />
                </label>
                <label className="flex items-center gap-2 font-medium text-[#172323]">
                  <input
                    type="checkbox"
                    checked={effectiveMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="h-4 w-4 accent-[#B85A3A]"
                  />
                  <span>Beneficiary is under 18 (requires guardian consent)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Informed Consent Section */}
          <div className="space-y-3 rounded-xl border border-[#DDD5C7] bg-white p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#0F5C5C]" />
              <h3 className="text-sm font-bold text-[#172323]">
                Informed Consent Capture (Required)
              </h3>
            </div>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#172323]">
              <input
                type="checkbox"
                checked={explanationConfirmed}
                onChange={(e) => setExplanationConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#0F5C5C]"
              />
              <span>
                I explained the DignityLink service in plain language: 2–3 short menstrual hygiene
                messages per week for 12 weeks, how to reply 1 or 2, and that she can stop anytime
                by replying STOP.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#172323]">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#0F5C5C]"
              />
              <span>
                Beneficiary explicitly granted consent to receive scheduled messages at the phone
                number above.
              </span>
            </label>

            <div className="max-w-sm">
              <label htmlFor="consent-by" className="block text-xs font-medium text-[#556363]">
                Consent given by (defaults to beneficiary name)
              </label>
              <input
                id="consent-by"
                type="text"
                value={consentGivenBy}
                onChange={(e) => setConsentGivenBy(e.target.value)}
                placeholder={fullName || 'Name of person consenting'}
                className="mt-1 w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-1.5 text-xs text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Conditional Guardian Consent for Minors */}
          {effectiveMinor && (
            <div className="space-y-3 rounded-xl border border-[#E5B8A8] bg-[#FDF4F0] p-4">
              <div className="flex items-center gap-2 text-[#7A321C]">
                <ShieldAlert className="h-4 w-4 text-[#B85A3A]" />
                <h3 className="text-sm font-bold">
                  Parent / Guardian Consent Required (Minor Under 18)
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="guardian-name"
                    className="block text-xs font-semibold text-[#7A321C]"
                  >
                    Parent or Guardian Full Name *
                  </label>
                  <input
                    id="guardian-name"
                    type="text"
                    required={effectiveMinor}
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Hauwa Bello"
                    className="mt-1 w-full rounded-lg border border-[#E5B8A8] bg-white px-3 py-2 text-sm text-[#172323] focus:border-[#B85A3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guardian-rel"
                    className="block text-xs font-semibold text-[#7A321C]"
                  >
                    Relationship *
                  </label>
                  <input
                    id="guardian-rel"
                    type="text"
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    placeholder="Mother / Father / Legal Guardian"
                    className="mt-1 w-full rounded-lg border border-[#E5B8A8] bg-white px-3 py-2 text-sm text-[#172323] focus:border-[#B85A3A] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#7A321C]">
                <input
                  type="checkbox"
                  checked={guardianConsentGiven}
                  onChange={(e) => setGuardianConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#B85A3A]"
                />
                <span>
                  I confirm that the parent or legal guardian named above witnessed the explanation
                  and granted consent for this minor to receive DignityLink messages.
                </span>
              </label>
            </div>
          )}

          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] p-3 text-xs text-[#7A321C]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B85A3A]" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#EFEAE0] pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#DDD5C7] bg-white px-4 py-2 text-sm font-medium text-[#172323] hover:bg-[#F7F4EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0F5C5C] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] disabled:opacity-60"
            >
              {submitting ? 'Saving & Sending Welcome...' : 'Complete Consented Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DDD5C7] bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#556363]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or community..."
            className="w-full rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] py-2 pr-3 pl-9 text-sm text-[#172323] focus:border-[#0F5C5C] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="opted_out">Opted Out</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">All Channels</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="ha">Hausa</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] p-3 text-xs text-[#7A321C]">
          {error}
        </div>
      )}

      {/* Beneficiary Directory Table */}
      <div className="overflow-hidden rounded-xl border border-[#DDD5C7] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EFEAE0] text-xs font-semibold text-[#556363]">
                <th className="px-5 py-3">Beneficiary</th>
                <th className="px-4 py-3">Community</th>
                <th className="px-4 py-3">Channel &amp; Lang</th>
                <th className="px-4 py-3">Consent</th>
                <th className="px-4 py-3 text-right">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#556363]">
                    Loading beneficiaries...
                  </td>
                </tr>
              )}

              {!loading && beneficiaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#556363]">
                    No beneficiaries match the current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                beneficiaries.map((b) => (
                  <tr key={b._id} className="hover:bg-[#F7F4EE]/60">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#172323]">{b.fullName}</p>
                      <p className="font-mono-tabular text-xs text-[#556363]">{b.phoneNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#172323]">{b.community}</td>
                    <td className="px-4 py-3.5 text-xs text-[#556363]">
                      {b.preferredChannel.toUpperCase()} ·{' '}
                      {b.preferredLanguage === 'ha' ? 'Hausa' : 'English'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#556363]">
                      <span>Consented</span>
                      {b.isMinor && (
                        <span className="block text-[11px] font-medium text-[#B85A3A]">
                          Minor · Guardian: {b.guardianConsent?.guardianName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular text-xs text-[#172323]">
                      Wk {b.currentWeek} · {b.lessonsSent}/28
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span
                        className={`font-semibold ${
                          b.status === 'opted_out'
                            ? 'text-[#B85A3A]'
                            : b.status === 'completed'
                              ? 'text-[#0F5C5C]'
                              : 'text-[#1F6E4A]'
                        }`}
                      >
                        {b.status === 'opted_out'
                          ? 'Opted Out'
                          : b.status === 'completed'
                            ? 'Completed'
                            : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPhone(b._id)}
                          className="rounded border border-[#DDD5C7] bg-[#F7F4EE] px-2.5 py-1 text-xs font-medium text-[#0F5C5C] hover:border-[#0F5C5C] whitespace-nowrap"
                        >
                          Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => openTimeline(b._id)}
                          className="rounded border border-[#DDD5C7] bg-white px-2.5 py-1 text-xs font-medium text-[#172323] hover:border-[#0F5C5C] whitespace-nowrap"
                        >
                          Record
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleOptOut(b)}
                          className="rounded border border-[#DDD5C7] bg-white px-2.5 py-1 text-xs font-medium text-[#B85A3A] hover:border-[#B85A3A] whitespace-nowrap"
                        >
                          {b.status === 'opted_out' ? 'Re-enable' : 'Opt Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consent & Delivery Timeline Modal */}
      {timelineData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#172323]/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#DDD5C7] bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-[#EFEAE0] px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#172323]">
                  {timelineData.beneficiary.fullName}
                </h3>
                <p className="mt-0.5 font-mono-tabular text-xs text-[#556363]">
                  {timelineData.beneficiary.phoneNumber} · {timelineData.beneficiary.community}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimelineData(null)}
                className="rounded-lg p-1.5 text-[#556363] hover:bg-[#F7F4EE]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] p-4 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-[#172323]">Consent Audit</p>
                  <p className="mt-1 text-[#556363]">
                    Given by: {timelineData.beneficiary.consent.givenBy}
                  </p>
                  <p className="font-mono-tabular text-[#556363]">
                    Recorded:{' '}
                    {new Date(timelineData.beneficiary.consent.recordedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#172323]">Minor / Guardian Safeguard</p>
                  {timelineData.beneficiary.isMinor ? (
                    <p className="mt-1 text-[#7A321C]">
                      Guardian: {timelineData.beneficiary.guardianConsent.guardianName} (
                      {timelineData.beneficiary.guardianConsent.relationship})
                    </p>
                  ) : (
                    <p className="mt-1 text-[#556363]">Adult beneficiary (18+)</p>
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold text-[#172323]">
                  Delivery &amp; Inbound Log ({timelineData.logs.length})
                </p>
                <div className="mt-2 space-y-2">
                  {timelineData.logs.map((log) => (
                    <div
                      key={log._id}
                      className="rounded-lg border border-[#EFEAE0] bg-white p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#556363]">
                        <span className="font-semibold text-[#172323]">
                          {log.direction === 'outbound' ? 'Outbound' : 'Inbound'} ·{' '}
                          {log.providerName}
                          {log.sequenceNumber ? ` · Lesson ${log.sequenceNumber}/28` : ''}
                        </span>
                        <span className="font-mono-tabular">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#172323]">{log.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
