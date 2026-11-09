/**
 * Capa Model (M - Dominio y Contratos)
 * Aplica SRP (Single Responsibility Principle) e ISP (Interface Segregation Principle):
 * Define contratos puros e inmutables sin acoplamiento a estado reactivo ni UI.
 */

export interface LoginCredentials {
  readonly correo: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly token: string;
}

export interface SessionUser {
  readonly idUsuario: string;
  readonly nombre: string;
  readonly correo: string;
}

export interface ApiErrorResponse {
  readonly mensaje: string;
}

export type SessionState =
  | { readonly status: 'cargando' }
  | { readonly status: 'autenticado'; readonly usuario: SessionUser }
  | { readonly status: 'no_autenticado' }
  | { readonly status: 'fallo_conexion'; readonly mensaje: string };

/**
 * ISP: Segregación de interfaz para operaciones de Login (Command)
 */
export interface ILoginService {
  login(credentials: LoginCredentials): Promise<void>;
}

/**
 * ISP: Segregación de interfaz para operaciones de Sesión (Query / Lifecycle)
 */
export interface ISessionService {
  validarSesion(): Promise<SessionUser | null>;
  logout(): Promise<void>;
  obtenerTokenActual(): Promise<string | null>;
}

/**
 * Contrato de Autenticación compatible con casos de uso desacoplados.
 * Mantiene compatibilidad directa con pruebas de Login previas.
 */
export interface IAuthService extends ILoginService {
  login(credentials: LoginCredentials): Promise<void>;
  validarSesion?(): Promise<SessionUser | null>;
  logout?(): Promise<void>;
  obtenerTokenActual?(): Promise<string | null>;
}
