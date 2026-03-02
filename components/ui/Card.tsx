export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-sm border border-gray-800 bg-surface-elevated p-4 ${className}`}
    >
      {children}
    </div>
  );
}
