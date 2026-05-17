'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BRPhoto, BREyebrow, BRPrimary } from '@/components/BR';
import { CheckIcon, CreditCardIcon, CryptoIcon, LockIcon, WalletIcon, stripLeadingSymbol } from '@/components/Icons';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ApiError, tokens, userStore } from '@/lib/api';
import { bookingDraftStore } from '@/lib/bookingDraft';
import { ApiBooking, ApiBookingQuote, endpoints, toApiPaymentMethod } from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { convertAmount, formatCurrencyAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type PaymentMethod = 'card' | 'cash' | 'crypto';

const PAYMENT_COPY = {
  en: {
    missingDetails: 'Booking details were not found. Please return to step 2.',
    cardNameRequired: 'Enter the cardholder name.',
    cardNumberInvalid: 'Card number looks invalid.',
    cardExpiryInvalid: 'Expiry date must be in MM/YY format.',
    cardCvcInvalid: 'CVC is invalid.',
    cashConsent: 'Please confirm payment on delivery.',
    draftMissing: 'Booking draft not found',
    guestRequired: 'Enter your name and phone to continue',
    bookingName: 'Scooter booking',
    pageTitle: 'Payment and confirmation',
    reserved: 'BOOKING RESERVED',
    confirmed: 'RESERVATION CONFIRMED',
    reservedDesc: 'Your scooter is reserved. It is already visible in your profile and you can pay on delivery.',
    openProfile: 'Open profile',
    contactDetails: 'CONTACT DETAILS',
    alreadyHave: 'Already have an account? Sign in',
    messengerTitle: 'MESSENGERS ON THIS NUMBER',
    messengerHint: 'Mark where we can contact you faster about the booking.',
    reserveCash: 'Reserve (pay on delivery) →',
    payCrypto: 'Pay {currency} →',
    bookingLabel: 'BOOKING',
    base: 'Base',
    addons: 'Add-ons',
    bankCard: 'BANK CARD · STRIPE',
    bankCardDesc: 'After the booking is created, we will redirect you to a secure Stripe page to finish payment. This form is a preview.',
    cardholder: 'Cardholder name',
    cardNumber: 'Card number',
    cardExpiry: 'Expiry (MM/YY)',
    cashTitle: 'CASH ON DELIVERY',
    cashDesc: 'The courier will bring the scooter to the address provided. Pay in cash upon delivery (USD or IDR at the daily rate).',
    deliveryAddress: 'DELIVERY ADDRESS',
    noDelivery: 'You did not specify a delivery address on step 2. Go back and fill it in.',
    cashBullet1: 'Booking is confirmed immediately, free cancellation up to 24 hours before.',
    cashBullet2: 'Deposit on delivery: passport or refundable $100.',
    cashBullet3: 'Cash payment on the rental start day.',
    cashConfirm: 'I confirm that I am ready to pay in cash on delivery and will be available at the specified time.',
    cryptoTitle: 'CRYPTO PAYMENT',
    cryptoDesc: 'We will create an invoice with the crypto provider. After confirmation you will receive the wallet address and the amount due.',
    selectCurrency: 'SELECT CURRENCY',
    amount: 'AMOUNT',
    amountHint: 'the exact amount will be shown after the invoice is created',
  },
  ru: {
    missingDetails: 'Детали бронирования не найдены. Вернитесь к шагу 2.',
    cardNameRequired: 'Введите имя владельца карты.',
    cardNumberInvalid: 'Номер карты выглядит некорректно.',
    cardExpiryInvalid: 'Срок действия должен быть в формате MM/YY.',
    cardCvcInvalid: 'CVC указан некорректно.',
    cashConsent: 'Подтвердите оплату при доставке.',
    draftMissing: 'Черновик бронирования не найден',
    guestRequired: 'Введите имя и телефон, чтобы продолжить',
    bookingName: 'Бронирование скутера',
    pageTitle: 'Оплата и подтверждение',
    reserved: 'БРОНЬ СОЗДАНА',
    confirmed: 'БРОНЬ ПОДТВЕРЖДЕНА',
    reservedDesc: 'Ваш скутер забронирован. Он уже виден в профиле, а оплатить можно при доставке.',
    openProfile: 'Открыть профиль',
    contactDetails: 'КОНТАКТНЫЕ ДАННЫЕ',
    alreadyHave: 'Уже есть аккаунт? Войти',
    messengerTitle: 'МЕССЕНДЖЕРЫ НА ЭТОМ НОМЕРЕ',
    messengerHint: 'Отметьте, где с вами быстрее связаться по бронированию.',
    reserveCash: 'Зарезервировать (оплата при доставке) →',
    payCrypto: 'Оплатить {currency} →',
    bookingLabel: 'БРОНЬ',
    base: 'База',
    addons: 'Допы',
    bankCard: 'БАНКОВСКАЯ КАРТА · STRIPE',
    bankCardDesc: 'После создания брони мы перенаправим вас на безопасную страницу Stripe для завершения оплаты. Эта форма показывает предварительные данные.',
    cardholder: 'Имя владельца',
    cardNumber: 'Номер карты',
    cardExpiry: 'Срок (MM/YY)',
    cashTitle: 'ОПЛАТА ПРИ ДОСТАВКЕ',
    cashDesc: 'Курьер привезёт скутер по указанному адресу. Оплатите наличными при получении (USD или IDR по дневному курсу).',
    deliveryAddress: 'АДРЕС ДОСТАВКИ',
    noDelivery: 'Вы не указали адрес доставки на шаге 2. Вернитесь и заполните его.',
    cashBullet1: 'Бронь подтверждается сразу, бесплатная отмена за 24 часа.',
    cashBullet2: 'Депозит при получении: паспорт или возвратные 100$.',
    cashBullet3: 'Оплата наличными в день начала аренды.',
    cashConfirm: 'Я подтверждаю, что готов оплатить наличными при получении и обязуюсь быть на месте в указанное время.',
    cryptoTitle: 'КРИПТО-ОПЛАТА',
    cryptoDesc: 'Мы создадим инвойс через крипто-провайдера. После подтверждения вы получите адрес кошелька и сумму к оплате.',
    selectCurrency: 'ВЫБЕРИТЕ ВАЛЮТУ',
    amount: 'СУММА',
    amountHint: 'точная сумма будет показана после создания инвойса',
  },
  zh: { missingDetails: '未找到预订信息，请返回第 2 步。', cardNameRequired: '请输入持卡人姓名。', cardNumberInvalid: '银行卡号看起来无效。', cardExpiryInvalid: '有效期必须为 MM/YY 格式。', cardCvcInvalid: 'CVC 无效。', cashConsent: '请确认到付付款。', draftMissing: '未找到预订草稿', guestRequired: '请输入姓名和电话以继续', bookingName: '摩托预订', pageTitle: '支付与确认', reserved: '预订已创建', confirmed: '预订已确认', reservedDesc: '您的车辆已预留，可在个人资料中查看并在交付时付款。', openProfile: '打开资料', contactDetails: '联系信息', alreadyHave: '已有账户？登录', messengerTitle: '此号码可用的聊天软件', messengerHint: '勾选我们可以更快联系您的方式。', reserveCash: '预留（交付时付款）→', payCrypto: '支付 {currency} →', bookingLabel: '预订', base: '基础价', addons: '附加项', bankCard: '银行卡 · STRIPE', bankCardDesc: '创建预订后，我们会将您跳转到安全的 Stripe 页面完成付款。此表单仅为预览。', cardholder: '持卡人姓名', cardNumber: '卡号', cardExpiry: '有效期 (MM/YY)', cashTitle: '货到付款', cashDesc: '配送员会将车辆送到指定地址。交付时支付现金（USD 或按日汇率的 IDR）。', deliveryAddress: '送车地址', noDelivery: '您在第 2 步没有填写送车地址，请返回补充。', cashBullet1: '预订立即确认，24 小时前可免费取消。', cashBullet2: '交付时押金：护照或可退还 100 美元。', cashBullet3: '在租赁开始当天现金支付。', cashConfirm: '我确认会在交付时现金支付，并按时在指定地点等候。', cryptoTitle: '加密支付', cryptoDesc: '我们会通过加密支付服务创建账单。确认后您将收到钱包地址和应付金额。', selectCurrency: '选择币种', amount: '金额', amountHint: '创建账单后会显示准确金额' },
  id: { missingDetails: 'Detail pesanan tidak ditemukan. Kembali ke langkah 2.', cardNameRequired: 'Masukkan nama pemilik kartu.', cardNumberInvalid: 'Nomor kartu tampak tidak valid.', cardExpiryInvalid: 'Tanggal berlaku harus format MM/YY.', cardCvcInvalid: 'CVC tidak valid.', cashConsent: 'Harap konfirmasi pembayaran saat pengantaran.', draftMissing: 'Draft pesanan tidak ditemukan', guestRequired: 'Masukkan nama dan nomor telepon untuk melanjutkan', bookingName: 'Pemesanan skuter', pageTitle: 'Pembayaran dan konfirmasi', reserved: 'PESANAN DIBUAT', confirmed: 'PESANAN DIKONFIRMASI', reservedDesc: 'Skuter Anda sudah dipesan. Sudah terlihat di profil dan bisa dibayar saat pengantaran.', openProfile: 'Buka profil', contactDetails: 'DETAIL KONTAK', alreadyHave: 'Sudah punya akun? Masuk', messengerTitle: 'MESSENGER DI NOMOR INI', messengerHint: 'Centang aplikasi yang bisa kami pakai untuk menghubungi Anda lebih cepat.', reserveCash: 'Pesan (bayar saat antar) →', payCrypto: 'Bayar {currency} →', bookingLabel: 'PESANAN', base: 'Dasar', addons: 'Tambahan', bankCard: 'KARTU BANK · STRIPE', bankCardDesc: 'Setelah pesanan dibuat, kami akan mengarahkan Anda ke halaman Stripe yang aman untuk menyelesaikan pembayaran. Formulir ini hanya pratinjau.', cardholder: 'Nama pemilik kartu', cardNumber: 'Nomor kartu', cardExpiry: 'Masa berlaku (MM/YY)', cashTitle: 'BAYAR SAAT ANTAR', cashDesc: 'Kurir akan membawa skuter ke alamat yang diberikan. Bayar tunai saat diterima (USD atau IDR sesuai kurs harian).', deliveryAddress: 'ALAMAT PENGANTARAN', noDelivery: 'Anda belum mengisi alamat pengantaran pada langkah 2. Kembali dan lengkapi.', cashBullet1: 'Pesanan langsung dikonfirmasi, pembatalan gratis hingga 24 jam sebelumnya.', cashBullet2: 'Deposit saat terima: paspor atau US$100 refundable.', cashBullet3: 'Pembayaran tunai pada hari mulai sewa.', cashConfirm: 'Saya mengonfirmasi siap membayar tunai saat pengantaran dan akan berada di lokasi pada waktu yang ditentukan.', cryptoTitle: 'PEMBAYARAN KRIPTO', cryptoDesc: 'Kami akan membuat invoice melalui penyedia kripto. Setelah konfirmasi Anda akan menerima alamat wallet dan jumlah pembayaran.', selectCurrency: 'PILIH MATA UANG', amount: 'JUMLAH', amountHint: 'jumlah tepat akan ditampilkan setelah invoice dibuat' },
  de: { missingDetails: 'Buchungsdetails wurden nicht gefunden. Bitte zu Schritt 2 zurückkehren.', cardNameRequired: 'Bitte Namen des Karteninhabers eingeben.', cardNumberInvalid: 'Kartennummer scheint ungültig zu sein.', cardExpiryInvalid: 'Ablaufdatum muss im Format MM/YY sein.', cardCvcInvalid: 'CVC ist ungültig.', cashConsent: 'Bitte Zahlung bei Lieferung bestätigen.', draftMissing: 'Buchungsentwurf nicht gefunden', guestRequired: 'Bitte Name und Telefonnummer eingeben, um fortzufahren', bookingName: 'Rollerbuchung', pageTitle: 'Zahlung und Bestätigung', reserved: 'BUCHUNG ERSTELLT', confirmed: 'BUCHUNG BESTÄTIGT', reservedDesc: 'Dein Roller ist reserviert. Er ist bereits im Profil sichtbar und kann bei Lieferung bezahlt werden.', openProfile: 'Profil öffnen', contactDetails: 'KONTAKTDATEN', alreadyHave: 'Schon ein Konto? Anmelden', messengerTitle: 'MESSENGER AUF DIESER NUMMER', messengerHint: 'Markiere, über welche Apps wir dich zur Buchung schneller erreichen können.', reserveCash: 'Reservieren (bei Lieferung zahlen) →', payCrypto: '{currency} bezahlen →', bookingLabel: 'BUCHUNG', base: 'Basis', addons: 'Extras', bankCard: 'BANKKARTE · STRIPE', bankCardDesc: 'Nach Erstellung der Buchung leiten wir dich zur sicheren Stripe-Seite weiter. Dieses Formular ist nur eine Vorschau.', cardholder: 'Name des Karteninhabers', cardNumber: 'Kartennummer', cardExpiry: 'Ablauf (MM/YY)', cashTitle: 'ZAHLUNG BEI LIEFERUNG', cashDesc: 'Der Kurier bringt den Roller an die angegebene Adresse. Bezahle bar bei Übergabe (USD oder IDR zum Tageskurs).', deliveryAddress: 'LIEFERADRESSE', noDelivery: 'Du hast in Schritt 2 keine Lieferadresse angegeben. Bitte zurückgehen und ergänzen.', cashBullet1: 'Buchung wird sofort bestätigt, kostenlose Stornierung bis 24 Stunden vorher.', cashBullet2: 'Kaution bei Übergabe: Reisepass oder rückzahlbare 100 $.', cashBullet3: 'Barzahlung am ersten Miettag.', cashConfirm: 'Ich bestätige, dass ich bei Lieferung bar bezahlen werde und zur angegebenen Zeit vor Ort bin.', cryptoTitle: 'KRYPTOZAHLUNG', cryptoDesc: 'Wir erstellen eine Rechnung über den Krypto-Anbieter. Nach der Bestätigung erhältst du Wallet-Adresse und Betrag.', selectCurrency: 'WÄHRUNG WÄHLEN', amount: 'BETRAG', amountHint: 'der genaue Betrag wird nach Erstellung der Rechnung angezeigt' },
  fr: { missingDetails: 'Les détails de réservation sont introuvables. Revenez à l’étape 2.', cardNameRequired: 'Veuillez saisir le nom du titulaire.', cardNumberInvalid: 'Le numéro de carte semble invalide.', cardExpiryInvalid: 'La date d’expiration doit être au format MM/YY.', cardCvcInvalid: 'Le CVC est invalide.', cashConsent: 'Veuillez confirmer le paiement à la livraison.', draftMissing: 'Brouillon de réservation introuvable', guestRequired: 'Saisissez votre nom et votre téléphone pour continuer', bookingName: 'Réservation du scooter', pageTitle: 'Paiement et confirmation', reserved: 'RÉSERVATION CRÉÉE', confirmed: 'RÉSERVATION CONFIRMÉE', reservedDesc: 'Votre scooter est réservé. Il est déjà visible dans votre profil et vous pourrez payer à la livraison.', openProfile: 'Ouvrir le profil', contactDetails: 'COORDONNÉES', alreadyHave: 'Déjà un compte ? Se connecter', messengerTitle: 'MESSAGERIES SUR CE NUMÉRO', messengerHint: 'Cochez les apps sur lesquelles nous pouvons vous joindre plus vite.', reserveCash: 'Réserver (payer à la livraison) →', payCrypto: 'Payer {currency} →', bookingLabel: 'RÉSERVATION', base: 'Base', addons: 'Options', bankCard: 'CARTE BANCAIRE · STRIPE', bankCardDesc: 'Après création de la réservation, nous vous redirigerons vers une page Stripe sécurisée pour terminer le paiement. Ce formulaire est un aperçu.', cardholder: 'Nom du titulaire', cardNumber: 'Numéro de carte', cardExpiry: 'Expiration (MM/YY)', cashTitle: 'PAIEMENT À LA LIVRAISON', cashDesc: 'Le coursier apportera le scooter à l’adresse indiquée. Payez en espèces à la livraison (USD ou IDR au taux du jour).', deliveryAddress: 'ADRESSE DE LIVRAISON', noDelivery: 'Vous n’avez pas indiqué d’adresse de livraison à l’étape 2. Revenez en arrière pour la renseigner.', cashBullet1: 'La réservation est confirmée immédiatement, annulation gratuite jusqu’à 24 h avant.', cashBullet2: 'Dépôt à la livraison : passeport ou 100 $ remboursables.', cashBullet3: 'Paiement en espèces le jour du début de location.', cashConfirm: 'Je confirme être prêt à payer en espèces à la livraison et à être présent à l’heure indiquée.', cryptoTitle: 'PAIEMENT CRYPTO', cryptoDesc: 'Nous créerons une facture via le prestataire crypto. Après confirmation, vous recevrez l’adresse du portefeuille et le montant à payer.', selectCurrency: 'CHOISIR LA DEVISE', amount: 'MONTANT', amountHint: 'le montant exact sera affiché après création de la facture' },
} as const;
type PaymentCopy = (typeof PAYMENT_COPY)[keyof typeof PAYMENT_COPY];

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentInner />
    </Suspense>
  );
}

