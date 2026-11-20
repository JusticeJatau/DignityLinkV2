import {AlertCircle, Check, Edit3, X} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useAuth} from '../context/AuthContext.tsx';
import {apiRequest} from '../lib/api.ts';
import {MessageTemplateRecord, MessageTheme} from '../types/index.ts';

const THEME_LABELS: Record<MessageTheme, string> = {
  pad_care: 'Reusable Pad Care',
  personal_hygiene: 'Personal Hygiene',
  health_warning_signs: 'Health & Warning Signs',
  myths_dignity: 'Myths & Dignity',
  understanding_body: 'Understanding Your Body',
  feedback_prompt: 'Biweekly Feedback Prompt',
};

export function MessageLibraryView() {
  const {user} = useAuth();
  const [templates, setTemplates] = useState<MessageTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [langFilter, setLangFilter] = useState<string>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{templates: MessageTemplateRecord[]}>('/api/messages');
      setTemplates(res.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (weekFilter !== 'all' && t.weekNumber !== Number(weekFilter)) return false;
      if (themeFilter !== 'all' && t.theme !== themeFilter) return false;
      if (langFilter !== 'all' && t.language !== langFilter) return false;
      return true;
    });
  }, [templates, weekFilter, themeFilter, langFilter]);

  // Group into sequence slots so English & Hausa appear together cleanly
  const groupedSlots = useMemo(() => {
    const map = new Map<
      number,
      {
        sequenceNumber: number;
        weekNumber: number;
        slotInWeek: number;
        dayOfWeek: string;
        theme: MessageTheme;
        isFeedbackPrompt: boolean;
        en?: MessageTemplateRecord;
        ha?: MessageTemplateRecord;
      }
    >();

    for (const tpl of filtered) {
      const entry = map.get(tpl.sequenceNumber) || {
        sequenceNumber: tpl.sequenceNumber,
        weekNumber: tpl.weekNumber,
        slotInWeek: tpl.slotInWeek,
        dayOfWeek: tpl.dayOfWeek,
        theme: tpl.theme,
        isFeedbackPrompt: tpl.isFeedbackPrompt,
      };
      if (tpl.language === 'en') entry.en = tpl;
      if (tpl.language === 'ha') entry.ha = tpl;
      map.set(tpl.sequenceNumber, entry);
    }

    return Array.from(map.values()).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }, [filtered]);

  const startEdit = (tpl: MessageTemplateRecord) => {
    setEditingId(tpl._id);
    setEditContent(tpl.content);
    setError(null);
  };

  const saveEdit = async (id: string) => {
    if (editContent.trim().length > 160) {
      setError('Message must stay at or below 160 characters to fit in one SMS.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({content: editContent.trim()}),
      });
      setEditingId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message.');
    } finally {
      setSaving(false);
    }
  };

  const isCoordinator = user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
            12-Week Message Library (English &amp; Hausa)
          </h1>
          <p className="mt-1 text-sm text-[#556363]">
            28 scheduled lessons (&le; 160 characters each) · Weeks 1–4 on Mon/Wed/Fri · Weeks 5–12
            on Tue/Fri
          </p>
        </div>

        <p className="rounded-lg border border-[#DDD5C7] bg-white px-3.5 py-2 text-xs text-[#556363]">
          Content status: Prototype guidance — clinical &amp; native-speaker review planned before
          deployment
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DDD5C7] bg-white p-4">
        <select
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">All 12 Weeks</option>
          {Array.from({length: 12}, (_, i) => i + 1).map((wk) => (
            <option key={wk} value={String(wk)}>
              Week {wk} ({wk <= 4 ? '3 msgs/wk' : '2 msgs/wk'})
            </option>
          ))}
        </select>

        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">All 6 Themes</option>
          {Object.entries(THEME_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] px-3 py-2 text-xs font-medium text-[#172323]"
        >
          <option value="all">English &amp; Hausa</option>
          <option value="en">English Only</option>
          <option value="ha">Hausa Only</option>
        </select>

        <span className="ml-auto font-mono-tabular text-xs text-[#556363]">
          Showing {groupedSlots.length} of 28 lessons
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] p-3 text-xs text-[#7A321C]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#B85A3A]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-[#DDD5C7] bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedSlots.map((slot) => (
            <div
              key={slot.sequenceNumber}
              className="rounded-xl border border-[#DDD5C7] bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] pb-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono-tabular font-bold text-[#0F5C5C]">
                    Lesson {slot.sequenceNumber}/28
                  </span>
                  <span aria-hidden="true" className="text-[#556363]">
                    ·
                  </span>
                  <span className="font-semibold text-[#172323]">
                    Week {slot.weekNumber} ({slot.dayOfWeek})
                  </span>
                  <span aria-hidden="true" className="text-[#556363]">
                    ·
                  </span>
                  <span className="text-[#556363]">{THEME_LABELS[slot.theme]}</span>
                </div>
                {slot.isFeedbackPrompt && (
                  <span className="text-xs font-semibold text-[#0F5C5C]">
                    Biweekly Feedback Check-in (1 / 2 / STOP)
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[
                  {label: 'English', tpl: slot.en},
                  {label: 'Hausa', tpl: slot.ha},
                ].map(
                  ({label, tpl}) =>
                    tpl && (
                      <div
                        key={tpl._id}
                        className="rounded-lg border border-[#EFEAE0] bg-[#F7F4EE]/70 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#172323]">{label}</span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono-tabular text-[11px] ${
                                tpl.content.length > 160 ? 'text-[#B85A3A]' : 'text-[#556363]'
                              }`}
                            >
                              {tpl.content.length}/160 chars
                            </span>
                            {isCoordinator && editingId !== tpl._id && (
                              <button
                                type="button"
                                onClick={() => startEdit(tpl)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#0F5C5C] hover:underline"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {editingId === tpl._id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              rows={3}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full rounded-lg border border-[#DDD5C7] bg-white p-2.5 text-sm text-[#172323] focus:border-[#0F5C5C] focus:outline-none"
                            />
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-mono-tabular text-xs font-semibold ${
                                  editContent.trim().length > 160
                                    ? 'text-[#B85A3A]'
                                    : 'text-[#1F6E4A]'
                                }`}
                              >
                                {editContent.trim().length}/160 characters
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-1 rounded border border-[#DDD5C7] bg-white px-2.5 py-1 text-xs font-medium text-[#556363]"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={saving || editContent.trim().length > 160}
                                  onClick={() => saveEdit(tpl._id)}
                                  className="inline-flex items-center gap-1 rounded bg-[#0F5C5C] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{saving ? 'Saving...' : 'Save'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed text-[#172323]">
                            {tpl.content}
                          </p>
                        )}
                      </div>
                    ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
