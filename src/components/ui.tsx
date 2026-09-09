"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { BELARUS_CITIES } from "@/lib/constants";

export function Input({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  autoComplete,
  min,
  max,
  step,
  inputMode,
  pattern,
  maxLength,
  autoFocus,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  inputMode?: "numeric" | "tel" | "email" | "text";
  pattern?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}

const PHONE_MASK = "+375 29 1234567";

function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("80")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  else if (digits.startsWith("375")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = "+375";
  if (digits) {
    out += " " + digits.slice(0, 2);
    if (digits.length > 2) out += " " + digits.slice(2);
  }
  return out;
}

export function PhoneInput({
  label,
  name = "phone",
  required,
  defaultValue,
}: {
  label: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(() =>
    defaultValue ? formatPhone(defaultValue) : "",
  );

  const needsOverlay = value === "" || PHONE_MASK.startsWith(value);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <div className="relative">
        <input
          type="tel"
          name={name}
          required={required}
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onFocus={() => {
            if (value === "") setValue("+375 ");
          }}
          onInput={(e) => setValue(formatPhone(e.currentTarget.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {needsOverlay && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm"
          >
            {value === "" ? (
              <>
                <span className="text-gray-500">+375</span>
                <span className="text-gray-300"> 29 1234567</span>
              </>
            ) : (
              <>
                <span className="opacity-0">{value}</span>
                <span className="text-gray-300">
                  {PHONE_MASK.slice(value.length)}
                </span>
              </>
            )}
          </span>
        )}
      </div>
    </label>
  );
}

export function CityInput({
  label,
  name = "city",
  required,
  defaultValue,
}: {
  label: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [show, setShow] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const matched = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return BELARUS_CITIES.slice();
    return BELARUS_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [value]);

  const pick = (city: string, close = true) => {
    setValue(city);
    if (close) setShow(false);
    setHi(-1);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          name={name}
          required={required}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            setShow(true);
            setHi(-1);
          }}
          onFocus={() => setShow(true)}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === "ArrowDown" && hi < matched.length - 1) {
              e.preventDefault();
              setHi(hi + 1);
            } else if (e.key === "ArrowUp" && hi > 0) {
              e.preventDefault();
              setHi(hi - 1);
            } else if (e.key === "Enter") {
              if (hi >= 0 && matched[hi]) {
                e.preventDefault();
                pick(matched[hi]);
              } else {
                setShow(false);
              }
            } else if (e.key === "Escape") {
              setShow(false);
            }
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {show && matched.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {matched.map((city, i) => (
              <li key={city}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(city);
                  }}
                  onMouseEnter={() => setHi(i)}
                  className={`block w-full px-3.5 py-2 text-left text-sm ${
                    i === hi ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                  }`}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Textarea({
  label,
  name,
  required,
  placeholder,
  rows = 4,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoGrow();
  }, []);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <textarea
        ref={ref}
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        onInput={autoGrow}
        className="block w-full resize-none overflow-hidden rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export function FormMessage({
  state,
}: {
  state: { error?: string; success?: string; message?: string } | undefined;
}) {
  if (!state) return null;
  if (state.error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.error}
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        {state.success}
      </div>
    );
  }
  if (state.message) {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {state.message}
      </div>
    );
  }
  return null;
}

export function SectionTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
