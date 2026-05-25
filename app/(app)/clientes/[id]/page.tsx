"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Mail,
  Phone,
  Star,
  MessageCircle,
  Tag,
  UserRound,
  Clock3,
  Ban,
  CalendarClock,
  Save,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Send,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AddVisitaModal from "../../components/AddVisitaModal";
import { getRestauranteUsuario } from "../../lib/getRestauranteUsuario";

type ClienteDetalle = {
  id: string;
  restaurante_id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  visitas_totales: number | null;
  primera_visita: string | null;
  ultima_visita: string | null;
  origen_principal: string | null;
  canal_contacto: string | null;
  ya_dejo_resena: boolean | null;
  puntos_totales: number | null;
  created_at: string | null;
  notas_internas: string | null;
  etiquetas: string[] | null;
  permite_whatsapp: boolean | null;
  permite_email: boolean | null;
  no_show_total: number | null;
  cancelaciones_totales: number | null;
  total_reservas: number | null;
  total_canceladas_reales: number | null;
  total_atendidas: number | null;
  proxima_reserva: string | null;
};

type Reserva = {
  id: string;
  fecha_hora_reserva: string | null;
  personas: number | null;
  estado: string | null;
  turno: string | null;
  origen: string | null;
  notas: string | null;
  atendida: boolean | null;
  resena_solicitada: boolean | null;
  mesa_id: string | null;
  cliente_id?: string | null;
  telefono?: string | null;
  email?: string | null;
};

function formatFecha(fecha: string | null) {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFechaHora(fecha: string | null) {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBool(value: boolean | null | undefined) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "Pendiente";
}

function formatCanal(canal: string | null) {
  if (!canal) return "-";

  const canales = canal
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c && c.toLowerCase() !== "ninguno");

  if (canales.length === 0) return "-";

  return [...new Set(canales)].join(" · ");
}

function formatBoolAtendida(value: boolean | null | undefined) {
  if (value === true) return "Ha venido";
  if (value === false) return "No show";
  return "Sin marcar";
}

function estadoClase(estado: string | null) {
  const e = (estado || "").toLowerCase();

  if (e === "confirmada") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (e === "pendiente") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }

  if (e === "cancelada") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

