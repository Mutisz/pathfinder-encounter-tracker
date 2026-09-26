import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base =
  'w-full rounded border border-stone-300 bg-white px-2 py-1 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export function Label({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-0.5 block font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={`${base} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${base} min-h-20 ${className}`} {...rest} />;
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${base} ${className}`} {...rest} />;
}

interface NumberProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (n: number) => void;
}

/** Integer input that always yields a number (empty -> 0). */
export function NumberInput({ value, onChange, className = '', ...rest }: NumberProps) {
  return (
    <input
      type="number"
      inputMode="numeric"
      step={1}
      className={`${base} ${className}`}
      value={Number.isNaN(value) ? '' : value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10) || 0)}
      {...rest}
    />
  );
}

interface ListProps {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

/** Comma-separated list input; trims and drops empties. */
export function ListInput({ value, onChange, placeholder }: ListProps) {
  return (
    <TextInput
      defaultValue={value.join(', ')}
      key={value.join('|')}
      placeholder={placeholder ?? 'comma, separated, values'}
      onBlur={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  );
}
