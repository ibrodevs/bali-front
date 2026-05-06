'use client';
import { useEffect, useMemo, useState } from 'react';
import { BRLogo, BREyebrow, BRChip, BRPrimary, BROutline } from '@/components/BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { ApiBooking, endpoints, unwrapList } from '@/lib/endpoints';

export default function AdminPage() {
  const { t, locale, tr } = useLocale();
  const { user, loading } = useAuth();
  const [active, setActive] = useState(t.admin.bookings);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);

  const items = [t.admin.overview, t.admin.bookings, t.admin.fleet, t.admin.riders, t.admin.calendar, t.admin.payouts, t.admin.settings];

  useEffect(() => {
    if (loading || user?.role !== 'admin') return;
    endpoints.bookingsList(locale).then((res) => setBookings(unwrapList(res))).catch(() => setBookings([]));
  }, [loading, user, locale]);

  useEffect(() => {
    setActive(t.admin.bookings);
  }, [t.admin.bookings]);

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const activeBookings = bookings.filter((booking) => booking.status === 'active').length;
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed').length;
    return { totalBookings, revenue, activeBookings, confirmed };
  }, [bookings]);

  return (
    <div className="br-admin-shell" style={{ background: '#fff', color: '#000', minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <aside className="br-admin-sidebar" style={{ background: '#0F0F0F', color: '#fff', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px 24px' }}>
          <BRLogo size={20} dark />
        </div>
        <nav className="br-admin-nav" style={{ flex: 1 }}>
          {items.map((i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 24px',
                background: 'transparent',
                color: active === i ? '#fff' : 'rgba(255,255,255,0.55)',
                border: 0,
                borderLeft: `3px solid ${active === i ? '#FFD700' : 'transparent'}`,
                fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: active === i ? 600 : 400,
                cursor: 'pointer'
              }}>
              {i}
            </button>
          ))}
        </nav>
        <div style={{ padding: '24px' }}>
          <div style={{ background: '#1A1A1A', borderRadius: 10, padding: 14 }}>
            <div className="br-mono" style={{ fontSize: 10, color: '#FFD700', letterSpacing: '0.14em' }}>{t.admin.fleetStatus}</div>
            <div className="br-display" style={{ fontSize: 22, marginTop: 6 }}>{t.admin.live}</div>
            <div className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{t.admin.deployed}</div>
          </div>
        </div>
      </aside>

      <main className="br-admin-main" style={{ padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <BREyebrow>{tr(t.admin.title, { section: active }).toUpperCase()}</BREyebrow>
            <h1 className="br-display" style={{ fontSize: 40, margin: '6px 0 0', letterSpacing: '-0.03em' }}>{active}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <BROutline>{t.admin.export}</BROutline>
            <BRPrimary>{t.admin.new}</BRPrimary>
          </div>
        </div>

        <div className="br-admin-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 28 }}>
          {([
            [t.admin.cards.totalBookings, String(metrics.totalBookings || 0), 'LIVE', 'API'],
            [t.admin.cards.revenue, `$${metrics.revenue.toFixed(2)}`, 'LIVE', 'API'],
            [t.admin.cards.activeRentals, String(metrics.activeBookings || 0), 'LIVE', 'API'],
            [t.admin.cards.availability, metrics.totalBookings ? `${Math.round((metrics.confirmed / metrics.totalBookings) * 100)}%` : '0%', 'LIVE', 'API'],
          ] as const).map(([l, v, d, sub], i) => (
            <div key={i} style={{ border: '1px solid #E6E6E6', borderRadius: 12, padding: 20, background: i === 0 ? '#FFD700' : '#fff' }}>
              <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>{l.toUpperCase()}</div>
              <div className="br-display" style={{ fontSize: 36, marginTop: 8, letterSpacing: '-0.03em' }}>{v}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, fontFamily: 'var(--br-mono)', fontSize: 11 }}>
                <span style={{ color: '#000', fontWeight: 600 }}>{d}</span>
                <span style={{ color: 'rgba(0,0,0,0.55)' }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
          {t.admin.filters.map((f, i) => (
            <button key={f} className="br-mono" style={{
              padding: '6px 12px', borderRadius: 999,
              background: i === 0 ? '#000' : 'transparent',
              color: i === 0 ? '#fff' : '#000',
              border: `1px solid ${i === 0 ? '#000' : '#E6E6E6'}`,
              fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer'
            }}>{f.toUpperCase()}</button>
          ))}
        </div>

        <div className="br-admin-table-wrap" style={{ marginTop: 16, border: '1px solid #E6E6E6', borderRadius: 12, overflow: 'hidden' }}>
          <div className="br-admin-table-head" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr 90px 130px 50px', padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E6E6E6', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.12em', color: '#888' }}>
            <span>{t.admin.table.booking}</span><span>{t.admin.table.rider}</span><span>{t.admin.table.scooter}</span><span>{t.admin.table.dates}</span><span>{t.admin.table.total}</span><span>{t.admin.table.status}</span><span></span>
          </div>
          {user?.role !== 'admin' ? (
            <div className="br-mono" style={{ padding: 20, color: '#666' }}>{t.admin.needAuth}</div>
          ) : bookings.length === 0 ? (
            <div className="br-mono" style={{ padding: 20, color: '#666' }}>{loading ? t.common.loading : t.admin.empty}</div>
          ) : (
            bookings.map((booking, i) => (
              <div key={booking.id} className="br-admin-table-row" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr 90px 130px 50px', padding: '16px 20px', borderBottom: i < bookings.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center', fontSize: 13 }}>
                <span className="br-mono">#{booking.order_number}</span>
                <span style={{ fontWeight: 500 }}>{booking.user || '—'}</span>
                <span>{booking.scooter?.title || '—'}</span>
                <span className="br-mono" style={{ color: '#666' }}>
                  {new Date(booking.start_datetime).toLocaleDateString(locale)} → {new Date(booking.end_datetime).toLocaleDateString(locale)}
                </span>
                <span className="br-mono" style={{ fontWeight: 600 }}>${booking.total_price}</span>
                <span><BRChip status={booking.status} /></span>
                <span style={{ color: '#888', textAlign: 'right' }}>···</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