function badgeBinario(tipo: "ok" | "no" | "neutral") {
  if (tipo === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (tipo === "no") {
    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
}

function badgeAtendida(atendida: boolean | null) {
  if (atendida === true) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (atendida === false) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

export default function ClienteHistorialPage() {
  const { id } = useParams<{ id: string }>();

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVisita, setShowAddVisita] = useState(false);

  const [notasInternas, setNotasInternas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [errorNotas, setErrorNotas] = useState<string | null>(null);
  const [okNotas, setOkNotas] = useState<string | null>(null);

  const [tituloAviso, setTituloAviso] = useState("");
  const [mensajeAviso, setMensajeAviso] = useState("");
  const [sendingAviso, setSendingAviso] = useState(false);
  const [errorAviso, setErrorAviso] = useState<string | null>(null);
  const [okAviso, setOkAviso] = useState<string | null>(null);

  useEffect(() => {
    const cargarRestaurante = async () => {
      const rid = await getRestauranteUsuario();
      if (rid) setRestauranteId(rid);
    };

    cargarRestaurante();
  }, []);

  const cargarFicha = async () => {
    if (!id || !restauranteId) return;

    setLoading(true);

    const { data: clienteData, error: clienteError } = await supabase
      .from("vw_clientes_resumen")
      .select("*")
      .eq("id", id)
      .eq("restaurante_id", restauranteId)
      .maybeSingle();

    if (clienteError || !clienteData) {
      console.error("Error cargando cliente:", clienteError);
      setCliente(null);
      setReservas([]);
      setLoading(false);
      return;
    }

    setCliente(clienteData);
    setNotasInternas(clienteData.notas_internas || "");

    const telefonoCliente = (clienteData.telefono || "").replace(/\D/g, "");
    const telefonoSin34 =
      telefonoCliente.startsWith("34") && telefonoCliente.length > 9
        ? telefonoCliente.slice(2)
        : telefonoCliente;

    const filtrosReserva = [`cliente_id.eq.${id}`];

    if (clienteData.email) {
      filtrosReserva.push(`email.eq.${clienteData.email}`);
    }

    if (telefonoCliente) {
      filtrosReserva.push(`telefono.eq.${telefonoCliente}`);
      filtrosReserva.push(`telefono.eq.${telefonoSin34}`);
      filtrosReserva.push(`telefono.eq.+${telefonoCliente}`);
    }

    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select(`
        id,
        fecha_hora_reserva,
        personas,
        estado,
        turno,
        origen,
        notas,
        atendida,
        resena_solicitada,
        mesa_id,
        cliente_id,
        telefono,
        email
      `)
      .eq("restaurante_id", restauranteId)
      .or(filtrosReserva.join(","))
      .order("fecha_hora_reserva", { ascending: false });

    if (reservasError) {
      console.error("Error cargando reservas del cliente:", reservasError);
      setReservas([]);
    } else {
      setReservas(reservasData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id && restauranteId) cargarFicha();
  }, [id, restauranteId]);

  const resumenReal = useMemo(() => {
    const ahora = new Date();

    const totalReservas = reservas.length;

    const totalAtendidas = reservas.filter((r) => r.atendida === true).length;

    const totalNoShow = reservas.filter(
      (r) =>
        r.atendida === false &&
        (r.estado || "").toLowerCase() !== "cancelada"
    ).length;

    const totalCanceladas = reservas.filter(
      (r) => (r.estado || "").toLowerCase() === "cancelada"
    ).length;

    const proximaReserva =
      [...reservas]
        .filter(
          (r) =>
            r.fecha_hora_reserva &&
            new Date(r.fecha_hora_reserva) > ahora &&
            (r.estado || "").toLowerCase() !== "cancelada"
        )
        .sort((a, b) => {
          const fa = new Date(a.fecha_hora_reserva || "").getTime();
          const fb = new Date(b.fecha_hora_reserva || "").getTime();
          return fa - fb;
        })[0]?.fecha_hora_reserva ?? null;

    const ultimaVisita =
      [...reservas]
        .filter((r) => r.atendida === true && r.fecha_hora_reserva)
        .sort((a, b) => {
          const fa = new Date(a.fecha_hora_reserva || "").getTime();
          const fb = new Date(b.fecha_hora_reserva || "").getTime();
          return fb - fa;
        })[0]?.fecha_hora_reserva ?? null;

    const primeraVisita =
      [...reservas]
        .filter((r) => r.atendida === true && r.fecha_hora_reserva)
        .sort((a, b) => {
          const fa = new Date(a.fecha_hora_reserva || "").getTime();
          const fb = new Date(b.fecha_hora_reserva || "").getTime();
          return fa - fb;
        })[0]?.fecha_hora_reserva ?? null;

    return {
      totalReservas,
      totalAtendidas,
      totalNoShow,
      totalCanceladas,
      proximaReserva,
      ultimaVisita,
      primeraVisita,
    };
  }, [reservas]);

  const guardarNotasInternas = async () => {
    if (!id || !restauranteId) return;

    setSavingNotas(true);
    setErrorNotas(null);
    setOkNotas(null);

    const { error } = await supabase
      .from("clientes")
      .update({ notas_internas: notasInternas.trim() || null })
      .eq("id", id)
      .eq("restaurante_id", restauranteId);

    if (error) {
      setErrorNotas(error.message);
      setSavingNotas(false);
      return;
    }

    setCliente((prev) =>
      prev
        ? {
            ...prev,
            notas_internas: notasInternas.trim() || null,
          }
        : prev
    );

    setOkNotas("Notas guardadas.");
    setEditandoNotas(false);
    setSavingNotas(false);
  };

  const enviarAvisoCliente = async () => {
    if (!id || !restauranteId || !cliente) return;

    const titulo = tituloAviso.trim();
    const mensaje = mensajeAviso.trim();

    setErrorAviso(null);
    setOkAviso(null);

    if (!titulo || !mensaje) {
      setErrorAviso("Escribe un título y un mensaje.");
      return;
    }

    setSendingAviso(true);

    const { error } = await supabase.from("cliente_notificaciones").insert({
      restaurante_id: restauranteId,
      cliente_id: id,
      tipo: "info",
      titulo,
      mensaje,
      url: null,
      leida: false,
    });

    if (error) {
      setErrorAviso(error.message);
      setSendingAviso(false);
      return;
    }

    setTituloAviso("");
    setMensajeAviso("");
    setOkAviso("Aviso enviado al panel del cliente.");
    setSendingAviso(false);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
            Ficha del cliente
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Información completa, actividad y reservas
          </p>
        </div>

        <button
          onClick={() => setShowAddVisita(true)}
          className="inline-flex w-fit items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          Añadir visita
        </button>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Cargando ficha del cliente...
        </div>
      )}

      {!loading && !cliente && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          No se ha encontrado el cliente
        </div>
      )}

      {!loading && cliente && (
        <>
          <div className="card overflow-hidden">
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                      <UserRound className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-bold text-slate-900 dark:text-white">
                        {cliente.nombre || "Cliente sin nombre"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Cliente registrado desde {formatFecha(cliente.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                      <Phone className="h-4 w-4" />
                      {cliente.telefono || "-"}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                      <Mail className="h-4 w-4" />
                      {cliente.email || "-"}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                      <CalendarDays className="h-4 w-4" />
                      Nacimiento: {formatFecha(cliente.fecha_nacimiento)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Última visita
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {formatFecha(
                          resumenReal.ultimaVisita || cliente.ultima_visita
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Próxima reserva
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {formatFechaHora(
                          resumenReal.proximaReserva || cliente.proxima_reserva
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Canal
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {formatCanal(cliente.canal_contacto)}
                      </p>
                    </div>
                  </div>

                  {!!cliente.etiquetas?.length && (
                    <div className="flex flex-wrap gap-2">
                      {cliente.etiquetas.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                      Visitas reales
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                      {resumenReal.totalAtendidas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                      Puntos
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                      {cliente.puntos_totales ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                      Reservas
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                      {resumenReal.totalReservas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                      No show
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                      {resumenReal.totalNoShow}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="card p-6">
                <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
                  Resumen del cliente
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock3 className="h-4 w-4" />
                      <p className="text-sm">Primera visita</p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {formatFecha(
                        resumenReal.primeraVisita || cliente.primera_visita
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock3 className="h-4 w-4" />
                      <p className="text-sm">Última visita</p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {formatFecha(
                        resumenReal.ultimaVisita || cliente.ultima_visita
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <CalendarClock className="h-4 w-4" />
                      <p className="text-sm">Próxima reserva</p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {formatFechaHora(
                        resumenReal.proximaReserva || cliente.proxima_reserva
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Ban className="h-4 w-4" />
                      <p className="text-sm">Canceladas</p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {resumenReal.totalCanceladas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Canal de contacto
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {formatCanal(cliente.canal_contacto)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Origen principal
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                      {cliente.origen_principal || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Historial de reservas
                  </h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {reservas.length} registros
                  </span>
                </div>

                {reservas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    No hay reservas registradas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservas.map((reserva) => (
                      <div
                        key={reserva.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {formatFechaHora(reserva.fecha_hora_reserva)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {reserva.personas ?? 0} personas
                                {reserva.turno ? ` · ${reserva.turno}` : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                              <span
                                className={`rounded-full border px-2.5 py-1 font-medium ${estadoClase(
                                  reserva.estado
                                )}`}
                              >
                                {reserva.estado || "Sin estado"}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 font-medium ${badgeAtendida(
                                  reserva.atendida
                                )}`}
                              >
                                {formatBoolAtendida(reserva.atendida)}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 font-medium ${
                                  reserva.resena_solicitada
                                    ? badgeBinario("ok")
                                    : badgeBinario("no")
                                }`}
                              >
                                Reseña pedida:{" "}
                                {formatBool(reserva.resena_solicitada)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                              <p className="text-slate-500 dark:text-slate-400">
                                Origen
                              </p>
                              <p className="mt-1 font-medium text-slate-900 dark:text-white">
                                {reserva.origen || "-"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                              <p className="text-slate-500 dark:text-slate-400">
                                Mesa
                              </p>
                              <p className="mt-1 font-medium text-slate-900 dark:text-white">
                                {reserva.mesa_id || "-"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                              <p className="text-slate-500 dark:text-slate-400">
                                Notas
                              </p>
                              <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900 dark:text-white">
                                {reserva.notas || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Enviar aviso
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aparecerá en el panel del cliente
                    </p>
                  </div>
                </div>

                {errorAviso && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {errorAviso}
                  </div>
                )}

                {okAviso && (
                  <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {okAviso}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Título
                    </label>
                    <input
                      value={tituloAviso}
                      onChange={(e) => {
                        setTituloAviso(e.target.value);
                        setErrorAviso(null);
                        setOkAviso(null);
                      }}
                      placeholder="Mensaje del restaurante"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Mensaje
                    </label>
                    <textarea
                      value={mensajeAviso}
                      onChange={(e) => {
                        setMensajeAviso(e.target.value);
                        setErrorAviso(null);
                        setOkAviso(null);
                      }}
                      rows={5}
                      placeholder="Escribe el aviso que verá el cliente..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={enviarAvisoCliente}
                    disabled={sendingAviso}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                  >
                    <Send className="h-4 w-4" />
                    {sendingAviso ? "Enviando..." : "Enviar aviso al cliente"}
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
                  Preferencias y permisos
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <MessageCircle className="h-4 w-4" />
                      Permite WhatsApp
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        cliente.permite_whatsapp === true
                          ? badgeBinario("ok")
                          : cliente.permite_whatsapp === false
                          ? badgeBinario("no")
                          : badgeBinario("neutral")
                      }`}
                    >
                      {formatBool(cliente.permite_whatsapp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Mail className="h-4 w-4" />
                      Permite email
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        cliente.permite_email === true
                          ? badgeBinario("ok")
                          : cliente.permite_email === false
                          ? badgeBinario("no")
                          : badgeBinario("neutral")
                      }`}
                    >
                      {formatBool(cliente.permite_email)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Star className="h-4 w-4" />
                      Ya dejó reseña
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        cliente.ya_dejo_resena === true
                          ? badgeBinario("ok")
                          : cliente.ya_dejo_resena === false
                          ? badgeBinario("no")
                          : badgeBinario("neutral")
                      }`}
                    >
                      {formatBool(cliente.ya_dejo_resena)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <AlertTriangle className="h-4 w-4" />
                      No show
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {resumenReal.totalNoShow}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <XCircle className="h-4 w-4" />
                      Cancelaciones
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {resumenReal.totalCanceladas}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Visitas reales
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {resumenReal.totalAtendidas}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Notas internas
                  </h3>

                  {!editandoNotas ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoNotas(true);
                        setErrorNotas(null);
                        setOkNotas(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={guardarNotasInternas}
                      disabled={savingNotas}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                    >
                      <Save className="h-4 w-4" />
                      {savingNotas ? "Guardando..." : "Guardar"}
                    </button>
                  )}
                </div>

                {errorNotas && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {errorNotas}
                  </div>
                )}

                {okNotas && (
                  <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {okNotas}
                  </div>
                )}

                {editandoNotas ? (
                  <div className="space-y-3">
                    <textarea
                      value={notasInternas}
                      onChange={(e) => setNotasInternas(e.target.value)}
                      rows={7}
                      placeholder="Escribe aquí notas internas del cliente..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setEditandoNotas(false);
                        setNotasInternas(cliente.notas_internas || "");
                        setErrorNotas(null);
                        setOkNotas(null);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <p className="whitespace-pre-wrap">
                      {cliente.notas_internas || "Sin notas internas"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showAddVisita && id && (
        <AddVisitaModal
          clienteId={id}
          onClose={() => setShowAddVisita(false)}
          onSaved={async () => {
            await cargarFicha();
          }}
        />
      )}
    </div>
  );
}