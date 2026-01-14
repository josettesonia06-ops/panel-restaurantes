export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
