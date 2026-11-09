import { ISecureStorage } from '../../../core/storage/ISecureStorage';

/**
 * CQRS - Command de Cierre de Sesión (Escritura / Mutación)
 * Remueve el token JWT del almacenamiento seguro.
 */
export async function ejecutarLogoutCommand(secureStorage: ISecureStorage): Promise<void> {
  await secureStorage.eliminarToken();
}

