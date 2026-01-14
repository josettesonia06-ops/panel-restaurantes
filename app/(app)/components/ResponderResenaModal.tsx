"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  resenaId: string;
  onSaved: () => void;
};

export default function ResponderResenaModal({
  open,
  onClose,
  resenaId,
  onSaved,
}: Props) {
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const guardarRespuesta = async () => {
    if (!texto.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from("resenas")
      .update({
        respuesta_texto: texto,
        responded: false,
      })
      .eq("id", resenaId);

    setLoading(false);

    if (!error) {
      onSaved();
      onClose();
      setTexto("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0b1220] rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Responder reseña</h2>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe la respuesta que se publicará en Google…"
          rows={5}
          className="w-full border rounded-md p-3 text-sm bg-transparent"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md"
          >
            Cancelar
          </button>

          <button
            onClick={guardarRespuesta}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar respuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
