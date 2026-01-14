import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardInner({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-inner rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}
