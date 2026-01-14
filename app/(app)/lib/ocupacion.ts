import { supabase } from "./supabaseClient";

/* ===== TIPOS ===== */
export type TramoOcupacion = {
  start: number;
  end: number;
  personas: number;
  pct: number;
};

export type OcupacionDia = {
  comida: number;
  cena: number;

  // ocupación media real
  totalDiaPct: number;
  ocupacionComidaPct: number;
  ocupacionCenaPct: number;

  tramosComida: TramoOcupacion[];
  tramosCena: TramoOcupacion[];

  horasComida: string[];
  horasCena: string[];
};

/* ===== UTILIDADES ===== */
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const minToHora = (min: number) =>
  String(Math.floor(min / 60)).padStart(2, "0") + ":00";

const rango = (txt?: string) => {
  if (!txt) return null;
  const [ini, fin] = txt.split("-").map((s) => s.trim());
  return { ini: toMin(ini), fin: toMin(fin) };
};

const generarTramos = (ini: number, fin: number): TramoOcupacion[] => {
  const tramos: TramoOcupacion[] = [];
  for (let m = ini; m < fin; m += 60) {
    tramos.push({
      start: m,
      end: Math.min(m + 60, fin),
      personas: 0,
      pct: 0,
    });
  }
  return tramos;
};

/* ===== FUNCIÓN PRINCIPAL ===== */
export async function calcularOcupacion(
  restauranteId: string
): Promise<OcupacionDia | null> {
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: restaurante } = await supabase
    .from("restaurantes")
    .select("capacidad_comida, capacidad_cena, horario_comida, horario_cena")
    .eq("id", restauranteId)
    .single();

  if (!restaurante) return null;

  const rangoComida =
    rango(restaurante.horario_comida) ?? { ini: 12 * 60, fin: 16 * 60 };

  const rangoCena =
    rango(restaurante.horario_cena) ?? { ini: 19 * 60, fin: 23 * 60 + 59 };

  const { data: reservas } = await supabase
    .from("reservas")
    .select("personas, fecha_hora_reserva, estado")
    .eq("restaurante_id", restauranteId)
    .neq("estado", "cancelada")
    .gte("fecha_hora_reserva", `${hoy} 00:00:00`)
    .lte("fecha_hora_reserva", `${hoy} 23:59:59`);

  if (!reservas) return null;

  const tramosComida = generarTramos(rangoComida.ini, rangoComida.fin);
  const tramosCena = generarTramos(rangoCena.ini, rangoCena.fin);

  /* ===== ASIGNAR PERSONAS A TRAMOS ===== */
  for (const r of reservas) {
    const d = new Date(r.fecha_hora_reserva);
    const min = d.getHours() * 60 + d.getMinutes();
    const p = r.personas ?? 0;

    tramosComida.forEach((t) => {
      if (min >= t.start && min < t.end) t.personas += p;
    });

    tramosCena.forEach((t) => {
      if (min >= t.start && min < t.end) t.personas += p;
    });
  }

  const capComida = Number(restaurante.capacidad_comida ?? 0);
  const capCena = Number(restaurante.capacidad_cena ?? 0);

  /* ===== % POR TRAMO ===== */
  tramosComida.forEach(
    (t) => (t.pct = capComida ? Math.round((t.personas / capComida) * 100) : 0)
  );

  tramosCena.forEach(
    (t) => (t.pct = capCena ? Math.round((t.personas / capCena) * 100) : 0)
  );

  /* ===== TRAMO ACTUAL ===== */
  const ahora = new Date();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const comida =
    tramosComida.find((t) => minAhora >= t.start && minAhora < t.end)?.pct ?? 0;

  const cena =
    tramosCena.find((t) => minAhora >= t.start && minAhora < t.end)?.pct ?? 0;

  /* ===== MEDIAS CORRECTAS ===== */
  const ocupacionComidaPct =
    tramosComida.length > 0
      ? Math.round(
          tramosComida.reduce((acc, t) => acc + t.pct, 0) /
            tramosComida.length
        )
      : 0;

  const ocupacionCenaPct =
    tramosCena.length > 0
      ? Math.round(
          tramosCena.reduce((acc, t) => acc + t.pct, 0) /
            tramosCena.length
        )
      : 0;

