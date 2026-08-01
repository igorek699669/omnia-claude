"use client";

import { IMaskInput } from "react-imask";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  error?: string;
};

export function PhoneInput({ value, onChange, onBlur, name, error }: PhoneInputProps) {
  return (
    <div>
      <IMaskInput
        mask="+7 (000) 000-00-00"
        value={value}
        unmask={false}
        onAccept={(val) => onChange(val)}
        onBlur={onBlur}
        name={name}
        type="tel"
        placeholder="Телефон"
        className="w-full rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-base outline-none transition-colors focus:border-brand"
      />
      {error && <p className="mt-1.5 text-sm text-brand-dark">{error}</p>}
    </div>
  );
}
