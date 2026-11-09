import { IHttpClient } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { ejecutarLoginCommand } from '../commands/loginCommand';
import { ejecutarLogoutCommand } from '../commands/logoutCommand';
import { IAuthService, LoginCredentials, SessionUser } from '../models/types';
import { ejecutarValidarSesionQuery } from '../queries/validarSesionQuery';

/**
 * Servicio de Autenticación (Orquestador de Casos de Uso CQRS)
 * Cumple con SRP (orquesta flujos de auth) y DIP (recibe IHttpClient e ISecureStorage).
 */
export class AuthService implements IAuthService {
  private readonly httpClient: IHttpClient;
  private readonly secureStorage: ISecureStorage;
  private readonly baseUrl: string;

  constructor(httpClient: IHttpClient, secureStorage: ISecureStorage, baseUrl: string) {
    this.httpClient = httpClient;
    this.secureStorage = secureStorage;
    this.baseUrl = baseUrl;
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await ejecutarLoginCommand(credentials, this.httpClient, this.secureStorage, this.baseUrl);
  }

  async validarSesion(): Promise<SessionUser | null> {
    return ejecutarValidarSesionQuery(this.httpClient, this.secureStorage, this.baseUrl);
  }

  async logout(): Promise<void> {
    await ejecutarLogoutCommand(this.secureStorage);
  }

  async obtenerTokenActual(): Promise<string | null> {
    return this.secureStorage.obtenerToken();
  }
}
