// app/c/[token]/page.tsx
import React from "react";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import PremioImage from "./PremioImage";

type RestauranteBrand = {
  id: string;
  nombre: string | null;
  color_primario?: string | null;
  color_fondo?: string | null;
  logo_url?: string | null;
};

type PremioPuntos = {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  imagen_url: string | null;
  activo: boolean;
  creado_en: string;
};

type Cupon = {
  id: string;
  nombre: string;
  beneficio: string;
  condiciones: any;
  activo: boolean;
  creado_en?: string;
};

type CanjePuntos = {
  id: string;
  premio_id: string;
  puntos_usados: number;
  estado: "pendiente" | "confirmado" | "cancelado";
  creado_en: string;
  confirmado_en: string | null;
};

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

function clsx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function Badge({
  children,
  accent,
  variant = "soft",
}: {
  children: React.ReactNode;
  accent: string;
  variant?: "soft" | "solid";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "solid"
          ? "text-white"
          : "bg-black/5 text-black/80 border border-black/10"
      )}
      style={variant === "solid" ? { backgroundColor: accent } : undefined}
    >
      {children}
    </span>
  );
}

function ProgressBar({ pct, accent }: { pct: number; accent: string }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
      <div className="h-full" style={{ width: `${v}%`, backgroundColor: accent }} />
    </div>
  );
}

function Donut({
  pct,
  accent,
  labelTop,
  labelBottom,
}: {
  pct: number;
  accent: string;
  labelTop: string;
  labelBottom: string;
}) {
  const v = Math.max(0, Math.min(100, pct));
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className="flex items-center gap-4">
      <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
        <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="10" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 46 46)"
        />
        <text
          x="46"
          y="50"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="rgba(0,0,0,0.85)"
        >
          {Math.round(v)}%
        </text>
      </svg>

      <div>
        <div className="text-sm font-semibold text-black/70">{labelTop}</div>
        <div className="text-base font-extrabold tracking-tight">{labelBottom}</div>
      </div>
    </div>
  );
}

function Card({
  children,
  accent,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  accent: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold tracking-tight">{title}</div>
          {subtitle ? <div className="text-sm text-black/60 mt-1">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
      <div className="mt-5 h-px w-full bg-black/5" />
      <div className="mt-4">
        <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}

function getNowMadridParts() {
  const dtf = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = dtf.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));

  const dayJS = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })).getDay();
  const weekdayMon0 = (dayJS + 6) % 7;

  return { y, m, d, hh, mm, weekdayMon0 };
}

function timeToMinutes(t: string) {
  const [H, M] = (t ?? "").split(":").map((x) => Number(x));
  return (H || 0) * 60 + (M || 0);
}

function isNowWithinWindow(nowMin: number, startMin: number, endMin: number) {
  if (startMin <= endMin) return nowMin >= startMin && nowMin <= endMin;
  return nowMin >= startMin || nowMin <= endMin;
}

function isBirthdayPromoActive(args: {
  fechaNacimiento: string | null | undefined;
  diasAntes: number;
  validezDias: number;
}) {
  const { fechaNacimiento, diasAntes, validezDias } = args;
  if (!fechaNacimiento) return { ok: false, motivo: "Sin fecha de nacimiento" };

  const { y, m, d } = getNowMadridParts();
  const today = new Date(Date.UTC(y, m - 1, d));

  const fn = new Date(fechaNacimiento);
  if (Number.isNaN(fn.getTime())) return { ok: false, motivo: "Fecha inválida" };

  const bMonth = fn.getUTCMonth();
  const bDay = fn.getUTCDate();

  let bThis = new Date(Date.UTC(y, bMonth, bDay));
  if (bThis < today) bThis = new Date(Date.UTC(y + 1, bMonth, bDay));

  const start = new Date(bThis);
  start.setUTCDate(start.getUTCDate() - Math.max(0, diasAntes));

  const end = new Date(bThis);
  end.setUTCDate(end.getUTCDate() + Math.max(0, validezDias) - 1);

  const ok = today >= start && today <= end;

  const msDay = 24 * 60 * 60 * 1000;
  const daysToStart = Math.ceil((start.getTime() - today.getTime()) / msDay);

  return {
    ok,
    motivo: ok ? "Disponible" : daysToStart > 0 ? `Disponible en ${daysToStart} días` : "Fuera de ventana",
  };
}

