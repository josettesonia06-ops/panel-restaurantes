"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Star,
  Utensils,
  AlertCircle,
  Euro,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../(app)/lib/supabaseClient";

type CartaDigital = {
  id: string;
  restaurante_id: string;
  nombre: string;
  archivo_url: string | null;
  estado: string;
  public_token: string;
};

type Categoria = {
  id: string;
  carta_id: string;
  restaurante_id: string;
  nombre: string;
  orden: number;
  activa: boolean;
};

type Producto = {
  id: string;
  carta_id: string;
  categoria_id: string | null;
  restaurante_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen_url: string | null;
  imagen_prompt: string | null;
  tipo: string | null;
  alergenos: string[] | null;
  recomendado: boolean;
  activo: boolean;
  orden: number;
};

type CarritoItem = {
  producto: Producto;
  cantidad: number;
};

const visualesPorTipo: Record<
  string,
  {
    fondo: string;
    emoji: string;
    detalle: string;
  }
> = {
  tapa: {
    fondo: "from-orange-500 via-amber-300 to-yellow-100",
    emoji: "🍟",
    detalle: "Perfecto para compartir",
  },
  principal: {
    fondo: "from-red-700 via-orange-500 to-amber-200",
    emoji: "🍔",
    detalle: "Plato principal",
  },
  postre: {
    fondo: "from-pink-500 via-rose-300 to-orange-100",
    emoji: "🍰",
    detalle: "Final dulce",
  },
  bebida: {
    fondo: "from-sky-500 via-cyan-300 to-blue-100",
    emoji: "🥤",
    detalle: "Bebida fría",
  },
  vino: {
    fondo: "from-purple-700 via-red-400 to-rose-100",
    emoji: "🍷",
    detalle: "Selección de bebida",
  },
  cafe: {
    fondo: "from-stone-800 via-amber-700 to-yellow-100",
    emoji: "☕",
    detalle: "Para terminar",
  },
};

