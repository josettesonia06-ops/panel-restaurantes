"use client";

import { useEffect, useState, useCallback } from "react";
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
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { useTheme } from "../components/ThemeProvider";
import { supabase } from "../lib/supabaseClient";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";

export default function OcupacionPage() {
  const [restauranteId, setRestauranteId] = useState<string | null>(null);

  useEffect(() => {
    const cargarRestaurante = async () => {
      const id = await getRestauranteUsuario();
      if (id) setRestauranteId(id);
    };

    cargarRestaurante();
  }, []);


/* ===== CHART ===== */
const DashboardChart = dynamic(() => import("../components/DashboardChart"), {
  ssr: false,
});

function parseHoraToMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function parseRangoHorario(texto: string | null) {
  if (!texto) return null;
  const limpio = texto.replace(/\s+/g, " ").trim();
  const parts = limpio.split(/-|–|—/).map((p) => p.trim());
  if (parts.length < 2) return null;

  const start = parseHoraToMin(parts[0]);
  const end = parseHoraToMin(parts[1]);
  if (start === null || end === null) return null;

  return { start, end, raw: limpio };
}

function minFromDate(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}
  const { toggle } = useTheme();

  const [restaurante, setRestaurante] = useState<any>(null);
  const [reservasHoy, setReservasHoy] = useState(0);

  const [clientesNuevosHoy, setClientesNuevosHoy] = useState(0);

  const [acciones, setAcciones] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [resenasPendientes, setResenasPendientes] = useState(0);

  const [huecosDetectados, setHuecosDetectados] = useState(0);
  const [reservasEnRiesgo, setReservasEnRiesgo] = useState(0);

  const [ocupacionActual, setOcupacionActual] = useState<string>("0%");
  const [ocupacionContext, setOcupacionContext] = useState<string>("");

  /* ===== RESTAURANTE ===== */
  useEffect(() => {
    const cargarRestaurante = async () => {
      const { data } = await supabase.from("Restaurante").select("*").limit(1).single();
      if (data) setRestaurante(data);
    };

    cargarRestaurante();
  }, []);

  /* ===== FECHAS HOY ===== */
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  const inicioHoy = `${yyyy}-${mm}-${dd} 00:00:00`;
  const finHoy = `${yyyy}-${mm}-${dd} 23:59:59`;

  /* ===== RESERVAS HOY ===== */
  const cargarReservasHoy = useCallback(async () => {
    if (!restaurante) return;

    const { count } = await supabase
      .from("reservas")
      .select("*", { count: "exact", head: true })
      .eq("restaurante_id", restaurante.id)
      .neq("estado", "cancelada")
      .gte("fecha_hora_reserva", inicioHoy)
      .lte("fecha_hora_reserva", finHoy);

    if (count !== null) setReservasHoy(count);
  }, [restaurante, inicioHoy, finHoy]);

  /* ===== CLIENTES NUEVOS HOY ===== */
  const cargarClientesNuevosHoy = useCallback(async () => {
    if (!restaurante) return;

    const { count } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("restaurante_id", restaurante.id)
      .eq("visitas_totales", 1)
      .gte("ultima_visita", inicioHoy)
      .lte("ultima_visita", finHoy);

    if (count !== null) setClientesNuevosHoy(count);
  }, [restaurante, inicioHoy, finHoy]);

  /* ===== OCUPACIÓN REAL (usa horarios reales + capacidades) ===== */
  const cargarOcupacionReal = useCallback(async () => {
    if (!restaurante) return;

    const rangoComida = parseRangoHorario(restaurante.horario_comida) ?? {
      start: 12 * 60,
      end: 17 * 60,
      raw: "12:00 - 17:00",
    };
    const rangoCena = parseRangoHorario(restaurante.horario_cena) ?? {
      start: 19 * 60,
      end: 24 * 60,
      raw: "19:00 - 24:00",
    };

    const { data: reservas } = await supabase
      .from("reservas")
      .select("personas, fecha_hora_reserva, estado")
      .eq("restaurante_id", restaurante.id)
      .neq("estado", "cancelada")
      .gte("fecha_hora_reserva", inicioHoy)
      .lte("fecha_hora_reserva", finHoy);

    let personasComida = 0;
    let personasCena = 0;

    reservas?.forEach((r) => {
      const d = new Date(r.fecha_hora_reserva);
      const min = minFromDate(d);
      const p = r.personas ?? 0;

      if (min >= rangoComida.start && min <= rangoComida.end) personasComida += p;
      if (min >= rangoCena.start && min <= rangoCena.end) personasCena += p;
    });

    const ahoraMin = minFromDate(new Date());

    // si estamos dentro de comida -> muestra comida, si dentro de cena -> cena, si no -> la mayor
    const dentroComida = ahoraMin >= rangoComida.start && ahoraMin <= rangoComida.end;
    const dentroCena = ahoraMin >= rangoCena.start && ahoraMin <= rangoCena.end;

    const capComida = restaurante.capacidad_comida ?? 0;
    const capCena = restaurante.capacidad_cena ?? 0;

    const pctComida = capComida > 0 ? Math.round((personasComida / capComida) * 100) : 0;
    const pctCena = capCena > 0 ? Math.round((personasCena / capCena) * 100) : 0;

    let pct = 0;
    let ctx = "";

    if (dentroComida) {
      pct = pctComida;
      ctx = `Comida · ${rangoComida.raw}`;
    } else if (dentroCena) {
      pct = pctCena;
      ctx = `Cena · ${rangoCena.raw}`;
    } else {
      // fuera de turnos: muestra el mayor
      if (pctCena >= pctComida) {
        pct = pctCena;
        ctx = `Cena · ${rangoCena.raw}`;
      } else {
        pct = pctComida;
        ctx = `Comida · ${rangoComida.raw}`;
      }
    }

    setOcupacionActual(`${Math.max(0, Math.min(pct, 999))}%`);
    setOcupacionContext(ctx);
  }, [restaurante, inicioHoy, finHoy]);

  useEffect(() => {
    cargarReservasHoy();
    cargarClientesNuevosHoy();
    cargarOcupacionReal();
  }, [restaurante, cargarReservasHoy, cargarClientesNuevosHoy, cargarOcupacionReal]);

  /* ===== REALTIME (ACTUALIZA TARJETAS) ===== */
  useEffect(() => {
    if (!restaurante) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas" }, () => {
        cargarReservasHoy();
        cargarOcupacionReal();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, () => {
        cargarClientesNuevosHoy();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "Restaurante" }, () => {
        // si cambian capacidades/horarios en Ajustes
        cargarOcupacionReal();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurante, cargarReservasHoy, cargarClientesNuevosHoy, cargarOcupacionReal]);

  /* ===== ACCIONES + RESEÑAS ===== */
  useEffect(() => {
    if (!restaurante) return;

    const cargarAcciones = async () => {
      const lista: any[] = [];

      const { count: pendientes } = await supabase
        .from("reseñas")
        .select("*", { count: "exact", head: true })
        .eq("restaurante_id", restaurante.id)
        .eq("responded", false);

      setResenasPendientes(pendientes || 0);

      if (pendientes && pendientes > 0) {
        lista.push({
          texto: `Responder ${pendientes} reseña${pendientes > 1 ? "s" : ""}`,
          tiempo: "5 min",
        });
      }

      const { count: reservasPendientes } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true })
        .eq("restaurante_id", restaurante.id)
        .eq("estado", "pendiente");

      if (reservasPendientes && reservasPendientes > 0) {
        lista.push({
          texto: `Confirmar ${reservasPendientes} reserva${reservasPendientes > 1 ? "s" : ""}`,
          tiempo: "1 min",
        });
      }

      setAcciones(lista);
      setReservasEnRiesgo(reservasPendientes || 0);
    };

    cargarAcciones();
  }, [restaurante]);

