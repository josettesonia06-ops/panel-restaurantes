"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Settings,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [reservasPendientes, setReservasPendientes] = useState(0);
  const [clientesNuevos, setClientesNuevos] = useState(0);
  const [resenasPendientes, setResenasPendientes] = useState(0);

  /* ===== RESTAURANTE ===== */
useEffect(() => {
  const cargarRestaurante = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("usuarios_restaurantes")
      .select("restaurante_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.restaurante_id) {
      setRestauranteId(data.restaurante_id);
    }
  };

  cargarRestaurante();
}, []);




  /* ===== CONTADORES INICIALES ===== */
  useEffect(() => {
    if (!restauranteId) return;

    const cargarContadores = async () => {
      // Reservas pendientes
      const { count: cReservas } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true })
        .eq("restaurante_id", restauranteId)
        .eq("estado", "pendiente");

      // Clientes nuevos HOY
      const hoy = new Date();
      const inicioHoy = `${hoy.getFullYear()}-${String(
        hoy.getMonth() + 1
      ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")} 00:00:00`;
      const finHoy = `${hoy.getFullYear()}-${String(
        hoy.getMonth() + 1
      ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")} 23:59:59`;

      const { count: cClientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("restaurante_id", restauranteId)
        .gte("created_at", inicioHoy)
        .lte("created_at", finHoy);

      // Reseñas sin responder
      const { count: cResenas } = await supabase
        .from("resenas")
        .select("*", { count: "exact", head: true })
        .eq("restaurante_id", restauranteId)
        .eq("responded", false);

      setReservasPendientes(cReservas ?? 0);
      setClientesNuevos(cClientes ?? 0);
      setResenasPendientes(cResenas ?? 0);
    };

    cargarContadores();
  }, [restauranteId]);

  /* ===== SUSCRIPCIÓN RESERVAS ===== */
  useEffect(() => {
    if (!restauranteId) return;

    const canal = supabase
      .channel("sidebar-reservas")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservas",
          filter: `restaurante_id=eq.${restauranteId}`,
        },
        async () => {
          const { count } = await supabase
            .from("reservas")
            .select("*", { count: "exact", head: true })
            .eq("restaurante_id", restauranteId)
            .eq("estado", "pendiente");

          setReservasPendientes(count ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [restauranteId]);

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/reservas",
      label: "Reservas",
      icon: CalendarDays,
      badge: reservasPendientes,
    },
    {
      href: "/clientes",
      label: "Clientes",
      icon: Users,
      badge: clientesNuevos,
    },
    {
      href: "/resenas",
      label: "Reseñas",
      icon: MessageSquare,
      badge: resenasPendientes,
    },
    { href: "/ajustes", label: "Ajustes", icon: Settings },
  ];

  return (
    <aside
      className={`
        w-64 h-full p-6 flex flex-col gap-6
        bg-white text-gray-900 border-r border-gray-200
        dark:bg-[#0b1220] dark:text-gray-100 dark:border-gray-800
        transition-colors duration-300
        ${mobile ? "" : "fixed left-0 top-0 h-screen"}
      `}
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Panel Restaurante</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vista general
        </p>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
             className={[
  "flex items-center justify-between px-3 py-2 rounded-md transition",
  isActive
  ? "bg-white border border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 font-semibold"
  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"

].join(" ")}

            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {item.label}
              </div>

              {item.badge && item.badge > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
