import { ISecureStorage } from '../../../core/storage/ISecureStorage';

/**
 * CQRS - Command de Cierre de Sesión (Escritura / Mutación)
 * Borro el token del dispositivo. El usuario puede salir aunque la API esté apagada.
 */
export async function ejecutarLogoutCommand(secureStorage: ISecureStorage): Promise<void> {
  await secureStorage.eliminarToken();
}

