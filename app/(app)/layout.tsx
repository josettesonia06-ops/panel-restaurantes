"use client";

import "./globals.css";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import ThemeProvider from "./components/ThemeProvider";
import RequireLandscape from "./components/RequireLandscape";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isLogin = pathname === "/login";

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen transition-colors">
        <ThemeProvider>
          {isLogin ? (
            /* ===== SOLO LOGIN ===== */
            <>{children}</>
          ) : (
            /* ===== PANEL COMPLETO ===== */
            <RequireLandscape>
              <div className="min-h-screen bg-[#f5f6fa] text-gray-900 dark:bg-[#050b18] dark:text-gray-100">
                {/* ===== TOP BAR MÓVIL ===== */}
                <div className="flex items-center justify-between p-4 lg:hidden border-b dark:border-gray-800">
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="px-3 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
                  >
                    ☰
                  </button>
                  <span className="font-bold uppercase text-sm">Panel</span>
                </div>

                {/* ===== SIDEBAR MÓVIL ===== */}
                {mobileOpen && (
                  <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                      className="absolute inset-0 bg-black/40"
                      onClick={() => setMobileOpen(false)}
                    />

                    <div className="absolute left-0 top-0 h-full w-64 bg-white text-gray-900 dark:bg-[#050b18] dark:text-gray-100 shadow-xl">
                      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                        <span className="font-bold">Menú</span>
                        <button
                          onClick={() => setMobileOpen(false)}
                          className="text-sm opacity-70"
                        >
                          Cerrar
                        </button>
                      </div>

                      <Sidebar mobile />
                    </div>
                  </div>
                )}

                <div className="flex min-h-screen">
                  {/* ===== SIDEBAR DESKTOP ===== */}
                  <div className="hidden lg:block">
                    <Sidebar />
                  </div>

                  {/* ===== CONTENIDO ===== */}
                  <main className="flex-1 w-full p-4 sm:p-6 lg:ml-64">
                    {children}
                  </main>
                </div>
              </div>
            </RequireLandscape>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
