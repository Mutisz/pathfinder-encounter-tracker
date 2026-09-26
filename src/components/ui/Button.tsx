import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-red-900 disabled:bg-stone-400',
  secondary: 'bg-stone-200 text-ink hover:bg-stone-300 disabled:text-stone-400',
  danger:
    'bg-white text-red-800 border border-red-800 hover:bg-red-50 disabled:text-stone-400 disabled:border-stone-300',
  ghost: 'bg-transparent text-ink hover:bg-stone-200 disabled:text-stone-400',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  const sizing = size === 'sm' ? 'px-2 py-1 text-sm' : 'px-3 py-1.5';
  return (
    <button
      type={type}
      className={`rounded font-medium transition-colors disabled:cursor-not-allowed ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
