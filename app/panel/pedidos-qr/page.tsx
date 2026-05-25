"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  ShoppingBag,
  ReceiptText,
  RefreshCw,
  ChefHat,
  CheckCircle,
  Utensils,
  XCircle,
  BellRing,
} from "lucide-react";
import { supabase } from "../../(app)/lib/supabaseClient";

type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  notas: string | null;
  created_at?: string;
};

type PedidoQR = {
  id: string;
  restaurante_id: string;
  carta_id: string | null;
  mesa: string | null;
  estado: string;
  total: number;
  notas: string | null;
  created_at: string;
  items?: PedidoItem[];
};

export default function PedidosQRPage() {
  const [pedidos, setPedidos] = useState<PedidoQR[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avisoNuevo, setAvisoNuevo] = useState(false);

  const primeraCargaRef = useRef(true);
  const pedidosIdsRef = useRef<Set<string>>(new Set());

  function reproducirSonidoNuevoPedido() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const audioContext = new AudioContextClass();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.25,
        audioContext.currentTime + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.35
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.35);
    } catch (error) {
      console.log("No se pudo reproducir sonido", error);
    }
  }

  async function cargarPedidos(silencioso = false) {
    if (!silencioso) {
      setCargando(true);
    }

    setError(null);

    try {
      const { data, error } = await supabase
        .from("pedidos_qr")
        .select(`
          *,
          pedido_qr_items (
            id,
            pedido_id,
            producto_id,
            nombre_producto,
            precio_unitario,
            cantidad,
            notas,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pedidosFormateados = (data || []).map((pedido: any) => ({
        ...pedido,
        items: pedido.pedido_qr_items || [],
      }));

      const idsActuales = new Set(pedidosFormateados.map((pedido) => pedido.id));

      if (!primeraCargaRef.current) {
        const pedidosNuevos = pedidosFormateados.filter(
          (pedido) => !pedidosIdsRef.current.has(pedido.id)
        );

        if (pedidosNuevos.length > 0) {
          reproducirSonidoNuevoPedido();
          setAvisoNuevo(true);

          setTimeout(() => {
            setAvisoNuevo(false);
          }, 4500);
        }
      }

      pedidosIdsRef.current = idsActuales;
      primeraCargaRef.current = false;

      setPedidos(pedidosFormateados);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudieron cargar los pedidos");
    } finally {
      if (!silencioso) {
        setCargando(false);
      }
    }
  }

  async function cambiarEstado(pedidoId: string, nuevoEstado: string) {
    setActualizandoId(pedidoId);
    setError(null);

    try {
      const { error } = await supabase
        .from("pedidos_qr")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId);

      if (error) throw error;

      setPedidos((actual) =>
        actual.map((pedido) =>
          pedido.id === pedidoId
            ? { ...pedido, estado: nuevoEstado }
            : pedido
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo cambiar el estado del pedido");
    } finally {
      setActualizandoId(null);
    }
  }

  useEffect(() => {
    cargarPedidos();

    const interval = setInterval(() => {
      cargarPedidos(true);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const pedidosNuevos = pedidos.filter((pedido) => pedido.estado === "nuevo");

  function getEstadoClass(estado: string) {
    if (estado === "nuevo") return "bg-orange-100 text-orange-700";
    if (estado === "preparando") return "bg-blue-100 text-blue-700";
    if (estado === "listo") return "bg-green-100 text-green-700";
    if (estado === "servido") return "bg-slate-200 text-slate-700";
    if (estado === "cancelado") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  }

  function getCardClass(estado: string) {
    if (estado === "nuevo") {
      return "border-orange-300 shadow-orange-100 shadow-lg ring-2 ring-orange-100";
    }

    if (estado === "preparando") return "border-blue-200";
    if (estado === "listo") return "border-green-200";
    if (estado === "servido") return "border-slate-200 opacity-80";
    if (estado === "cancelado") return "border-red-200 opacity-70";

    return "border-slate-200";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative rounded-2xl bg-slate-950 p-3 text-white shadow-sm">
              <ShoppingBag className="h-6 w-6" />

              {pedidosNuevos.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-black text-white">
                  {pedidosNuevos.length}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-black">Pedidos QR</h1>
              <p className="mt-1 text-slate-600">
                Pedidos enviados desde la carta digital.
              </p>
            </div>
          </div>

          <button
            onClick={() => cargarPedidos()}
            disabled={cargando}
            className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {avisoNuevo && (
          <div className="mt-6 flex items-center gap-3 rounded-3xl border border-orange-200 bg-orange-50 p-5 text-orange-800 shadow-sm">
            <div className="rounded-2xl bg-orange-500 p-3 text-white">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>

            <div>
              <p className="font-black">Nuevo pedido recibido</p>
              <p className="text-sm">
                Revisa la pantalla de cocina para prepararlo.
              </p>
            </div>
          </div>
        )}

        {pedidosNuevos.length > 0 && (
          <div className="mt-6 rounded-3xl border border-orange-200 bg-white p-4 shadow-sm">
            <p className="font-black text-orange-700">
              {pedidosNuevos.length} pedido
              {pedidosNuevos.length !== 1 ? "s" : ""} nuevo
              {pedidosNuevos.length !== 1 ? "s" : ""} pendiente
              {pedidosNuevos.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {cargando && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-bold">Cargando pedidos...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <p className="font-black">Error</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold">No hay pedidos todavía.</p>
          </div>
        )}

        {!cargando && pedidos.length > 0 && (
          <div className="mt-8 grid gap-5">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${getCardClass(
                  pedido.estado
                )}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-500">
                      Pedido
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {pedido.mesa ? `Mesa ${pedido.mesa}` : "Sin mesa"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {new Date(pedido.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getEstadoClass(
                        pedido.estado
                      )}`}
                    >
                      {pedido.estado}
                    </span>

                    <p className="mt-3 text-2xl font-black">
                      {Number(pedido.total || 0).toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-slate-500" />
                    <p className="font-black">Productos</p>
                  </div>

                  <div className="space-y-2">
                    {(!pedido.items || pedido.items.length === 0) && (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500">
                        Este pedido no tiene productos asociados.
                      </p>
                    )}

                    {(pedido.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {item.nombre_producto}
                          </p>

                          <p className="text-sm text-slate-500">
                            {Number(item.precio_unitario || 0).toFixed(2)} € /
                            ud.
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black">x{item.cantidad}</p>

                          <p className="text-sm font-bold text-slate-500">
                            {(
                              Number(item.precio_unitario || 0) * item.cantidad
                            ).toFixed(2)}{" "}
                            €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <button
                    onClick={() => cambiarEstado(pedido.id, "preparando")}
                    disabled={actualizandoId === pedido.id}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <ChefHat className="h-4 w-4" />
                    Preparando
                  </button>

                  <button
                    onClick={() => cambiarEstado(pedido.id, "listo")}
                    disabled={actualizandoId === pedido.id}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Listo
                  </button>

                  <button
                    onClick={() => cambiarEstado(pedido.id, "servido")}
                    disabled={actualizandoId === pedido.id}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Utensils className="h-4 w-4" />
                    Servido
                  </button>

                  <button
                    onClick={() => cambiarEstado(pedido.id, "cancelado")}
                    disabled={actualizandoId === pedido.id}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>

                {actualizandoId === pedido.id && (
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    Cambiando estado del pedido...
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}