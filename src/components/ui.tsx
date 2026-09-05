import type { ReactNode } from "react";

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
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
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
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
