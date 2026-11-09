import { HttpError, HttpResponse, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { ejecutarLoginCommand } from '../commands/loginCommand';
import { ejecutarLogoutCommand } from '../commands/logoutCommand';
import { LoginCredentials, SessionUser } from '../models/types';
import { ejecutarValidarSesionQuery } from '../queries/validarSesionQuery';
import { AuthService } from '../services/AuthService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ Falló la prueba: ${message}`);
  }
}

/**
 * Mock de almacenamiento seguro en memoria para pruebas desacopladas (DIP)
 */
class MockSecureStorage implements ISecureStorage {
  private token: string | null = null;

  async guardarToken(token: string): Promise<void> {
    this.token = token;
  }

  async obtenerToken(): Promise<string | null> {
    return this.token;
  }

  async eliminarToken(): Promise<void> {
    this.token = null;
  }
}

/**
 * Mock de cliente HTTP programable para pruebas deterministas
 */
class MockHttpClient implements IHttpClient {
  getHandler?: (url: string, headers?: Record<string, string>) => Promise<HttpResponse<any>>;
  postHandler?: (url: string, body?: unknown, headers?: Record<string, string>) => Promise<HttpResponse<any>>;

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    if (!this.getHandler) throw new Error('getHandler no configurado');
    return this.getHandler(url, headers);
  }

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    if (!this.postHandler) throw new Error('postHandler no configurado');
    return this.postHandler(url, body, headers);
  }
}

