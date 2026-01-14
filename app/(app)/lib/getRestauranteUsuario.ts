import { supabase } from "./supabaseClient";

export async function getRestauranteUsuario(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("NO USER");
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios_restaurantes")
    .select("restaurante_id")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.log("NO RESTAURANTE");
    return null;
  }

  return data.restaurante_id;
}