function isHappyHourActive(args: { diasSemana: number[]; horaInicio: string; horaFin: string }) {
  const { diasSemana, horaInicio, horaFin } = args;
  const { hh, mm, weekdayMon0 } = getNowMadridParts();

  const dayOk = Array.isArray(diasSemana) ? diasSemana.includes(weekdayMon0) : false;

  const nowMin = hh * 60 + mm;
  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);

  const timeOk = isNowWithinWindow(nowMin, startMin, endMin);

  return {
    ok: dayOk && timeOk,
    motivo: dayOk ? (timeOk ? "Disponible ahora" : `Horario: ${horaInicio}–${horaFin}`) : "Hoy no aplica",
  };
}

export default async function ClientePremiosPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;

  const supabase = getAdmin();

  // Server Action: canjear
  async function canjearAction(formData: FormData) {
    "use server";
    const premioId = String(formData.get("premio_id") ?? "");
    const tokenLocal = String(formData.get("token") ?? "");

    const admin = getAdmin();

    const { data: cliente } = await admin
      .from("clientes")
      .select("id,restaurante_id,public_token")
      .eq("public_token", tokenLocal)
      .maybeSingle();

    if (!cliente) redirect(`/c/${tokenLocal}?err=cliente`);

    const { error } = await admin.rpc("rpc_canjear_premio", {
      p_cliente_id: cliente.id,
      p_restaurante_id: cliente.restaurante_id,
      p_premio_id: premioId,
    });

    if (error) {
      const code =
        /insuficientes/i.test(error.message) ? "puntos" :
        /no disponible/i.test(error.message) ? "premio" :
        "canje";
      redirect(`/c/${tokenLocal}?err=${code}`);
    }

    redirect(`/c/${tokenLocal}?ok=1`);
  }

  // Cliente por token
  const { data: cliente, error: clienteErr } = await supabase
    .from("clientes")
    // ✅ AÑADIDO puntos_totales para usarlo como saldo real
    .select("id,nombre,restaurante_id,public_token,fecha_nacimiento")
    .eq("public_token", token)
    .maybeSingle();

  if (clienteErr || !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="text-lg font-extrabold tracking-tight">Enlace no válido</div>
          <div className="text-sm text-black/60 mt-1">Revisa el enlace o pide uno nuevo en el restaurante.</div>
        </div>
      </div>
    );
  }

  // Branding
  let restaurante: RestauranteBrand | null = null;
  try {
    const r = await supabase
      .from("restaurantes")
      .select("id,nombre,color_primario,color_fondo,logo_url")
      .eq("id", cliente.restaurante_id)
      .maybeSingle();
    restaurante = (r.data as any) ?? null;
  } catch {
    restaurante = null;
  }

  const restoNombre = restaurante?.nombre ?? "Restaurante";
  const accent = restaurante?.color_primario ?? "#2563eb";
  const bg = restaurante?.color_fondo ?? "#f8fafc";
  const logo = restaurante?.logo_url ?? null;

// ✅ Puntos actuales: usar puntos_saldos (saldo calculado desde movimientos)
const { data: saldo } = await supabase
  .from("puntos_saldos")
  .select("puntos")
  .eq("cliente_id", cliente.id)
  .eq("restaurante_id", cliente.restaurante_id)
  .maybeSingle();

