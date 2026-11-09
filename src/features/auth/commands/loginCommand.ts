import { HttpError, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { ApiErrorResponse, LoginCredentials, LoginResponse } from '../models/types';

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
    const response = await httpClient.post<LoginResponse | ApiErrorResponse>(url, credentials);

    if (response.status === 200 && 'token' in (response.data as LoginResponse)) {
      const { token } = response.data as LoginResponse;
      await secureStorage.guardarToken(token);
      return token;
    }

    if (response.status === 400) {
      const mensaje =
        'mensaje' in (response.data as ApiErrorResponse)
          ? (response.data as ApiErrorResponse).mensaje
          : 'Revisa el correo y la contraseña';
      throw new HttpError(400, mensaje || 'Revisa el correo y la contraseña', response.data);
    }

    if (response.status === 401) {
      const mensaje =
        'mensaje' in (response.data as ApiErrorResponse)
          ? (response.data as ApiErrorResponse).mensaje
          : 'Acceso inválido';
      throw new HttpError(401, mensaje || 'Acceso inválido', response.data);
    }

    // Otro código de error HTTP
    const mensajeError =
      'mensaje' in (response.data as ApiErrorResponse)
        ? (response.data as ApiErrorResponse).mensaje
        : 'No se pudo procesar la solicitud';
    throw new HttpError(response.status, mensajeError || 'No se pudo procesar la solicitud', response.data);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof NetworkError) {
      throw error;
    }
    throw new NetworkError('Fallo de conexión. Reintentar');
  }
}

