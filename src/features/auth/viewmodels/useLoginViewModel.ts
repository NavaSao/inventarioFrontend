import { useCallback, useState } from 'react';
import { IAuthService, LoginCredentials } from '../models/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Servicio por defecto para desarrollo e integración inicial con el endpoint de Diana.
 * Cumple el contrato IAuthService (DIP / LSP).
 */
export const defaultAuthService: IAuthService = {
  async login(credentials: LoginCredentials): Promise<void> {
    console.log('[AssetOps Auth] Payload listo para enviar a API:', credentials);
  },
};

export interface UseLoginViewModelReturn {
  readonly correo: string;
  readonly password: string;
  readonly mostrarPassword: boolean;
  readonly cargando: boolean;
  readonly errorMensaje: string | null;
  readonly setCorreo: (valor: string) => void;
  readonly setPassword: (valor: string) => void;
  readonly toggleMostrarPassword: () => void;
  readonly ejecutarLogin: () => Promise<void>;
}

/**
 * Capa ViewModel (VM - Lógica de Presentación)
 * - SRP: Gestiona exclusivamente estado de formulario, validaciones y ciclo de vida de envío.
 * - DIP: Depende de la abstracción `IAuthService` inyectada por parámetro.
 */
export const useLoginViewModel = (
  authService: IAuthService = defaultAuthService
): UseLoginViewModelReturn => {
  const [correo, setCorreoState] = useState<string>('');
  const [password, setPasswordState] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const setCorreo = useCallback((valor: string): void => {
    setCorreoState(valor);
    setErrorMensaje(null);
  }, []);

  const setPassword = useCallback((valor: string): void => {
    setPasswordState(valor);
    setErrorMensaje(null);
  }, []);

  const toggleMostrarPassword = useCallback((): void => {
    setMostrarPassword((prev) => !prev);
  }, []);

  const ejecutarLogin = useCallback(async (): Promise<void> => {
    if (cargando) {
      return;
    }

    setErrorMensaje(null);

    const correoLimpio = correo.trim();
    const passwordLimpia = password.trim();

    // Regla 1: Campos obligatorios
    if (!correoLimpio || !passwordLimpia) {
      setErrorMensaje('Por favor ingresa tu correo y contraseña.');
      return;
    }

    // Regla 2: Validación de formato de correo electrónico
    if (!EMAIL_REGEX.test(correoLimpio)) {
      setErrorMensaje('Ingresa un formato de correo electrónico válido.');
      return;
    }

    // Regla 3: Normalización del payload antes del despacho
    const payloadNormalizado: LoginCredentials = Object.freeze({
      correo: correoLimpio.toLowerCase(),
      password,
    });

    try {
      setCargando(true);
      await authService.login(payloadNormalizado);
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Ocurrió un error al intentar iniciar sesión.';
      setErrorMensaje(mensaje);
    } finally {
      setCargando(false);
    }
  }, [authService, cargando, correo, password]);

  return {
    correo,
    password,
    mostrarPassword,
    cargando,
    errorMensaje,
    setCorreo,
    setPassword,
    toggleMostrarPassword,
    ejecutarLogin,
  };
};
