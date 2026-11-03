import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'accent' | 'danger' | 'ghost' | 'outline';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white border-brand-dark',
  accent: 'bg-accent text-white border-accent-dark',
  danger: 'bg-bad text-white border-bad-dark',
  outline: 'bg-white text-ink border-ink-line border-2 border-b-4',
  ghost: 'bg-transparent text-ink-soft border-transparent shadow-none',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

/** Big rounded button with a darker bottom edge that "presses" down. */
export function Button({ variant = 'primary', block, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        'press min-h-[3rem] rounded-2xl border-b-4 px-6 py-3 text-base font-extrabold uppercase tracking-wide',
        'disabled:cursor-not-allowed disabled:border-[#C4C4C4] disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF]',
        VARIANTS[variant],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
    />
  );
}
