export default function TablePlaceholder() {
  return (
    <div className="divide-y divide-gray-900/5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="py-3 space-y-2 animate-pulse">
          <div className="animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse" />
          <div className="h-1.5" />
          <div className="font-bold h-4 w-48 rounded-md bg-gray-200 animate-pulse" />
          <div className="h-2" />
        </div>
      ))}
    </div>
  );
}
