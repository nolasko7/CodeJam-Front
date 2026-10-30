import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { siguienteIndice } from '../src/presentacion/navegacion.mjs';

test('la navegación se mantiene dentro de la presentación', () => {
  assert.equal(siguienteIndice(0, -1, 10), 0);
  assert.equal(siguienteIndice(9, 1, 10), 9);
  assert.equal(siguienteIndice(4, 1, 10), 5);
});

import { MINIMOS, costo, resumir, simular } from '../src/presentacion/paisaje.mjs';

test('el paisaje tiene un único mínimo global, en el centro, y varios locales', () => {
  assert.equal(MINIMOS[0].nombre, 'global');
  assert.ok(Math.hypot(MINIMOS[0].x, MINIMOS[0].y) < 0.05);
  assert.ok(MINIMOS.length > 2);
  assert.ok(MINIMOS.slice(1).every((m) => m.z > MINIMOS[0].z + 0.5));
  assert.equal(costo(MINIMOS[0].x, MINIMOS[0].y), MINIMOS[0].z);
});

test('la simulación es reproducible y el recocido llega más veces al mínimo global', () => {
  assert.deepEqual(simular('recocido', 5).caminantes[0].camino, simular('recocido', 5).caminantes[0].camino);
  let descenso = 0;
  let recocido = 0;
  for (let semilla = 1; semilla <= 40; semilla++) {
    descenso += resumir(simular('descenso', semilla)).globales;
    recocido += resumir(simular('recocido', semilla)).globales;
  }
  assert.ok(recocido > descenso * 2, `recocido ${recocido} vs descenso ${descenso}`);
});

test('el descenso simple nunca sube el costo', () => {
  for (const c of simular('descenso', 5).caminantes) {
    for (let i = 1; i < c.camino.length - 1; i++) assert.ok(c.camino[i].z <= c.camino[i - 1].z + 1e-12);
  }
});
