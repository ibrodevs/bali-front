'use client';

import Link from 'next/link';
import { ChangeEvent, CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import {
  AdminScooterModelPayload,
  AdminScooterPayload,
  AdminScooterRentalRatePayload,
  ApiVehicleModel,
  ApiVehicleTranslation,
  ApiVehicleType,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { DEFAULT_CURRENCY_RATES, formatCurrencyAmount } from '@/lib/i18n/CurrencyProvider';
import { createDefaultRentalRateDrafts, RentalRateDraft, validateRentalRateDrafts } from '@/lib/rentalRates';
import { useRouter } from 'next/navigation';

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

function formatIdrPreview(value?: string | number | null) {
  const amountUsd = Number(value ?? 0);
  const normalizedUsd = Number.isFinite(amountUsd) ? amountUsd : 0;
  const amountIdr = normalizedUsd * (DEFAULT_CURRENCY_RATES.IDR || 15650);
  const hasFraction = Math.abs(amountIdr % 1) > 0.000001;
  return formatCurrencyAmount(amountIdr, 'IDR', 'id-ID', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  });
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, ...style }}>{children}</div>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          color: A.g500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
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
  variant?: 'primary' | 'dark' | 'outline';
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { background: A.gold, color: A.black, border: 'none' },
    dark: { background: A.black, color: A.white, border: 'none' },
    outline: { background: 'transparent', color: A.black, border: `1.5px solid ${A.g200}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 10,
        padding: '12px 18px',
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
    <div
      style={{
        marginBottom: 16,
        background: A.redBg,
        color: A.red,
        borderRadius: 12,
        padding: '14px 16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
      }}
    >
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
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: 'vertical',
  lineHeight: 1.5,
};

type DraftModel = {
  type: string;
  brand: string;
  name: string;
  engine_cc: string;
  transmission: string;
  fuel_consumption: string;
  year: string;
  trunk: string;
  helmets_count: string;
  description: string;
  rental_terms: string;
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

type PhotoDraft = {
  file: File;
  preview: string;
  alt_text: string;
};

type TranslationDraft = {
  title: string;
  description: string;
  rental_terms: string;
  transmission: string;
  trunk: string;
  color: string;
};

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'Indonesia' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

const EMPTY_MODEL: DraftModel = {
  type: '',
  brand: '',
  name: '',
  engine_cc: '',
  transmission: '',
  fuel_consumption: '',
  year: String(new Date().getFullYear()),
  trunk: '',
  helmets_count: '1',
  description: '',
  rental_terms: '',
};

const EMPTY_SCOOTER: DraftScooter = {
  model: '',
  title: '',
  slug: '',
  sku: '',
  color: '',
  base_price_usd: '',
  status: 'available',
  mileage: '0',
  is_featured: false,
};

function createEmptyTranslations(): Record<string, TranslationDraft> {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale.code,
      { title: '', description: '', rental_terms: '', transmission: '', trunk: '', color: '' },
    ]),
  ) as Record<string, TranslationDraft>;
}

export default function AdminNewScooterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const canOpenAdmin = isAdminLike(user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<'existing' | 'new'>('new');
  const [vehicleTypes, setVehicleTypes] = useState<ApiVehicleType[]>([]);
  const [scooterModels, setScooterModels] = useState<ApiVehicleModel[]>([]);
  const [modelDraft, setModelDraft] = useState<DraftModel>(EMPTY_MODEL);
  const [scooterDraft, setScooterDraft] = useState<DraftScooter>(EMPTY_SCOOTER);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [translations, setTranslations] = useState<Record<string, TranslationDraft>>(createEmptyTranslations());
  const [activeLang, setActiveLang] = useState('en');
  const [rentalRates, setRentalRates] = useState<RentalRateDraft[]>(createDefaultRentalRateDrafts(''));

  useEffect(() => {
    return () => {
      photos.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [photos]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !canOpenAdmin) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [typesRes, modelsRes] = await Promise.all([endpoints.scooterTypes(), endpoints.scooterModels()]);
        if (cancelled) return;
        setVehicleTypes(unwrapList(typesRes));
        setScooterModels(unwrapList(modelsRes));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Unable to load scooter data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, canOpenAdmin]);

  const selectedModel = useMemo(
    () => scooterModels.find((item) => String(item.id) === scooterDraft.model),
    [scooterDraft.model, scooterModels],
  );

  function updateModelDraft<K extends keyof DraftModel>(key: K, value: DraftModel[K]) {
    setModelDraft((current) => ({ ...current, [key]: value }));
  }

  function updateScooterDraft<K extends keyof DraftScooter>(key: K, value: DraftScooter[K]) {
    setScooterDraft((current) => ({ ...current, [key]: value }));
  }

  function updateRentalRate(index: number, key: keyof RentalRateDraft, value: string) {
    setRentalRates((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function addRentalRateRow() {
    setRentalRates((current) => [...current, { min_days: '', max_days: '', price_usd: '', billing_period_days: '1', isNew: true }]);
  }

  function removeRentalRateRow(index: number) {
    setRentalRates((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetRentalRatesFromBasePrice() {
    setRentalRates(createDefaultRentalRateDrafts(scooterDraft.base_price_usd));
  }

  function handlePhotoPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: scooterDraft.title || file.name.replace(/\.[^.]+$/, ''),
    }));
    setPhotos((current) => [...current, ...next]);
    event.target.value = '';
  }

  function updatePhotoAlt(index: number, value: string) {
    setPhotos((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, alt_text: value } : item)));
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setMainPhotoIndex((current) => {
      if (index < current) return current - 1;
      if (index === current) return 0;
      return current;
    });
  }

  function getEnglishFallbacks() {
    return {
      title: scooterDraft.title.trim(),
      description: (modelMode === 'existing' ? selectedModel?.description : modelDraft.description)?.trim() || '',
      rental_terms: (modelMode === 'existing' ? selectedModel?.rental_terms : modelDraft.rental_terms)?.trim() || '',
      transmission: (modelMode === 'existing' ? selectedModel?.transmission : modelDraft.transmission)?.trim() || '',
      trunk: (modelMode === 'existing' ? selectedModel?.trunk : modelDraft.trunk)?.trim() || '',
      color: scooterDraft.color.trim(),
    };
  }

  function buildTranslationPayload() {
    const englishFallbacks = getEnglishFallbacks();
    return LOCALES.map((locale) => {
      const draftTranslation = translations[locale.code] || { title: '', description: '', rental_terms: '', transmission: '', trunk: '', color: '' };
      return {
        language: locale.code,
        title: draftTranslation.title.trim() || (locale.code === 'en' ? englishFallbacks.title : ''),
        description: draftTranslation.description.trim() || (locale.code === 'en' ? englishFallbacks.description : ''),
        rental_terms: draftTranslation.rental_terms.trim() || (locale.code === 'en' ? englishFallbacks.rental_terms : ''),
        transmission: draftTranslation.transmission.trim() || (locale.code === 'en' ? englishFallbacks.transmission : ''),
        trunk: draftTranslation.trunk.trim() || (locale.code === 'en' ? englishFallbacks.trunk : ''),
        color: draftTranslation.color.trim() || (locale.code === 'en' ? englishFallbacks.color : ''),
      };
    });
  }

  function validateTranslations() {
    const payload = buildTranslationPayload();
    const requiredFields: Array<keyof ApiVehicleTranslation> = ['title', 'description', 'rental_terms', 'transmission', 'trunk', 'color'];

    for (const locale of LOCALES) {
      const item = payload.find((translation) => translation.language === locale.code);
      const missing = requiredFields.filter((field) => !String(item?.[field] || '').trim());
      if (missing.length > 0) {
        setActiveLang(locale.code);
        throw new Error(`Fill all translation fields for ${locale.label}: ${missing.join(', ')}`);
      }
    }

    return payload;
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let modelId = scooterDraft.model ? Number(scooterDraft.model) : null;

      if (modelMode === 'new') {
        if (
          !modelDraft.type ||
          !modelDraft.brand.trim() ||
          !modelDraft.name.trim() ||
          !modelDraft.engine_cc ||
          !modelDraft.transmission.trim() ||
          !modelDraft.fuel_consumption ||
          !modelDraft.year ||
          !modelDraft.trunk.trim() ||
          !modelDraft.helmets_count ||
          !modelDraft.description.trim() ||
          !modelDraft.rental_terms.trim()
        ) {
          throw new Error('Fill in all model fields including description and rental terms.');
        }

        const createdModel = await endpoints.adminCreateScooterModel({
          type: Number(modelDraft.type),
          brand: modelDraft.brand.trim(),
          name: modelDraft.name.trim(),
          engine_cc: Number(modelDraft.engine_cc),
          transmission: modelDraft.transmission.trim(),
          fuel_consumption: Number(modelDraft.fuel_consumption),
          year: Number(modelDraft.year),
          trunk: modelDraft.trunk.trim(),
          helmets_count: Number(modelDraft.helmets_count),
          description: modelDraft.description.trim(),
          rental_terms: modelDraft.rental_terms.trim(),
        } satisfies AdminScooterModelPayload);

        modelId = createdModel.id;
      }

      if (!modelId) {
        throw new Error('Choose an existing model or create a new one.');
      }

      if (
        !scooterDraft.title.trim() ||
        !scooterDraft.slug.trim() ||
        !scooterDraft.base_price_usd
      ) {
        throw new Error('Fill in scooter title, slug and price.');
      }

      const translationPayload = validateTranslations();
      const validatedRates = validateRentalRateDrafts(rentalRates);

      const createdScooter = await endpoints.adminCreateScooter({
        model: modelId,
        title: scooterDraft.title.trim(),
        slug: scooterDraft.slug.trim(),
        sku: scooterDraft.sku.trim(),
        color: scooterDraft.color.trim(),
        base_price_usd: scooterDraft.base_price_usd,
        status: scooterDraft.status,
        mileage: Number(scooterDraft.mileage || 0),
        is_featured: scooterDraft.is_featured,
      } satisfies AdminScooterPayload);
      for (const rate of validatedRates) {
        await endpoints.adminCreateRentalRate({
          scooter: createdScooter.id,
          min_days: rate.min_days,
          max_days: rate.max_days,
          price_usd: rate.price_usd,
          billing_period_days: rate.billing_period_days,
        } satisfies AdminScooterRentalRatePayload);
      }

      await endpoints.adminSaveScooterTranslations(createdScooter.id, translationPayload);

      for (let index = 0; index < photos.length; index += 1) {
        const item = photos[index];
        await endpoints.adminUploadScooterImage(createdScooter.id, item.file, {
          alt_text: item.alt_text.trim() || createdScooter.title,
          sort_order: index,
          is_main: index === mainPhotoIndex,
        });
      }

      setSuccess('Scooter created and published to the site.');
      router.push('/admin?view=fleet');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to save scooter');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div style={{ minHeight: '100vh', background: A.bg, padding: 32, fontFamily: 'Inter, sans-serif' }}>Loading…</div>;
  }

  if (!user || !canOpenAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: A.bg, padding: 32, fontFamily: 'Inter, sans-serif' }}>
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

  return (
    <div style={{ minHeight: '100vh', background: A.bg, padding: 28, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Admin / Fleet
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, letterSpacing: '-0.04em', color: A.black }}>
              Add Scooter
            </h1>
            <p style={{ color: A.g500, marginTop: 8 }}>
              Create a new catalog item with description, rental terms and gallery. If status is `available`, it will appear on the site right away.
            </p>
          </div>
          <Link href="/admin?view=fleet" style={{ textDecoration: 'none' }}>
            <Button variant="outline">Back to fleet</Button>
          </Link>
        </div>

        <ErrorBanner error={error} />
        {success ? (
          <div style={{ marginBottom: 16, background: A.greenBg, color: A.green, borderRadius: 12, padding: '14px 16px', fontSize: 14 }}>
            {success}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, 0.85fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Panel style={{ padding: 22 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <Button variant={modelMode === 'new' ? 'dark' : 'outline'} onClick={() => setModelMode('new')}>
                  Create new model
                </Button>
                <Button variant={modelMode === 'existing' ? 'dark' : 'outline'} onClick={() => setModelMode('existing')}>
                  Use existing model
                </Button>
              </div>

              {modelMode === 'existing' ? (
                <Field label="Existing model">
                  <select value={scooterDraft.model} onChange={(event) => updateScooterDraft('model', event.target.value)} style={inputStyle}>
                    <option value="">Select model</option>
                    {scooterModels.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brand} {item.name} · {item.type_name || 'Category'} · {item.engine_cc}cc
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black }}>Model Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Category">
                      <select value={modelDraft.type} onChange={(event) => updateModelDraft('type', event.target.value)} style={inputStyle}>
                        <option value="">Select category</option>
                        {vehicleTypes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Brand">
                      <input value={modelDraft.brand} onChange={(event) => updateModelDraft('brand', event.target.value)} style={inputStyle} placeholder="Honda" />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Model name">
                      <input value={modelDraft.name} onChange={(event) => updateModelDraft('name', event.target.value)} style={inputStyle} placeholder="PCX 160" />
                    </Field>
                    <Field label="Transmission">
                      <input value={modelDraft.transmission} onChange={(event) => updateModelDraft('transmission', event.target.value)} style={inputStyle} placeholder="Automatic" />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                    <Field label="Engine cc">
                      <input type="number" value={modelDraft.engine_cc} onChange={(event) => updateModelDraft('engine_cc', event.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Fuel">
                      <input type="number" step="0.1" value={modelDraft.fuel_consumption} onChange={(event) => updateModelDraft('fuel_consumption', event.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Year">
                      <input type="number" value={modelDraft.year} onChange={(event) => updateModelDraft('year', event.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Helmets">
                      <input type="number" min="1" value={modelDraft.helmets_count} onChange={(event) => updateModelDraft('helmets_count', event.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="Trunk / storage">
                    <input value={modelDraft.trunk} onChange={(event) => updateModelDraft('trunk', event.target.value)} style={inputStyle} placeholder="Large under-seat storage" />
                  </Field>
                  <Field label="Detailed description">
                    <textarea value={modelDraft.description} onChange={(event) => updateModelDraft('description', event.target.value)} style={textAreaStyle} />
                  </Field>
                  <Field label="Rental terms">
                    <textarea value={modelDraft.rental_terms} onChange={(event) => updateModelDraft('rental_terms', event.target.value)} style={textAreaStyle} />
                  </Field>
                </div>
              )}
            </Panel>

            <Panel style={{ padding: 22 }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 16 }}>Scooter Card</div>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Title">
                    <input value={scooterDraft.title} onChange={(event) => updateScooterDraft('title', event.target.value)} style={inputStyle} placeholder="Honda PCX 160" />
                  </Field>
                  <Field label="SKU">
                    <input value={scooterDraft.sku} onChange={(event) => updateScooterDraft('sku', event.target.value)} style={inputStyle} placeholder="PCX-160-WHT" />
                  </Field>
                </div>
                <Field label="Slug">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                    <input value={scooterDraft.slug} onChange={(event) => updateScooterDraft('slug', event.target.value)} style={inputStyle} placeholder="honda-pcx-160" />
                    <Button variant="outline" onClick={() => updateScooterDraft('slug', slugify(scooterDraft.title || scooterDraft.slug))}>Auto</Button>
                  </div>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                  <Field label="Color">
                    <input value={scooterDraft.color} onChange={(event) => updateScooterDraft('color', event.target.value)} style={inputStyle} placeholder="White" />
                  </Field>
                  <Field label="Base price / day (USD)" hint="Stored in USD base, preview uses IDR by default.">
                    <input type="number" step="0.01" value={scooterDraft.base_price_usd} onChange={(event) => updateScooterDraft('base_price_usd', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Mileage">
                    <input type="number" min="0" value={scooterDraft.mileage} onChange={(event) => updateScooterDraft('mileage', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Status" hint="Use available to show on the public catalog immediately.">
                    <select value={scooterDraft.status} onChange={(event) => updateScooterDraft('status', event.target.value)} style={inputStyle}>
                      <option value="available">available</option>
                      <option value="rented">rented</option>
                      <option value="maintenance">maintenance</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </Field>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <input type="checkbox" checked={scooterDraft.is_featured} onChange={(event) => updateScooterDraft('is_featured', event.target.checked)} />
                  <span>Feature on website homepage</span>
                </label>
              </div>
            </Panel>

            <Panel style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black }}>Tariffs</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, marginTop: 4 }}>
                    Set rental ranges without overlaps. Use billing period `30` for monthly prices.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Button variant="outline" onClick={resetRentalRatesFromBasePrice}>Fill from base price</Button>
                  <Button variant="outline" onClick={addRentalRateRow}>Add range</Button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 120px 88px', gap: 10, fontSize: 12, color: A.g500, fontWeight: 700 }}>
                  <span>From</span>
                  <span>To</span>
                  <span>Base price USD</span>
                  <span>Billing days</span>
                  <span />
                </div>
                {rentalRates.map((rate, index) => (
                  <div key={`rate-${index}`} style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 120px 88px', gap: 10, alignItems: 'center' }}>
                    <input type="number" min="1" value={rate.min_days} onChange={(event) => updateRentalRate(index, 'min_days', event.target.value)} style={inputStyle} />
                    <input type="number" min="1" value={rate.max_days} onChange={(event) => updateRentalRate(index, 'max_days', event.target.value)} style={inputStyle} placeholder="∞" />
                    <input type="number" min="0" step="0.01" value={rate.price_usd} onChange={(event) => updateRentalRate(index, 'price_usd', event.target.value)} style={inputStyle} />
                    <input type="number" min="1" value={rate.billing_period_days} onChange={(event) => updateRentalRate(index, 'billing_period_days', event.target.value)} style={inputStyle} />
                    <Button variant="outline" onClick={() => removeRentalRateRow(index)} disabled={rentalRates.length === 1}>Remove</Button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel style={{ padding: 22 }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 4 }}>Translations</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, marginBottom: 16 }}>
                Detail screen content comes from backend in the selected language, so fill every language before publishing.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {LOCALES.map((locale) => {
                  const draftTranslation = translations[locale.code];
                  const hasTranslation = Boolean(
                    draftTranslation?.title ||
                    draftTranslation?.description ||
                    draftTranslation?.rental_terms ||
                    draftTranslation?.transmission ||
                    draftTranslation?.trunk ||
                    draftTranslation?.color,
                  );
                  return (
                    <button
                      key={locale.code}
                      type="button"
                      onClick={() => setActiveLang(locale.code)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: activeLang === locale.code ? `2px solid ${A.black}` : `1.5px solid ${A.g200}`,
                        background: activeLang === locale.code ? A.black : hasTranslation ? A.greenBg : A.white,
                        color: activeLang === locale.code ? A.white : hasTranslation ? A.green : A.g700,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {locale.code.toUpperCase()}
                      {hasTranslation ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
              {LOCALES.map((locale) => {
                const translation = translations[locale.code] || { title: '', description: '', rental_terms: '', transmission: '', trunk: '', color: '' };
                const fallbackDescription = modelMode === 'existing' ? selectedModel?.description : modelDraft.description;
                const fallbackRentalTerms = modelMode === 'existing' ? selectedModel?.rental_terms : modelDraft.rental_terms;
                const fallbackTransmission = modelMode === 'existing' ? selectedModel?.transmission : modelDraft.transmission;
                const fallbackTrunk = modelMode === 'existing' ? selectedModel?.trunk : modelDraft.trunk;
                const fallbackColor = scooterDraft.color;
                return (
                  <div key={locale.code} style={{ display: activeLang === locale.code ? 'grid' : 'none', gap: 14 }}>
                    <Field label={`Title (${locale.label})`}>
                      <input
                        value={translation.title}
                        onChange={(event) =>
                          setTranslations((current) => ({
                            ...current,
                            [locale.code]: { ...current[locale.code], title: event.target.value },
                          }))
                        }
                        style={inputStyle}
                        placeholder={locale.code === 'en' ? scooterDraft.title || 'Vehicle title' : `Title in ${locale.label}`}
                      />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                      <Field label={`Transmission (${locale.label})`}>
                        <input
                          value={translation.transmission}
                          onChange={(event) =>
                            setTranslations((current) => ({
                              ...current,
                              [locale.code]: { ...current[locale.code], transmission: event.target.value },
                            }))
                          }
                          style={inputStyle}
                          placeholder={locale.code === 'en' ? fallbackTransmission || 'Automatic CVT' : `Transmission in ${locale.label}`}
                        />
                      </Field>
                      <Field label={`Storage / Trunk (${locale.label})`}>
                        <input
                          value={translation.trunk}
                          onChange={(event) =>
                            setTranslations((current) => ({
                              ...current,
                              [locale.code]: { ...current[locale.code], trunk: event.target.value },
                            }))
                          }
                          style={inputStyle}
                          placeholder={locale.code === 'en' ? fallbackTrunk || '18L underseat' : `Storage in ${locale.label}`}
                        />
                      </Field>
                      <Field label={`Color (${locale.label})`}>
                        <input
                          value={translation.color}
                          onChange={(event) =>
                            setTranslations((current) => ({
                              ...current,
                              [locale.code]: { ...current[locale.code], color: event.target.value },
                            }))
                          }
                          style={inputStyle}
                          placeholder={locale.code === 'en' ? fallbackColor || 'Pastel Blue' : `Color in ${locale.label}`}
                        />
                      </Field>
                    </div>
                    <Field label={`Description (${locale.label})`}>
                      <textarea
                        value={translation.description}
                        onChange={(event) =>
                          setTranslations((current) => ({
                            ...current,
                            [locale.code]: { ...current[locale.code], description: event.target.value },
                          }))
                        }
                        style={textAreaStyle}
                        placeholder={locale.code === 'en' ? fallbackDescription || 'Description' : `Description in ${locale.label}`}
                      />
                    </Field>
                    <Field label={`Rental Terms (${locale.label})`}>
                      <textarea
                        value={translation.rental_terms}
                        onChange={(event) =>
                          setTranslations((current) => ({
                            ...current,
                            [locale.code]: { ...current[locale.code], rental_terms: event.target.value },
                          }))
                        }
                        style={textAreaStyle}
                        placeholder={locale.code === 'en' ? fallbackRentalTerms || 'Rental terms' : `Rental terms in ${locale.label}`}
                      />
                    </Field>
                  </div>
                );
              })}
            </Panel>

            <Panel style={{ padding: 22 }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 16 }}>Photos</div>
              <Field label="Upload gallery" hint="The selected main photo will be used as the primary image on the site.">
                <input type="file" accept="image/*" multiple onChange={handlePhotoPick} style={inputStyle} />
              </Field>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {photos.length === 0 ? (
                  <div style={{ border: `1px dashed ${A.g200}`, borderRadius: 14, padding: 24, color: A.g500, textAlign: 'center' }}>
                    Add one or more photos for the site gallery.
                  </div>
                ) : (
                  photos.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 14, alignItems: 'center' }}>
                      <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${A.g200}`, background: A.g100, aspectRatio: '4 / 3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.preview} alt={item.alt_text || item.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <Field label={`Alt text ${index + 1}`}>
                          <input value={item.alt_text} onChange={(event) => updatePhotoAlt(index, event.target.value)} style={inputStyle} />
                        </Field>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                          <input type="radio" checked={mainPhotoIndex === index} onChange={() => setMainPhotoIndex(index)} />
                          <span>Main photo</span>
                        </label>
                      </div>
                      <Button variant="outline" onClick={() => removePhoto(index)}>Remove</Button>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          <Panel style={{ padding: 22, position: 'sticky', top: 28 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, marginBottom: 14 }}>Preview</div>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${A.g200}`, marginBottom: 16 }}>
              <div
                style={{
                  height: 220,
                  background: photos[mainPhotoIndex]?.preview
                    ? `center / cover no-repeat url(${photos[mainPhotoIndex].preview})`
                    : selectedModel
                      ? `linear-gradient(145deg,#111 0%,#2a2a2a 100%)`
                      : A.g100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: 22,
                  textAlign: 'center',
                  padding: 18,
                }}
              >
                {!photos[mainPhotoIndex]?.preview ? scooterDraft.title || 'New scooter' : null}
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18 }}>{scooterDraft.title || 'Title pending'}</div>
                    <div style={{ fontSize: 12, color: A.g500 }}>
                      {(modelMode === 'existing' ? selectedModel?.type_name : vehicleTypes.find((item) => String(item.id) === modelDraft.type)?.name) || 'Category'}
                      {' · '}
                      {(modelMode === 'existing' ? selectedModel?.engine_cc : modelDraft.engine_cc) || '0'}cc
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 22 }}>
                    {formatIdrPreview(scooterDraft.base_price_usd)}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: A.g700, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {modelMode === 'existing'
                    ? selectedModel?.description || 'Description will come from the selected model.'
                    : modelDraft.description || 'Detailed description will appear here.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <Button variant="dark" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Save and publish'}
              </Button>
              <Link href={scooterDraft.slug ? `/scooter/${scooterDraft.slug}` : '#'} style={{ textDecoration: 'none', pointerEvents: scooterDraft.slug ? 'auto' : 'none' }}>
                <Button variant="outline" disabled={!scooterDraft.slug} style={{ width: '100%' }}>
                  Open public page
                </Button>
              </Link>
            </div>

            <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: A.g100, fontSize: 13, color: A.g700, lineHeight: 1.6 }}>
              Saved content reaches the website from the same API the storefront already uses:
              <br />
              photos from vehicle gallery,
              <br />
              titles and translations from vehicle translations,
              <br />
              specs and detail copy from localized backend fields,
              <br />
              price and status from the scooter card.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
