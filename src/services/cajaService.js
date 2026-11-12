const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const { fechaLocal } = require('../utils/fechas');

function resumen(vendedorId, fecha = fechaLocal()) {
  const db = getDb();
  const delDia = (iso) => fechaLocal(iso) === fecha;

  const tickets = db.tickets.filter((t) => t.vendedorId === vendedorId && delDia(t.creadoEn));
  const validos = tickets.filter((t) => t.estado !== 'ANULADO');
  const pagos = db.pagos.filter((p) => p.usuarioId === vendedorId && delDia(p.fecha));

  const totalVendido = validos.reduce((s, t) => s + t.total, 0);
  const totalPagado = pagos.reduce((s, p) => s + p.valor, 0);

  return {
    vendedorId,
    fecha,
    tiquetesVendidos: validos.length,
    tiquetesAnulados: tickets.length - validos.length,
    ventasChance: validos.filter((t) => t.tipo === 'CHANCE').reduce((s, t) => s + t.total, 0),
    ventasBaloto: validos.filter((t) => t.tipo === 'BALOTO').reduce((s, t) => s + t.total, 0),
    totalVendido,
    premiosPagados: pagos.length,
    totalPagado,
    saldoEsperado: totalVendido - totalPagado,
    cerrada: db.cierres.some((c) => c.vendedorId === vendedorId && c.fecha === fecha),
  };
}

/**
 * Realiza el cierre de caja del día para un vendedor y determina si la caja
 * quedó cuadrada, con sobrante o con faltante.
 *
 * Flujo:
 * 1. Valida que `efectivoReportado` sea un entero positivo.
 * 2. Calcula el resumen del día (usa la fecha local del servidor si no se
 *    indica otra).
 * 3. Impide un segundo cierre para la misma caja/fecha (409).
 * 4. Compara el efectivo reportado contra el `saldoEsperado`
 *    (`totalVendido − totalPagado`) y registra el `cierre` con su `diferencia`
 *    y `estado` resultante: `CUADRADA`, `SOBRANTE` o `FALTANTE`.
 *
 * @param {number} vendedorId - Identificador del vendedor dueño de la caja.
 * @param {Object} datos - Datos del cierre.
 * @param {number} datos.efectivoReportado - Efectivo contado por el vendedor (COP).
 * @param {string} [datos.fecha] - Fecha del cierre en formato `YYYY-MM-DD`
 *        (por defecto, la fecha local actual).
 * @returns {Object} Registro de cierre (`diferencia`, `estado`, resumen del día).
 * @throws {AppError} 400 si el efectivo reportado no es un entero positivo.
 * @throws {AppError} 409 si la caja de ese día ya fue cerrada.
 *
 * @example
 * cerrar(2, { efectivoReportado: 10700 });
 * // => { vendedorId: 2, saldoEsperado: 10700, diferencia: 0, estado: 'CUADRADA', ... }
 */
function cerrar(vendedorId, { efectivoReportado, fecha = fechaLocal() }) {
  if (!Number.isInteger(efectivoReportado) || efectivoReportado < 0) {
    throw new AppError('El efectivo reportado debe ser un entero positivo');
  }
  const r = resumen(vendedorId, fecha);
  if (r.cerrada) throw new AppError('La caja de ese día ya fue cerrada', 409);

  const diferencia = efectivoReportado - r.saldoEsperado;
  const cierre = {
    id: nextId('cierres'),
    ...r,
    cerrada: true,
    efectivoReportado,
    diferencia,
    estado: diferencia === 0 ? 'CUADRADA' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE',
    creadoEn: new Date().toISOString(),
  };
  getDb().cierres.push(cierre);
  return cierre;
}

module.exports = { resumen, cerrar };
