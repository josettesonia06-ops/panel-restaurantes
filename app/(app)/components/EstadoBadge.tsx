"use client";

type Props = {
  estado: "Confirmada" | "Pendiente" | "Cancelada";
};

export default function EstadoBadge({ estado }: Props) {
  const styles = {
    Confirmada: "bg-green-100 text-green-700",
    Pendiente: "bg-yellow-100 text-yellow-700",
    Cancelada: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[estado]}`}
    >
      {estado}
    </span>
  );
}
