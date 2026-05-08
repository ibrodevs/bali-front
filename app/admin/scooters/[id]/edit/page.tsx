'use client';

import Link from 'next/link';
import { ChangeEvent, CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
import { ApiError, mediaUrl } from '@/lib/api';
import {
  AdminScooterPayload,
  ApiScooterDetail,
  ApiVehicleModel,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { useParams } from 'next/navigation';

const A = {
  bg: '#f7f7f8',
  white: '#ffffff',
  black: '#000000',
  gold: '#FFD700',
  g100: '#F5F5F5',
  g200: '#EBEBEB',
  g500: '#888888',
  g700: '#444444',
  red: '#dc2626',
  redBg: '#fef2f2',
  green: '#16a34a',
  greenBg: '#f0fdf4',
};

function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function slugify(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initials(value?: string | null) {
  const source = (value || '').trim();
  if (!source) return 'AD';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

function isAdminLike(user: { role?: string; is_staff?: boolean; is_superuser?: boolean } | null | undefined) {
  if (!user) return false;
  if (user.is_staff || user.is_superuser) return true;
  return ['admin', 'manager', 'staff'].includes((user.role || '').toLowerCase());
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {children}
      {hint ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>{hint}</span> : null}
    </label>
  );
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'dark' | 'outline' | 'danger';
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { background: A.gold, color: A.black, border: 'none' },
    dark: { background: A.black, color: A.white, border: 'none' },
    outline: { background: 'transparent', color: A.black, border: `1.5px solid ${A.g200}` },
    danger: { background: A.redBg, color: A.red, border: `1.5px solid ${A.red}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 10,
        padding: '10px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div style={{ marginBottom: 16, background: A.redBg, color: A.red, borderRadius: 12, padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
      {error}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${A.g200}`,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  outline: 'none',
  background: A.white,
  boxSizing: 'border-box',
};

type DraftScooter = {
  model: string;
  title: string;
  slug: string;
  sku: string;
  color: string;
  base_price_usd: string;
  status: string;
  mileage: string;
  is_featured: boolean;
};

type NewPhoto = {
  file: File;
  preview: string;
  alt_text: string;
};

type ExistingImage = {
  id: number;
  image: string;
  alt_text?: string;
  sort_order?: number;
  is_main?: boolean;
};

export default function AdminEditScooterPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const scooterId = params.id as string;
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const isNarrow = windowWidth < 1100;

  const canOpenAdmin = isAdminLike(user);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [scooter, setScooter] = useState<ApiScooterDetail | null>(null);
  const [scooterModels, setScooterModels] = useState<ApiVehicleModel[]>([]);
  const [draft, setDraft] = useState<DraftScooter>({
    model: '',
    title: '',
    slug: '',
    sku: '',
    color: '',
    base_price_usd: '',
    status: 'available',
    mileage: '0',
    is_featured: false,
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [newMainIndex, setNewMainIndex] = useState(0);

  useEffect(() => {
    return () => {
      newPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [newPhotos]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !canOpenAdmin) {
      setPageLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [scooterRes, modelsRes] = await Promise.all([
          endpoints.scooter(scooterId),
          endpoints.scooterModels(),
        ]);
        if (cancelled) return;

        const models = unwrapList(modelsRes);
        setScooterModels(models);
        setScooter(scooterRes);
        setExistingImages(scooterRes.gallery || []);

        const priceRaw = scooterRes.base_price_usd ?? scooterRes.price_per_day;
        setDraft({
          model: scooterRes.model ? String(scooterRes.model) : '',
          title: scooterRes.title || '',
          slug: scooterRes.slug || '',
          sku: scooterRes.sku || '',
          color: scooterRes.color || scooterRes.characteristics?.color || '',
          base_price_usd: priceRaw != null ? String(priceRaw) : '',
          status: scooterRes.status || 'available',
          mileage: scooterRes.mileage != null ? String(scooterRes.mileage) : '0',
          is_featured: scooterRes.is_featured || false,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Unable to load scooter data');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user, canOpenAdmin, scooterId]);

  function updateDraft<K extends keyof DraftScooter>(key: K, value: DraftScooter[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleNewPhotoPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: draft.title || file.name.replace(/\.[^.]+$/, ''),
    }));
    setNewPhotos((current) => [...current, ...next]);
    event.target.value = '';
  }

  function updateNewPhotoAlt(index: number, value: string) {
    setNewPhotos((current) =>
      current.map((item, i) => (i === index ? { ...item, alt_text: value } : item)),
    );
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, i) => i !== index);
    });
    setNewMainIndex((current) => {
      if (index < current) return current - 1;
      if (index === current) return 0;
      return current;
    });
  }

  async function deleteExistingImage(imageId: number) {
    setDeletingIds((s) => new Set([...s, imageId]));
    try {
      await endpoints.adminDeleteScooterImage(imageId);
      setExistingImages((current) => current.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete image');
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(imageId);
        return next;
      });
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!draft.model) throw new Error('Choose a model for this scooter.');
      if (!draft.title.trim() || !draft.slug.trim() || !draft.base_price_usd) {
        throw new Error('Fill in title, slug and price.');
      }

      const sku = draft.sku.trim();
      await endpoints.adminUpdateScooter(scooterId, {
        model: Number(draft.model),
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        ...(sku ? { sku } : {}),
        color: draft.color.trim(),
        base_price_usd: draft.base_price_usd,
        status: draft.status,
        mileage: Number(draft.mileage || 0),
        is_featured: draft.is_featured,
      } satisfies AdminScooterPayload);

      const startOrder = existingImages.length;
      for (let i = 0; i < newPhotos.length; i++) {
        const item = newPhotos[i];
        await endpoints.adminUploadScooterImage(scooterId, item.file, {
          alt_text: item.alt_text.trim() || draft.title,
          sort_order: startOrder + i,
          is_main: existingImages.length === 0 && i === newMainIndex,
        });
      }

      setSuccess('Changes saved successfully.');
      setNewPhotos([]);
      const refreshed = await endpoints.scooter(scooterId);
      setExistingImages(refreshed.gallery || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to save changes');
    } finally {
      setSaving(false);
    }
  }

  const selectedModel = useMemo(
    () => scooterModels.find((m) => String(m.id) === draft.model),
    [draft.model, scooterModels],
  );

  const mainPreviewUrl = useMemo(() => {
    if (newPhotos.length > 0 && existingImages.length === 0) {
      return newPhotos[newMainIndex]?.preview || null;
    }
    const mainImg = existingImages.find((img) => img.is_main) || existingImages[0];
    return mainImg ? mediaUrl(mainImg.image) : null;
  }, [existingImages, newPhotos, newMainIndex]);

  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: A.bg, padding: isMobile ? 16 : 32, fontFamily: 'Inter, sans-serif' }}>
        Loading…
      </div>
    );
  }

  if (!user || !canOpenAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: A.bg, padding: isMobile ? 16 : 32, fontFamily: 'Inter, sans-serif' }}>
        <Panel style={{ maxWidth: 520, margin: '80px auto', padding: 28, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: 14, background: A.gold, display: 'grid', placeItems: 'center', fontWeight: 800 }}>
            {initials(user?.full_name || user?.email)}
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, marginBottom: 10 }}>Access denied</h1>
          <p style={{ color: A.g500, marginBottom: 18 }}>Your account does not have admin privileges.</p>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <Button variant="dark">Back to admin</Button>
          </Link>
        </Panel>
      </div>
    );
  }

  const pad = isMobile ? 16 : 22;

  return (
    <div style={{ minHeight: '100vh', background: A.bg, padding: isMobile ? '16px' : '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 12 : 16,
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Admin / Fleet / Edit
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: isMobile ? 26 : 34, letterSpacing: '-0.04em', color: A.black, margin: 0 }}>
              {scooter?.title || 'Edit Scooter'}
            </h1>
            {!isMobile && (
              <p style={{ color: A.g500, marginTop: 8, marginBottom: 0 }}>
                Edit scooter details, status and gallery. Changes are saved immediately to the site.
              </p>
            )}
          </div>
          <Link href="/admin?view=fleet" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Button variant="outline">← Back to fleet</Button>
          </Link>
        </div>

        <ErrorBanner error={error} />
        {success ? (
          <div style={{ marginBottom: 16, background: A.greenBg, color: A.green, borderRadius: 12, padding: '14px 16px', fontSize: 14 }}>
            {success}
          </div>
        ) : null}

        {/* Save button pinned at top on mobile */}
        {isMobile && (
          <div style={{ marginBottom: 16 }}>
            <Button variant="dark" onClick={handleSubmit} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}

        {/* Main layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
          gap: 16,
          alignItems: 'start',
        }}>
          {/* Left column — forms */}
          <div style={{ display: 'grid', gap: 16 }}>

            {/* Model */}
            <Panel style={{ padding: pad }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 16 }}>
                Model
              </div>
              <Field label="Vehicle model">
                <select
                  value={draft.model}
                  onChange={(e) => updateDraft('model', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select model</option>
                  {scooterModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.name} · {m.type_name || 'Type'} · {m.engine_cc}cc
                    </option>
                  ))}
                </select>
              </Field>
              {selectedModel ? (
                <div style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  background: A.g100,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 6,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: A.g700,
                }}>
                  <div>Transmission: <strong style={{ color: A.black }}>{selectedModel.transmission}</strong></div>
                  <div>Engine: <strong style={{ color: A.black }}>{selectedModel.engine_cc}cc</strong></div>
                  <div>Year: <strong style={{ color: A.black }}>{selectedModel.year}</strong></div>
                  <div>Helmets: <strong style={{ color: A.black }}>{selectedModel.helmets_count}</strong></div>
                </div>
              ) : null}
            </Panel>

            {/* Scooter fields */}
            <Panel style={{ padding: pad }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 16 }}>
                Scooter Details
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {/* Title + SKU */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <Field label="Title">
                    <input
                      value={draft.title}
                      onChange={(e) => updateDraft('title', e.target.value)}
                      style={inputStyle}
                      placeholder="Honda PCX 160"
                    />
                  </Field>
                  <Field label="SKU (optional)">
                    <input
                      value={draft.sku}
                      onChange={(e) => updateDraft('sku', e.target.value)}
                      style={inputStyle}
                      placeholder="PCX-160-WHT"
                    />
                  </Field>
                </div>

                {/* Slug */}
                <Field label="Slug">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                    <input
                      value={draft.slug}
                      onChange={(e) => updateDraft('slug', e.target.value)}
                      style={inputStyle}
                      placeholder="honda-pcx-160"
                    />
                    <Button
                      variant="outline"
                      onClick={() => updateDraft('slug', slugify(draft.title || draft.slug))}
                    >
                      Auto
                    </Button>
                  </div>
                </Field>

                {/* Color / Price / Mileage / Status */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                  <Field label="Color">
                    <input
                      value={draft.color}
                      onChange={(e) => updateDraft('color', e.target.value)}
                      style={inputStyle}
                      placeholder="White"
                    />
                  </Field>
                  <Field label="Price / day">
                    <input
                      type="number"
                      step="0.01"
                      value={draft.base_price_usd}
                      onChange={(e) => updateDraft('base_price_usd', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Mileage">
                    <input
                      type="number"
                      min="0"
                      value={draft.mileage}
                      onChange={(e) => updateDraft('mileage', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={draft.status}
                      onChange={(e) => updateDraft('status', e.target.value)}
                      style={inputStyle}
                    >
                      <option value="available">available</option>
                      <option value="rented">rented</option>
                      <option value="maintenance">maintenance</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </Field>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={draft.is_featured}
                    onChange={(e) => updateDraft('is_featured', e.target.checked)}
                  />
                  <span>Feature on website homepage</span>
                </label>
              </div>
            </Panel>

            {/* Gallery */}
            <Panel style={{ padding: pad }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 16 }}>
                Gallery
              </div>

              {existingImages.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Existing photos
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '120px' : '160px'}, 1fr))`, gap: isMobile ? 8 : 12 }}>
                    {existingImages.map((img) => {
                      const deleting = deletingIds.has(img.id);
                      return (
                        <div key={img.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `2px solid ${img.is_main ? A.gold : A.g200}`, background: A.g100 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mediaUrl(img.image)}
                            alt={img.alt_text || ''}
                            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                          />
                          {img.is_main ? (
                            <div style={{ position: 'absolute', top: 6, left: 6, background: A.gold, color: A.black, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                              Main
                            </div>
                          ) : null}
                          <button
                            onClick={() => deleteExistingImage(img.id)}
                            disabled={deleting}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              border: 'none',
                              cursor: deleting ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Delete image"
                          >
                            {deleting ? '…' : '×'}
                          </button>
                          {img.alt_text && !isMobile ? (
                            <div style={{ padding: '6px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {img.alt_text}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <Field
                label="Upload new photos"
                hint="New photos are appended to the gallery."
              >
                <input type="file" accept="image/*" multiple onChange={handleNewPhotoPick} style={inputStyle} />
              </Field>

              {newPhotos.length > 0 ? (
                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  {newPhotos.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '80px 1fr' : '140px 1fr auto',
                        gap: isMobile ? 10 : 14,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${A.g200}`, background: A.g100, aspectRatio: '4/3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.preview}
                          alt={item.alt_text || item.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <Field label={`Alt text ${index + 1}`}>
                          <input
                            value={item.alt_text}
                            onChange={(e) => updateNewPhotoAlt(index, e.target.value)}
                            style={inputStyle}
                          />
                        </Field>
                        {existingImages.length === 0 ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                            <input
                              type="radio"
                              checked={newMainIndex === index}
                              onChange={() => setNewMainIndex(index)}
                            />
                            <span>Main photo</span>
                          </label>
                        ) : null}
                        {isMobile && (
                          <Button variant="outline" onClick={() => removeNewPhoto(index)} style={{ justifySelf: 'start' }}>
                            Remove
                          </Button>
                        )}
                      </div>
                      {!isMobile && (
                        <Button variant="outline" onClick={() => removeNewPhoto(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {existingImages.length === 0 && newPhotos.length === 0 ? (
                <div style={{ border: `1px dashed ${A.g200}`, borderRadius: 14, padding: 24, color: A.g500, textAlign: 'center', marginTop: 12 }}>
                  No photos yet. Upload at least one to show on the site.
                </div>
              ) : null}
            </Panel>
          </div>

          {/* Right column — preview + actions */}
          <Panel style={{ padding: pad, position: isNarrow ? 'static' : 'sticky', top: 28 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 14 }}>
              Preview
            </div>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${A.g200}`, marginBottom: 16 }}>
              <div
                style={{
                  height: isMobile ? 180 : 220,
                  background: mainPreviewUrl
                    ? `center / cover no-repeat url(${mainPreviewUrl})`
                    : 'linear-gradient(145deg,#111 0%,#2a2a2a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: isMobile ? 18 : 22,
                  textAlign: 'center',
                  padding: 18,
                }}
              >
                {!mainPreviewUrl ? draft.title || 'Scooter' : null}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16 }}>
                      {draft.title || 'Title'}
                    </div>
                    <div style={{ fontSize: 12, color: A.g500 }}>
                      {selectedModel?.type_name || 'Type'} · {selectedModel?.engine_cc || 0}cc
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20 }}>
                    {draft.base_price_usd ? `$${draft.base_price_usd}` : '$0'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: draft.status === 'available' ? '#f0fdf4' : '#f5f5f5', color: draft.status === 'available' ? '#16a34a' : '#888', fontSize: 12, fontWeight: 600 }}>
                    {draft.status}
                  </span>
                  {draft.is_featured ? (
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: A.gold, color: A.black, fontSize: 12, fontWeight: 600 }}>
                      featured
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {!isMobile && (
                <Button variant="dark" onClick={handleSubmit} disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              )}
              <Link
                href={draft.slug ? `/scooter/${draft.slug}` : '#'}
                style={{ textDecoration: 'none', pointerEvents: draft.slug ? 'auto' : 'none' }}
              >
                <Button variant="outline" disabled={!draft.slug} style={{ width: '100%' }}>
                  Open public page
                </Button>
              </Link>
              <Link href="/admin?view=fleet" style={{ textDecoration: 'none' }}>
                <Button variant="outline" style={{ width: '100%' }}>
                  Back to fleet
                </Button>
              </Link>
            </div>

            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: A.g100, fontSize: 13, color: A.g700, lineHeight: 1.6 }}>
              Scooter #{scooterId} · {existingImages.length} photo{existingImages.length !== 1 ? 's' : ''} in gallery
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
