import { supabase } from "./supabaseClient";

export async function getRestauranteUsuario(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios_restaurantes")
    .select("restaurante_id")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data.restaurante_id;
}