const puntos = Number((saldo as any)?.puntos ?? 0);



  // Premios por puntos
  const { data: premiosRaw } = await supabase
    .from("premios_puntos")
    .select("id,nombre,descripcion,puntos_requeridos,imagen_url,activo,creado_en")
    .eq("restaurante_id", cliente.restaurante_id)
    .eq("activo", true)
    .order("puntos_requeridos", { ascending: true });

  const premiosPuntos = ((premiosRaw ?? []) as any[]).map((x) => ({
    id: x.id,
    nombre: x.nombre,
    descripcion: x.descripcion ?? null,
    puntos_requeridos: Number(x.puntos_requeridos ?? 0),
    imagen_url: x.imagen_url ?? null,
    activo: Boolean(x.activo),
    creado_en: x.creado_en,
  })) as PremioPuntos[];

  // Canjes
  const { data: canjesRaw } = await supabase
    .from("canjes_puntos")
    .select("id,premio_id,puntos_usados,estado,creado_en,confirmado_en")
    .eq("cliente_id", cliente.id)
    .eq("restaurante_id", cliente.restaurante_id)
    .order("creado_en", { ascending: false });

  const canjes = ((canjesRaw ?? []) as any[]).map((x) => ({
    id: x.id,
    premio_id: x.premio_id,
    puntos_usados: Number(x.puntos_usados ?? 0),
    estado: x.estado,
    creado_en: x.creado_en,
    confirmado_en: x.confirmado_en ?? null,
  })) as CanjePuntos[];

  const canjesPendientes = canjes.filter((c) => c.estado === "pendiente");
  const premiosById = new Map(premiosPuntos.map((p) => [p.id, p]));

  // Promos automáticas (cumpleaños / horas valle)
  const { data: cuponesRaw } = await supabase
    .from("cupones")
    .select("id,nombre,beneficio,condiciones,activo,creado_en")
    .eq("restaurante_id", cliente.restaurante_id)
    .eq("activo", true)
    .order("creado_en", { ascending: false });

  const cupones = (cuponesRaw ?? []) as Cupon[];

  const promosEspeciales = cupones
    .filter((c) => ["cumpleanos", "horas_valle"].includes(c.condiciones?.tipo ?? ""))
    .map((c) => {
      const tipo = c.condiciones?.tipo ?? "";
      if (tipo === "cumpleanos") {
        const diasAntes = Number(c.condiciones?.dias_antes ?? 0);
        const validezDias = Number(c.condiciones?.validez_dias ?? 1);
        const r = isBirthdayPromoActive({
          fechaNacimiento: (cliente as any).fecha_nacimiento,
          diasAntes,
          validezDias,
        });
        return { cupon: c, tipo, ok: r.ok, texto: r.motivo };
      }
      const diasSemana = (c.condiciones?.dias_semana ?? []) as number[];
      const horaInicio = String(c.condiciones?.hora_inicio ?? "00:00");
      const horaFin = String(c.condiciones?.hora_fin ?? "23:59");
      const r = isHappyHourActive({ diasSemana, horaInicio, horaFin });
      return { cupon: c, tipo, ok: r.ok, texto: r.motivo };
    });

  // Donut: hacia el siguiente premio
  const next = premiosPuntos.find((p) => p.puntos_requeridos > puntos) ?? null;
  const best = premiosPuntos[0] ?? null;
  const donutTarget = next ?? best;

  const donutTop = donutTarget ? donutTarget.nombre : "Puntos";
  const donutBottom = donutTarget
    ? next
      ? `Te faltan ${Math.max(0, donutTarget.puntos_requeridos - puntos)} pts`
      : "Ya puedes canjear"
    : "Sin premios configurados";

  const donutPct = donutTarget
    ? donutTarget.puntos_requeridos > 0
      ? Math.min(100, (puntos / donutTarget.puntos_requeridos) * 100)
      : 0
    : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(1200px 500px at 10% 0%, ${accent}1a, transparent 60%),
                     radial-gradient(900px 500px at 90% 10%, ${accent}12, transparent 55%),
                     ${bg}`,
      }}
    >
      <div className="mx-auto max-w-3xl p-6 space-y-5">
        {/* Banner ok/err */}
        {sp.ok ? (
          <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold">Canje solicitado</div>
            <div className="text-xs text-black/60 mt-1">Enseña la pantalla en el restaurante para confirmarlo.</div>
          </div>
        ) : null}

        {sp.err ? (
          <div className="rounded-3xl border border-red-200 bg-white/80 backdrop-blur p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold text-red-700">No se pudo canjear</div>
            <div className="text-xs text-red-700/70 mt-1">
              {sp.err === "puntos"
                ? "Puntos insuficientes."
                : sp.err === "premio"
                  ? "Premio no disponible."
                  : "Inténtalo otra vez."}
            </div>
          </div>
        ) : null}

        {/* HERO */}
        <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-2xl border border-black/10 bg-white flex items-center justify-center overflow-hidden"
                style={{ boxShadow: `0 12px 28px ${accent}22` }}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={restoNombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-xl" style={{ backgroundColor: accent }} />
                )}
              </div>

              <div>
                <div className="text-sm font-semibold text-black/60">{restoNombre}</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight">{cliente.nombre ?? "Cliente"}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge accent={accent} variant="solid">
                    Puntos: <span className="ml-1 font-extrabold">{puntos}</span>
                  </Badge>
                  <Badge accent={accent}>
                    Canjes pendientes: <span className="ml-1 font-extrabold">{canjesPendientes.length}</span>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <Donut pct={donutPct} accent={accent} labelTop={donutTop} labelBottom={donutBottom} />
            </div>
          </div>

          <div className="sm:hidden mt-5">
            <Donut pct={donutPct} accent={accent} labelTop={donutTop} labelBottom={donutBottom} />
          </div>
        </div>

        {/* PREMIOS POR PUNTOS */}
        <Card
          accent={accent}
          title="Premios por puntos"
          subtitle={premiosPuntos.length ? "Elige tu objetivo y acumula puntos" : "Aún no hay premios configurados"}
          right={<Badge accent={accent} variant="solid">{premiosPuntos.length}</Badge>}
        >
          {premiosPuntos.length === 0 ? (
            <div className="text-sm text-black/60">Cuando el restaurante configure premios, aparecerán aquí.</div>
          ) : (
            <div className="space-y-3">
              {premiosPuntos.map((p) => {
                const falta = Math.max(0, p.puntos_requeridos - puntos);
                const ok = puntos >= p.puntos_requeridos;
                const pct = p.puntos_requeridos > 0 ? Math.min(100, (puntos / p.puntos_requeridos) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <PremioImage src={p.imagen_url} alt={p.nombre} accent={accent} />

                        <div>
                          <div className="font-extrabold tracking-tight">{p.nombre}</div>
                          {p.descripcion ? <div className="text-sm text-black/70 mt-1">{p.descripcion}</div> : null}

                          <div className="mt-3">
                            <ProgressBar pct={pct} accent={accent} />
                            <div className="mt-2 text-xs text-black/50 flex justify-between">
                              <span>Tú: {puntos}</span>
                              <span>Objetivo: {p.puntos_requeridos}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="rounded-xl px-3 py-2 text-sm font-extrabold"
                          style={{ backgroundColor: `${accent}14`, color: "rgba(0,0,0,0.85)" }}
                        >
                          {p.puntos_requeridos} pts
                        </div>

                        {ok ? (
                          <form action={canjearAction}>
                            <input type="hidden" name="premio_id" value={p.id} />
                            <input type="hidden" name="token" value={token} />
                            <button
                              type="submit"
                              className="rounded-full px-4 py-2 text-xs font-extrabold text-white"
                              style={{ backgroundColor: accent }}
                            >
                              Canjear
                            </button>
                          </form>
                        ) : (
                          <Badge accent={accent}>Faltan {falta}</Badge>
                        )}

                        <div className="text-xs text-black/50">Se registra como pendiente</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* PROMOS AUTOMÁTICAS */}
        <Card
          accent={accent}
          title="Promos automáticas"
          subtitle="Cumpleaños y horas valle"
          right={<Badge accent={accent}>{promosEspeciales.length}</Badge>}
        >
          {promosEspeciales.length === 0 ? (
            <div className="text-sm text-black/60">Este restaurante no tiene promos activas ahora.</div>
          ) : (
            <div className="space-y-3">
              {promosEspeciales.map((p) => (
                <div
                  key={p.cupon.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="font-extrabold tracking-tight">{p.cupon.nombre}</div>
                    <div className="text-sm text-black/70 mt-1">{p.cupon.beneficio}</div>
                    <div className="text-xs text-black/50 mt-2">
                      {p.tipo === "cumpleanos" ? "Tipo: Cumpleaños" : "Tipo: Horas valle"}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge accent={accent} variant={p.ok ? "solid" : "soft"}>
                      {p.ok ? "Disponible" : "No disponible"}
                    </Badge>
                    <div className="mt-2 text-xs text-black/50">{p.texto}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* HISTORIAL */}
        <Card
          accent={accent}
          title="Historial"
          subtitle="Canjes registrados"
          right={<Badge accent={accent}>{canjes.length}</Badge>}
        >
          {canjes.length === 0 ? (
            <div className="text-sm text-black/60">Aún no hay canjes.</div>
          ) : (
            <div className="space-y-2">
              {canjes.map((c) => {
                const premio = premiosById.get(c.premio_id);
                const title = premio?.nombre ?? "Premio";
                const pts = premio?.puntos_requeridos ?? c.puntos_usados;

                const estadoLabel =
                  c.estado === "pendiente" ? "Pendiente" : c.estado === "confirmado" ? "Confirmado" : "Cancelado";

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="font-extrabold tracking-tight">{title}</div>
                      <div className="text-sm text-black/70 mt-1">
                        Puntos: <span className="font-extrabold">{pts}</span>
                      </div>
                      <div className="mt-3 text-xs text-black/50">
                        Creado: {new Date(c.creado_en).toLocaleString("es-ES")}
                        {c.confirmado_en ? ` · Confirmado: ${new Date(c.confirmado_en).toLocaleString("es-ES")}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge accent={accent} variant={c.estado === "confirmado" ? "solid" : "soft"}>
                        {estadoLabel}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="text-center text-xs text-black/40">Guarda este enlace para volver cuando quieras</div>
      </div>
    </div>
  );
}
