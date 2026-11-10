import { useCallback, useState } from 'react';
import { NetworkError } from '../../../core/network/IHttpClient';
import { ILoginService, LoginCredentials } from '../models/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Servicio por defecto para desarrollo o pruebas aisladas.
 * Cumple el contrato ILoginService (DIP / LSP / ISP).
 */
export const defaultAuthService: ILoginService = {
  async login(): Promise<void> {
    // El formulario aislado puede simular el envío sin registrar credenciales.
  },
};

export interface UseLoginViewModelReturn {
  readonly correo: string;
  readonly password: string;
  readonly mostrarPassword: boolean;
  readonly cargando: boolean;
  readonly errorMensaje: string | null;
  readonly puedeReintentar: boolean;
  readonly setCorreo: (valor: string) => void;
  readonly setPassword: (valor: string) => void;
  readonly toggleMostrarPassword: () => void;
  readonly ejecutarLogin: () => Promise<void>;
}

/**
 * Capa ViewModel (VM - Lógica de Presentación de Login)
 * - SRP: Gestiona exclusivamente estado de formulario, validaciones y ciclo de vida de envío.
 * - DIP / ISP: Depende de la abstracción segregada `ILoginService` inyectada por parámetro.
 */
export const useLoginViewModel = (
  authService: ILoginService = defaultAuthService,
  onLoginExitoso?: () => void
): UseLoginViewModelReturn => {
  const [correo, setCorreoState] = useState<string>('');
  const [password, setPasswordState] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorLogin, setErrorLogin] = useState<Error | null>(null);

  const setCorreo = useCallback((valor: string): void => {
    setCorreoState(valor);
    setErrorLogin(null);
  }, []);

  const setPassword = useCallback((valor: string): void => {
    setPasswordState(valor);
    setErrorLogin(null);
  }, []);

  const toggleMostrarPassword = useCallback((): void => {
    setMostrarPassword((prev) => !prev);
  }, []);

  const ejecutarLogin = useCallback(async (): Promise<void> => {
    if (cargando) {
      return;
    }

    setErrorLogin(null);

    const correoLimpio = correo.trim();
    const passwordLimpia = password.trim();

    // Regla 1: Campos obligatorios
    if (!correoLimpio || !passwordLimpia) {
      setErrorLogin(new Error('Por favor ingresa tu correo y contraseña.'));
      return;
    }

    // Regla 2: Validación de formato de correo electrónico
    if (!EMAIL_REGEX.test(correoLimpio)) {
      setErrorLogin(new Error('Ingresa un formato de correo electrónico válido.'));
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
      onLoginExitoso?.();
    } catch (error: unknown) {
      // Guardo el error original para ofrecer reintento cuando falla la conexión.
      setErrorLogin(
        error instanceof Error && error.message.trim().length > 0
          ? error
          : new Error('Ocurrió un error al intentar iniciar sesión.')
      );
    } finally {
      setCargando(false);
    }
  }, [authService, cargando, correo, onLoginExitoso, password]);

  return {
    correo,
    password,
    mostrarPassword,
    cargando,
    errorMensaje: errorLogin?.message ?? null,
    puedeReintentar: errorLogin instanceof NetworkError,
    setCorreo,
    setPassword,
    toggleMostrarPassword,
    ejecutarLogin,
  };
};
