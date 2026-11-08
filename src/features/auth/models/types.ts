/**
 * Capa Model (M - Dominio y Contratos)
 * Aplica SRP (Single Responsibility Principle) e ISP (Interface Segregation Principle):
 * Define contratos puros e inmutables sin acoplamiento a estado reactivo ni UI.
 */

export interface LoginCredentials {
  readonly correo: string;
  readonly password: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<void>;
}

