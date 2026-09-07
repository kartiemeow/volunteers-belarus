export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-600/25 border-t-emerald-600" />
        <p className="text-sm text-gray-500">Загружаем страницу…</p>
      </div>
    </div>
  );
}