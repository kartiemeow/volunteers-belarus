export function OrganizerContact({ contact, address }: { contact: string | null; address?: string | null }) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-gray-700">
      <h3 className="font-semibold text-emerald-800">Детали участия и связь</h3>
      {address && <p className="mt-1">Место: {address}</p>}
      <p className="mt-1 whitespace-pre-line break-words">{contact || "Контакт пока не указан. Уточните его у организации до участия."}</p>
      {contact && contactLink(contact) && (
        <a href={contactLink(contact)!} className="mt-2 inline-block font-medium text-emerald-700 underline">
          Связаться с организатором
        </a>
      )}
    </div>
  );
}

function contactLink(raw: string): string | null {
  const value = raw.trim();
  if (/^\+?[\d\s()-]{7,25}$/.test(value)) return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${encodeURIComponent(value)}`;
  if (/^@[a-zA-Z0-9_]{5,32}$/.test(value)) return `https://t.me/${value.slice(1)}`;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
