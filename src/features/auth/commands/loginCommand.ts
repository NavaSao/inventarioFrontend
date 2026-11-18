import { HttpError, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { leerRespuestaAuth } from '../models/respuestaAuth';
import type { LoginCredentials } from '../models/types';

/**
 * CQRS - Command de Inicio de Sesión (Escritura / Mutación)
 * - Envía credenciales al backend mediante POST /api/auth/login.
 * - Si es exitoso (200), persiste de forma segura el JWT en ISecureStorage.
 * - Mapea respuestas 400 y 401 con mensajes amigables según el contrato de la API.
 */
export async function ejecutarLoginCommand(
  credentials: LoginCredentials,
  httpClient: IHttpClient,
  secureStorage: ISecureStorage,
  baseUrl: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/auth/login`;

  try {
    const response = await httpClient.post<unknown>(url, credentials);
    const { datos, mensaje } = leerRespuestaAuth(response.data);

    if (response.status === 200 && typeof datos === 'object' && datos !== null
        && 'token' in datos && typeof datos.token === 'string' && datos.token) {
      await secureStorage.guardarToken(datos.token);
      return datos.token;
    }

    if (response.status === 400) {
      throw new HttpError(400, mensaje || 'Revisa el correo y la contraseña', response.data);
    }

    if (response.status === 401) {
      // En el formulario mostramos el mismo mensaje para cualquier rechazo de credenciales.
      throw new HttpError(401, 'Credenciales incorrectas', response.data);
    }

    throw new HttpError(response.status, mensaje || 'No se pudo procesar la solicitud', response.data);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof NetworkError) {
      throw error;
    }
    throw new NetworkError('Fallo de conexión. Reintentar');
  }
}

