"use client";

import { useEffect, useState } from "react";
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

  // Detecta modo real (tu app a veces deja "dark" activo aunque visualmente estés en claro)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains("dark"));
    read();

    // Por si tu ThemeProvider cambia la clase "dark" después
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (!open) return null;

  const guardar = async () => {
    if (!restauranteId) return;
    if (!nombre || !telefono || !fecha || !hora || !personas) return;

    setLoading(true);

    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", telefono)
      .eq("restaurante_id", restauranteId)
      .maybeSingle();

    let clienteId = clienteExistente?.id ?? null;

    if (!clienteId) {
      const { data: nuevoCliente, error } = await supabase
        .from("clientes")
        .insert({
          restaurante_id: restauranteId,
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

    const fechaHoraDate = new Date(`${fecha}T${hora}`);
    if (isNaN(fechaHoraDate.getTime())) {
      setLoading(false);
      return;
    }

    const { error: errorReserva } = await supabase.from("reservas").insert({
      restaurante_id: restauranteId,
      cliente_id: clienteId,
      nombre_cliente: nombre,
      telefono,
      personas: Number(personas),
      fecha_hora_reserva: fechaHoraDate.toISOString(),
      estado: "pendiente",
      origen: "panel",
    });

    if (errorReserva) {
      setLoading(false);
      return;
    }

    setNombre("");
    setTelefono("");
    setFecha("");
    setHora("");
    setPersonas("");

    setLoading(false);
    onClose();
    onCreated?.();
  };

  const overlayClass = isDark ? "bg-black/60" : "bg-black/30";

  const modalClass = isDark
    ? "bg-[#0b1220] text-gray-100"
    : "bg-white text-gray-900";

  const inputClass = isDark
    ? "px-3 py-2 border rounded-md text-sm bg-[#050b18] text-gray-100 border-gray-700"
    : "px-3 py-2 border rounded-md text-sm bg-white text-gray-900 border-gray-300";

  const cancelBtnClass = isDark
    ? "px-4 py-2 rounded-md border text-sm border-gray-700 text-gray-200"
    : "px-4 py-2 rounded-md border text-sm border-gray-300 text-gray-700";

  const saveBtnClass =
    "px-4 py-2 rounded-md text-sm text-white disabled:opacity-50 " +
    (isDark ? "bg-black hover:bg-gray-800" : "bg-gray-900 hover:bg-gray-800");

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass}`}>
      <div className={`rounded-lg w-full max-w-lg p-6 space-y-4 ${modalClass}`}>
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
            className={`${inputClass} col-span-2`}
          />

          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className={`${inputClass} col-span-2`}
          />

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />

          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={inputClass}
          />

          <input
            type="number"
            value={personas}
            onChange={(e) =>
              setPersonas(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Personas"
            className={`${inputClass} col-span-2`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className={cancelBtnClass}>
            Cancelar
          </button>

          <button type="button" disabled={loading} onClick={guardar} className={saveBtnClass}>
            Guardar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
