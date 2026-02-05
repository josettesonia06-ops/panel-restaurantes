"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddReservaModal from "../components/AddReservaModal";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";

type Estado = "confirmada" | "pendiente" | "cancelada";

type Reserva = {
  id: string;
  cliente: string;
  cliente_id: string;
  fecha: string;
  hora: string;
  personas: number;
  email: string;
  estado: Estado;
  telefono: string;
  restaurante_id: string;
  fecha_hora_reserva: string;
  atendida: boolean | null;
  resena_solicitada: boolean;
  ya_dejo_resena: boolean;
};

type Filtro = "todas" | "hoy" | "pendientes";

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === "confirmada") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-green-500/15 text-green-500">
        Confirmada
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/15 text-yellow-500">
        Pendiente
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs bg-red-500/15 text-red-500">
      Cancelada
    </span>
  );
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);

  // ===== PUNTOS (config del restaurante) =====
  const [puntosActivo, setPuntosActivo] = useState(false);
  const [puntosPorEuro, setPuntosPorEuro] = useState<number>(1);

  // ===== MODAL GASTO =====
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [reservaParaGasto, setReservaParaGasto] = useState<Reserva | null>(null);
  const [gastoInput, setGastoInput] = useState<string>("");

  /* ===== RESTAURANTE ===== */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        console.log("NO USER AUN");
        return;
      }

      const id = await getRestauranteUsuario();
      setRestauranteId(id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

/* ===== CARGAR CONFIG PUNTOS ===== */
const cargarConfigPuntos = async (rid: string) => {
  const { data, error } = await supabase
    .from("fidelizacion_config")
    .select("puntos_por_euro")
    .eq("restaurante_id", rid)
    .maybeSingle();

  if (error) {
    setPuntosActivo(false);
    setPuntosPorEuro(1);
    return;
  }

  const ratio = Number(data?.puntos_por_euro ?? 0);
  setPuntosPorEuro(ratio > 0 ? ratio : 1);
  setPuntosActivo(ratio > 0); // activo si hay ratio > 0
};

  /* ===== CARGAR RESERVAS ===== */
  const cargarReservas = async () => {
    if (!restauranteId) return;

    const { data } = await supabase
      .from("reservas")
      .select(
        `
          *,
          clientes:cliente_id (
            ya_dejo_resena
          )
        `
      )
      .eq("restaurante_id", restauranteId)
      .order("fecha_hora_reserva", { ascending: true });

    if (!data) return;

    const formateadas: Reserva[] = data.map((r: any) => {
      const fechaDate = new Date(r.fecha_hora_reserva);

      return {
        id: r.id,
        cliente: r.nombre_cliente ?? "Cliente",
        cliente_id: r.cliente_id,
        telefono: r.telefono,
        email: r.email,
        restaurante_id: r.restaurante_id,
        fecha_hora_reserva: r.fecha_hora_reserva,
        fecha:
          fechaDate.toDateString() === new Date().toDateString()
            ? "Hoy"
            : fechaDate.toLocaleDateString(),
        hora: fechaDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        personas: r.personas,
        estado: r.estado,
        atendida: r.atendida,
        resena_solicitada: r.resena_solicitada,
        ya_dejo_resena: r.clientes?.ya_dejo_resena ?? false,
      };
    });

    setReservas(formateadas);
  };

  useEffect(() => {
    if (!restauranteId) return;
    cargarReservas();
    cargarConfigPuntos(restauranteId);
  }, [restauranteId]);

  /* ===== CAMBIAR ESTADO ===== */
  const actualizarEstado = async (id: string, nuevoEstado: Estado) => {
    if (!restauranteId) return;

    const { error } = await supabase
      .from("reservas")
      .update({ estado: nuevoEstado })
      .eq("id", id)
      .eq("restaurante_id", restauranteId);

    if (error) {
      console.error("Error al actualizar estado", error);
      return;
    }

    setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r)));

    try {
      await fetch("https://n8n.gastrohelp.es/webhook/reserva-estado-cambiado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reserva_id: id,
          estado: nuevoEstado,
          restaurante_id: restauranteId,
        }),
      });
    } catch {
      console.log("Webhook n8n no respondió, pero el estado se actualizó");
    }
  };

  /* ===== HA VENIDO (con gasto opcional) ===== */
  const marcarHaVenido = async (reserva: Reserva, valor: boolean, gastoEur?: number | null) => {
    if (!restauranteId) return;
    if (procesando === reserva.id || reserva.atendida !== null) return;

    setProcesando(reserva.id);

    const { data, error } = await supabase
      .from("reservas")
      .update({ atendida: valor })
      .eq("id", reserva.id)
      .eq("restaurante_id", restauranteId)
      .select("id");

    if (error) {
      console.error("Error real al marcar ha venido:", error);
      setProcesando(null);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("Reserva ya estaba atendida o no había cambios");
    }

    // ⛔ Si NO ha venido, paramos aquí
    if (valor === false) {
      setReservas((prev) => prev.map((r) => (r.id === reserva.id ? { ...r, atendida: false } : r)));
      setProcesando(null);
      return;
    }

    // 1) Buscar cliente real en tabla clientes
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("restaurante_id", reserva.restaurante_id)
      .eq("telefono", reserva.telefono)
      .maybeSingle();

    let clienteIdFinal = clienteExistente?.id;

    // 2) Si no existe, crearlo
    if (!clienteIdFinal) {
      const { data: nuevoCliente, error: errNuevo } = await supabase
        .from("clientes")
        .insert({
          restaurante_id: reserva.restaurante_id,
          nombre: reserva.cliente,
          telefono: reserva.telefono,
          visitas_totales: 0,
        })
        .select("id")
        .single();

      if (errNuevo || !nuevoCliente) {
        setProcesando(null);
        return;
      }

      clienteIdFinal = nuevoCliente.id;
    }
// 2.5) Si hay gasto, registrar puntos automáticamente en BD
if (typeof gastoEur === "number" && Number.isFinite(gastoEur) && gastoEur > 0) {
  const { error: errPuntos } = await supabase.rpc("rpc_registrar_gasto", {
    p_cliente_id: clienteIdFinal,
    p_restaurante_id: reserva.restaurante_id,
    p_gasto: gastoEur,
  });

  if (errPuntos) {
    console.error("Error registrando puntos por gasto:", errPuntos);
  }
}

    // 3) Guardar historial (con gasto si aplica)
    const fechaEvento = new Date(reserva.fecha_hora_reserva);

    await supabase.from("clientes_historial").upsert(
      {
        cliente_id: clienteIdFinal,
        restaurante_id: reserva.restaurante_id,
        reserva_id: reserva.id,
        tipo: "visita",
        personas: reserva.personas,
        // si tu columna se llama created_at, esto está ok
        created_at: fechaEvento.toISOString(),
        // NUEVO:
        gasto_eur: typeof gastoEur === "number" && Number.isFinite(gastoEur) ? gastoEur : null,
      },
      { onConflict: "reserva_id" }
    );

    // 4) Actualizar estado en el front
    setReservas((prev) => prev.map((r) => (r.id === reserva.id ? { ...r, atendida: true } : r)));

    // 5) Avisar a n8n (solo si ha venido)
    fetch("https://n8n.gastrohelp.es/webhook/resena-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reserva_id: reserva.id,
        restaurante_id: reserva.restaurante_id,
        cliente_id: clienteIdFinal,
        email: reserva.email,
        nombre: reserva.cliente,
        telefono: reserva.telefono,
        resena_solicitada: reserva.resena_solicitada,
        ya_dejo_resena: reserva.ya_dejo_resena,
        // NUEVO:
        gasto_eur: typeof gastoEur === "number" && Number.isFinite(gastoEur) ? gastoEur : null,
        puntos_activo: puntosActivo,
        puntos_por_euro: puntosPorEuro,
      }),
    });

    setProcesando(null);
  };

  // ===== CLICK ✓ (si puntos activo -> pedir gasto) =====
  const clickHaVenido = (r: Reserva) => {
    if (!puntosActivo) {
      marcarHaVenido(r, true);
      return;
    }
    setReservaParaGasto(r);
    setGastoInput("");
    setShowGastoModal(true);
  };

  const confirmarGastoYMarcar = async () => {
    if (!reservaParaGasto) return;

    const raw = (gastoInput || "").trim().replace(",", ".");
    const n = raw === "" ? null : Number(raw);
    const gasto = n !== null && Number.isFinite(n) && n >= 0 ? n : null;

    setShowGastoModal(false);

    await marcarHaVenido(reservaParaGasto, true, gasto);

    setReservaParaGasto(null);
    setGastoInput("");
  };

  /* ===== FILTROS ===== */
  const reservasFiltradas = reservas
    .filter((r) => {
      if (filtro === "hoy") return r.fecha === "Hoy";
      if (filtro === "pendientes") return r.estado === "pendiente";
      return true;
    })
    .filter((r) => r.cliente.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reservas</h1>

        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="px-4 py-2 rounded-md bg-black text-white text-sm"
        >
          Añadir reserva
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Fecha</th>
              <th className="px-6 py-3 text-left">Hora</th>
              <th className="px-6 py-3 text-left">Personas</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Acciones</th>
              <th className="px-6 py-3 text-left">Ha venido</th>
            </tr>
          </thead>

          <tbody>
            {reservasFiltradas.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-6 py-4 font-medium">{r.cliente}</td>
                <td className="px-6 py-4">{r.fecha}</td>
                <td className="px-6 py-4">{r.hora}</td>
                <td className="px-6 py-4">{r.personas}</td>
                <td className="px-6 py-4">
                  <EstadoBadge estado={r.estado} />
                </td>

                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {r.estado === "pendiente" && (
                      <button
                        onClick={() => actualizarEstado(r.id, "confirmada")}
                        className="text-xs px-3 py-1 rounded-md bg-green-600 text-white"
                      >
                        Confirmar
                      </button>
                    )}
                    {r.estado !== "cancelada" && (
                      <button
                        onClick={() => actualizarEstado(r.id, "cancelada")}
                        className="text-xs px-3 py-1 rounded-md bg-red-600 text-white"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {r.atendida === null && r.estado === "confirmada" && (
                    <div className="flex gap-2">
                      <button
                        disabled={procesando === r.id}
                        onClick={() => clickHaVenido(r)}
                        className="w-7 h-7 flex items-center justify-center rounded border border-green-600 text-green-600"
                        title={puntosActivo ? "Ha venido (pedirá gasto)" : "Ha venido"}
                      >
                        ✓
                      </button>

                      <button
                        disabled={procesando === r.id}
                        onClick={() => marcarHaVenido(r, false)}
                        className="w-7 h-7 flex items-center justify-center rounded border border-red-600 text-red-600"
                        title="No ha venido"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {r.atendida === true && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-600">
                      Ha venido
                    </span>
                  )}
                  {r.atendida === false && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-600">
                      No ha venido
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddReservaModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        restauranteId={restauranteId}
        onCreated={cargarReservas}
      />

      {/* MODAL GASTO */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Registrar gasto</div>
                <div className="mt-1 text-xs text-gray-500">
                  Solo suma puntos si introduces gasto (€).
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGastoModal(false);
                  setReservaParaGasto(null);
                  setGastoInput("");
                }}
                className="rounded-lg border px-3 py-1 text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-600">
                Gasto (€)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={gastoInput}
                onChange={(e) => setGastoInput(e.target.value)}
                placeholder="Ej: 35,50"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <div className="mt-2 text-xs text-gray-500">
                Relación actual: {puntosPorEuro} puntos por €.
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowGastoModal(false);
                  setReservaParaGasto(null);
                  setGastoInput("");
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGastoYMarcar}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
