"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    <div className="relative min-h-screen overflow-hidden bg-white flex items-center justify-center px-4">
      {/* Fondo blanco con tu marca moviéndose en diagonal */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 diagonalWrap">
          <div className="diagonalTrack diagonalA">
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
          </div>

          <div className="diagonalTrack diagonalB">
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
            <BrandTile />
          </div>
        </div>

        {/* Un velo suave para que el fondo no moleste */}
        <div className="absolute inset-0 bg-white/70" />
      </div>

      {/* Tarjeta login (por delante) */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl p-8 space-y-5 ring-1 ring-black/5">
        <h1 className="text-2xl font-bold text-center text-gray-900">
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

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button className="btn w-full" onClick={entrar}>
          Entrar
        </button>

        <p className="text-xs text-center text-gray-500">
          ¿No tienes acceso? Pide invitación al administrador.
        </p>
      </div>

      <style jsx global>{`
        /* Ajusta la rotación para más o menos diagonal */
        .diagonalWrap {
          position: absolute;
          inset: -40%;
          transform: rotate(-18deg);
          transform-origin: center;
        }

        .diagonalTrack {
          display: flex;
          gap: 44px;
          width: max-content;
          align-items: center;
          opacity: 0.22; /* intensidad del fondo */
          will-change: transform;
          filter: saturate(1.05);
        }

        .diagonalA {
          position: absolute;
          top: 20%;
          left: 0;
          animation: drift 18s linear infinite;
        }

        .diagonalB {
          position: absolute;
          top: 55%;
          left: 0;
          opacity: 0.16;
          animation: drift 26s linear infinite;
        }

        @keyframes drift {
          0% {
            transform: translate3d(-20%, 0, 0);
          }
          100% {
            transform: translate3d(-70%, 0, 0);
          }
        }

        @media (max-width: 480px) {
          .diagonalTrack {
            gap: 28px;
          }
          .diagonalWrap {
            inset: -60%;
          }
        }
      `}</style>
    </div>
  );
}

function BrandTile() {
  // Pon tu logo en: /public/logo.png (o cambia la ruta)
  const logoSrc = "/logo.png";
  const brand = "GASTROHELP";

  return (
    <div className="flex items-center gap-4 pr-6">
      <div className="h-11 w-11 rounded-2xl bg-white ring-1 ring-black/10 shadow-sm flex items-center justify-center overflow-hidden">
        <Image src={logoSrc} alt="Logo" width={34} height={34} />
      </div>

      <div className="text-black/80 font-extrabold tracking-[0.22em] text-sm">
        {brand}
      </div>

      <div className="h-[1px] w-14 bg-black/15" />
    </div>
  );
}
