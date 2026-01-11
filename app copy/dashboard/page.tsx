"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  MessageSquareWarning,
  Percent,
  Sparkles,
  Bell,
  Moon,
  Sun,
} from "lucide-react";

/* ===== Chart ===== */
const DashboardChart = dynamic(
  () => import("../components/DashboardChart"),
  { ssr: false }
);

/* ===== KPIs ===== */
const stats = [
  {
    id: "reservas",
    title: "Reservas hoy",
    value: 12,
    icon: CalendarDays,
    color: "blue",
    helper: "vs ayer +2",
    href: "/reservas",
  },
  {
    id: "clientes",
    title: "Clientes nuevos",
    value: 5,
    icon: Users,
    color: "green",
    helper: "últimas 24h",
    href: "/clientes",
  },
  {
    id: "resenas",
    title: "Reseñas pendientes",
    value: 3,
    icon: MessageSquareWarning,
    color: "red",
    helper: "objetivo 0",
    href: "/resenas",
  },
  {
    id: "ocupacion",
    title: "Ocupación",
    value: "78%",
    icon: Percent,
    color: "purple",
    helper: "próx. 3h",
    href: "/ocupacion",
  },
];

const colorMap: Record<string, { bg: string; icon: string; line: string }> = {
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    line: "bg-blue-400",
  },
  green: {
    bg: "bg-green-500/10",
    icon: "text-green-400",
    line: "bg-green-400",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    line: "bg-red-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-400",
    line: "bg-purple-400",
  },
};

function toggleTheme() {
  const body = document.body;

  if (body.classList.contains("theme-dark")) {
    body.classList.remove("theme-dark");
    body.classList.add("theme-light");
  } else {
    body.classList.remove("theme-light");
    body.classList.add("theme-dark");
  }
}

export default function DashboardPage() {
  const isDark =
    typeof window !== "undefined" &&
    document.body.classList.contains("theme-dark");

  return (
    <div className="h-[calc(100vh-110px)] space-y-6">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-start">
        <div>
          {/* CORREGIDO */}
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            Dashboard
          </h1>
          <p className="text-sm font-semibold opacity-70">
            Resumen operativo y marketing del día
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            Estado: bien
          </span>
          <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
            Google: estable
          </span>

          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 border rounded-lg hover:bg-gray-200"
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href="/ajustes"
            className="px-3 py-1.5 border rounded-lg hover:bg-gray-200"
          >
            Ajustes
          </Link>
        </div>
      </div>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-6 gap-5">
        <div className="col-span-4 grid grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const c = colorMap[stat.color];

            return (
              <Link
                key={stat.id}
                href={stat.href}
                className="card rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className={`h-1 w-full rounded-full ${c.line} mb-3`} />

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${c.bg}`}>
                      <Icon size={22} className={c.icon} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-70">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-extrabold">
                        {stat.value}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    {stat.helper}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ===== ACCIONES + ALERTAS ===== */}
        <div className="col-span-2 grid grid-rows-2 gap-5">
          <Link href="/acciones" className="card rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-500" size={18} />
                <p className="text-sm font-bold uppercase">
                  Acciones recomendadas
                </p>
              </div>
              <span className="bg-blue-500/20 text-blue-500 text-xs px-2 rounded-full">
                3
              </span>
            </div>

            <ul className="text-sm space-y-2">
              <li className="flex justify-between">
                <span>Responder 2 reseñas</span>
                <span className="opacity-60">5 min</span>
              </li>
              <li className="flex justify-between">
                <span>Confirmar 1 reserva</span>
                <span className="opacity-60">1 min</span>
              </li>
            </ul>
          </Link>

          <Link href="/avisos" className="card rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Bell className="text-red-500" size={18} />
                <p className="text-sm font-bold uppercase">
                  Alertas rápidas
                </p>
              </div>
              <span className="bg-red-500/20 text-red-500 text-xs px-2 rounded-full">
                2
              </span>
            </div>

            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 bg-red-500 rounded-full" />
                Cancelación en franja fuerte
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 bg-yellow-400 rounded-full" />
                Reseña 2★ sin respuesta
              </li>
            </ul>
          </Link>
        </div>
      </div>

      {/* ===== GRÁFICO ===== */}
      <div className="card rounded-2xl p-5 shadow-xl">
        <p className="text-sm font-bold uppercase">
          Reservas de la semana
        </p>
        <p className="text-xs opacity-60 mb-3">
          Tendencia y carga diaria
        </p>

        <div className="card-inner rounded-xl p-5">
          <DashboardChart />
        </div>
      </div>
    </div>
  );
}
