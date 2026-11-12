const AppError = require('../utils/AppError');
const { apuestaMinChance, apuestaMaxChance } = require('../config');

const TABLA_PAGOS = { 4: 4500, 3: 400, 2: 50, 1: 5 };
const MODALIDADES = ['DIRECTO', 'COMBINADO'];

function permutaciones(numero) {
  if (numero.length <= 1) return new Set([numero]);
  const resultado = new Set();
  [...numero].forEach((digito, i) => {
    const resto = numero.slice(0, i) + numero.slice(i + 1);
    permutaciones(resto).forEach((p) => resultado.add(digito + p));
  });
  return resultado;
}

/**
 * Valida una apuesta individual de chance contra las reglas del negocio.
 *
 * Reglas aplicadas (en orden):
 * - `numero`: cadena de 1 a 4 dígitos numéricos.
 * - `modalidad`: `DIRECTO` (por defecto) o `COMBINADO`.
 * - `COMBINADO` exige al menos 3 cifras y que no todas sean iguales
 *   (un número con cifras repetidas no tiene permutaciones válidas).
 * - `valor`: entero entre `APUESTA_MIN_CHANCE` y `APUESTA_MAX_CHANCE`
 *   (configurables por variables de entorno) y múltiplo de 100.
 *
 * @param {Object} apuesta - Datos de la apuesta recibida en la venta.
 * @param {string} apuesta.numero - Número jugado de 1 a 4 dígitos (p. ej. `"1234"`).
 * @param {('DIRECTO'|'COMBINADO')} [apuesta.modalidad='DIRECTO'] - Tipo de apuesta.
 * @param {number} apuesta.valor - Valor apostado en COP (múltiplo de 100).
 * @returns {{numero: string, cifras: number, modalidad: string, valor: number}}
 *          Apuesta normalizada; `cifras` deriva de la longitud de `numero`.
 * @throws {AppError} 400 si cualquiera de las reglas anteriores se incumple.
 *
 * @example
 * validarApuesta({ numero: '1234', valor: 2000 });
 * // => { numero: '1234', cifras: 4, modalidad: 'DIRECTO', valor: 2000 }
 */
function validarApuesta(apuesta) {
  const { numero, modalidad = 'DIRECTO', valor } = apuesta || {};

  if (typeof numero !== 'string' || !/^\d{1,4}$/.test(numero)) {
    throw new AppError('El número debe tener entre 1 y 4 dígitos');
  }
  if (!MODALIDADES.includes(modalidad)) {
    throw new AppError(`Modalidad inválida: ${modalidad}`);
  }
  if (modalidad === 'COMBINADO' && numero.length < 3) {
    throw new AppError('La modalidad COMBINADO solo aplica para 3 o 4 cifras');
  }
  if (modalidad === 'COMBINADO' && permutaciones(numero).size === 1) {
    throw new AppError('Un número con todas las cifras iguales no se puede combinar');
  }
  if (!Number.isInteger(valor) || valor < apuestaMinChance || valor > apuestaMaxChance) {
    throw new AppError(`El valor debe estar entre ${apuestaMinChance} y ${apuestaMaxChance}`);
  }
  if (valor % 100 !== 0) {
    throw new AppError('El valor debe ser múltiplo de 100');
  }

  return { numero, cifras: numero.length, modalidad, valor };
}

/**
 * Calcula el premio de una apuesta de chance ya validada dado el resultado
 * oficial del sorteo (número de 4 dígitos).
 *
 * El número ganador se obtiene comparando las últimas `cifras` posiciones del
 * resultado con el número jugado:
 * - **DIRECTO**: gana solo si coincide exactamente; el premio es
 *   `valor × multiplicador` según la tabla `TABLA_PAGOS` (4→4500, 3→400,
 *   2→50, 1→5).
 * - **COMBINADO**: gana si el resultado termina en cualquiera de las
 *   permutaciones del número; el premio se reparte entre todas las
 *   permutaciones (`valor × factor / nº de permutaciones`, redondeado
 *   hacia abajo).
 *
 * @param {{numero: string, cifras: number, modalidad: 'DIRECTO'|'COMBINADO', valor: number}} apuesta
 *        Apuesta normalizada retornada por {@link validarApuesta}.
 * @param {string} resultado - Resultado oficial del sorteo (4 dígitos).
 * @returns {number} Premio en COP (0 si la apuesta no ganó).
 *
 * @example
 * calcularPremio({ numero: '1234', cifras: 4, modalidad: 'DIRECTO', valor: 1000 }, '1234');
 * // => 4500000
 *
 * @example
 * // Combinado '123' (6 permutaciones) con apuesta de 600:
 * calcularPremio({ numero: '123', cifras: 3, modalidad: 'COMBINADO', valor: 600 }, '9321');
 * // => 40000  (600 × 400 / 6)
 */
function calcularPremio(apuesta, resultado) {
  const ganador = resultado.slice(-apuesta.cifras);
  const factor = TABLA_PAGOS[apuesta.cifras];

  if (apuesta.modalidad === 'DIRECTO') {
    return apuesta.numero === ganador ? apuesta.valor * factor : 0;
  }

  const combinaciones = permutaciones(apuesta.numero);
  if (!combinaciones.has(ganador)) return 0;
  return Math.floor((apuesta.valor * factor) / combinaciones.size);
}

function validarResultado(resultado) {
  if (typeof resultado !== 'string' || !/^\d{4}$/.test(resultado)) {
    throw new AppError('El resultado de chance debe ser un número de 4 dígitos');
  }
  return resultado;
}

module.exports = { validarApuesta, calcularPremio, validarResultado, permutaciones, TABLA_PAGOS };
