export function siguienteIndice(actual, delta, total) {
  return Math.max(0, Math.min(total - 1, actual + delta));
}
