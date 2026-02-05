"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/(app)/components/ThemeProvider";
import { supabase } from "@/app/(app)/lib/supabaseClient";
import { getRestauranteUsuario } from "@/app/(app)/lib/getRestauranteUsuario";

type Canje = {
  id: string;
  cliente_id: string;
  premio_id: string;
  puntos_usados: number;
  estado: "pendiente" | "confirmado" | "cancelado";
  creado_en: string;
  confirmado_en: string | null;
};

type Cliente = { id: string; nombre: string | null; telefono: string | null };
type Premio = { id: string; nombre: string; puntos_requeridos: number };

function clsx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function CanjesPage() {
  const { dark } = useTheme();

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [clientesById, setClientesById] = useState<Record<string, Cliente>>({});
  const [premiosById, setPremiosById] = useState<Record<string, Premio>>({});
  const [emailByClienteId, setEmailByClienteId] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const cardBase = useMemo(
    () =>
      clsx(
        "rounded-2xl border shadow-sm",
        dark ? "border-gray-800 bg-gray-950/40" : "border-gray-200 bg-white"
      ),
    [dark]
  );

  const btn = useMemo(
    () =>
      clsx(
        "rounded-xl border px-4 py-2 text-sm font-medium transition",
        dark
          ? "border-gray-800 bg-transparent text-gray-200 hover:bg-gray-900"
          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
        "disabled:opacity-60"
      ),
    [dark]
  );

  const btnPrimary = useMemo(
    () =>
      clsx(
        "rounded-xl px-4 py-2 text-sm font-semibold transition",
        dark ? "bg-white text-black" : "bg-black text-white",
        "disabled:opacity-60"
      ),
    [dark]
  );

  const badge = (text: string, kind: "pendiente" | "confirmado" | "cancelado") => {
    const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold";
    const map =
      kind === "pendiente"
        ? dark
          ? "bg-white/10 text-white"
          : "bg-black/10 text-black"
        : kind === "confirmado"
        ? dark
          ? "bg-emerald-500/20 text-emerald-200"
          : "bg-emerald-100 text-emerald-800"
        : dark
        ? "bg-red-500/20 text-red-200"
        : "bg-red-100 text-red-700";
    return <span className={clsx(base, map)}>{text}</span>;
  };

  const cargarTodo = async (rid: string) => {
    // 1) Canjes (solo del restaurante)
    const { data: canjesData, error: canjesErr } = await supabase
      .from("canjes_puntos")
      .select("id,cliente_id,premio_id,puntos_usados,estado,creado_en,confirmado_en")
      .eq("restaurante_id", rid)
      .order("creado_en", { ascending: false });

    if (canjesErr) throw canjesErr;

    const rows = (canjesData ?? []) as Canje[];
    setCanjes(rows);

    const clienteIds = Array.from(new Set(rows.map((c) => c.cliente_id)));
    const premioIds = Array.from(new Set(rows.map((c) => c.premio_id)));

    // 2) Clientes (SIN email)
    if (clienteIds.length) {
      const { data: clientesData, error: clientesErr } = await supabase
        .from("clientes")
        .select("id,nombre,telefono")
        .in("id", clienteIds);

      if (clientesErr) throw clientesErr;

      const map: Record<string, Cliente> = {};
      (clientesData ?? []).forEach((c: any) => (map[c.id] = c));
      setClientesById(map);
    } else {
      setClientesById({});
    }

    // 3) Premios
    if (premioIds.length) {
      const { data: premiosData, error: premiosErr } = await supabase
        .from("premios_puntos")
        .select("id,nombre,puntos_requeridos")
        .in("id", premioIds)
        .eq("restaurante_id", rid);

      if (premiosErr) throw premiosErr;

      const map: Record<string, Premio> = {};
      (premiosData ?? []).forEach((p: any) => (map[p.id] = p));
      setPremiosById(map);
    } else {
      setPremiosById({});
    }

    // 4) Email: desde reservas (más reciente por cliente y restaurante)
    if (clienteIds.length) {
      const { data: emailsData, error: emailsErr } = await supabase
        .from("reservas")
        .select("cliente_id,email,fecha_hora_reserva")
        .eq("restaurante_id", rid)
        .in("cliente_id", clienteIds)
        .not("email", "is", null)
        .order("cliente_id", { ascending: true })
        .order("fecha_hora_reserva", { ascending: false });

      if (emailsErr) throw emailsErr;

      const map: Record<string, string> = {};
      (emailsData ?? []).forEach((r: any) => {
        if (!map[r.cliente_id] && r.email) map[r.cliente_id] = r.email;
      });
      setEmailByClienteId(map);
    } else {
      setEmailByClienteId({});
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMsg(null);

      const rid = await getRestauranteUsuario();
      if (!rid) {
        setErrorMsg("No se encontró restaurante_id para este usuario.");
        setLoading(false);
        return;
      }
      setRestauranteId(rid);

      try {
        await cargarTodo(rid);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Error cargando canjes");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const confirmar = async (canjeId: string) => {
    if (!restauranteId) return;
    setBusyId(canjeId);
    setErrorMsg(null);

    const { error } = await supabase.rpc("rpc_confirmar_canje", {
      p_canje_id: canjeId,
      p_restaurante_id: restauranteId,
    });

    if (error) {
      setErrorMsg(error.message);
      setBusyId(null);
      return;
    }

    await cargarTodo(restauranteId);
    setBusyId(null);
  };

  const cancelar = async (canjeId: string) => {
    if (!restauranteId) return;
    const ok = window.confirm("Cancelar canje y devolver puntos al cliente?");
    if (!ok) return;

    setBusyId(canjeId);
    setErrorMsg(null);

    const { error } = await supabase.rpc("rpc_cancelar_canje", {
      p_canje_id: canjeId,
      p_restaurante_id: restauranteId,
    });

    if (error) {
      setErrorMsg(error.message);
      setBusyId(null);
      return;
    }

    await cargarTodo(restauranteId);
    setBusyId(null);
  };

  const pendientes = canjes.filter((c) => c.estado === "pendiente");
  const confirmados = canjes.filter((c) => c.estado === "confirmado");
  const cancelados = canjes.filter((c) => c.estado === "cancelado");

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canjes</h1>
          <div className={clsx("mt-1 text-sm", dark ? "text-gray-400" : "text-gray-500")}>
            Restaurante: {restauranteId ?? "—"}
          </div>
        </div>

        <button
          className={btn}
          onClick={() =>
            restauranteId &&
            cargarTodo(restauranteId).catch((e: any) => setErrorMsg(e?.message ?? "Error"))
          }
          disabled={!restauranteId || loading}
        >
          Recargar
        </button>
      </div>

      {errorMsg && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className={clsx("mt-6 text-sm", dark ? "text-gray-300" : "text-gray-600")}>Cargando…</div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* PENDIENTES */}
          <div className={cardBase}>
            <div className={clsx("px-5 py-4 border-b", dark ? "border-gray-800" : "border-gray-200")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Pendientes</div>
                {badge(String(pendientes.length), "pendiente")}
              </div>
            </div>

            <div className="p-5 space-y-3">
              {pendientes.length === 0 ? (
                <div className={clsx("text-sm", dark ? "text-gray-300" : "text-gray-600")}>
                  No hay canjes pendientes.
                </div>
              ) : (
                pendientes.map((c) => {
                  const cl = clientesById[c.cliente_id];
                  const pr = premiosById[c.premio_id];
                  const email = emailByClienteId[c.cliente_id];

                  return (
                    <div
                      key={c.id}
                      className={clsx(
                        "rounded-2xl border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                        dark ? "border-gray-800 bg-gray-950/20" : "border-gray-200 bg-white"
                      )}
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {pr?.nombre ?? "Premio"} · {pr?.puntos_requeridos ?? c.puntos_usados} pts
                        </div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Cliente: {cl?.nombre ?? c.cliente_id}
                          {cl?.telefono ? ` · ${cl.telefono}` : ""}
                          {email ? ` · ${email}` : ""}
                        </div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Creado: {new Date(c.creado_en).toLocaleString("es-ES")}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {badge("Pendiente", "pendiente")}
                        <button className={btnPrimary} onClick={() => confirmar(c.id)} disabled={busyId === c.id}>
                          Confirmar
                        </button>
                        <button className={btn} onClick={() => cancelar(c.id)} disabled={busyId === c.id}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CONFIRMADOS */}
          <div className={cardBase}>
            <div className={clsx("px-5 py-4 border-b", dark ? "border-gray-800" : "border-gray-200")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Confirmados</div>
                {badge(String(confirmados.length), "confirmado")}
              </div>
            </div>

            <div className="p-5 space-y-2">
              {confirmados.length === 0 ? (
                <div className={clsx("text-sm", dark ? "text-gray-300" : "text-gray-600")}>—</div>
              ) : (
                confirmados.slice(0, 20).map((c) => {
                  const cl = clientesById[c.cliente_id];
                  const pr = premiosById[c.premio_id];
                  const email = emailByClienteId[c.cliente_id];

                  return (
                    <div
                      key={c.id}
                      className={clsx(
                        "rounded-2xl border p-4 flex items-start justify-between gap-4",
                        dark ? "border-gray-800 bg-gray-950/20" : "border-gray-200 bg-white"
                      )}
                    >
                      <div>
                        <div className="text-sm font-semibold">{pr?.nombre ?? "Premio"}</div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Cliente: {cl?.nombre ?? c.cliente_id}
                          {email ? ` · ${email}` : ""}
                        </div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Confirmado:{" "}
                          {c.confirmado_en ? new Date(c.confirmado_en).toLocaleString("es-ES") : "—"}
                        </div>
                      </div>
                      {badge("Confirmado", "confirmado")}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CANCELADOS */}
          <div className={cardBase}>
            <div className={clsx("px-5 py-4 border-b", dark ? "border-gray-800" : "border-gray-200")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Cancelados</div>
                {badge(String(cancelados.length), "cancelado")}
              </div>
            </div>

            <div className="p-5 space-y-2">
              {cancelados.length === 0 ? (
                <div className={clsx("text-sm", dark ? "text-gray-300" : "text-gray-600")}>—</div>
              ) : (
                cancelados.slice(0, 20).map((c) => {
                  const cl = clientesById[c.cliente_id];
                  const pr = premiosById[c.premio_id];
                  const email = emailByClienteId[c.cliente_id];

                  return (
                    <div
                      key={c.id}
                      className={clsx(
                        "rounded-2xl border p-4 flex items-start justify-between gap-4",
                        dark ? "border-gray-800 bg-gray-950/20" : "border-gray-200 bg-white"
                      )}
                    >
                      <div>
                        <div className="text-sm font-semibold">{pr?.nombre ?? "Premio"}</div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Cliente: {cl?.nombre ?? c.cliente_id}
                          {email ? ` · ${email}` : ""}
                        </div>
                        <div className={clsx("mt-1 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
                          Creado: {new Date(c.creado_en).toLocaleString("es-ES")}
                        </div>
                      </div>
                      {badge("Cancelado", "cancelado")}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
