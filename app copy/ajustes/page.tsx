"use client";

import { useState } from "react";
import OcupacionTurnos from "./ocupacion";

type Turno = {
  inicio: string;
  fin: string;
};

type DiaHorario = {
  abierto: boolean;
  comidas: Turno;
  cenas: Turno;
};

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function AjustesPage() {
  const [nombre, setNombre] = useState("Restaurante Demo");
  const [telefono, setTelefono] = useState("600 000 000");
  const [capacidad, setCapacidad] = useState(50);

  const [horarios, setHorarios] = useState<Record<string, DiaHorario>>(
    Object.fromEntries(
      diasSemana.map((dia) => [
        dia,
        {
          abierto: true,
          comidas: { inicio: "13:00", fin: "16:00" },
          cenas: { inicio: "20:00", fin: "23:00" },
        },
      ])
    )
  );

  const [guardado, setGuardado] = useState(false);

  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [mostrarOcupacion, setMostrarOcupacion] = useState(false);

  function actualizarHorario(
    dia: string,
    campo: keyof DiaHorario,
    valor: any
  ) {
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  }

  function actualizarTurno(
    dia: string,
    turno: "comidas" | "cenas",
    campo: "inicio" | "fin",
    valor: string
  ) {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [turno]: {
          ...prev[dia][turno],
          [campo]: valor,
        },
      },
    }));
  }

  function guardarCambios() {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ✅ TÍTULO NEGRO EN FONDO BLANCO */}
      <h1 className="text-2xl font-semibold text-black-900 dark:text-white">
  Ajustes
</h1>


      {/* ================= DATOS RESTAURANTE ================= */}
      <div className="bg-white text-gray-900 rounded-xl border p-6 space-y-6">
        <h2 className="font-semibold text-lg">Datos del restaurante</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Teléfono</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Capacidad total
            </label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* ================= HORARIOS ================= */}
      <div className="space-y-4">
        <button
          onClick={() => setMostrarHorarios((v) => !v)}
          className="w-full bg-white text-gray-900 border rounded-xl px-6 py-4 flex justify-between items-center font-medium"
        >
          Horarios del restaurante
          <span>{mostrarHorarios ? "−" : "+"}</span>
        </button>

        {mostrarHorarios && (
          <div className="bg-white text-gray-900 rounded-xl border p-6 space-y-4">
            {diasSemana.map((dia) => {
              const h = horarios[dia];

              return (
                <div key={dia} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{dia}</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={h.abierto}
                        onChange={(e) =>
                          actualizarHorario(
                            dia,
                            "abierto",
                            e.target.checked
                          )
                        }
                      />
                      Abierto
                    </label>
                  </div>

                  {h.abierto && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Comidas</p>
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={h.comidas.inicio}
                            onChange={(e) =>
                              actualizarTurno(
                                dia,
                                "comidas",
                                "inicio",
                                e.target.value
                              )
                            }
                            className="border rounded-md px-2 py-1"
                          />
                          <input
                            type="time"
                            value={h.comidas.fin}
                            onChange={(e) =>
                              actualizarTurno(
                                dia,
                                "comidas",
                                "fin",
                                e.target.value
                              )
                            }
                            className="border rounded-md px-2 py-1"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Cenas</p>
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={h.cenas.inicio}
                            onChange={(e) =>
                              actualizarTurno(
                                dia,
                                "cenas",
                                "inicio",
                                e.target.value
                              )
                            }
                            className="border rounded-md px-2 py-1"
                          />
                          <input
                            type="time"
                            value={h.cenas.fin}
                            onChange={(e) =>
                              actualizarTurno(
                                dia,
                                "cenas",
                                "fin",
                                e.target.value
                              )
                            }
                            className="border rounded-md px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= OCUPACIÓN ================= */}
      <div className="space-y-4">
        <button
          onClick={() => setMostrarOcupacion((v) => !v)}
          className="w-full bg-white text-gray-900 border rounded-xl px-6 py-4 flex justify-between items-center font-medium"
        >
          Ocupación por turnos
          <span>{mostrarOcupacion ? "−" : "+"}</span>
        </button>

        {mostrarOcupacion && (
          <div className="bg-white text-gray-900 rounded-xl border p-6">
            <OcupacionTurnos />
          </div>
        )}
      </div>

      {/* ================= GUARDAR ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={guardarCambios}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Guardar cambios
        </button>
        {guardado && (
          <span className="text-sm text-green-600">
            Cambios guardados
          </span>
        )}
      </div>
    </div>
  );
}
