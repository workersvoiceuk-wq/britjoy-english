import { useState } from 'react';
import {
  VUM_ACADEMY_URL,
  backendConfigured,
  buy,
  deleteAccount,
  canBuyHere,
  manageSubscription,
  sendLoginCode,
  signOut,
  syncAcademy,
  useAccount,
  usePlus,
  verifyLoginCode,
  type ProductId,
} from '../lib/backend';
import { ACADEMY_MONTHLY, CREDIT_PACK, FREE_AI_DAILY, PLUS_AI_DAILY, PRICES, formatPrice } from '../lib/plans';
import { sfx } from '../lib/sound';
import { useT } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';
import { Britjoy } from './Britjoy';

/** Sign in with an emailed 6-digit code (no password). */
export function AccountBox() {
  const t = useT();
  const email = useAccount((s) => s.email);
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!backendConfigured) {
    return <p className="rounded-2xl bg-cream p-4 text-sm font-bold text-ink-soft">{t('account.notReady')}</p>;
  }
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(false);
    try {
      await fn();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (email) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{t('account.signedIn', { email })}</p>
        <button onClick={() => void signOut()} className="text-sm font-extrabold text-royal underline">
          {t('account.signOut')}
        </button>
        <button
          onClick={() => {
            if (window.confirm(t('account.deleteConfirm'))) void run(deleteAccount);
          }}
          className="w-full text-start text-xs font-bold text-ink-soft underline"
        >
          {t('account.delete')}
        </button>
        {error && <p role="alert" className="text-sm font-bold text-bad-dark">{t('account.error')}</p>}
      </div>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 'email') void run(async () => { await sendLoginCode(address); setStep('code'); });
        else void run(() => verifyLoginCode(address, code));
      }}
    >
      <p className="text-sm font-semibold text-ink-soft">{t('account.why')}</p>
      {step === 'email' ? (
        <>
          <label htmlFor="acc-email" className="sr-only">{t('account.email')}</label>
          <input
            id="acc-email" type="email" required autoComplete="email" value={address}
            onChange={(e) => setAddress(e.target.value)} placeholder={t('account.email')}
            className="w-full rounded-2xl border-2 border-ink-line bg-cream px-4 py-3 font-semibold outline-none focus:border-navy"
          />
        </>
      ) : (
        <>
          <label htmlFor="acc-code" className="sr-only">{t('account.code')}</label>
          <input
            id="acc-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder={t('account.code')}
            className="w-full rounded-2xl border-2 border-ink-line bg-cream px-4 py-3 text-center text-xl font-black tracking-[0.4em] outline-none focus:border-navy"
          />
        </>
      )}
      <button
        type="submit" disabled={busy}
        className="press w-full rounded-2xl border-b-4 border-navy-dark bg-navy py-3 font-black text-white disabled:opacity-60"
      >
        {step === 'email' ? t('account.sendCode') : t('account.verify')}
      </button>
      {error && <p role="alert" className="text-sm font-bold text-bad-dark">{t('account.error')}</p>}
    </form>
  );
}

function Perk({ children, on = true }: { children: React.ReactNode; on?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-[15px] font-semibold">
      <span aria-hidden className={on ? 'text-brand-dark' : 'text-ink-soft'}>{on ? '✓' : '·'}</span>
      <span>{children}</span>
    </li>
  );
}

/**
 * VUM Academy in the app: compare Free vs Academy, subscribe on vozunidamundo.com
 * (web only), check an existing subscription by email, AI credits and the account.
 */
