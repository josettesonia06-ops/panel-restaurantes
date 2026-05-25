"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../components/ThemeProvider";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Building2,
  Users,
  MessageSquare,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Euro,
  Activity,
  PieChart as PieIcon,
  Target,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

type RowReservas = {
  restaurante_id: string;
  restaurante_nombre: string | null;
  reservas_mes_actual: number | string | null;
  reservas_mes_anterior: number | string | null;
  diferencia?: number | string | null;
  variacion_pct?: number | string | null;
};

type RowClientes = {
  restaurante_id: string;
  restaurante_nombre: string | null;
  clientes_nuevos_mes_actual: number | string | null;
  clientes_nuevos_mes_anterior: number | string | null;
  diferencia?: number | string | null;
  variacion_pct?: number | string | null;
};

type RowResenas = {
  restaurante_id: string;
  restaurante_nombre: string | null;
  resenas_nuevas_mes_actual: number | string | null;
  resenas_nuevas_mes_anterior: number | string | null;
  diferencia?: number | string | null;
  variacion_pct?: number | string | null;
};

type RowUI = {
  restaurante_id: string;
  restaurante_nombre: string | null;

  reservas_mes_actual: number;
  reservas_mes_anterior: number;
  reservas_diferencia: number;
  reservas_variacion_pct: number;

  clientes_nuevos_mes_actual: number;
  clientes_nuevos_mes_anterior: number;
  clientes_nuevos_diferencia: number;
  clientes_nuevos_variacion_pct: number;

  resenas_nuevas_mes_actual: number;
  resenas_nuevas_mes_anterior: number;
  resenas_nuevas_diferencia: number;
  resenas_nuevas_variacion_pct: number;
};

type VentaPlato = {
  id: string;
  restaurante_id: string;
  plato_id: string;
  fecha: string;
  cantidad: number | string;
  ingreso_total: number | string | null;
  coste_total: number | string | null;
  beneficio_total: number | string | null;
  platos?: {
    nombre: string | null;
    categoria: string | null;
  } | null;
};

function clsx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

const fmtInt = (n: number) => new Intl.NumberFormat("es-ES").format(n);

