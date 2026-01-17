"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../(app)/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const entrar = async () => {
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("confirm")) {
        setError("Debes confirmar tu correo antes de acceder.");
      } else {
        setError(error.message);
      }
      return;
    }

    if (!data.session) {
      setError("No se ha creado sesión");
      return;
    }

    router.replace("/dashboard");

  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-8 space-y-5">
        <h1 className="text-2xl font-bold text-center">
          Panel Restaurante
        </h1>

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button className="btn w-full" onClick={entrar}>
          Entrar
        </button>

        <p className="text-xs text-center text-gray-500">
          ¿No tienes acceso? Pide invitación al administrador.
        </p>
      </div>
    </div>
  );
}
