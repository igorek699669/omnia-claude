"use client";

import { useState, type KeyboardEvent } from "react";

export interface ComboboxProps<T> {
  value: string;
  onValueChange: (value: string) => void;
  items: T[];
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  onSelect: (item: T) => void;
  isLoading?: boolean;
  /** Сколько символов должно быть введено, прежде чем список вообще может открыться. */
  minChars?: number;
  placeholder?: string;
  loadingLabel?: string;
  disabled?: boolean;
  className?: string;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-600" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function Combobox<T>({
  value,
  onValueChange,
  items,
  getItemKey,
  getItemLabel,
  onSelect,
  isLoading = false,
  minChars = 3,
  placeholder,
  loadingLabel = "Ищем варианты…",
  disabled = false,
  className = "",
}: ComboboxProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Отдельно от isFocused: клик по варианту сохраняет реальный DOM-фокус на инпуте
  // (мы гасим blur через preventDefault ниже), поэтому закрывать список нужно этим
  // флагом, а не занижением isFocused — иначе следующий onFocus просто не наступит
  // (фокус и так уже стоит на поле) и список не откроется, пока не стереть/ввести текст.
  const [isSuppressed, setIsSuppressed] = useState(false);

  // Сбрасываем подсветку варианта при каждом новом наборе результатов поиска —
  // без useEffect, чтобы не ловить лишний рендер (react-hooks/set-state-in-effect).
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setActiveIndex(-1);
  }

  const isOpen =
    !disabled && isFocused && !isSuppressed && value.trim().length >= minChars && (items.length > 0 || isLoading);

  function selectItem(item: T) {
    setIsSuppressed(true);
    onSelect(item);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        selectItem(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSuppressed(true);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5">
        <SearchIcon />
        <input
          value={value}
          onChange={(e) => {
            setIsSuppressed(false);
            onValueChange(e.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsSuppressed(false);
          }}
          onBlur={() => setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full min-w-0 flex-1 bg-transparent text-base outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-auto rounded-2xl border border-ink-900/12 bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(28,20,16,0.35)]"
        >
          {items.map((item, index) => (
            <li key={getItemKey(item)} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(item)}
                className={`block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-paper-100" : "hover:bg-paper-100"
                }`}
              >
                {getItemLabel(item)}
              </button>
            </li>
          ))}
          {items.length === 0 && isLoading && <li className="px-3 py-2 text-sm text-ink-600">{loadingLabel}</li>}
        </ul>
      )}
    </div>
  );
}