export default function CartaPublicaPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const token = String(params?.token || "");
  const mesa = searchParams.get("mesa");

  const [carta, setCarta] = useState<CartaDigital | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPedido, setErrorPedido] = useState<string | null>(null);

  useEffect(() => {
    async function cargarCarta() {
      if (!token) return;

      setCargando(true);
      setError(null);

      try {
        const { data: cartasData, error: cartaError } = await supabase
          .from("cartas_digitales")
          .select("*")
          .eq("public_token", token)
          .limit(1);

        if (cartaError) throw cartaError;

        const cartaData = cartasData?.[0];

        if (!cartaData) {
          throw new Error("Carta no encontrada con este token");
        }

        setCarta(cartaData);

        const { data: categoriasData, error: categoriasError } = await supabase
          .from("carta_categorias")
          .select("*")
          .eq("carta_id", cartaData.id)
          .eq("activa", true)
          .order("orden", { ascending: true });

        if (categoriasError) throw categoriasError;

        const { data: productosData, error: productosError } = await supabase
          .from("carta_productos")
          .select("*")
          .eq("carta_id", cartaData.id)
          .eq("activo", true)
          .order("orden", { ascending: true });

        if (productosError) throw productosError;

        setCategorias(categoriasData || []);
        setProductos(productosData || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "No se pudo cargar la carta");
      } finally {
        setCargando(false);
      }
    }

    cargarCarta();
  }, [token]);

  function añadirAlCarrito(producto: Producto) {
    setPedidoEnviado(false);
    setErrorPedido(null);

    setCarrito((actual) => {
      const existe = actual.find((item) => item.producto.id === producto.id);

      if (existe) {
        return actual.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...actual, { producto, cantidad: 1 }];
    });

    setCarritoAbierto(true);
  }

  function sumarProducto(productoId: string) {
    setCarrito((actual) =>
      actual.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  }

  function restarProducto(productoId: string) {
    setCarrito((actual) =>
      actual
        .map((item) =>
          item.producto.id === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }

  function eliminarProducto(productoId: string) {
    setCarrito((actual) =>
      actual.filter((item) => item.producto.id !== productoId)
    );
  }

  async function enviarPedido() {
    if (!carta || carrito.length === 0) return;

    setEnviandoPedido(true);
    setErrorPedido(null);
    setPedidoEnviado(false);

    try {
      const { data: pedidoCreado, error: pedidoError } = await supabase
        .from("pedidos_qr")
        .insert({
          restaurante_id: carta.restaurante_id,
          carta_id: carta.id,
          mesa: mesa || null,
          estado: "nuevo",
          total: totalCarrito,
          notas: null,
        })
        .select("id")
        .single();

      if (pedidoError) throw pedidoError;

      const itemsParaInsertar = carrito.map((item) => ({
        pedido_id: pedidoCreado.id,
        producto_id: item.producto.id,
        nombre_producto: item.producto.nombre,
        precio_unitario: Number(item.producto.precio || 0),
        cantidad: item.cantidad,
        notas: null,
      }));

      const { error: itemsError } = await supabase
        .from("pedido_qr_items")
        .insert(itemsParaInsertar);

      if (itemsError) throw itemsError;

      setPedidoEnviado(true);
      setCarrito([]);
      setCarritoAbierto(false);
    } catch (err: any) {
      console.error(err);
      setErrorPedido(err.message || "No se pudo enviar el pedido");
    } finally {
      setEnviandoPedido(false);
    }
  }

  const productosPorCategoria = useMemo(() => {
    const agrupado: Record<string, Producto[]> = {};

    categorias.forEach((categoria) => {
      agrupado[categoria.nombre] = productos.filter(
        (producto) => producto.categoria_id === categoria.id
      );
    });

    const productosSinCategoria = productos.filter(
      (producto) => !producto.categoria_id
    );

    if (productosSinCategoria.length > 0) {
      agrupado["Otros"] = productosSinCategoria;
    }

    return agrupado;
  }, [categorias, productos]);

  const totalProductos = productos.length;
  const recomendados = productos.filter((p) => p.recomendado).length;
  const precioMedio =
    productos.length > 0
      ? productos.reduce((acc, p) => acc + Number(p.precio || 0), 0) /
        productos.length
      : 0;

  const unidadesCarrito = carrito.reduce(
    (acc, item) => acc + item.cantidad,
    0
  );

  const totalCarrito = carrito.reduce(
    (acc, item) => acc + Number(item.producto.precio || 0) * item.cantidad,
    0
  );

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6 text-slate-900">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-900" />
          <p className="mt-4 font-bold">Cargando carta...</p>
          <p className="mt-1 text-sm text-slate-500">
            Preparando la carta digital del restaurante.
          </p>
        </div>
      </main>
    );
  }

  if (error || !carta) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6 text-slate-900">
        <div className="max-w-md rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
          <h1 className="mt-4 text-2xl font-black">Carta no disponible</h1>
          <p className="mt-2 text-sm text-slate-500">
            No se ha podido cargar esta carta. Revisa que el enlace sea correcto.
          </p>
          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7fb] pb-36 text-slate-900">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 animate-[blobMove_8s_ease-in-out_infinite] rounded-full bg-orange-200 blur-3xl" />
        <div className="absolute right-[-140px] top-40 h-96 w-96 animate-[blobMove_10s_ease-in-out_infinite] rounded-full bg-yellow-100 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/3 h-96 w-96 animate-[blobMove_12s_ease-in-out_infinite] rounded-full bg-slate-200 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {pedidoEnviado && (
          <div className="mb-6 flex items-center gap-3 rounded-[2rem] border border-green-200 bg-green-50 p-5 text-green-800 shadow-sm">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-black">Pedido enviado correctamente</p>
              <p className="text-sm">
                {mesa ? `Pedido enviado desde la mesa ${mesa}.` : "Pedido enviado."}
              </p>
            </div>
          </div>
        )}

        {errorPedido && (
          <div className="mb-6 rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
            {errorPedido}
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative rounded-3xl bg-slate-950 p-4 text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
                <span className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-orange-400" />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-orange-400" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                    <Utensils className="h-3.5 w-3.5" />
                    Carta digital
                  </p>

                  {mesa && (
                    <p className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      Mesa {mesa}
                    </p>
                  )}
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  {carta.nombre || "Carta del restaurante"}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Explora los platos disponibles y descubre las recomendaciones
                  destacadas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <Utensils className="mx-auto h-5 w-5 text-slate-500" />
                <p className="mt-2 text-2xl font-black">{totalProductos}</p>
                <p className="text-xs text-slate-500">Platos</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <Star className="mx-auto h-5 w-5 text-slate-500" />
                <p className="mt-2 text-2xl font-black">{recomendados}</p>
                <p className="text-xs text-slate-500">Destacados</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <Euro className="mx-auto h-5 w-5 text-slate-500" />
                <p className="mt-2 text-2xl font-black">
                  {precioMedio.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">Media</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-10">
          {Object.entries(productosPorCategoria).map(
            ([categoria, items], categoriaIndex) => {
              if (items.length === 0) return null;

              return (
                <div
                  key={categoria}
                  style={{ animationDelay: `${categoriaIndex * 140}ms` }}
                  className="animate-[sectionEntrada_0.7s_ease-out_both]"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-10 w-2 rounded-full bg-slate-950" />
                    <div>
                      <h2 className="text-2xl font-black">{categoria}</h2>
                      <p className="text-sm text-slate-500">
                        {items.length} productos disponibles
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((producto, index) => {
                      const tipo = producto.tipo || "principal";
                      const visual =
                        visualesPorTipo[tipo] ?? visualesPorTipo.principal;

                      return (
                        <article
                          key={producto.id}
                          style={{
                            animationDelay: `${index * 120}ms`,
                          }}
                          className="group animate-[cardEntrada_0.7s_ease-out_both] overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-2xl"
                        >
                          <div
                            className={`relative h-64 overflow-hidden bg-gradient-to-br ${visual.fondo}`}
                          >
                            {producto.imagen_url ? (
                              <img
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <>
                                <div className="absolute inset-0 animate-[fondoMovimiento_5s_ease-in-out_infinite] bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.75),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(15,23,42,0.22),transparent_34%)]" />

                                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 blur-2xl transition duration-700 group-hover:scale-125" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="relative">
                                    <div className="absolute inset-0 animate-pulse rounded-full bg-white/40 blur-2xl" />
                                    <div className="relative flex h-36 w-36 animate-[platoFloat_3.5s_ease-in-out_infinite] items-center justify-center rounded-full border border-white/50 bg-white/60 text-7xl shadow-2xl backdrop-blur">
                                      {visual.emoji}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/50 bg-white/75 p-3 shadow-lg backdrop-blur">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                {visual.detalle}
                              </p>
                              <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">
                                {producto.nombre}
                              </p>
                            </div>

                            {producto.recomendado && (
                              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white shadow-lg">
                                <Star className="h-3.5 w-3.5 fill-white" />
                                Recomendado
                              </span>
                            )}

                            {producto.tipo && (
                              <span className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-lg backdrop-blur">
                                {producto.tipo}
                              </span>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                                  {producto.tipo || "plato"}
                                </p>

                                <h3 className="mt-1 text-xl font-black text-slate-950">
                                  {producto.nombre}
                                </h3>
                              </div>

                              <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm">
                                {Number(producto.precio || 0).toFixed(2)} €
                              </span>
                            </div>

                            {producto.descripcion && (
                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                {producto.descripcion}
                              </p>
                            )}

                            <button
                              onClick={() => añadirAlCarrito(producto)}
                              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl"
                            >
                              <Plus className="h-4 w-4" />
                              Añadir
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </section>
      </div>

      {unidadesCarrito > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <button
            onClick={() => setCarritoAbierto((actual) => !actual)}
            className="flex w-full items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative rounded-2xl bg-slate-950 p-3 text-white">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-black text-white">
                  {unidadesCarrito}
                </span>
              </div>

              <div className="text-left">
                <p className="font-black text-slate-950">Tu pedido</p>
                <p className="text-sm text-slate-500">
                  {mesa ? `Mesa ${mesa}` : "Sin mesa"} · {unidadesCarrito} producto
                  {unidadesCarrito !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-slate-500">Total</p>
              <p className="text-2xl font-black text-slate-950">
                {totalCarrito.toFixed(2)} €
              </p>
            </div>
          </button>

          {carritoAbierto && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {carrito.map((item) => (
                  <div
                    key={item.producto.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-950">
                        {item.producto.nombre}
                      </p>
                      <p className="text-sm text-slate-500">
                        {Number(item.producto.precio || 0).toFixed(2)} € / ud.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restarProducto(item.producto.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white font-black text-slate-900 shadow-sm transition hover:bg-slate-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <span className="w-6 text-center font-black">
                        {item.cantidad}
                      </span>

                      <button
                        onClick={() => sumarProducto(item.producto.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white font-black text-slate-900 shadow-sm transition hover:bg-slate-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => eliminarProducto(item.producto.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={enviarPedido}
                disabled={enviandoPedido}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviandoPedido && <Loader2 className="h-5 w-5 animate-spin" />}
                {enviandoPedido ? "Enviando pedido..." : "Enviar pedido"}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes cardEntrada {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes sectionEntrada {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fondoMovimiento {
          0% {
            transform: scale(1) translateX(0) translateY(0);
          }
          50% {
            transform: scale(1.16) translateX(12px) translateY(-8px);
          }
          100% {
            transform: scale(1) translateX(0) translateY(0);
          }
        }

        @keyframes platoFloat {
          0% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
          100% {
            transform: translateY(0) rotate(-1deg);
          }
        }

        @keyframes blobMove {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.15) translate(22px, -14px);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </main>
  );
}