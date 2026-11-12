const AppError = require('../utils/AppError');

const MAX_NUMERO = 43;
const MAX_SUPERBALOTA = 16;

const PREMIOS = {
  '5+1': 'ACUMULADO',
  '5+0': 50000000,
  '4+1': 2000000,
  '4+0': 150000,
  '3+1': 40000,
  '3+0': 12000,
  '2+1': 9000,
  '1+1': 5700,
  '0+1': 5700,
};

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarAleatoria() {
  const numeros = new Set();
  while (numeros.size < 5) numeros.add(aleatorioEntre(1, MAX_NUMERO));
  return {
    numeros: [...numeros].sort((a, b) => a - b),
    superbalota: aleatorioEntre(1, MAX_SUPERBALOTA),
  };
}

/**
 * Valida una jugada de Baloto (5 números de 1 a 43 sin repetir + 1 superbalota
 * de 1 a 16) o genera una jugada aleatoria cuando se solicita.
 *
 * @param {Object|null} jugada - Jugada enviada por el cliente.
 * @param {boolean} [jugada.aleatoria] - Si es `true`, ignora los demás campos
 *        y devuelve una jugada generada aleatoriamente ("Balotazo").
 * @param {number[]} jugada.numeros - Exactamente 5 enteros entre 1 y 43, sin repetir.
 * @param {number} jugada.superbalota - Entero entre 1 y 16.
 * @returns {{numeros: number[], superbalota: number}} Jugada con los números
 *          ordenados de forma ascendente.
 * @throws {AppError} 400 si la cantidad, el rango, los duplicados o la
 *          superbalota no cumplen las reglas.
 *
 * @example
 * validarJugada({ aleatoria: true });
 * // => { numeros: [3, 10, 21, 30, 43], superbalota: 7 } (valores de ejemplo)
 *
 * @example
 * validarJugada({ numeros: [1, 2, 3, 4, 5], superbalota: 6 });
 * // => { numeros: [1, 2, 3, 4, 5], superbalota: 6 }
 */
function validarJugada(jugada) {
  if (jugada && jugada.aleatoria === true) return generarAleatoria();

  const { numeros, superbalota } = jugada || {};
  if (!Array.isArray(numeros) || numeros.length !== 5) {
    throw new AppError('Cada jugada debe tener exactamente 5 números');
  }
  if (!numeros.every((n) => Number.isInteger(n) && n >= 1 && n <= MAX_NUMERO)) {
    throw new AppError(`Los números deben estar entre 1 y ${MAX_NUMERO}`);
  }
  if (new Set(numeros).size !== 5) {
    throw new AppError('Los números de una jugada no se pueden repetir');
  }
  if (!Number.isInteger(superbalota) || superbalota < 1 || superbalota > MAX_SUPERBALOTA) {
    throw new AppError(`La superbalota debe estar entre 1 y ${MAX_SUPERBALOTA}`);
  }
  return { numeros: [...numeros].sort((a, b) => a - b), superbalota };
}

/**
 * Calcula el premio de una jugada de Baloto según la cantidad de números
 * acertados y si la superbalota coincide con la del resultado.
 *
 * Tabla de premios (`PREMIOS`, clave `"<aciertos>+<superbalota>"`):
 * `5+1` paga el ACUMULADO del sorteo; `5+0` → 50.000.000; `4+1` → 2.000.000;
 * `4+0` → 150.000; `3+1` → 40.000; `3+0` → 12.000; `2+1` → 9.000;
 * `1+1` y `0+1` → 5.700 (devuelve la apuesta). Cualquier otra combinación paga 0.
 *
 * @param {{numeros: number[], superbalota: number}} jugada - Jugada validada.
 * @param {{numeros: number[], superbalota: number}} resultado - Resultado oficial del sorteo.
 * @param {number} [acumulado=0] - Acumulado vigente del sorteo (se paga solo en `5+1`).
 * @returns {number} Premio en COP (0 si la jugada no gana nada).
 *
 * @example
 * const resultado = { numeros: [3, 10, 21, 30, 43], superbalota: 7 };
 * calcularPremio({ numeros: [3, 10, 21, 30, 1], superbalota: 7 }, resultado);
 * // => 2000000  (4 aciertos + superbalota)
 */
function calcularPremio(jugada, resultado, acumulado = 0) {
  const aciertos = jugada.numeros.filter((n) => resultado.numeros.includes(n)).length;
  const sb = jugada.superbalota === resultado.superbalota ? 1 : 0;
  const premio = PREMIOS[`${aciertos}+${sb}`];
  if (!premio) return 0;
  return premio === 'ACUMULADO' ? acumulado : premio;
}

module.exports = { validarJugada, calcularPremio, generarAleatoria, PREMIOS };
