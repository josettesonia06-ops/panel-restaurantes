"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../(app)/lib/supabaseClient";

export default function AcceptInvitePage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setError("Invitación no válida o expirada.");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  checkSession();
}, []);


  const guardarPassword = async () => {
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando invitación…</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-8 space-y-5">
        <h1 className="text-xl font-bold text-center">Activar cuenta</h1>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />

        <input
          type="password"
          placeholder="Repite la contraseña"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="input"
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button onClick={guardarPassword} className="btn w-full">
          Activar cuenta
        </button>
      </div>
    </div>
  );
}
