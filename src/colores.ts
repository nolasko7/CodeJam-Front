// Paleta categórica validada (orden fijo, seguro para daltonismo en pares adyacentes).
// El color sigue al vehículo según su posición en el dataset: V2 es siempre el mismo color.
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const OTRO = "#898781";

export function colorVehiculo(vehiculos: { id: string }[], id: string): string {
  const i = vehiculos.findIndex((v) => v.id === id);
  return i >= 0 && i < SERIES.length ? SERIES[i] : OTRO;
}
