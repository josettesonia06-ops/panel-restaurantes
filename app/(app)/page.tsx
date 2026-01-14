"use client";

import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";


export default function Home() {
  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase
        .from("Restaurante")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    };

    testSupabase();
  }, []);

  return (
    <div className="p-8">
      Mira la consola (F12 → Console)
    </div>
  );
}
