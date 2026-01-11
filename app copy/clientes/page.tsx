"use client";

import { useState } from "react";
import { MessageCircle, History } from "lucide-react";

type Cliente = {
  id: number;
  nombre: string;
  tipo: "nuevo" | "habitual" | "frecuente";
  visitas: number;
  ultimaVisita: string;
  whatsapp?: string;
};

const clientes: Cliente[] = [
  { id: 1, nombre: "Juan Pérez", tipo: "habitual", visitas: 5, ultimaVisita: "Hace 2 días", whatsapp: "600123123" },
  { id: 2, nombre: "María López", tipo: "nuevo", visitas: 2, ultimaVisita: "Hace 1 semana" },
  { id: 3, nombre: "Carlos Gómez", tipo: "frecuente", visitas: 8, ultimaVisita: "Ayer", whatsapp: "611222333" },
];

function TipoBadge({ tipo }: { tipo: Cliente["tipo"] }) {
  const styles = {
    nuevo: "bg-gray-100 text-gray-700",
    habitual: "bg-blue-100 text-blue-700",
    frecuente: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles[tipo]}`}>
      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
    </span>
  );
}

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Cliente["tipo"] | "todos">("todos");

  const filtrados = clientes.filter((c) => {
    const nombreOk = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const tipoOk = filtroTipo === "todos" || c.tipo === filtroTipo;
    return nombreOk && tipoOk;
  });

  return (
    <div className="space-y-6">
      {/* ÚNICO CAMBIO: color del título según fondo */}
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Clientes
      </h1>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total clientes", value: clientes.length },
          { label: "Frecuentes", value: clientes.filter(c => c.tipo === "frecuente").length },
          { label: "Nuevos", value: clientes.filter(c => c.tipo === "nuevo").length },
          { label: "Con WhatsApp", value: clientes.filter(c => c.whatsapp).length },
        ].map((item, i) => (
          <div key={i} className="bg-white text-gray-900 rounded-xl p-5 border">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white text-gray-900 rounded-xl p-5 border flex gap-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente..."
          className="border rounded-md px-3 py-2 text-sm w-64"
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as any)}
          className="border rounded-md px-3 py-2 text-sm w-48"
        >
          <option value="todos">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="habitual">Habitual</option>
          <option value="frecuente">Frecuente</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white text-gray-900 rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Visitas</th>
              <th className="px-6 py-3 text-left">Última visita</th>
              <th className="px-6 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-6 py-4 font-medium">{c.nombre}</td>
                <td className="px-6 py-4"><TipoBadge tipo={c.tipo} /></td>
                <td className="px-6 py-4">{c.visitas}</td>
                <td className="px-6 py-4">{c.ultimaVisita}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="px-3 py-1 border rounded-md text-xs flex gap-1 items-center">
                    <History size={14} /> Historial
                  </button>
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/34${c.whatsapp}`}
                      target="_blank"
                      className="px-3 py-1 border rounded-md text-xs flex gap-1 items-center"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
