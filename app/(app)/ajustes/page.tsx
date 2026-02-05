"use client";

import { useEffect, useState } from "react";
import { Save, Clock, Users } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";

export default function AjustesPage() {
  const [restaurante, setRestaurante] = useState<any>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [capacidadTotal, setCapacidadTotal] = useState<number>(0);
  const [horarioComida, setHorarioComida] = useState("");
  const [horarioCena, setHorarioCena] = useState("");
  const [capacidadComida, setCapacidadComida] = useState<number>(0);
  const [capacidadCena, setCapacidadCena] = useState<number>(0);

  // ===== PUNTOS =====
  const [puntosActivo, setPuntosActivo] = useState<boolean>(false);
  const [puntosPorEuroInput, setPuntosPorEuroInput] = useState<string>("1"); // string para permitir "0,5" mientras escribe

  /* ===== CARGAR RESTAURANTE ===== */
  useEffect(() => {
    const cargarRestaurante = async () => {
      const restauranteId = await getRestauranteUsuario();
      if (!restauranteId) return;

      const { data, error } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("id", restauranteId)
        .single();

      if (error || !data) return;

      setRestaurante(data);
      setNombre(data.nombre || "");
      setTelefono(data.telefono || "");
      setCapacidadTotal(data.capacidad_total || 0);
      setHorarioComida(data.horario_comida || "");
      setHorarioCena(data.horario_cena || "");
      setCapacidadComida(data.capacidad_comida || 0);
      setCapacidadCena(data.capacidad_cena || 0);

      // puntos
      setPuntosActivo(Boolean(data.puntos_activo));
      const ppe = data.puntos_por_euro ?? 1;
      setPuntosPorEuroInput(String(ppe));
    };

    cargarRestaurante();
  }, []);

  /* ===== GUARDAR CAMBIOS ===== */
  const guardarCambios = async () => {
    const restauranteId = await getRestauranteUsuario();
    if (!restauranteId) return;

    // Normaliza coma -> punto y parsea
    const normalizado = (puntosPorEuroInput || "").trim().replace(",", ".");
    const ppe = Number(normalizado);

    const puntos_por_euro = Number.isFinite(ppe) && ppe > 0 ? ppe : 1;

    const { data, error } = await supabase
      .from("restaurantes")
      .update({
        nombre,
        telefono,
        capacidad_total: capacidadTotal,
        horario_comida: horarioComida,
        horario_cena: horarioCena,
        capacidad_comida: capacidadComida,
        capacidad_cena: capacidadCena,

        // ===== PUNTOS =====
        puntos_activo: puntosActivo,
        puntos_por_euro: puntos_por_euro,
      })
      .eq("id", restauranteId)
      .select("id,puntos_activo,puntos_por_euro");

    if (error) {
      console.log("Error guardando restaurantes:", error);
      alert("Error al guardar cambios");
      return;
    }

    // Si por RLS o lo que sea no devuelve filas, al menos no explota
    if (!data || data.length === 0) {
      alert("Guardado, pero no se pudo confirmar la lectura (RLS).");
      return;
    }

    // Sincroniza estado con lo guardado realmente
    const row: any = data[0];
    setPuntosActivo(Boolean(row.puntos_activo));
    setPuntosPorEuroInput(String(row.puntos_por_euro ?? puntos_por_euro));

    alert("Cambios guardados correctamente");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-wider">
          Ajustes
        </h1>
        <p className="text-sm opacity-70">Configuración del restaurante</p>
      </div>

      {/* DATOS RESTAURANTE */}
      <div className="card rounded-2xl p-5">
        <p className="text-sm font-bold uppercase mb-4">
          Datos del restaurante
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold opacity-70">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">
              Capacidad total
            </label>
            <input
              type="number"
              value={capacidadTotal}
              onChange={(e) => setCapacidadTotal(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* PUNTOS */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase">Puntos</p>
            <p className="text-xs opacity-70 mt-1">
              puntos = suelo(gasto € × puntos/€). Si no se introduce gasto, no suma puntos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 items-start">
          <div>
            <label className="text-xs font-semibold opacity-70">
              Activar puntos
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="puntos_activo"
                type="checkbox"
                checked={puntosActivo}
                onChange={(e) => setPuntosActivo(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="puntos_activo" className="text-sm">
                {puntosActivo ? "Activado" : "Desactivado"}
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">
              Puntos por €
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={puntosPorEuroInput}
              onChange={(e) => setPuntosPorEuroInput(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
              placeholder="Ej: 1 o 0.5"
            />
            <p className="text-xs opacity-60 mt-2">
              Usa punto decimal (0.5). Si escribes coma, se convierte al guardar.
            </p>
          </div>
        </div>
      </div>

      {/* HORARIOS */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} />
          <p className="text-sm font-bold uppercase">Horarios</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold opacity-70">Comida</label>
            <input
              type="text"
              value={horarioComida}
              onChange={(e) => setHorarioComida(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">Cena</label>
            <input
              type="text"
              value={horarioCena}
              onChange={(e) => setHorarioCena(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* TURNOS */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} />
          <p className="text-sm font-bold uppercase">Ocupación por turnos</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold opacity-70">
              Capacidad comida
            </label>
            <input
              type="number"
              value={capacidadComida}
              onChange={(e) => setCapacidadComida(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">
              Capacidad cena
            </label>
            <input
              type="number"
              value={capacidadCena}
              onChange={(e) => setCapacidadCena(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-transparent dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* GUARDAR */}
      <div className="flex justify-end">
        <button
          onClick={guardarCambios}
          className="flex items-center gap-íc2 px-5 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 dark:bg-white dark:text-black"
        >
          <Save size={14} />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