const fmtPct = (n: number) =>
  `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;

const fmtEuro = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(n) ? n : 0);

function toNum(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthStart(date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getNextMonthStart(date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function getPrevMonthStart(date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function metricDelta(actual: number, anterior: number) {
  const diferencia = actual - anterior;
  let variacion = 0;

  if (anterior === 0 && actual > 0) variacion = 100;
  else if (anterior === 0 && actual === 0) variacion = 0;
  else variacion = Number((((actual - anterior) / anterior) * 100).toFixed(2));

  return { diferencia, variacion };
}

function TrendBadge({
  diff,
  dark,
  label,
}: {
  diff: number;
  dark: boolean;
  label?: string;
}) {
  const sube = diff > 0;
  const baja = diff < 0;

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        sube
          ? dark
            ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20"
            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : baja
          ? dark
            ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/20"
            : "bg-red-50 text-red-700 ring-1 ring-red-200"
          : dark
          ? "bg-gray-800 text-gray-200 ring-1 ring-gray-700"
          : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
      )}
    >
      {sube ? (
        <TrendingUp size={12} />
      ) : baja ? (
        <TrendingDown size={12} />
      ) : (
        <Minus size={12} />
      )}
      <span>
        {sube ? "sube" : baja ? "baja" : "igual"}
        {label ? ` · ${label}` : ""}
      </span>
    </div>
  );
}

function SectionTitle({
  dark,
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  dark: boolean;
  icon: any;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl",
            dark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"
          )}
        >
          <Icon size={17} />
        </div>

        <div>
          <h2
            className={clsx(
              "text-sm font-extrabold uppercase tracking-[0.16em]",
              dark ? "text-white" : "text-gray-900"
            )}
          >
            {title}
          </h2>

          {subtitle ? (
            <p className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function KPI({
  dark,
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: {
  dark: boolean;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  tone?: "default" | "emerald" | "red" | "blue" | "violet" | "amber";
}) {
  const toneMap: Record<string, string> = {
    default: dark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700",
    emerald: dark
      ? "bg-emerald-500/15 text-emerald-200"
      : "bg-emerald-50 text-emerald-700",
    red: dark ? "bg-red-500/15 text-red-200" : "bg-red-50 text-red-700",
    blue: dark ? "bg-blue-500/15 text-blue-200" : "bg-blue-50 text-blue-700",
    violet: dark
      ? "bg-violet-500/15 text-violet-200"
      : "bg-violet-50 text-violet-700",
    amber: dark ? "bg-amber-500/15 text-amber-200" : "bg-amber-50 text-amber-700",
  };

  return (
    <div
      className={clsx(
        "group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        dark ? "border-gray-800 bg-gray-950/50" : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={clsx(
              "text-xs font-bold uppercase tracking-[0.14em]",
              dark ? "text-gray-400" : "text-gray-500"
            )}
          >
            {title}
          </p>

          <p
            className={clsx(
              "mt-2 truncate text-2xl font-black tracking-tight",
              dark ? "text-white" : "text-gray-950"
            )}
          >
            {value}
          </p>

          {subtitle ? (
            <p className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            toneMap[tone]
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  dark,
  label,
  value,
  tone,
}: {
  dark: boolean;
  label: string;
  value: string | number;
  tone: "emerald" | "blue" | "violet" | "red" | "gray";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "blue"
      ? "text-blue-600"
      : tone === "violet"
      ? "text-violet-600"
      : tone === "red"
      ? "text-red-600"
      : dark
      ? "text-gray-200"
      : "text-gray-800";

  return (
    <div
      className={clsx(
        "rounded-2xl border p-4",
        dark ? "border-gray-800 bg-gray-900/40" : "border-gray-200 bg-gray-50"
      )}
    >
      <p className={clsx("text-xs font-semibold", dark ? "text-gray-400" : "text-gray-500")}>
        {label}
      </p>
      <p className={clsx("mt-2 text-2xl font-black", color)}>{value}</p>
    </div>
  );
}

function ChartCard({
  dark,
  title,
  subtitle,
  children,
}: {
  dark: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 shadow-sm",
        dark ? "border-gray-800 bg-gray-950/50" : "border-gray-200 bg-white"
      )}
    >
      <div className="mb-4">
        <p className={clsx("text-sm font-extrabold", dark ? "text-white" : "text-gray-900")}>
          {title}
        </p>
        {subtitle ? (
          <p className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

export default function EstadisticasMensualesPage() {
  const { dark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [row, setRow] = useState<RowUI | null>(null);
  const [ventasPlatos, setVentasPlatos] = useState<VentaPlato[]>([]);

  const cardBase = useMemo(
    () =>
      clsx(
        "rounded-3xl border shadow-sm",
        dark ? "border-gray-800 bg-gray-950/50" : "border-gray-200 bg-white"
      ),
    [dark]
  );

  const pageBg = dark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-950";

  const btn = useMemo(
    () =>
      clsx(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition",
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800"
          : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
      ),
    [dark]
  );

  const pieColors = dark
    ? ["#10b981", "#3b82f6", "#8b5cf6"]
    : ["#059669", "#2563eb", "#7c3aed"];

  const cargar = async () => {
    setLoading(true);
    setErrorMsg(null);

    const rid = await getRestauranteUsuario();

    if (!rid) {
      setErrorMsg("No se encontró el restaurante del usuario.");
      setLoading(false);
      return;
    }

    setRestauranteId(rid);

    const [r1, r2, r3, r4] = await Promise.all([
      supabase
        .from("vw_reservas_comparativa_mensual")
        .select("*")
        .eq("restaurante_id", rid)
        .maybeSingle(),

      supabase
        .from("vw_clientes_nuevos_comparativa_mensual")
        .select("*")
        .eq("restaurante_id", rid)
        .maybeSingle(),

      supabase
        .from("vw_resenas_nuevas_comparativa_mensual")
        .select("*")
        .eq("restaurante_id", rid)
        .maybeSingle(),

      supabase
        .from("ventas_platos")
        .select(
          `
          *,
          platos (
            nombre,
            categoria
          )
        `
        )
        .eq("restaurante_id", rid),
    ]);

    if (r1.error || r2.error || r3.error || r4.error) {
      setErrorMsg(
        r1.error?.message ||
          r2.error?.message ||
          r3.error?.message ||
          r4.error?.message ||
          "Error cargando estadísticas"
      );
      setLoading(false);
      return;
    }

    setVentasPlatos((r4.data as VentaPlato[]) ?? []);

    const reservas = (r1.data ?? null) as RowReservas | null;
    const clientes = (r2.data ?? null) as RowClientes | null;
    const resenas = (r3.data ?? null) as RowResenas | null;

    const nombre =
      reservas?.restaurante_nombre ||
      clientes?.restaurante_nombre ||
      resenas?.restaurante_nombre ||
      "Restaurante";

    const reservasActual = toNum(reservas?.reservas_mes_actual);
    const reservasAnterior = toNum(reservas?.reservas_mes_anterior);
    const dReservas = metricDelta(reservasActual, reservasAnterior);

    const clientesActual = toNum(clientes?.clientes_nuevos_mes_actual);
    const clientesAnterior = toNum(clientes?.clientes_nuevos_mes_anterior);
    const dClientes = metricDelta(clientesActual, clientesAnterior);

    const resenasActual = toNum(resenas?.resenas_nuevas_mes_actual);
    const resenasAnterior = toNum(resenas?.resenas_nuevas_mes_anterior);
    const dResenas = metricDelta(resenasActual, resenasAnterior);

    setRow({
      restaurante_id: rid,
      restaurante_nombre: nombre,

      reservas_mes_actual: reservasActual,
      reservas_mes_anterior: reservasAnterior,
      reservas_diferencia: dReservas.diferencia,
      reservas_variacion_pct: dReservas.variacion,

      clientes_nuevos_mes_actual: clientesActual,
      clientes_nuevos_mes_anterior: clientesAnterior,
      clientes_nuevos_diferencia: dClientes.diferencia,
      clientes_nuevos_variacion_pct: dClientes.variacion,

      resenas_nuevas_mes_actual: resenasActual,
      resenas_nuevas_mes_anterior: resenasAnterior,
      resenas_nuevas_diferencia: dResenas.diferencia,
      resenas_nuevas_variacion_pct: dResenas.variacion,
    });

    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const chartComparativaGlobal = useMemo(() => {
    if (!row) return [];

    return [
      {
        nombre: "Reservas",
        actual: row.reservas_mes_actual,
        anterior: row.reservas_mes_anterior,
      },
      {
        nombre: "Clientes nuevos",
        actual: row.clientes_nuevos_mes_actual,
        anterior: row.clientes_nuevos_mes_anterior,
      },
      {
        nombre: "Reseñas nuevas",
        actual: row.resenas_nuevas_mes_actual,
        anterior: row.resenas_nuevas_mes_anterior,
      },
    ];
  }, [row]);

  const chartDistribucion = useMemo(() => {
    if (!row) return [];

    return [
      { name: "Reservas", value: row.reservas_mes_actual },
      { name: "Clientes nuevos", value: row.clientes_nuevos_mes_actual },
      { name: "Reseñas nuevas", value: row.resenas_nuevas_mes_actual },
    ].filter((x) => x.value > 0);
  }, [row]);

  const chartRadar = useMemo(() => {
    if (!row) return [];

    return [
      { metric: "Reservas", valor: row.reservas_mes_actual },
      { metric: "Clientes", valor: row.clientes_nuevos_mes_actual },
      { metric: "Reseñas", valor: row.resenas_nuevas_mes_actual },
    ];
  }, [row]);

  const rentabilidadMensual = useMemo(() => {
    const now = new Date();
    const monthStart = getMonthStart(now);
    const nextMonthStart = getNextMonthStart(now);
    const prevMonthStart = getPrevMonthStart(now);

    const ventasMes = ventasPlatos.filter(
      (v) => v.fecha >= monthStart && v.fecha < nextMonthStart
    );

    const ventasMesAnterior = ventasPlatos.filter(
      (v) => v.fecha >= prevMonthStart && v.fecha < monthStart
    );

    const ingresoMes = ventasMes.reduce(
      (acc, v) => acc + toNum(v.ingreso_total),
      0
    );

    const costeMes = ventasMes.reduce(
      (acc, v) => acc + toNum(v.coste_total),
      0
    );

    const beneficioMes = ventasMes.reduce(
      (acc, v) => acc + toNum(v.beneficio_total),
      0
    );

    const beneficioAnterior = ventasMesAnterior.reduce(
      (acc, v) => acc + toNum(v.beneficio_total),
      0
    );

    const unidadesMes = ventasMes.reduce(
      (acc, v) => acc + toNum(v.cantidad),
      0
    );

    const diferenciaBeneficio = beneficioMes - beneficioAnterior;

    const porPlato = new Map<
      string,
      {
        nombre: string;
        categoria: string;
        beneficio: number;
        unidades: number;
      }
    >();

    ventasMes.forEach((v) => {
      const key = v.plato_id;
      const actual = porPlato.get(key) ?? {
        nombre: v.platos?.nombre ?? "Plato eliminado",
        categoria: v.platos?.categoria ?? "Sin categoría",
        beneficio: 0,
        unidades: 0,
      };

      actual.beneficio += toNum(v.beneficio_total);
      actual.unidades += toNum(v.cantidad);

      porPlato.set(key, actual);
    });

    const topPlato =
      Array.from(porPlato.values()).sort((a, b) => b.beneficio - a.beneficio)[0] ??
      null;

    return {
      ingresoMes,
      costeMes,
      beneficioMes,
      beneficioAnterior,
      diferenciaBeneficio,
      unidadesMes,
      topPlato,
    };
  }, [ventasPlatos]);

  if (loading && !row) {
    return (
      <div className={clsx("min-h-screen p-6", pageBg)}>
        <div
          className={clsx(
            "rounded-3xl border p-6 text-sm shadow-sm",
            dark ? "border-gray-800 bg-gray-950 text-gray-300" : "border-gray-200 bg-white text-gray-600"
          )}
        >
          Cargando estadísticas…
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen space-y-6 p-4 md:p-6", pageBg)}>
      {/* CABECERA */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                dark ? "bg-gray-900 text-emerald-300" : "bg-white text-emerald-700 shadow-sm"
              )}
            >
              <BarChart3 size={20} />
            </div>

            <div>
              <h1
                className={clsx(
                  "text-2xl font-black uppercase tracking-[0.18em]",
                  dark ? "text-white" : "text-gray-950"
                )}
              >
                Estadísticas mensuales
              </h1>

              <p className={clsx("mt-1 text-sm", dark ? "text-gray-400" : "text-gray-600")}>
                {row?.restaurante_nombre ?? "Restaurante"} · mes actual vs mes anterior
              </p>
            </div>
          </div>

          {restauranteId ? (
            <p className={clsx("mt-3 text-xs", dark ? "text-gray-500" : "text-gray-500")}>
              ID: {restauranteId}
            </p>
          ) : null}
        </div>

        <button className={btn} onClick={cargar} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Recargar
        </button>
      </div>

      {errorMsg && (
        <div
          className={clsx(
            "rounded-2xl border p-4 text-sm",
            dark
              ? "border-red-800 bg-red-950/30 text-red-200"
              : "border-red-300 bg-red-50 text-red-700"
          )}
        >
          {errorMsg}
        </div>
      )}

      {!row ? (
        <div className={clsx(cardBase, "p-5 text-sm")}>
          No hay datos para este restaurante.
        </div>
      ) : (
        <>
          {/* RESUMEN */}
          <section className={clsx(cardBase, "p-4 md:p-5")}>
            <SectionTitle
              dark={dark}
              icon={Activity}
              title="Resumen general"
              subtitle="Vista rápida del rendimiento mensual del restaurante"
              right={
                <TrendBadge
                  diff={row.reservas_diferencia}
                  dark={dark}
                  label={fmtPct(row.reservas_variacion_pct)}
                />
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <KPI
                dark={dark}
                title="Restaurante"
                value={row.restaurante_nombre ?? "—"}
                subtitle="Panel actual"
                icon={Building2}
              />

              <KPI
                dark={dark}
                title="Reservas"
                value={fmtInt(row.reservas_mes_actual)}
                subtitle={`Ant.: ${fmtInt(row.reservas_mes_anterior)}`}
                icon={CalendarDays}
                tone="emerald"
              />

              <KPI
                dark={dark}
                title="Clientes nuevos"
                value={fmtInt(row.clientes_nuevos_mes_actual)}
                subtitle={`Ant.: ${fmtInt(row.clientes_nuevos_mes_anterior)}`}
                icon={Users}
                tone="blue"
              />

              <KPI
                dark={dark}
                title="Reseñas nuevas"
                value={fmtInt(row.resenas_nuevas_mes_actual)}
                subtitle={`Ant.: ${fmtInt(row.resenas_nuevas_mes_anterior)}`}
                icon={MessageSquare}
                tone="violet"
              />

              <KPI
                dark={dark}
                title="Diferencia reservas"
                value={`${row.reservas_diferencia > 0 ? "+" : ""}${fmtInt(
                  row.reservas_diferencia
                )}`}
                subtitle={fmtPct(row.reservas_variacion_pct)}
                icon={row.reservas_diferencia >= 0 ? ArrowUpRight : ArrowDownRight}
                tone={row.reservas_diferencia >= 0 ? "emerald" : "red"}
              />

              <KPI
                dark={dark}
                title="Tendencia"
                value={
                  row.reservas_diferencia > 0
                    ? "Sube"
                    : row.reservas_diferencia < 0
                    ? "Baja"
                    : "Igual"
                }
                subtitle="Según reservas"
                icon={
                  row.reservas_diferencia > 0
                    ? TrendingUp
                    : row.reservas_diferencia < 0
                    ? TrendingDown
                    : Minus
                }
                tone={
                  row.reservas_diferencia > 0
                    ? "emerald"
                    : row.reservas_diferencia < 0
                    ? "red"
                    : "default"
                }
              />
            </div>
          </section>

          {/* RENTABILIDAD */}
          <section className={clsx(cardBase, "p-4 md:p-5")}>
            <SectionTitle
              dark={dark}
              icon={ShoppingCart}
              title="Rentabilidad mensual"
              subtitle="Basado en ventas por plato y coste de receta guardado"
              right={
                <div
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    rentabilidadMensual.diferenciaBeneficio >= 0
                      ? dark
                        ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : dark
                      ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/20"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  )}
                >
                  {rentabilidadMensual.diferenciaBeneficio >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>
                    {rentabilidadMensual.diferenciaBeneficio >= 0 ? "+" : ""}
                    {fmtEuro(rentabilidadMensual.diferenciaBeneficio)} vs mes anterior
                  </span>
                </div>
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KPI
                dark={dark}
                title="Ingresos estimados"
                value={fmtEuro(rentabilidadMensual.ingresoMes)}
                subtitle="Mes actual"
                icon={Euro}
                tone="emerald"
              />

              <KPI
                dark={dark}
                title="Costes estimados"
                value={fmtEuro(rentabilidadMensual.costeMes)}
                subtitle="Según receta"
                icon={Euro}
                tone="amber"
              />

              <KPI
                dark={dark}
                title="Beneficio estimado"
                value={fmtEuro(rentabilidadMensual.beneficioMes)}
                subtitle="Ingresos - costes"
                icon={TrendingUp}
                tone={rentabilidadMensual.beneficioMes >= 0 ? "emerald" : "red"}
              />

              <KPI
                dark={dark}
                title="Unidades vendidas"
                value={fmtInt(rentabilidadMensual.unidadesMes)}
                subtitle="Registradas este mes"
                icon={ShoppingCart}
                tone="blue"
              />

              <div
                className={clsx(
                  "rounded-2xl border p-4 shadow-sm",
                  dark ? "border-gray-800 bg-gray-950/50" : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-xs font-bold uppercase tracking-[0.14em]",
                        dark ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      Top plato
                    </p>

                    <p
                      className={clsx(
                        "mt-2 truncate text-xl font-black",
                        dark ? "text-white" : "text-gray-950"
                      )}
                    >
                      {rentabilidadMensual.topPlato?.nombre ?? "Sin datos"}
                    </p>

                    <p
                      className={clsx(
                        "mt-1 text-xs",
                        dark ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      {rentabilidadMensual.topPlato
                        ? `${fmtEuro(rentabilidadMensual.topPlato.beneficio)} · ${fmtInt(
                            rentabilidadMensual.topPlato.unidades
                          )} uds.`
                        : "Registra ventas para verlo"}
                    </p>
                  </div>

                  <div
                    className={clsx(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      dark ? "bg-violet-500/15 text-violet-200" : "bg-violet-50 text-violet-700"
                    )}
                  >
                    <Trophy size={18} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* METRICAS */}
          <section className={clsx(cardBase, "p-4 md:p-5")}>
            <SectionTitle
              dark={dark}
              icon={Target}
              title="Métricas principales"
              subtitle="Comparación directa entre mes actual y mes anterior"
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div
                className={clsx(
                  "rounded-2xl border p-4",
                  dark ? "border-gray-800 bg-gray-950/40" : "border-gray-200 bg-white"
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className={clsx("text-sm font-black", dark ? "text-white" : "text-gray-900")}>
                    Reservas
                  </p>
                  <TrendBadge
                    diff={row.reservas_diferencia}
                    dark={dark}
                    label={fmtPct(row.reservas_variacion_pct)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricBox dark={dark} label="Actual" value={fmtInt(row.reservas_mes_actual)} tone="emerald" />
                  <MetricBox dark={dark} label="Anterior" value={fmtInt(row.reservas_mes_anterior)} tone="red" />
                  <MetricBox
                    dark={dark}
                    label="Dif."
                    value={`${row.reservas_diferencia > 0 ? "+" : ""}${fmtInt(row.reservas_diferencia)}`}
                    tone={row.reservas_diferencia >= 0 ? "emerald" : "red"}
                  />
                </div>
              </div>

              <div
                className={clsx(
                  "rounded-2xl border p-4",
                  dark ? "border-gray-800 bg-gray-950/40" : "border-gray-200 bg-white"
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className={clsx("text-sm font-black", dark ? "text-white" : "text-gray-900")}>
                    Clientes nuevos
                  </p>
                  <TrendBadge
                    diff={row.clientes_nuevos_diferencia}
                    dark={dark}
                    label={fmtPct(row.clientes_nuevos_variacion_pct)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricBox dark={dark} label="Actual" value={fmtInt(row.clientes_nuevos_mes_actual)} tone="blue" />
                  <MetricBox dark={dark} label="Anterior" value={fmtInt(row.clientes_nuevos_mes_anterior)} tone="red" />
                  <MetricBox
                    dark={dark}
                    label="Dif."
                    value={`${row.clientes_nuevos_diferencia > 0 ? "+" : ""}${fmtInt(
                      row.clientes_nuevos_diferencia
                    )}`}
                    tone={row.clientes_nuevos_diferencia >= 0 ? "emerald" : "red"}
                  />
                </div>
              </div>

              <div
                className={clsx(
                  "rounded-2xl border p-4",
                  dark ? "border-gray-800 bg-gray-950/40" : "border-gray-200 bg-white"
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className={clsx("text-sm font-black", dark ? "text-white" : "text-gray-900")}>
                    Reseñas nuevas
                  </p>
                  <TrendBadge
                    diff={row.resenas_nuevas_diferencia}
                    dark={dark}
                    label={fmtPct(row.resenas_nuevas_variacion_pct)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricBox dark={dark} label="Actual" value={fmtInt(row.resenas_nuevas_mes_actual)} tone="violet" />
                  <MetricBox dark={dark} label="Anterior" value={fmtInt(row.resenas_nuevas_mes_anterior)} tone="red" />
                  <MetricBox
                    dark={dark}
                    label="Dif."
                    value={`${row.resenas_nuevas_diferencia > 0 ? "+" : ""}${fmtInt(
                      row.resenas_nuevas_diferencia
                    )}`}
                    tone={row.resenas_nuevas_diferencia >= 0 ? "emerald" : "red"}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* GRAFICOS */}
          <section className={clsx(cardBase, "p-4 md:p-5")}>
            <SectionTitle
              dark={dark}
              icon={PieIcon}
              title="Gráficos"
              subtitle="Lectura visual de reservas, clientes y reseñas"
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ChartCard dark={dark} title="Comparativa global" subtitle="Mes actual vs mes anterior">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartComparativaGlobal}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={dark ? "#374151" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="nombre"
                        stroke={dark ? "#d1d5db" : "#4b5563"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={dark ? "#d1d5db" : "#4b5563"}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: dark ? "#111827" : "#ffffff",
                          border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                          borderRadius: 12,
                          color: dark ? "#fff" : "#111827",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="anterior"
                        name="Mes anterior"
                        radius={[8, 8, 0, 0]}
                        fill={dark ? "#6b7280" : "#94a3b8"}
                      />
                      <Bar
                        dataKey="actual"
                        name="Mes actual"
                        radius={[8, 8, 0, 0]}
                        fill={dark ? "#10b981" : "#059669"}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard dark={dark} title="Distribución del mes actual" subtitle="Reservas / clientes / reseñas">
                {chartDistribucion.length === 0 ? (
                  <div
                    className={clsx(
                      "flex h-[320px] items-center justify-center text-sm",
                      dark ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    No hay datos para mostrar
                  </div>
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            background: dark ? "#111827" : "#ffffff",
                            border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                            borderRadius: 12,
                            color: dark ? "#fff" : "#111827",
                          }}
                        />
                        <Legend />
                        <Pie
                          data={chartDistribucion}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={115}
                          paddingAngle={4}
                        >
                          {chartDistribucion.map((_, i) => (
                            <Cell key={i} fill={pieColors[i % pieColors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                dark={dark}
                title="Ranking interno de métricas"
                subtitle="Comparación de las 3 métricas principales"
              >
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { nombre: "Reservas", valor: row.reservas_mes_actual },
                        { nombre: "Clientes nuevos", valor: row.clientes_nuevos_mes_actual },
                        { nombre: "Reseñas nuevas", valor: row.resenas_nuevas_mes_actual },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={dark ? "#374151" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="nombre"
                        stroke={dark ? "#d1d5db" : "#4b5563"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={dark ? "#d1d5db" : "#4b5563"}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: dark ? "#111827" : "#ffffff",
                          border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                          borderRadius: 12,
                          color: dark ? "#fff" : "#111827",
                        }}
                      />
                      <Bar dataKey="valor" name="Mes actual" radius={[8, 8, 0, 0]}>
                        {[
                          { nombre: "Reservas", valor: row.reservas_mes_actual },
                          { nombre: "Clientes nuevos", valor: row.clientes_nuevos_mes_actual },
                          { nombre: "Reseñas nuevas", valor: row.resenas_nuevas_mes_actual },
                        ].map((entry, index) => {
                          const color =
                            entry.nombre === "Reservas"
                              ? dark
                                ? "#10b981"
                                : "#059669"
                              : entry.nombre === "Clientes nuevos"
                              ? dark
                                ? "#3b82f6"
                                : "#2563eb"
                              : dark
                              ? "#8b5cf6"
                              : "#7c3aed";

                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard dark={dark} title="Perfil del restaurante" subtitle={row.restaurante_nombre ?? "Restaurante"}>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartRadar}>
                      <PolarGrid stroke={dark ? "#374151" : "#d1d5db"} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{
                          fill: dark ? "#d1d5db" : "#4b5563",
                          fontSize: 12,
                        }}
                      />
                      <PolarRadiusAxis
                        tick={{
                          fill: dark ? "#9ca3af" : "#6b7280",
                          fontSize: 10,
                        }}
                      />
                      <Radar
                        dataKey="valor"
                        stroke={dark ? "#10b981" : "#059669"}
                        fill={dark ? "#10b981" : "#059669"}
                        fillOpacity={0.28}
                      />
                      <Tooltip
                        contentStyle={{
                          background: dark ? "#111827" : "#ffffff",
                          border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                          borderRadius: 12,
                          color: dark ? "#fff" : "#111827",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </section>

          {/* DETALLE */}
          <section className={clsx(cardBase, "p-4 md:p-5")}>
            <SectionTitle
              dark={dark}
              icon={Building2}
              title="Detalle del restaurante"
              subtitle="Resumen mensual visual"
              right={
                <TrendBadge
                  diff={row.reservas_diferencia}
                  dark={dark}
                  label={fmtPct(row.reservas_variacion_pct)}
                />
              }
            />

            <div
              className={clsx(
                "rounded-3xl border p-4 md:p-5",
                dark ? "border-gray-800 bg-gray-950/40" : "border-gray-200 bg-gray-50"
              )}
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={clsx("text-lg font-black", dark ? "text-white" : "text-gray-950")}>
                    {row.restaurante_nombre ?? "Restaurante"}
                  </p>
                  <p className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                    Informe mensual del restaurante
                  </p>
                </div>

                <p className={clsx("text-xs", dark ? "text-gray-500" : "text-gray-500")}>
                  Actual vs anterior
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <MetricBox dark={dark} label="Reservas mes actual" value={fmtInt(row.reservas_mes_actual)} tone="emerald" />
                <MetricBox dark={dark} label="Reservas mes anterior" value={fmtInt(row.reservas_mes_anterior)} tone="red" />
                <MetricBox dark={dark} label="Clientes nuevos" value={fmtInt(row.clientes_nuevos_mes_actual)} tone="blue" />
                <MetricBox dark={dark} label="Reseñas nuevas" value={fmtInt(row.resenas_nuevas_mes_actual)} tone="violet" />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className={dark ? "text-gray-400" : "text-gray-500"}>
                    Peso del mes actual en reservas
                  </span>

                  <span className={dark ? "text-gray-400" : "text-gray-500"}>
                    Actual: {fmtInt(row.reservas_mes_actual)} · Anterior:{" "}
                    {fmtInt(row.reservas_mes_anterior)}
                  </span>
                </div>

                <div
                  className={clsx(
                    "h-3 overflow-hidden rounded-full",
                    dark ? "bg-gray-800" : "bg-gray-200"
                  )}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.max(
                        row.reservas_mes_actual + row.reservas_mes_anterior === 0
                          ? 0
                          : (row.reservas_mes_actual /
                              (row.reservas_mes_actual + row.reservas_mes_anterior)) *
                              100,
                        row.reservas_mes_actual > 0 ? 4 : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}