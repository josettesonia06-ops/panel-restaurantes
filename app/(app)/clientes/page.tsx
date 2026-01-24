"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import AddVisitaModal from "../components/AddVisitaModal";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";


/* ===== TIPOS ===== */
type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  visitas_totales: number;
  ultima_visita: string | null;
  canal_contacto: string | null;
};

/* ===== HELPERS ===== */
function getTipo(visitas: number) {
  if (visitas >= 5) return "Frecuente";
  if (visitas >= 2) return "Habitual";
  return "Nuevo";
}


function formatFecha(fecha: string | null) {
  if (!fecha) return "-";
  const diff = Math.floor(
    (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `Hace ${diff} días`;
}

function normalizarNombre(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    read();

    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => obs.disconnect();
  }, []);

useEffect(() => {
  const cargarRestaurante = async () => {
    const id = await getRestauranteUsuario();
    if (id) setRestauranteId(id);
  };

  cargarRestaurante();
}, []);


  /* NUEVO: modal visita */
  const [showAddVisita, setShowAddVisita] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(
    null
  );

  /* FORM */
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [personas, setPersonas] = useState("");



  /* ===== CARGAR CLIENTES ===== */
const cargarClientes = async () => {
  if (!restauranteId) return;

  const { data } = await supabase
    .from("clientes")
    .select(
      "id, nombre, telefono, visitas_totales, ultima_visita, canal_contacto"
    )
    .eq("restaurante_id", restauranteId)
    .order("ultima_visita", { ascending: false });

  if (data) setClientes(data);
};


useEffect(() => {
  if (!restauranteId) return;
  cargarClientes();
}, [restauranteId]);


  /* ===== AÑADIR CLIENTE (SIN DUPLICADOS) ===== */
  const añadirCliente = async () => {
    if (!nombre || !fecha) {
      alert("Nombre y fecha son obligatorios");
      return;
    }

    const nombreNormalizado = normalizarNombre(nombre);

   if (!restauranteId) return;

const { data: existente } = await supabase
  .from("clientes")
  .select("id")
  .eq("restaurante_id", restauranteId)
  .eq("nombre_normalizado", nombreNormalizado)
  .maybeSingle();


    if (existente) {
      await supabase.from("clientes_historial").insert({
        cliente_id: existente.id,
        restaurante_id: restauranteId,
        tipo: "visita",
        created_at: fecha,
        personas: personas ? Number(personas) : null,
      });

      await supabase.rpc("increment_client_visit", {
        cliente_id_input: existente.id,
      });

      setShowModal(false);
      setNombre("");
      setFecha("");
      setPersonas("");
      cargarClientes();
      return;
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .insert({
  restaurante_id: restauranteId,
  nombre,
  nombre_normalizado: nombreNormalizado,
  visitas_totales: 1,
  ultima_visita: fecha,
})

      .select()
      .single();

    if (error || !cliente) {
      alert("Error al guardar el cliente");
      return;
    }

    await supabase.from("clientes_historial").insert({
      cliente_id: cliente.id,
      restaurante_id: restauranteId,
      tipo: "visita",
      created_at: fecha,
      personas: personas ? Number(personas) : null,
    });

    setNombre("");
    setFecha("");
    setPersonas("");
    setShowModal(false);
    cargarClientes();
  };

  /* ===== CONTADORES ===== */
  const totalClientes = clientes.length;
  const frecuentes = clientes.filter((c) => c.visitas_totales >= 5).length;
  const nuevos = clientes.filter((c) => c.visitas_totales === 1).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            Clientes
          </h1>
          <p className="text-sm opacity-70">
            Gestión de clientes presenciales y reservas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-bold"
        >
          <Plus size={16} />
          Añadir cliente
        </button>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card rounded-2xl p-5 h-32 flex flex-col justify-between bg-blue-50 dark:bg-blue-500/10">
          <p className="text-sm font-bold uppercase text-blue-700">
            Total clientes
          </p>
          <p className="text-4xl font-extrabold text-blue-800">
            {totalClientes}
          </p>
        </div>

        <div className="card rounded-2xl p-5 h-32 flex flex-col justify-between bg-green-50 dark:bg-green-500/10">
          <p className="text-sm font-bold uppercase text-green-700">
            Frecuentes
          </p>
          <p className="text-4xl font-extrabold text-green-800">
            {frecuentes}
          </p>
        </div>

        <div className="card rounded-2xl p-5 h-32 flex flex-col justify-between bg-purple-50 dark:bg-purple-500/10">
          <p className="text-sm font-bold uppercase text-purple-700">
            Nuevos
          </p>
          <p className="text-4xl font-extrabold text-purple-800">
            {nuevos}
          </p>
        </div>
      </div>

      {/* LISTADO */}
      <div className="card rounded-2xl p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Visitas</th>
              <th>Última visita</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-3 font-medium">{c.nombre}</td>
                <td>{getTipo(c.visitas_totales)}</td>
                <td>{c.visitas_totales}</td>
                <td>{formatFecha(c.ultima_visita)}</td>
                <td className="text-right space-x-2">
                  <button
                    onClick={() => {
                      setClienteSeleccionado(c.id);
                      setShowAddVisita(true);
                    }}
                    className="px-3 py-1 text-xs rounded-lg border"
                  >
                    + Visita
                  </button>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="px-3 py-1 text-xs rounded-lg border"
                  >
                    Historial
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL AÑADIR CLIENTE */}
 {showModal && (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      isDark ? "bg-black/60" : "bg-black/30"
    }`}
  >
    <div
      className={`rounded-xl p-6 w-full max-w-md space-y-4 ${
        isDark
          ? "bg-[#0b1220] text-gray-100"
          : "bg-white text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Añadir cliente</h2>
        <button
          onClick={() => setShowModal(false)}
          className="opacity-70 hover:opacity-100"
        >
          <X />
        </button>
      </div>

      <input
        className={`w-full border rounded-lg p-2 text-sm ${
          isDark
            ? "bg-[#050b18] text-gray-100 border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        }`}
        placeholder="Nombre del cliente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <input
        type="date"
        className={`w-full border rounded-lg p-2 text-sm ${
          isDark
            ? "bg-[#050b18] text-gray-100 border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        }`}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      <input
        type="number"
        className={`w-full border rounded-lg p-2 text-sm ${
          isDark
            ? "bg-[#050b18] text-gray-100 border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        }`}
        placeholder="Personas (opcional)"
        value={personas}
        onChange={(e) => setPersonas(e.target.value)}
      />

      <button
        onClick={añadirCliente}
        className={`w-full py-2 rounded-lg font-bold text-white ${
        isDark
          ? "bg-black hover:bg-gray-800"
          : "bg-gray-900 hover:bg-gray-800"
      }`}
      >
        Guardar cliente
      </button>
    </div>
  </div>
)}


      {/* MODAL AÑADIR VISITA */}
      {showAddVisita && clienteSeleccionado && (
        <AddVisitaModal
          clienteId={clienteSeleccionado}
          onClose={() => {
            setShowAddVisita(false);
            setClienteSeleccionado(null);
          }}
          onSaved={cargarClientes}
        />
      )}
    </div>
  );
}
