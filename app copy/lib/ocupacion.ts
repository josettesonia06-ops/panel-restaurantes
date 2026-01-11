export function calcularOcupacion() {
  const capacidadTotal = 50;

  const personasReservadas = {
    comidas: 32,
    cenas: 46,
  };

  const totalReservado =
    personasReservadas.comidas + personasReservadas.cenas;

  const capacidadDia = capacidadTotal * 2; // comidas + cenas

  const porcentaje = Math.round(
    (totalReservado / capacidadDia) * 100
  );

  return porcentaje;
}