/* ===== ALERTAS + HUECOS ===== */
useEffect(() => {
  if (!restaurante) return;

  const cargarAlertas = async () => {
    const lista: any[] = [];

    const { data: resenasGraves } = await supabase
      .from("reseñas")
      .select("rating")
      .eq("restaurante_id", restaurante.id)
      .lte("rating", 2)
      .eq("responded", false);

    resenasGraves?.forEach((r) => {
      lista.push({ texto: `Reseña ${r.rating}★ sin respuesta` });
    });

    const { data: canceladas } = await supabase
      .from("reservas")
      .select("fecha_hora_reserva")
      .eq("restaurante_id", restaurante.id)
      .eq("estado", "cancelada");

    let huecos = 0;

    canceladas?.forEach((r) => {
      const d = new Date(r.fecha_hora_reserva);
      const min = d.getHours() * 60 + d.getMinutes();

      if (
        (min >= 810 && min <= 930) || // comida fuerte
        (min >= 1230 && min <= 1350)  // cena fuerte
      ) {
        huecos++;
      }
    });

    if (huecos > 0) {
      lista.push({ texto: "Cancelación en franja fuerte" });
    }

    // Alertas por ocupación (sin cambiar tu UI)
    const pctNum = Number(String(ocupacionActual).replace("%", ""));
    if (!Number.isNaN(pctNum) && pctNum >= 100) {
      lista.push({ texto: "Turno completo (aforo al 100%)" });
    } else if (!Number.isNaN(pctNum) && pctNum >= 85) {
      lista.push({ texto: "Turno casi lleno (+85% ocupación)" });
    }

    setHuecosDetectados(huecos);
    setAlertas(lista);
  };

  cargarAlertas();
}, [restaurante, ocupacionActual]);


  /* ===== KPIs ===== */
  const stats = [
    {
      id: "reservas",
      title: "Reservas hoy",
      value: reservasHoy,
      context: "Capacidad 50 · quedan 11 plazas",
      icon: CalendarDays,
      color: "blue",
      href: "/reservas",
    },
    {
      id: "clientes",
      title: "Clientes nuevos",
      value: clientesNuevosHoy,
      context: "Buen ritmo hoy",
      icon: Users,
      color: "green",
      href: "/clientes",
    },
    {
      id: "resenas",
      title: "Reseñas pendientes",
      value: resenasPendientes,
      context: "Impacta en Google",
      icon: MessageSquareWarning,
      color: "red",
      href: "/resenas",
    },
    {
      id: "ocupacion",
      title: "Ocupación",
      value: ocupacionActual,
      context: ocupacionContext || "Turno actual",
      icon: Percent,
      color: "purple",
      href: "/ocupacion",
    },
  ];

  /* ===== IMPACTO ===== */
  const impactStats = [
    {
      id: "huecos",
      title: "Huecos detectados",
      value: huecosDetectados,
      description: "Hoy en comida o cena",
      href: "/reservas",
      color: "amber",
    },
    {
      id: "riesgo",
      title: "Reservas en riesgo",
      value: reservasEnRiesgo,
      description: "Pendientes de confirmar",
      href: "/reservas?filtro=pendientes",
      color: "red",
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; line: string }> = {
    blue: { bg: "bg-blue-500/10", icon: "text-blue-500", line: "bg-blue-500" },
    green: { bg: "bg-green-500/10", icon: "text-green-500", line: "bg-green-500" },
    red: { bg: "bg-red-500/10", icon: "text-red-500", line: "bg-red-500" },
    purple: { bg: "bg-purple-500/10", icon: "text-purple-500", line: "bg-purple-500" },
    amber: { bg: "bg-amber-500/10", icon: "text-amber-500", line: "bg-amber-500" },
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            {restaurante ? restaurante.nombre : "Dashboard"}
          </h1>
          <p className="text-sm opacity-70">Estado del restaurante hoy</p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-lg border bg-white dark:bg-transparent"
          >
            <Moon size={16} />
          </button>

          <Link
            href="/ajustes"
            className="px-3 py-1.5 rounded-lg border bg-white dark:bg-transparent"
          >
            Ajustes
          </Link>
        </div>
      </div>

      {/* KPIs + ACCIONES + ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:col-span-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const c = colorMap[stat.color];

            return (
              <Link
                key={stat.id}
                href={stat.href}
                className="card rounded-2xl p-4 hover:shadow-xl"
              >
                <div className={`h-1 w-full rounded-full ${c.line} mb-3`} />
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${c.bg}`}>
                    <Icon size={22} className={c.icon} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-extrabold">{stat.value}</p>
                    <p className="text-xs opacity-60">{stat.context}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:col-span-2">
          <div className="card rounded-2xl p-5">
            <div className="flex justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-500" size={18} />
                <p className="text-sm font-bold uppercase">Acciones</p>
              </div>
              <span className="text-xs px-2 rounded-full bg-blue-100">
                {acciones.length}
              </span>
            </div>

            <ul className="text-sm space-y-2">
              {acciones.length === 0 && <li className="opacity-60">Todo al día</li>}
              {acciones.map((a, i) => (
                <li key={i} className="flex justify-between">
                  <span>{a.texto}</span>
                  <span className="opacity-60">{a.tiempo}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card rounded-2xl p-5">
            <div className="flex justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="text-red-500" size={18} />
                <p className="text-sm font-bold uppercase">Alertas</p>
              </div>
              <span className="text-xs px-2 rounded-full bg-red-100">
                {alertas.length}
              </span>
            </div>

            <ul className="text-sm space-y-2">
              {alertas.length === 0 && <li className="opacity-60">Sin alertas</li>}
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-red-500 rounded-full" />
                  {a.texto}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* IMPACTO */}
      <div className="card rounded-2xl p-5">
        <p className="text-sm font-bold uppercase mb-4">Impacto de hoy</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {impactStats.map((item) => {
            const c = colorMap[item.color];

            return (
              <Link key={item.id} href={item.href} className={`rounded-xl p-4 ${c.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className={c.icon} />
                  <p className="text-xs uppercase opacity-60">{item.title}</p>
                </div>
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="text-xs opacity-60">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="opacity-60" />
          <p className="text-sm font-bold uppercase">Reservas de la semana</p>
        </div>

        {restauranteId && <DashboardChart restauranteId={restauranteId} />}
    </div>
  </div>
);
}
