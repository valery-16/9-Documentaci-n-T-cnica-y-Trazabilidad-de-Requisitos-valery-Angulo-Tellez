const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../data/store');
const { jwtSecret, jwtExpiresIn } = require('../config');
const AppError = require('../utils/AppError');

/**
 * Autentica a un usuario contra el almacén de datos y genera un token JWT
 * firmado con el rol y el identificador del usuario.
 *
 * Flujo de validación:
 * 1. Verifica que lleguen usuario y contraseña.
 * 2. Compara la contraseña contra el hash bcrypt almacenado.
 * 3. Verifica que la cuenta esté activa.
 *
 * @param {string} usuario - Nombre de usuario del operario (p. ej. `vendedor1`).
 * @param {string} password - Contraseña en texto plano enviada por el cliente.
 * @returns {{token: string, usuario: {id: number, usuario: string, nombre: string, rol: string}}}
 *          Token JWT firmado y el perfil público (sin datos sensibles).
 * @throws {AppError} 400 si falta el usuario o la contraseña.
 * @throws {AppError} 401 si las credenciales no coinciden.
 * @throws {AppError} 403 si la cuenta está inactiva.
 *
 * @example
 * const { token, usuario } = login('vendedor1', 'vende123');
 * // => { token: 'eyJhbGciOi...', usuario: { rol: 'VENDEDOR', ... } }
 */
function login(usuario, password) {
  if (!usuario || !password) throw new AppError('Usuario y contraseña son obligatorios');

  const encontrado = getDb().usuarios.find((u) => u.usuario === usuario);
  if (!encontrado || !bcrypt.compareSync(password, encontrado.password)) {
    throw new AppError('Credenciales inválidas', 401);
  }
  if (!encontrado.activo) throw new AppError('Usuario inactivo', 403);

  const token = jwt.sign({ id: encontrado.id, rol: encontrado.rol }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token, usuario: perfil(encontrado) };
}

function perfil(u) {
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
}

function buscarPorId(id) {
  return getDb().usuarios.find((u) => u.id === id);
}

module.exports = { login, perfil, buscarPorId };
