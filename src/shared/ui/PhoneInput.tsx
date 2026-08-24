"use client";

import { IMaskInput } from "react-imask";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Классы обёртки — чтобы поле можно было поставить в ряд с кнопкой (`min-w-0 flex-1`). */
  className?: string;
};

export function PhoneInput({
  value,
  onChange,
  onBlur,
  name,
  error,
  autoFocus,
  disabled,
  className = "",
}: PhoneInputProps) {
  return (
    <div className={className}>
      <IMaskInput
        mask="+7 (000) 000-00-00"
        value={value}
        unmask={false}
        onAccept={(val) => onChange(val)}
        onBlur={onBlur}
        name={name}
        type="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder="Телефон"
        className="w-full rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-base outline-none transition-colors focus:border-brand disabled:bg-paper-100 disabled:text-ink-600"
      />
      {error && <p className="mt-1.5 text-sm text-brand-dark">{error}</p>}
    </div>
  );
}
