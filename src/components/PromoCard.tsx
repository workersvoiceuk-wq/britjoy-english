import { useState } from 'react';
import { DOWNLOADS } from '../data/catalog';
import { canBuyHere, usePlus } from '../lib/backend';
import { sfx } from '../lib/sound';
import { useT, type MessageKey } from '../i18n';

const VUM_URL = 'https://www.vozunidamundo.com/';

type Promo = 'plus' | 'share' | 'vum';
const ORDER: Promo[] = ['share', 'plus', 'vum'];

/**
 * House recommendations for free learners (like the cards other learning apps show
 * between lessons): VUM Academy, invite a friend, Voz Unida Mundo. No ad network,
 * no tracking. Hidden for VUM Academy members; the store apps only show the
 * invite card.
 */
export function PromoCard({ seed, onOpenPlus }: { seed: number; onOpenPlus: () => void }) {
  const t = useT();
  const plus = usePlus();
  const [copied, setCopied] = useState(false);
  if (plus) return null;
  // In the store apps only "invite a friend" is shown: no prices, no outside links.
  const order = canBuyHere() ? ORDER : (['share'] as Promo[]);
  const promo = order[Math.abs(seed) % order.length];

  const copy: Record<Promo, { icon: string; title: MessageKey; text: MessageKey; action: MessageKey }> = {
    plus: { icon: '👑', title: 'promo.plusTitle', text: 'promo.plusText', action: 'promo.open' },
    share: { icon: '💌', title: 'promo.shareTitle', text: 'promo.shareText', action: 'promo.share' },
    vum: { icon: '🤝', title: 'promo.vumTitle', text: 'promo.vumText', action: 'promo.open' },
  };
  const c = copy[promo];

  const act = async () => {
    sfx.tap();
    if (promo === 'plus') return onOpenPlus();
    if (promo === 'vum') return void window.open(VUM_URL, '_blank', 'noopener');
    const data = { title: 'Britjoy English', text: t('promo.shareText'), url: DOWNLOADS.web };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        setCopied(true);
      }
    } catch {
      /* the learner closed the share sheet */
    }
  };

  return (
    <aside aria-label={t('promo.kicker')} className="w-full rounded-2xl border-2 border-gold/60 bg-gold-light p-4 text-start">
      <p className="text-[11px] font-black uppercase tracking-wider text-gold-dark">{t('promo.kicker')}</p>
      <div className="mt-1 flex items-center gap-3">
        <span aria-hidden className="text-3xl">{c.icon}</span>
        <div className="flex-1">
          <p className="font-black text-navy">{t(c.title)}</p>
          <p className="text-sm font-semibold text-ink-soft">{copied ? t('promo.copied') : t(c.text)}</p>
        </div>
        <button onClick={() => void act()} className="press rounded-xl border-b-4 border-navy-dark bg-navy px-3 py-2 text-sm font-black text-white">
          {t(c.action)}
        </button>
      </div>
    </aside>
  );
}
