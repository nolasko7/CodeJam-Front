import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { siguienteIndice } from '../src/presentacion/navegacion.mjs';

test('la navegación se mantiene dentro de la presentación', () => {
  assert.equal(siguienteIndice(0, -1, 10), 0);
  assert.equal(siguienteIndice(9, 1, 10), 9);
  assert.equal(siguienteIndice(4, 1, 10), 5);
});
