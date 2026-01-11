import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "Panel Restaurante",
  description: "Panel profesional para restaurantes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f5f6fa] dark:bg-[#050b18] text-gray-900 dark:text-gray-100 transition-colors">
        <Sidebar />
        <main className="ml-64 p-8 min-h-screen text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </body>
    </html>
  );
}
