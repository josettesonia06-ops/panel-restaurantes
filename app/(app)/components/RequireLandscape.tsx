"use client";

import { useEffect, useState } from "react";

export default function RequireLandscape({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;

      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (isMobile && isPortrait) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white text-center px-6">
        <div className="text-2xl font-semibold mb-4">
          Gira el móvil
        </div>
        <p className="text-sm opacity-80">
          Este panel está pensado para verse en horizontal
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