export function PlusScreen({ checkout = null }: { checkout?: 'ok' | 'cancel' | null }) {
  const t = useT();
  const lang = useProgressStore((s) => s.uiLang) ?? 'es';
  const plus = usePlus();
  const { email, plusUntil, credits } = useAccount();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<ProductId | 'portal' | 'sync' | null>(null);
  const [syncResult, setSyncResult] = useState<'ok' | 'none' | null>(null);
  const price = (p: ProductId) => formatPrice(PRICES[p], lang);
  const sellHere = canBuyHere() && backendConfigured;

  const purchase = async (p: ProductId | 'portal') => {
    sfx.tap();
    setBusy(p);
    setError(false);
    try {
      await (p === 'portal' ? manageSubscription() : buy(p));
    } catch {
      setError(true);
      setBusy(null);
    }
  };

  const checkAcademy = async () => {
    sfx.tap();
    setBusy('sync');
    setError(false);
    setSyncResult(null);
    try {
      setSyncResult((await syncAcademy()) ? 'ok' : 'none');
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  const BuyButton = ({ product, label }: { product: ProductId; label: string }) => (
    <button
      disabled={!sellHere || !email || busy !== null}
      onClick={() => void purchase(product)}
      className="press mt-3 w-full rounded-2xl border-b-4 border-royal-dark bg-royal py-3 font-black text-white disabled:border-[#C4C4C4] disabled:bg-[#E5E5E5] disabled:text-[#8A8A8A]"
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-5">
      <section className="flex items-center gap-3 rounded-3xl bg-navy p-5 text-white">
        <Britjoy size={92} expression="happy" />
        <div>
          <h2 className="text-2xl font-black">👑 {t('plus.title')}</h2>
          <p className="font-semibold text-white/85">{t('plus.tagline')}</p>
        </div>
      </section>

      {checkout === 'ok' && <p role="status" className="rounded-2xl bg-brand-light p-3 font-bold text-brand-dark">{t('plus.thanks')}</p>}
      {checkout === 'cancel' && <p role="status" className="rounded-2xl bg-cream p-3 font-bold text-ink-soft">{t('plus.cancelled')}</p>}

      {plus && plusUntil ? (
        <section className="rounded-2xl border-2 border-gold bg-white p-4">
          <p className="text-lg font-black text-navy">
            ✨ {t('plus.active', { date: new Date(plusUntil).toLocaleDateString(lang) })}
          </p>
          {sellHere && (
            <button onClick={() => void purchase('portal')} className="mt-2 font-extrabold text-royal underline">
              {t('plus.manage')}
            </button>
          )}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-navy/10 bg-white p-4">
          <h3 className="mb-2 text-lg font-black text-navy">{t('plus.free')}</h3>
          <ul className="space-y-1">
            <Perk>{t('plus.freeAll')}</Perk>
            <Perk>{t('plus.freeAi', { n: FREE_AI_DAILY })}</Perk>
            <Perk on={false}>{t('plus.freeAds')}</Perk>
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-gold bg-white p-4 shadow-[0_4px_0_#C9A227]">
          <h3 className="mb-2 text-lg font-black text-navy">👑 {t('plus.title')}</h3>
          <ul className="space-y-1">
            <Perk>{t('plus.freeAll')}</Perk>
            <Perk>{t('plus.perkCourses')}</Perk>
            <Perk>{t('plus.perkHearts')}</Perk>
            <Perk>{t('plus.perkAi', { n: PLUS_AI_DAILY })}</Perk>
            <Perk>{t('plus.perkNoAds')}</Perk>
            <Perk>{t('plus.perkSupport')}</Perk>
          </ul>
        </div>
      </section>

      {!plus && (
        <section className="rounded-2xl border-2 border-royal bg-white p-4" aria-label={t('plus.title')}>
          {canBuyHere() && (
            <>
              <p className="font-black text-navy">{t('plus.month')}</p>
              <p className="text-2xl font-black text-ink">{t('plus.perMonth', { price: formatPrice(ACADEMY_MONTHLY, lang) })}</p>
              <a
                href={VUM_ACADEMY_URL}
                target="_blank"
                rel="noopener"
                className="press mt-3 block w-full rounded-2xl border-b-4 border-royal-dark bg-royal py-3 text-center font-black text-white"
              >
                {t('plus.subscribe')} ↗
              </a>
            </>
          )}
          <p className="mt-2 text-sm font-semibold text-ink-soft">{t('plus.sameEmail')}</p>
          <button
            onClick={() => void checkAcademy()}
            disabled={!backendConfigured || !email || busy !== null}
            className="press mt-3 w-full rounded-2xl border-2 border-b-4 border-navy/20 bg-white py-3 font-black text-navy disabled:opacity-60"
          >
            {t('plus.check')}
          </button>
          {syncResult === 'none' && <p role="status" className="mt-2 text-sm font-bold text-ink-soft">{t('plus.checkNone')}</p>}
        </section>
      )}
      {syncResult === 'ok' && <p role="status" className="rounded-2xl bg-brand-light p-3 font-bold text-brand-dark">{t('plus.checkOk')}</p>}

      <section className="rounded-2xl border-2 border-navy/10 bg-white p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-black text-navy">🪙 {t('plus.credits', { n: CREDIT_PACK })}</h3>
          {canBuyHere() && <span className="font-black text-ink">{price('credits_100')}</span>}
        </div>
        <p className="text-sm font-semibold text-ink-soft">{t('plus.creditsHint')}</p>
        {email && <p className="mt-1 text-sm font-bold text-navy">{t('plus.balance', { n: credits })}</p>}
        {canBuyHere() && <BuyButton product="credits_100" label={t('plus.buy')} />}
      </section>

      <p className="text-sm font-semibold text-ink-soft">
        {!backendConfigured ? t('plus.notReady') : canBuyHere() ? t('plus.legal') : t('plus.storeNote')}
      </p>
      {error && <p role="alert" className="font-bold text-bad-dark">{t('plus.error')}</p>}

      <section className="rounded-2xl border-2 border-navy/10 bg-white p-4">
        <h3 className="mb-2 text-lg font-black text-navy">👤 {t('account.title')}</h3>
        <AccountBox />
      </section>
    </div>
  );
}
