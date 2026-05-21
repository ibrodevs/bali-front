'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { ApiAdminFaqItem, ApiAdminFaqTranslation, endpoints, unwrapList } from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';

const A = {
  bg: '#f7f7f8',
  white: '#ffffff',
  black: '#000000',
  gold: '#FFD700',
  g100: '#F5F5F5',
  g200: '#EBEBEB',
  g300: '#CCCCCC',
  g400: '#AAAAAA',
  g500: '#888888',
  g700: '#444444',
  green: '#16a34a',
  red: '#dc2626',
  greenBg: '#f0fdf4',
  redBg: '#fef2f2',
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function isAdminLike(user: { role?: string; is_staff?: boolean; is_superuser?: boolean } | null | undefined) {
  if (!user) return false;
  if (user.is_staff || user.is_superuser) return true;
  return ['admin', 'manager', 'staff'].includes((user.role || '').toLowerCase());
}

function Button({
  children, onClick, variant = 'primary', size = 'md', disabled, style, fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: CSSProperties;
  fullWidth?: boolean;
}) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: 600,
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '6px 12px' : '9px 18px',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 120ms',
    whiteSpace: 'nowrap' as const,
    width: fullWidth ? '100%' : undefined,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: A.black, color: A.gold },
    outline: { background: 'transparent', color: A.g700, border: `1px solid ${A.g300}` },
    danger: { background: A.redBg, color: A.red, border: `1px solid ${A.red}20` },
    ghost: { background: 'transparent', color: A.g500 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: A.white, borderRadius: 12, border: `1px solid ${A.g200}`, ...style }}>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, multiline, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const base: CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${A.g300}`,
    fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black,
    background: A.white, outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? 90 : undefined,
  };
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: A.g500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      {multiline
        ? <textarea style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} />
        : <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </label>
  );
}

function emptyTranslations(): ApiAdminFaqTranslation[] {
  return LANGUAGES.map(l => ({ language: l.code, question: '', answer: '' }));
}

type EditState = {
  code: string;
  is_active: boolean;
  sort_order: number;
  translations: ApiAdminFaqTranslation[];
};

function FAQEditor({
  initial, onSave, onCancel, saving, error, isMobile,
}: {
  initial: EditState;
  onSave: (state: EditState) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  isMobile: boolean;
}) {
  const [state, setState] = useState<EditState>(initial);
  const [activeLang, setActiveLang] = useState('en');

  const setTranslation = (lang: string, field: 'question' | 'answer', value: string) => {
    setState(s => ({
      ...s,
      translations: s.translations.map(t => t.language === lang ? { ...t, [field]: value } : t),
    }));
  };

  const activeTr = state.translations.find(t => t.language === activeLang) || { language: activeLang, question: '', answer: '' };
  const filledCount = state.translations.filter(t => t.question.trim() && t.answer.trim()).length;
  const pad = isMobile ? '16px' : '20px 24px';

  return (
    <div style={{ padding: pad, borderTop: `1px solid ${A.g200}`, background: '#fafafa' }}>
      {error && (
        <div style={{ background: A.redBg, color: A.red, border: `1px solid ${A.red}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
          {error}
        </div>
      )}

      {/* Code / sort / active */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '1fr 90px auto', gap: 12, alignItems: 'end', marginBottom: 16 }}>
        <Field
          label="Code (ID)"
          value={state.code}
          onChange={v => setState(s => ({ ...s, code: v.toLowerCase().replace(/\s+/g, '_') }))}
          placeholder="e.g. delivery_time"
        />
        <Field
          label="Sort order"
          value={String(state.sort_order)}
          onChange={v => setState(s => ({ ...s, sort_order: parseInt(v) || 0 }))}
        />
        {!isMobile && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.g700, paddingBottom: 10 }}>
            <input
              type="checkbox"
              checked={state.is_active}
              onChange={e => setState(s => ({ ...s, is_active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: A.gold, cursor: 'pointer' }}
            />
            Active
          </label>
        )}
      </div>

      {/* Active + filled count row (mobile only) */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.g700 }}>
            <input
              type="checkbox"
              checked={state.is_active}
              onChange={e => setState(s => ({ ...s, is_active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: A.gold, cursor: 'pointer' }}
            />
            Active
          </label>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
            {`${filledCount}/${LANGUAGES.length} filled`}
          </span>
        </div>
      )}

      {/* Filled count (desktop) */}
      {!isMobile && (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 12, textAlign: 'right' }}>
          {`${filledCount}/${LANGUAGES.length} languages filled`}
        </div>
      )}

      {/* Language tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {LANGUAGES.map(l => {
          const tr = state.translations.find(t => t.language === l.code);
          const filled = !!(tr?.question?.trim() && tr?.answer?.trim());
          const active = activeLang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setActiveLang(l.code)}
              style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer',
                borderRadius: 6, transition: 'all 120ms',
                fontSize: isMobile ? 11 : 12,
                padding: isMobile ? '5px 8px' : '5px 12px',
                border: `1px solid ${active ? A.black : (filled ? A.green : A.g300)}`,
                background: active ? A.black : (filled ? A.greenBg : A.white),
                color: active ? A.gold : (filled ? A.green : A.g500),
              }}
            >
              {l.flag} {isMobile ? l.code.toUpperCase() : l.label}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gap: 12 }}>
        <Field
          label="Question"
          value={activeTr.question}
          onChange={v => setTranslation(activeLang, 'question', v)}
          placeholder={`Question in ${LANGUAGES.find(l => l.code === activeLang)?.label}`}
        />
        <Field
          label="Answer"
          value={activeTr.answer}
          onChange={v => setTranslation(activeLang, 'answer', v)}
          multiline
          placeholder={`Answer in ${LANGUAGES.find(l => l.code === activeLang)?.label}`}
        />
      </div>

      {/* Save / cancel */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexDirection: isMobile ? 'column' : 'row' }}>
        <Button onClick={() => onSave(state)} disabled={saving || !state.code.trim()} fullWidth={isMobile}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving} fullWidth={isMobile}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminFAQPage() {
  const { user, loading: authLoading } = useAuth();
  const canOpen = isAdminLike(user);
  const isMobile = useWindowWidth() < 640;

  const [items, setItems] = useState<ApiAdminFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await endpoints.adminFaqs();
      setItems(unwrapList(res));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !canOpen) return;
    load();
  }, [authLoading, canOpen, load]);

  const handleSave = async (state: EditState, id?: number) => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        code: state.code,
        is_active: state.is_active,
        sort_order: state.sort_order,
        translations: state.translations.filter(t => t.question.trim() || t.answer.trim()),
      };
      if (id) {
        const updated = await endpoints.adminUpdateFaq(id, payload);
        setItems(prev => prev.map(item => item.id === id ? updated : item));
      } else {
        const created = await endpoints.adminCreateFaq(payload);
        setItems(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
      }
      setEditingId(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await endpoints.adminDeleteFaq(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setDeleteConfirm(null);
      if (editingId === id) setEditingId(null);
    } catch {
      // keep confirm open
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (item: ApiAdminFaqItem) => {
    try {
      const updated = await endpoints.adminUpdateFaq(item.id, { is_active: !item.is_active });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    } catch {}
  };

  if (!authLoading && (!user || !canOpen)) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', padding: 24 }}>
        <Panel style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', margin: '0 0 8px' }}>Access denied</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', color: A.g500, margin: '0 0 24px' }}>Admin privileges required.</p>
          <Link href="/admin"><Button>Back to admin</Button></Link>
        </Panel>
      </div>
    );
  }

  const newItemInitial: EditState = {
    code: '',
    is_active: true,
    sort_order: items.length * 10,
    translations: emptyTranslations(),
  };

  const outerPad = isMobile ? '16px 12px' : '32px 24px';

  return (
    <div style={{ minHeight: '100vh', background: A.bg, padding: outerPad }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 16 : 28, flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, textDecoration: 'none', flexShrink: 0 }}>
            ← Admin
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, color: A.black }}>
              FAQ Management
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, margin: '2px 0 0' }}>
              {`${items.length} question${items.length !== 1 ? 's' : ''} · 6 languages`}
            </p>
          </div>
          {editingId !== 'new' && (
            <Button size={isMobile ? 'sm' : 'md'} onClick={() => { setEditingId('new'); setSaveError(''); }}>
              + Add
            </Button>
          )}
        </div>

        {/* New item form */}
        {editingId === 'new' && (
          <Panel style={{ marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ padding: isMobile ? '12px 16px' : '14px 24px', borderBottom: `1px solid ${A.g200}` }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: A.black }}>New question</span>
            </div>
            <FAQEditor
              initial={newItemInitial}
              onSave={state => handleSave(state)}
              onCancel={() => { setEditingId(null); setSaveError(''); }}
              saving={saving}
              error={saveError}
              isMobile={isMobile}
            />
          </Panel>
        )}

        {/* FAQ list */}
        <Panel>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'Inter, sans-serif', color: A.g500 }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: A.black, marginBottom: 6 }}>No FAQ items yet</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>Add your first question above</div>
            </div>
          ) : (
            items.map((item, idx) => {
              const isEditing = editingId === item.id;
              const enTr = item.translations.find(t => t.language === 'en');
              const filledLangs = item.translations.filter(t => t.question && t.answer).map(t => t.language.toUpperCase());
              const isDeleteConfirm = deleteConfirm === item.id;

              const editInitial: EditState = {
                code: item.code,
                is_active: item.is_active,
                sort_order: item.sort_order,
                translations: LANGUAGES.map(l => {
                  const found = item.translations.find(t => t.language === l.code);
                  return found ? { ...found } : { language: l.code, question: '', answer: '' };
                }),
              };

              return (
                <div key={item.id} style={{ borderBottom: idx < items.length - 1 ? `1px solid ${A.g200}` : 'none' }}>
                  {isMobile ? (
                    /* ── Mobile row: 2-line layout ── */
                    <div style={{ padding: '12px 14px' }}>
                      {/* Line 1: toggle + question text */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <button
                          onClick={() => handleToggleActive(item)}
                          style={{
                            width: 32, height: 18, borderRadius: 9, border: 'none',
                            background: item.is_active ? A.green : A.g300,
                            cursor: 'pointer', position: 'relative', transition: 'background 200ms',
                            flexShrink: 0, marginTop: 2,
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: 2, left: item.is_active ? 16 : 2,
                            width: 14, height: 14, borderRadius: '50%',
                            background: A.white, transition: 'left 200ms',
                          }} />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.black,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {enTr?.question || <span style={{ color: A.g400, fontStyle: 'italic' }}>No English translation</span>}
                          </div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500, marginTop: 2 }}>
                            {item.code}
                            {filledLangs.length > 0 && (
                              <span style={{ marginLeft: 6, color: A.green }}>{filledLangs.join(' · ')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Line 2: sort + action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g400, marginRight: 4 }}>
                          #{item.sort_order}
                        </span>
                        <div style={{ flex: 1 }} />
                        {isDeleteConfirm ? (
                          <>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)} disabled={deleting}>
                              {deleting ? '…' : 'Delete?'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant={isEditing ? 'primary' : 'outline'}
                              onClick={() => { setEditingId(isEditing ? null : item.id); setSaveError(''); }}
                            >
                              {isEditing ? 'Close' : 'Edit'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(item.id)} style={{ color: A.red }}>
                              Del
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── Desktop row: single line ── */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g400, minWidth: 24, textAlign: 'center', flexShrink: 0 }}>
                        #{item.sort_order}
                      </span>

                      <button
                        onClick={() => handleToggleActive(item)}
                        style={{
                          width: 32, height: 18, borderRadius: 9, border: 'none',
                          background: item.is_active ? A.green : A.g300,
                          cursor: 'pointer', position: 'relative', transition: 'background 200ms', flexShrink: 0,
                        }}
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <span style={{
                          position: 'absolute', top: 2, left: item.is_active ? 16 : 2,
                          width: 14, height: 14, borderRadius: '50%',
                          background: A.white, transition: 'left 200ms',
                        }} />
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.black,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
                        }}>
                          {enTr?.question || <span style={{ color: A.g400, fontStyle: 'italic' }}>No English translation</span>}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500 }}>
                          {item.code}
                          {filledLangs.length > 0 && (
                            <span style={{ marginLeft: 8, color: A.green }}>{filledLangs.join(' · ')}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Button
                          size="sm"
                          variant={isEditing ? 'primary' : 'outline'}
                          onClick={() => { setEditingId(isEditing ? null : item.id); setSaveError(''); }}
                        >
                          {isEditing ? 'Close' : 'Edit'}
                        </Button>
                        {isDeleteConfirm ? (
                          <>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)} disabled={deleting}>
                              {deleting ? '…' : 'Confirm'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(item.id)} style={{ color: A.red }}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Editor */}
                  {isEditing && (
                    <FAQEditor
                      initial={editInitial}
                      onSave={state => handleSave(state, item.id)}
                      onCancel={() => { setEditingId(null); setSaveError(''); }}
                      saving={saving}
                      error={saveError}
                      isMobile={isMobile}
                    />
                  )}
                </div>
              );
            })
          )}
        </Panel>

      </div>
    </div>
  );
}