export async function correrPruebasIntegracionAuth(): Promise<void> {
  console.log('=== INICIANDO PRUEBAS UNITARIAS DE CQRS Y SERVICIOS AUTH ===\n');

  const baseUrl = 'http://127.0.0.1:3000';

  // ==========================================
  // PRUEBA 1: LoginCommand - Éxito 200
  // ==========================================
  {
    const storage = new MockSecureStorage();
    const httpClient = new MockHttpClient();
    httpClient.postHandler = async (url, body) => {
      assert(url.includes('/api/auth/login'), 'URL incorrecta para login');
      return {
        status: 200,
        ok: true,
        data: { token: 'jwt-token-valido-123' },
      };
    };

    const credentials: LoginCredentials = {
      correo: 'admin@assetops.com',
      password: 'admin-password',
    };

    const token = await ejecutarLoginCommand(credentials, httpClient, storage, baseUrl);
    assert(token === 'jwt-token-valido-123', 'El token devuelto debe coincidir');
    const tokenGuardado = await storage.obtenerToken();
    assert(tokenGuardado === 'jwt-token-valido-123', 'El token debe guardarse en ISecureStorage');
    console.log('✅ Prueba 1 (LoginCommand 200 OK): Token persistido correctamente en storage');
  }

  // ==========================================
  // PRUEBA 2: LoginCommand - Error 400 (Datos faltantes o formato)
  // ==========================================
  {
    const storage = new MockSecureStorage();
    const httpClient = new MockHttpClient();
    httpClient.postHandler = async () => ({
      status: 400,
      ok: false,
      data: { mensaje: 'Revisa el correo y la contraseña' },
    });

    let capturado: HttpError | null = null;
    try {
      await ejecutarLoginCommand({ correo: 'bad', password: '' }, httpClient, storage, baseUrl);
    } catch (err) {
      if (err instanceof HttpError) capturado = err;
    }

    assert(capturado !== null, 'Debe lanzar HttpError ante 400');
    assert(capturado?.status === 400, 'El status debe ser 400');
    assert(capturado?.message === 'Revisa el correo y la contraseña', 'El mensaje debe coincidir');
    console.log('✅ Prueba 2 (LoginCommand 400 Bad Request): Rechaza y mapea mensaje esperado');
  }

  // ==========================================
  // PRUEBA 3: LoginCommand - Error 401 (Acceso inválido)
  // ==========================================
  {
    const storage = new MockSecureStorage();
    const httpClient = new MockHttpClient();
    httpClient.postHandler = async () => ({
      status: 401,
      ok: false,
      data: { mensaje: 'Acceso inválido' },
    });

    let capturado: HttpError | null = null;
    try {
      await ejecutarLoginCommand({ correo: 'user@test.com', password: 'bad' }, httpClient, storage, baseUrl);
    } catch (err) {
      if (err instanceof HttpError) capturado = err;
    }

    assert(capturado !== null, 'Debe lanzar HttpError ante 401');
    assert(capturado?.status === 401, 'El status debe ser 401');
    assert(capturado?.message === 'Acceso inválido', 'El mensaje debe coincidir');
    console.log('✅ Prueba 3 (LoginCommand 401 Unauthorized): Rechaza con "Acceso inválido"');
  }

  // ==========================================
  // PRUEBA 4: ValidarSesionQuery - Éxito 200
  // ==========================================
  {
    const storage = new MockSecureStorage();
    await storage.guardarToken('jwt-existente');
    const httpClient = new MockHttpClient();

    httpClient.getHandler = async (url, headers) => {
      assert(headers?.Authorization === 'Bearer jwt-existente', 'Debe incluir header Authorization Bearer');
      return {
        status: 200,
        ok: true,
        data: {
          idUsuario: 'user-001',
          nombre: 'Diana Administradora',
          correo: 'diana@assetops.com',
        },
      };
    };

    const usuario = await ejecutarValidarSesionQuery(httpClient, storage, baseUrl);
    assert(usuario !== null, 'Debe retornar los datos del usuario');
    assert(usuario?.idUsuario === 'user-001', 'idUsuario debe coincidir');
    assert(usuario?.nombre === 'Diana Administradora', 'Nombre debe coincidir');
    console.log('✅ Prueba 4 (ValidarSesionQuery 200 OK): Sesión recuperada exitosamente');
  }

  // ==========================================
  // PRUEBA 5: ValidarSesionQuery - 401 Unauthorized (Token expirado/revocado)
  // ==========================================
  {
    const storage = new MockSecureStorage();
    await storage.guardarToken('jwt-expirado');
    const httpClient = new MockHttpClient();

    httpClient.getHandler = async () => ({
      status: 401,
      ok: false,
      data: { mensaje: 'Sesión expirada' },
    });

    const usuario = await ejecutarValidarSesionQuery(httpClient, storage, baseUrl);
    assert(usuario === null, 'Debe retornar null ante 401');
    const tokenRestante = await storage.obtenerToken();
    assert(tokenRestante === null, 'REGLA: Ante 401 el token DEBE ser eliminado del storage');
    console.log('✅ Prueba 5 (ValidarSesionQuery 401): Token eliminado del storage y redirige a login');
  }

  // ==========================================
  // PRUEBA 6: ValidarSesionQuery - Fallo de red (Servidor caído / Sin conexión)
  // ==========================================
  {
    const storage = new MockSecureStorage();
    await storage.guardarToken('jwt-guardado-offline');
    const httpClient = new MockHttpClient();

    httpClient.getHandler = async () => {
      throw new NetworkError('Fallo de conexión. Reintentar');
    };

    let lanzoNetworkError = false;
    try {
      await ejecutarValidarSesionQuery(httpClient, storage, baseUrl);
    } catch (err) {
      if (err instanceof NetworkError) lanzoNetworkError = true;
    }

    assert(lanzoNetworkError, 'Debe propagar NetworkError ante desconexión');
    const tokenConservado = await storage.obtenerToken();
    assert(
      tokenConservado === 'jwt-guardado-offline',
      'REGLA CRÍTICA: Ante error de red el token se CONSERVA en storage para reintentar'
    );
    console.log('✅ Prueba 6 (ValidarSesionQuery Red Caída): Token CONSERVADO en storage y permite reintento');
  }

  // ==========================================
  // PRUEBA 7: LogoutCommand
  // ==========================================
  {
    const storage = new MockSecureStorage();
    await storage.guardarToken('jwt-activo');
    await ejecutarLogoutCommand(storage);
    const token = await storage.obtenerToken();
    assert(token === null, 'El token debe ser null tras logout');
    console.log('✅ Prueba 7 (LogoutCommand): Cierre de sesión y limpieza de storage exitosa');
  }

  // ==========================================
  // PRUEBA 8: AuthService (Orquestador integrado)
  // ==========================================
  {
    const storage = new MockSecureStorage();
    const httpClient = new MockHttpClient();

    httpClient.postHandler = async () => ({
      status: 200,
      ok: true,
      data: { token: 'token-orquestador' },
    });

    httpClient.getHandler = async () => ({
      status: 200,
      ok: true,
      data: { idUsuario: 'u-1', nombre: 'Test', correo: 'test@mail.com' },
    });

    const authService = new AuthService(httpClient, storage, baseUrl);

    await authService.login({ correo: 'test@mail.com', password: '123' });
    const token = await authService.obtenerTokenActual();
    assert(token === 'token-orquestador', 'AuthService.login debe persistir el token');

    const user = await authService.validarSesion();
    assert(user?.idUsuario === 'u-1', 'AuthService.validarSesion debe recuperar el usuario');

    await authService.logout();
    const tokenPostLogout = await authService.obtenerTokenActual();
    assert(tokenPostLogout === null, 'AuthService.logout debe limpiar el token');
    console.log('✅ Prueba 8 (AuthService Integrado): Flujo completo de orquestación verificado\n');
  }

  console.log('🎉 TODAS LAS PRUEBAS UNITARIAS DE CQRS, SOLID Y CASOS DE USO PASARON AL 100%');
}

correrPruebasIntegracionAuth();