function PaymentInner() {
  const { t, tr, locale } = useLocale();
  const copy = PAYMENT_COPY[locale as keyof typeof PAYMENT_COPY] || PAYMENT_COPY.en;
  const { user, refresh } = useAuth();
  const { currency: selectedCurrency } = useCurrency();
  const search = useSearchParams();
  const existingBookingId = Number(search.get('booking_id') || '0');
  const [draft, setDraft] = useState(bookingDraftStore.get());
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [quote, setQuote] = useState<ApiBookingQuote | null>(null);
  const [pm, setPm] = useState<PaymentMethod>(
    search.get('payment') === 'cash' ? 'cash' : search.get('payment') === 'crypto' ? 'crypto' : 'card'
  );
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestHasTelegram, setGuestHasTelegram] = useState(false);
  const [guestHasWechat, setGuestHasWechat] = useState(false);
  const [guestHasWhatsapp, setGuestHasWhatsapp] = useState(false);

  // Card form (UI only — actual processing happens at the redirected provider)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Crypto-specific UI
  const [cryptoCurrency] = useState<'USDT'>('USDT');

  // Cash-specific UI
  const [cashConfirmedTerms, setCashConfirmedTerms] = useState(false);

  const [loading, setLoading] = useState(Boolean(existingBookingId) || Boolean(draft));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const surf = '#F5F5F5';
  const border = 'rgba(0,0,0,0.08)';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (existingBookingId) {
          const nextBooking = await endpoints.booking(existingBookingId, locale);
          if (cancelled) return;
          setBooking(nextBooking);
          setPaid(nextBooking.payment_status === 'paid' || nextBooking.latest_payment?.status === 'succeeded');
          return;
        }

        const currentDraft = bookingDraftStore.get();
        if (!currentDraft) {
          if (!cancelled) setError(copy.missingDetails);
          return;
        }

        setDraft(currentDraft);
        const nextQuote = await endpoints.bookingCalculate({
          scooter_id: currentDraft.scooter_id,
          start_datetime: currentDraft.start_datetime,
          end_datetime: currentDraft.end_datetime,
          delivery_time: currentDraft.delivery_time,
          delivery_address: currentDraft.delivery_address,
          add_on_ids: currentDraft.add_on_ids,
          promo_code: currentDraft.promo_code,
          payment_method: toApiPaymentMethod(pm),
          currency: selectedCurrency,
        });
        if (!cancelled) setQuote(nextQuote);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : t.auth.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [copy.missingDetails, existingBookingId, locale, pm, selectedCurrency, t.auth.error]);

  useEffect(() => {
    if (paymentUrl && /^https?:/i.test(paymentUrl)) {
      const timer = setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [paymentUrl]);

  const messengerOptions = [
    { key: 'telegram', label: 'Telegram', checked: guestHasTelegram, setChecked: setGuestHasTelegram },
    { key: 'wechat', label: 'WeChat', checked: guestHasWechat, setChecked: setGuestHasWechat },
    { key: 'whatsapp', label: 'WhatsApp', checked: guestHasWhatsapp, setChecked: setGuestHasWhatsapp },
  ] as const;

  function validateMethodForm(): string | null {
    if (pm === 'card') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (!cardName.trim()) return copy.cardNameRequired;
      if (digits.length < 12 || !/^[0-9]+$/.test(digits)) return copy.cardNumberInvalid;
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return copy.cardExpiryInvalid;
      if (!/^\d{3,4}$/.test(cardCvc)) return copy.cardCvcInvalid;
    }
    if (pm === 'cash' && !cashConfirmedTerms) {
      return copy.cashConsent;
    }
    return null;
  }

  async function handleConfirm() {
    setError(null);
    const formError = validateMethodForm();
    if (formError) {
      setError(formError);
      return;
    }
    setSubmitting(true);
    try {
      let activeBooking = booking;

      if (!activeBooking) {
        const currentDraft = bookingDraftStore.get();
        if (!currentDraft) {
          throw new Error(copy.draftMissing);
        }

        const payload = {
          scooter_id: currentDraft.scooter_id,
          start_datetime: currentDraft.start_datetime,
          end_datetime: currentDraft.end_datetime,
          delivery_time: currentDraft.delivery_time,
          delivery_address: currentDraft.delivery_address,
          add_on_ids: currentDraft.add_on_ids,
          promo_code: currentDraft.promo_code,
          payment_method: toApiPaymentMethod(pm),
          currency: selectedCurrency,
        };

        if (user) {
          activeBooking = await endpoints.createBooking(payload, locale);
        } else {
          if (!guestName.trim() || !guestPhone.trim()) {
            throw new Error(copy.guestRequired);
          }
          const result = await endpoints.guestCreateBooking(
            {
              ...payload,
              guest_full_name: guestName.trim(),
              guest_phone: guestPhone.trim(),
              guest_has_telegram: guestHasTelegram,
              guest_has_wechat: guestHasWechat,
              guest_has_whatsapp: guestHasWhatsapp,
              language: locale,
            },
            locale
          );
          activeBooking = result.booking;
          if (result.auth?.access && result.auth?.refresh) {
            tokens.set({ access: result.auth.access, refresh: result.auth.refresh });
            try {
              const profile = await endpoints.profile();
              userStore.set(profile);
              await refresh();
            } catch {}
          }
        }

        setBooking(activeBooking);
        bookingDraftStore.clear();
      }

      if (pm === 'cash' || activeBooking.payment_method === 'cash_on_delivery') {
        setPaid(true);
        return;
      }

      const provider = pm === 'crypto' ? 'crypto' : 'stripe';
      const payment = await endpoints.createPayment({ booking_id: activeBooking.id, provider });
      if (payment.payment_url) {
        setPaymentUrl(payment.payment_url);
      } else {
        setPaid(true);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  const bookingName = booking?.scooter?.title || draft?.name || search.get('name') || copy.bookingName;
  const startLabel = booking
    ? new Date(booking.start_datetime).toLocaleString(locale)
    : draft
      ? new Date(draft.start_datetime).toLocaleString(locale)
      : '—';
  const endLabel = booking
    ? new Date(booking.end_datetime).toLocaleString(locale)
    : draft
      ? new Date(draft.end_datetime).toLocaleString(locale)
      : '—';
  const reserveOnly = booking?.payment_method === 'cash_on_delivery' || pm === 'cash';
  const summary = useMemo(() => {
    const toSelectedCurrency = (amount: string | number | undefined, fromCurrency?: string | null) =>
      convertAmount(Number(amount || 0), fromCurrency || 'USD', selectedCurrency);
    // Keep the final payment step aligned with step 2:
    // pricing amounts still come back from the API in USD even when another currency is requested.
    const pricingSourceCurrency = 'USD';

    if (booking) {
      return {
        base: toSelectedCurrency(booking.base_price, pricingSourceCurrency),
        addons: toSelectedCurrency(booking.add_ons_price, pricingSourceCurrency),
        delivery: toSelectedCurrency(booking.delivery_price, pricingSourceCurrency),
        total: toSelectedCurrency(booking.total_price, pricingSourceCurrency),
        currency: selectedCurrency,
      };
    }
    return {
      base: toSelectedCurrency(quote?.base_price, pricingSourceCurrency),
      addons: toSelectedCurrency(quote?.add_ons_price, pricingSourceCurrency),
      delivery: toSelectedCurrency(quote?.delivery_price, pricingSourceCurrency),
      total: toSelectedCurrency(quote?.total_price, pricingSourceCurrency),
      currency: selectedCurrency,
    };
  }, [booking, quote, selectedCurrency]);

  const trustMarks = [
    { icon: LockIcon, label: stripLeadingSymbol(t.booking.secure) },
    { icon: CheckIcon, label: stripLeadingSymbol(t.booking.pci) },
    { icon: CheckIcon, label: stripLeadingSymbol(t.booking.cancel24) },
  ] as const;

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <div className="br-payment-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}` }}>
        <span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.12em' }}>STEP 3 OF 3 · PAYMENT</span>
        <span className="br-mono" style={{ fontSize: 11, color: sub }}>{summary.currency}</span>
      </div>
      <div className="br-payment-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 460px', gap: 0 }}>
        <div className="br-payment-main" style={{ padding: '60px 60px' }}>
          <BREyebrow>{t.payment.step}</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 0.98, margin: '10px 0 32px' }}>
            {paid ? t.payment.confirmedTitle : copy.pageTitle}
          </h1>

          {loading && <div className="br-mono" style={{ color: sub }}>{t.common.loading}</div>}

          {paymentUrl && (
            <div style={{ background: '#FFF6CC', padding: 20, borderRadius: 12 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>{t.payment.redirect}</div>
              <a href={paymentUrl} className="br-mono" style={{ display: 'inline-block', marginTop: 8, color: '#000' }}>{paymentUrl}</a>
            </div>
          )}

          {paid ? (
            <div style={{ background: '#FFD700', borderRadius: 14, padding: 32 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>{reserveOnly ? copy.reserved : copy.confirmed}</div>
              <div className="br-display" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.03em' }}>#{booking?.order_number || booking?.id || '—'}</div>
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.55, maxWidth: 460 }}>
                {reserveOnly ? copy.reservedDesc : t.payment.confirmedDesc}
              </p>
              <div className="br-payment-success-actions" style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <BRPrimary href="/profile" style={{ background: '#000', color: '#FFD700' }}>{copy.openProfile}</BRPrimary>
                <BRPrimary href="/" style={{ background: '#fff', color: '#000' }}>{t.payment.home}</BRPrimary>
              </div>
            </div>
          ) : (
            !paymentUrl && !loading && (
              <>
                <div className="br-payment-methods" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {(['card', 'cash', 'crypto'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPm(p)}
                      className="br-mono"
                      style={{
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: `1px solid ${pm === p ? '#FFD700' : border}`,
                        background: pm === p ? '#FFD700' : 'transparent',
                        color: pm === p ? '#000' : fg,
                        cursor: 'pointer',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {p === 'card' && <CreditCardIcon size={14} color="currentColor" />}
                        {p === 'cash' && <WalletIcon size={14} color="currentColor" />}
                        {p === 'crypto' && <CryptoIcon size={14} color="currentColor" />}
                        {p}
                      </span>
                    </button>
                  ))}
                </div>

                {!user && (
                  <div className="br-payment-card" style={{ border: `1px solid ${border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
                    <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: sub }}>{copy.contactDetails}</div>
                    <div className="br-payment-guest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
                      <Field label={t.auth.name}>
                        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label={t.auth.phone}>
                        <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} style={inputStyle} />
                      </Field>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: sub, marginBottom: 8 }}>{copy.messengerTitle}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {messengerOptions.map((item) => (
                            <label
                              key={item.key}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 12px',
                                borderRadius: 999,
                                border: `1px solid ${border}`,
                                background: '#fff',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: 13,
                                color: fg,
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(event) => item.setChecked(event.target.checked)}
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: sub, marginTop: 8 }}>{copy.messengerHint}</div>
                      </div>
                      <div style={{ display: 'grid', alignContent: 'end' }}>
                        <Link href="/login" className="br-mono" style={{ color: '#000', fontSize: 12 }}>
                          {copy.alreadyHave}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {pm === 'card' && (
                  <CardTemplate
                    copy={copy}
                    cardName={cardName}
                    setCardName={setCardName}
                    cardNumber={cardNumber}
                    setCardNumber={setCardNumber}
                    cardExpiry={cardExpiry}
                    setCardExpiry={setCardExpiry}
                    cardCvc={cardCvc}
                    setCardCvc={setCardCvc}
                  />
                )}

                {pm === 'cash' && (
                  <CashTemplate
                    copy={copy}
                    confirmed={cashConfirmedTerms}
                    setConfirmed={setCashConfirmedTerms}
                    deliveryAddress={draft?.delivery_address || booking?.delivery_address || ''}
                  />
                )}

                {pm === 'crypto' && (
                  <CryptoTemplate
                    copy={copy}
                    currency={cryptoCurrency}
                    total={summary.total}
                    displayCurrency={summary.currency}
                  />
                )}

                <div className="br-mono" style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 11, color: sub, letterSpacing: '0.1em', flexWrap: 'wrap' }}>
                  {trustMarks.map(({ icon: Icon, label }) => (
                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} color="currentColor" />
                      {label}
                    </span>
                  ))}
                </div>
                {error && <div className="br-mono" style={{ marginTop: 20, color: '#B91C1C', fontSize: 13 }}>{error}</div>}
                <div className="br-payment-cta-wrap" style={{ marginTop: 40 }}>
                  <BRPrimary onClick={handleConfirm} disabled={submitting || (!booking && !draft)} style={{ padding: '20px 36px', fontSize: 15 }}>
                    {submitting
                      ? t.common.loading
                      : pm === 'cash'
                        ? copy.reserveCash
                        : pm === 'crypto'
                          ? copy.payCrypto.replace('{currency}', cryptoCurrency)
                          : tr(t.payment.pay, { amount: formatCurrencyAmount(summary.total, summary.currency) })}
                  </BRPrimary>
                </div>
              </>
            )
          )}
        </div>
        <div className="br-payment-side" style={{ background: surf, padding: 40 }}>
          {draft?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image} alt={bookingName} style={{ width: '100%', height: 200, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: 12 }} />
          ) : (
            <BRPhoto tone="sand" label={copy.bookingLabel} style={{ height: 200, borderRadius: 12 }} />
          )}
          <h3 className="br-display" style={{ fontSize: 22, marginTop: 18 }}>{bookingName}</h3>
          <div className="br-mono" style={{ fontSize: 12, color: sub }}>{startLabel} → {endLabel}</div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${border}` }}>
            <BREyebrow>{t.payment.breakdown}</BREyebrow>
            <div style={{ marginTop: 14, fontFamily: 'var(--br-mono)', fontSize: 13 }}>
              {[
                [copy.base, formatCurrencyAmount(summary.base, summary.currency)],
                [copy.addons, formatCurrencyAmount(summary.addons, summary.currency)],
                [t.payment.delivery, summary.delivery === 0 ? t.payment.free : formatCurrencyAmount(summary.delivery, summary.currency)],
              ].map(([l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: sub }}>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
              <span className="br-display" style={{ fontSize: 18 }}>{t.detail.total}</span>
              <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 24, fontWeight: 600 }}>{formatCurrencyAmount(summary.total, summary.currency)}</span>
            </div>
          </div>
          <div style={{ marginTop: 28, padding: 16, background: bg, borderRadius: 10 }}>
            <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.14em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LockIcon size={12} color="currentColor" />
              {stripLeadingSymbol(t.payment.protected)}
            </div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{t.payment.protectedDesc}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function CardTemplate({
  copy,
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
}: {
  copy: PaymentCopy;
  cardName: string;
  setCardName: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
}) {
  function formatNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.bankCard}
      </div>
      <p style={{ margin: '10px 0 18px', color: 'rgba(0,0,0,0.62)', fontSize: 13, lineHeight: 1.6 }}>
        {copy.bankCardDesc}
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label={copy.cardholder}>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder=""
            style={inputStyle}
            autoComplete="cc-name"
          />
        </Field>
        <Field label={copy.cardNumber}>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatNumber(e.target.value))}
            placeholder=""
            style={inputStyle}
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </Field>
        <div className="br-payment-card-expiry-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <Field label={copy.cardExpiry}>
            <input
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              placeholder=""
              style={inputStyle}
              inputMode="numeric"
              autoComplete="cc-exp"
            />
          </Field>
          <Field label="CVC">
            <input
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder=""
              style={inputStyle}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function CashTemplate({
  copy,
  confirmed,
  setConfirmed,
  deliveryAddress,
}: {
  copy: PaymentCopy;
  confirmed: boolean;
  setConfirmed: (v: boolean) => void;
  deliveryAddress: string;
}) {
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.cashTitle}
      </div>
      <p style={{ margin: '10px 0 14px', color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.6 }}>
        {copy.cashDesc}
      </p>
      {deliveryAddress ? (
        <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>{copy.deliveryAddress}</div>
          <div style={{ marginTop: 4 }}>{deliveryAddress}</div>
        </div>
      ) : (
        <div className="br-mono" style={{ color: '#B91C1C', fontSize: 12 }}>
          {copy.noDelivery}
        </div>
      )}
      <ul style={{ marginTop: 18, paddingLeft: 20, color: 'rgba(0,0,0,0.7)', fontSize: 13, lineHeight: 1.7 }}>
        <li>{copy.cashBullet1}</li>
        <li>{copy.cashBullet2}</li>
        <li>{copy.cashBullet3}</li>
      </ul>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span style={{ fontSize: 13, lineHeight: 1.5 }}>
          {copy.cashConfirm}
        </span>
      </label>
    </div>
  );
}

function CryptoTemplate({
  copy,
  currency,
  total,
  displayCurrency,
}: {
  copy: PaymentCopy;
  currency: 'USDT';
  total: number;
  displayCurrency: string;
}) {
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.cryptoTitle}
      </div>
      <p style={{ margin: '10px 0 18px', color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.6 }}>
        {copy.cryptoDesc}
      </p>
      <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.selectCurrency}
      </div>
      <div className="br-payment-crypto-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, marginTop: 12 }}>
        <div
          style={{
            padding: '14px 12px',
            borderRadius: 14,
            border: '1px solid #FFD700',
            background: 'rgba(255,215,0,0.16)',
            textAlign: 'left',
          }}
        >
          <div className="br-display" style={{ fontSize: 18 }}>USDT</div>
          <div className="br-mono" style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', marginTop: 4 }}>
            TRC-20 / ERC-20
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, background: '#F5F5F5', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
        <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>{copy.amount}</div>
        <div style={{ marginTop: 4 }}>
          {formatCurrencyAmount(total, displayCurrency)} → {currency} ({copy.amountHint})
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  padding: '12px 14px',
  fontSize: 15,
  color: '#000',
  outline: 'none',
};
