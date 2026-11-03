import { useEffect, useRef, useState } from 'react';

interface Props {
  locked: boolean;
  correct: boolean | null;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

export function TextAnswer({ locked, correct, placeholder, onChange, multiline = true }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const border = locked ? (correct ? 'border-brand bg-brand-light' : 'border-bad bg-bad-light') : 'border-ink-line bg-[#F7F7F7] focus:border-accent';
  const props = {
    ref,
    value,
    disabled: locked,
    placeholder,
    autoCapitalize: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setValue(e.target.value);
      onChange(e.target.value);
    },
    className: `w-full rounded-2xl border-2 px-4 py-3 text-lg font-semibold outline-none transition-colors ${border}`,
  };
  return multiline ? (
    <textarea
      {...props}
      rows={3}
      className={`${props.className} resize-none`}
      onKeyDown={(e) => {
        // Enter checks the answer (handled by the lesson screen); Shift+Enter is not needed.
        if (e.key === 'Enter') e.preventDefault();
      }}
    />
  ) : (
    <input {...props} />
  );
}
