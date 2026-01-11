"use client";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";
import { useEffect, useState } from "react";
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
import { calcularOcupacion } from "../lib/ocupacion";
import { detectarDiaFlojoSemana } from "../lib/ocupacion";



/* ===== CHART ===== */
const DashboardChart = dynamic(() => import("../components/DashboardChart"), {
  ssr: false,
});

export default function DashboardPage() {
  const { toggle } = useTheme();

  const [restaurante, setRestaurante] = useState<any>(null);

  const [reservasHoy, setReservasHoy] = useState(0);
  const [clientesNuevosHoy, setClientesNuevosHoy] = useState(0);
  const [resenasPendientes, setResenasPendientes] = useState(0);

  const [acciones, setAcciones] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);

  const [huecosDetectados, setHuecosDetectados] = useState(0);
  const [reservasEnRiesgo, setReservasEnRiesgo] = useState(0);

  /* ===== OCUPACIÓN ===== */
  const [ocupacionValor, setOcupacionValor] = useState("0%");
  const [ocupacionContexto, setOcupacionContexto] = useState("Buen ritmo");
  const [pctComidaState, setPctComidaState] = useState(0);
  const [pctCenaState, setPctCenaState] = useState(0);
  const [diaFlojo, setDiaFlojo] = useState<any>(null);


  /* ===== RESTAURANTE ===== */
useEffect(() => {
  const cargarRestaurante = async () => {
    const restauranteId = await getRestauranteUsuario();
    if (!restauranteId) return;

    const { data, error } = await supabase
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    console.log("REST DATA:", data);
    console.log("REST ERROR:", error);

    if (data) setRestaurante(data);
  };

  cargarRestaurante();
}, []);



 // Hora actual en España
const ahoraEsp = new Date(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date())
);


// Inicio y fin de hoy (España → UTC)
const inicioHoyDate = new Date(ahoraEsp);
inicioHoyDate.setHours(0, 0, 0, 0);

const finHoyDate = new Date(ahoraEsp);
finHoyDate.setHours(23, 59, 59, 999);

