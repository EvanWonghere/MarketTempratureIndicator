export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-elevated p-4 ${className}`}
    >
      {children}
    </div>
  );
}
