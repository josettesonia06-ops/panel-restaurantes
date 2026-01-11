"use client";


import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  restauranteId: string | null;
  onCreated?: () => void;
};


export default function AddReservaModal({
  open,
  onClose,
  restauranteId,
  onCreated,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [personas, setPersonas] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

const guardar = async () => {
  console.log("GUARDAR CLICK");

  console.log({
    restauranteId,
    nombre,
    telefono,
    fecha,
    hora,
    personas,
  });

  if (!restauranteId) {
    console.log("❌ SIN RESTAURANTE ID");
    return;
  }

  if (!nombre || !telefono || !fecha || !hora || !personas) {
    console.log("❌ FALTAN DATOS");
    return;
  }

  setLoading(true);


    /* ===== 1. BUSCAR CLIENTE ===== */
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", telefono)
      .eq("restaurante_id", restauranteId
)
      .maybeSingle();

    let clienteId = clienteExistente?.id ?? null;

    /* ===== 2. CREAR CLIENTE SI NO EXISTE ===== */
    if (!clienteId) {
      const { data: nuevoCliente, error } = await supabase
        .from("clientes")
        .insert({
          restaurante_id: restauranteId
,
          nombre,
          telefono,
          canal_contacto: "panel",
        })
        .select("id")
        .single();

      if (error || !nuevoCliente) {
        setLoading(false);
        return;
      }

      clienteId = nuevoCliente.id;
    }

    /* ===== 3. CREAR RESERVA ===== */
    const fechaHoraDate = new Date(`${fecha}T${hora}`);

if (isNaN(fechaHoraDate.getTime())) {
  setLoading(false);
  return;
}

const fechaHora = fechaHoraDate.toISOString();


const { error: errorReserva } = await supabase.from("reservas").insert({
  restaurante_id: restauranteId,
  cliente_id: clienteId,
  nombre_cliente: nombre,
  telefono,
  personas: Number(personas),
  fecha_hora_reserva: fechaHora,
  estado: "pendiente",
  origen: "panel",
});


    if (errorReserva) {
      setLoading(false);
      return;
    }

    /* ===== 4. LIMPIAR Y CERRAR ===== */
    setNombre("");
    setTelefono("");
    setFecha("");
    setHora("");
    setPersonas("");

    setLoading(false);
    onClose();
    onCreated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0b1220] rounded-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Añadir reserva</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm opacity-70 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre cliente"
            className="px-3 py-2 border rounded-md bg-transparent text-sm col-span-2"
          />

          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="px-3 py-2 border rounded-md bg-transparent text-sm col-span-2"
          />

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-2 border rounded-md bg-transparent text-sm"
          />

          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="px-3 py-2 border rounded-md bg-transparent text-sm"
          />

          <input
            type="number"
            value={personas}
            onChange={(e) =>
              setPersonas(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Personas"
            className="px-3 py-2 border rounded-md bg-transparent text-sm col-span-2"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={guardar}
            className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-50"
          >
            Guardar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
