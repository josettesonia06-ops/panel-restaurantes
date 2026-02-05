"use client";

import React, { useState } from "react";

export default function PremioImage({
  src,
  alt,
  accent,
}: {
  src: string | null;
  alt: string;
  accent: string;
}) {
  const [ok, setOk] = useState(true);

  const valid = Boolean(src && /^https?:\/\//i.test(src));
  const showImg = valid && ok;

  return (
    <div className="h-14 w-14 rounded-2xl border border-black/10 bg-black/5 overflow-hidden shrink-0">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }}
        />
      )}
    </div>
  );
}
