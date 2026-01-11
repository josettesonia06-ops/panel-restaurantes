"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const entrar = async () => {
    setError("");
    setInfo("");

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

    router.push("/dashboard");
  };

  const crearCuenta = async () => {
    setError("");
    setInfo("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setInfo(
      "Te hemos enviado un correo para confirmar tu cuenta. Revisa la bandeja de entrada o el spam."
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-login-animated px-4">
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl p-8 space-y-5 border border-white/30">
        <h1 className="text-2xl font-bold text-center tracking-tight">
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

        {info && (
          <p className="text-green-600 text-sm text-center">{info}</p>
        )}

        <button className="btn w-full" onClick={entrar}>
          Entrar
        </button>

        <button className="btn w-full border" onClick={crearCuenta}>
          Crear cuenta
        </button>
      </div>
    </div>
  );
}
