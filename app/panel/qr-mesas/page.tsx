"use client";

import { useMemo, useState } from "react";
import { QrCode, Download, Link2, Table2 } from "lucide-react";
import QRCode from "qrcode";

export default function QRMesasPage() {
  const [tokenCarta, setTokenCarta] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [mesaDesde, setMesaDesde] = useState(1);
  const [mesaHasta, setMesaHasta] = useState(10);

  const mesas = useMemo(() => {
    const desde = Math.max(1, Number(mesaDesde) || 1);
    const hasta = Math.max(desde, Number(mesaHasta) || desde);

    return Array.from({ length: hasta - desde + 1 }, (_, index) => {
      const mesa = desde + index;
      const url = `${baseUrl}/carta/${tokenCarta}?mesa=${mesa}`;

      return {
        mesa,
        url,
      };
    });
  }, [baseUrl, tokenCarta, mesaDesde, mesaHasta]);

  async function descargarQR(mesa: number, url: string) {
    if (!tokenCarta.trim()) {
      alert("Primero pega el token de la carta.");
      return;
    }

    const canvas = document.createElement("canvas");

    await QRCode.toCanvas(canvas, url, {
      width: 900,
      margin: 3,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    });

    const imagenQR = canvas.toDataURL("image/png");

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = 1100;
    finalCanvas.height = 1400;

    const ctx = finalCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    ctx.fillStyle = "#020617";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Carta digital", finalCanvas.width / 2, 120);

    ctx.fillStyle = "#334155";
    ctx.font = "bold 42px Arial";
    ctx.fillText(`Mesa ${mesa}`, finalCanvas.width / 2, 190);

    const qrImage = new Image();

    qrImage.onload = () => {
      ctx.drawImage(qrImage, 100, 260, 900, 900);

      ctx.fillStyle = "#020617";
      ctx.font = "bold 38px Arial";
      ctx.fillText("Escanea para pedir", finalCanvas.width / 2, 1240);

      ctx.fillStyle = "#64748b";
      ctx.font = "28px Arial";
      ctx.fillText("GastroHelp", finalCanvas.width / 2, 1300);

      const link = document.createElement("a");
      link.download = `qr-mesa-${mesa}.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    };

    qrImage.src = imagenQR;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-black">QR por mesa</h1>
            <p className="mt-1 text-slate-600">
              Genera los QR para que cada cliente escanee la carta desde su mesa.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                URL base
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-slate-400"
                placeholder="https://gastrohelp.es"
              />
              <p className="mt-2 text-xs font-bold text-slate-500">
                En local usa http://localhost:3000. En producción usa tu dominio.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Token público de la carta
              </label>
              <input
                value={tokenCarta}
                onChange={(e) => setTokenCarta(e.target.value.trim())}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-slate-400"
                placeholder="680e5c04d4f7bfd3f0b25526c7a85d98"
              />
              <p className="mt-2 text-xs font-bold text-slate-500">
                Es el token que aparece en /carta/TOKEN.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Desde mesa
              </label>
              <input
                type="number"
                value={mesaDesde}
                onChange={(e) => setMesaDesde(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Hasta mesa
              </label>
              <input
                type="number"
                value={mesaHasta}
                onChange={(e) => setMesaHasta(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mesas.map((item) => (
            <article
              key={item.mesa}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <Table2 className="h-5 w-5 text-slate-700" />
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase text-slate-500">
                      Mesa
                    </p>
                    <h2 className="text-2xl font-black">{item.mesa}</h2>
                  </div>
                </div>

                <QrCode className="h-6 w-6 text-slate-400" />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-black uppercase text-slate-500">
                    Enlace del QR
                  </p>
                </div>

                <p className="break-all text-sm font-bold text-slate-700">
                  {item.url}
                </p>
              </div>

              <button
                onClick={() => descargarQR(item.mesa, item.url)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}