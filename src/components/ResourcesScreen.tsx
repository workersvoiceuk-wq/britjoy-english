import data from '../data/resources.json';
import { BritjoySays } from './Britjoy';
import { narrate } from '../lib/narrator';
import { sfx } from '../lib/sound';

type Item = { name: string; icon: string; details: string; url: string; bestFor?: string };

function Card({ item }: { item: Item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => sfx.tap()}
      className="press flex items-start gap-4 rounded-3xl border-2 border-b-4 border-navy/10 bg-white p-4"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl" aria-hidden>
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-black text-navy">{item.name}</span>
        {item.bestFor && <span className="block font-extrabold text-royal">{item.bestFor}</span>}
        <span className="mt-0.5 block text-[15px] font-semibold text-ink-soft">{item.details}</span>
        <span className="mt-2 block text-sm font-extrabold text-navy underline underline-offset-2">Abrir ↗</span>
      </span>
    </a>
  );
}

export function ResourcesScreen() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-5">
      <button className="w-full text-left" onClick={() => void narrate(data.intro)} aria-label="Escuchar a Britjoy">
        <BritjoySays size={110}>{data.intro}</BritjoySays>
      </button>
      <h2 className="mb-3 mt-6 text-xl font-black text-navy">Para seguir aprendiendo inglés</h2>
      <div className="grid gap-3">
        {data.items.map((item) => (
          <Card key={item.name} item={item} />
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-xl font-black text-navy">Webs oficiales para vivir en UK</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.official.map((item) => (
          <Card key={item.name} item={item} />
        ))}
      </div>
      <p className="mt-6 text-center text-xs font-semibold text-ink-soft">Información revisada: {data.checked}</p>
    </div>
  );
}
