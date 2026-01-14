"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  clienteId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddVisitaModal({
  clienteId,
  onClose,
  onSaved,
}: Props) {
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [guardando, setGuardando] = useState(false);

  const guardarVisita = async () => {
    if (!fecha || guardando) return;
    setGuardando(true);

    // 1️⃣ Insertar visita (SIN restaurante_id)
    const { error: insertError } = await supabase
      .from("clientes_historial")
      .insert({
        cliente_id: clienteId,
        tipo: "visita",
        created_at: `${fecha}T12:00:00`,
      });

    if (insertError) {
      console.log("ERROR INSERT:", insertError);
      setGuardando(false);
      return;
    }

    // 2️⃣ Incrementar contador (RPC que YA usas)
    const { error: rpcError } = await supabase.rpc(
      "incrementar_visitas_cliente",
      { cliente_uuid: clienteId }
    );

    if (rpcError) {
      console.log("ERROR RPC:", rpcError);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#050b18] rounded-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Añadir visita</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          type="date"
          className="w-full border rounded-lg p-2 text-sm"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        <button
          onClick={guardarVisita}
          disabled={guardando}
          className="w-full py-2 rounded-lg border font-bold disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar visita"}
        </button>
      </div>
    </div>
  );
}