const sumaTramos =
  tramosComida.reduce((acc, t) => acc + t.pct, 0) +
  tramosCena.reduce((acc, t) => acc + t.pct, 0);

const totalTramos = tramosComida.length + tramosCena.length;

const totalDiaPct =
  totalTramos > 0
    ? Math.round(sumaTramos / totalTramos)
    : 0;


  /* ===== RETURN ===== */
  return {
    comida,
    cena,
    totalDiaPct,
    ocupacionComidaPct,
    ocupacionCenaPct,
    tramosComida,
    tramosCena,
    horasComida: tramosComida.map(
      (t) => `${minToHora(t.start)} - ${minToHora(t.end)}`
    ),
    horasCena: tramosCena.map(
      (t) => `${minToHora(t.start)} - ${minToHora(t.end)}`
    ),
  };
}
/* ===== OCUPACIÓN TOTAL POR FECHA (para días futuros) ===== */
export async function calcularOcupacionPorFecha(
  restauranteId: string,
  fechaISO: string // "YYYY-MM-DD"
): Promise<number> {
  const { data: restaurante } = await supabase
    .from("restaurantes")
    .select("capacidad_comida, capacidad_cena, horario_comida, horario_cena")
    .eq("id", restauranteId)
    .single();

  if (!restaurante) return 0;

  const rangoComida =
    rango(restaurante.horario_comida) ?? { ini: 12 * 60, fin: 16 * 60 };

  const rangoCena =
    rango(restaurante.horario_cena) ?? { ini: 19 * 60, fin: 23 * 60 + 59 };

  const { data: reservas } = await supabase
    .from("reservas")
    .select("personas, fecha_hora_reserva")
    .eq("restaurante_id", restauranteId)
    .neq("estado", "cancelada")
    .gte("fecha_hora_reserva", `${fechaISO} 00:00:00`)
    .lte("fecha_hora_reserva", `${fechaISO} 23:59:59`);

  if (!reservas) return 0;

  const tramosComida = generarTramos(rangoComida.ini, rangoComida.fin);
  const tramosCena = generarTramos(rangoCena.ini, rangoCena.fin);

  reservas.forEach((r) => {
    const d = new Date(r.fecha_hora_reserva);
    const min = d.getHours() * 60 + d.getMinutes();
    const p = r.personas ?? 0;

    tramosComida.forEach((t) => {
      if (min >= t.start && min < t.end) t.personas += p;
    });

    tramosCena.forEach((t) => {
      if (min >= t.start && min < t.end) t.personas += p;
    });
  });

  const capComida = Number(restaurante.capacidad_comida ?? 0);
  const capCena = Number(restaurante.capacidad_cena ?? 0);

  tramosComida.forEach(
    (t) => (t.pct = capComida ? (t.personas / capComida) * 100 : 0)
  );

  tramosCena.forEach(
    (t) => (t.pct = capCena ? (t.personas / capCena) * 100 : 0)
  );

  const sumaTramos =
    tramosComida.reduce((acc, t) => acc + t.pct, 0) +
    tramosCena.reduce((acc, t) => acc + t.pct, 0);

  const totalTramos = tramosComida.length + tramosCena.length;

  return totalTramos > 0 ? Math.round(sumaTramos / totalTramos) : 0;
}
export async function detectarDiaFlojoSemana(
  restauranteId: string,
  umbral = 40
) {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay(); // lunes = 1
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana - 1));

  const dias = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const hoyLimpio = new Date();
hoyLimpio.setHours(0, 0, 0, 0);

if (fecha < hoyLimpio) continue;


    const iso = fecha.toISOString().slice(0, 10);
    const ocupacion = await calcularOcupacionPorFecha(restauranteId, iso);

    dias.push({
      fecha: iso,
      dia: fecha.toLocaleDateString("es-ES", { weekday: "long" }),
      ocupacion,
    });
  }

  const flojos = dias
    .filter((d) => d.ocupacion < umbral)
    .sort((a, b) => a.ocupacion - b.ocupacion);

  return flojos[0] ?? null;
}