const inicioHoy = inicioHoyDate.toISOString();
const finHoy = finHoyDate.toISOString();


  /* ===== HELPERS ===== */
  function parseHoraToMin(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  function parseRangoHorario(texto: string | null) {
    if (!texto) return null;
    const parts = texto.split(/-|–|—/).map((p) => p.trim());
    if (parts.length < 2) return null;

    const start = parseHoraToMin(parts[0]);
    const end = parseHoraToMin(parts[1]);
    if (start === null || end === null) return null;

    return { start, end };
  }

  function minFromDate(d: Date) {
    return d.getHours() * 60 + d.getMinutes();
  }

  /* ===== RESERVAS HOY ===== */
const cargarReservasHoy = async () => {
  if (!restaurante) return;

  const hoy = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("restaurante_id", restaurante.id)
    .eq("estado", "confirmada")
    .gte("fecha_hora_reserva", `${hoy} 00:00:00`)
    .lte("fecha_hora_reserva", `${hoy} 23:59:59`);

  if (count !== null) setReservasHoy(count);
};



/* ===== CLIENTES NUEVOS HOY ===== */
const cargarClientesNuevosHoy = async () => {
  if (!restaurante) return;

  const hoy = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .eq("restaurante_id", restaurante.id)
    .gte("created_at", `${hoy} 00:00:00`)
    .lte("created_at", `${hoy} 23:59:59`);

  if (count !== null) setClientesNuevosHoy(count);
};

const cargarResenasPendientes = async () => {
  if (!restaurante) return;

  const { count } = await supabase
    .from("resenas")
    .select("*", { count: "exact", head: true })
    .eq("restaurante_id", restaurante.id)
    .eq("respondida", false);

  if (count !== null) setResenasPendientes(count);
};


/* ===== RESERVAS EN RIESGO (PENDIENTES HOY) ===== */
const cargarReservasEnRiesgo = async () => {
  if (!restaurante) return;

  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const inicioHoy = `${hoy} 00:00:00`;
  const finHoy = `${hoy} 23:59:59`;

  const { count, error } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("restaurante_id", restaurante.id)
    .eq("estado", "pendiente")
    .gte("fecha_hora_reserva", inicioHoy)
    .lte("fecha_hora_reserva", finHoy);

  if (error) console.error("RIESGO ERROR", error);
  if (count !== null) setReservasEnRiesgo(count);

};




  /* ===== OCUPACIÓN ===== */
  const cargarOcupacion = async () => {
  if (!restaurante) return;

  const res = await calcularOcupacion(restaurante.id);
  if (!res) return;

  setPctComidaState(res.ocupacionComidaPct);
  setPctCenaState(res.ocupacionCenaPct);

  setOcupacionValor(`${res.totalDiaPct}%`);
  setOcupacionContexto("Ocupación total del día");
};

/* ===== RESERVAS PENDIENTES DE HOY ===== */
const recalcularHuecos = async () => {
  if (!restaurante) return;

  const { count } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("restaurante_id", restaurante.id)
    .eq("estado", "pendiente")
    .gte("fecha_hora_reserva", inicioHoy)
    .lte("fecha_hora_reserva", finHoy);

  setHuecosDetectados(count ?? 0);
};


  /* ===== ACCIONES / ALERTAS ===== */
  const recalcularAccionesYAlertas = () => {
    const nuevasAcciones: any[] = [];
    const nuevasAlertas: any[] = [];

    if (reservasEnRiesgo > 0) {
      nuevasAcciones.push({
        texto: `Confirmar ${reservasEnRiesgo} reservas pendientes`,
        tiempo: "Hoy",
      });
    }

    if (huecosDetectados > 0) {
      nuevasAcciones.push({
        texto: "Promocionar turnos con huecos",
        tiempo: "Hoy",
      });
    }

    if (resenasPendientes > 0) {
      nuevasAcciones.push({
        texto: "Responder reseñas pendientes",
        tiempo: "Hoy",
      });
    }

    if (reservasEnRiesgo >= 3) {
      nuevasAlertas.push({
        texto: "Varias reservas siguen sin confirmar",
      });
    }

    const pctFinal = Math.max(pctComidaState, pctCenaState);
    if (pctFinal >= 90) {
      nuevasAlertas.push({
        texto: "Ocupación muy alta: revisa la capacidad",
      });
    }
if (diaFlojo) {
  nuevasAcciones.push({
    texto: `Promocionar ${diaFlojo.dia} (${diaFlojo.ocupacion}%)`,
    tiempo: "Esta semana",
  });
}

    setAcciones(nuevasAcciones);
    setAlertas(nuevasAlertas);
  };

  /* ===== DISPARADORES ===== */
  useEffect(() => {
    if (!restaurante) return;
    cargarReservasHoy();
    cargarClientesNuevosHoy();
    cargarResenasPendientes();
    cargarOcupacion();
    cargarReservasEnRiesgo();
    detectarDiaFlojoSemana(restaurante.id).then(setDiaFlojo);

  }, [restaurante]);

  useEffect(() => {
    if (!restaurante) return;
    recalcularHuecos();
  }, [restaurante, pctComidaState, pctCenaState]);

  useEffect(() => {
  recalcularAccionesYAlertas();
}, [
  reservasEnRiesgo,
  huecosDetectados,
  resenasPendientes,
  pctComidaState,
  pctCenaState,
  diaFlojo,
]);


  useEffect(() => {
    if (!restaurante) return;

    const channel = supabase
      .channel("dashboard-reservas")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservas",
          filter: `restaurante_id=eq.${restaurante.id}`,
        },
        () => {
          cargarReservasHoy();
          cargarClientesNuevosHoy();
          cargarResenasPendientes();
          cargarOcupacion();
          cargarReservasEnRiesgo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurante]);

  /* ===== KPIs ===== */
  const stats = [
    {
      id: "reservas",
      title: "Reservas hoy",
      value: reservasHoy,
      context: "Total del día",
      icon: CalendarDays,
      color: "blue",
      href: "/reservas",
    },
    {
      id: "clientes",
      title: "Clientes nuevos",
      value: clientesNuevosHoy,
      context: "Hoy",
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
      value: ocupacionValor,
      context: ocupacionContexto,
      icon: Percent,
      color: "purple",
      href: "/ocupacion",
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

        {/* ACCIONES */}
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

          {/* ALERTAS */}
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
          {[
           {
              id: "pendientes-hoy",
              title: "Reservas pendientes",
              value: reservasEnRiesgo,
              description: "Hoy",
              href: "/reservas?filtro=pendientes",
              color: "amber",
          },

            {
              id: "dia-flojo",
  title: diaFlojo ? "Día flojo detectado" : "Ocupación estable",
  value: diaFlojo ? `${diaFlojo.ocupacion}%` : "OK",
  description: diaFlojo
    ? diaFlojo.dia
    : "Sin días por debajo del 40%",
  href: "/ocupacion",
  color: "red",
},

          ].map((item) => {
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

        <div className="h-[260px] min-h-[260px] w-full">
{restaurante && <DashboardChart restauranteId={restaurante.id} />}

        </div>
      </div>
    </div>
  );
}
