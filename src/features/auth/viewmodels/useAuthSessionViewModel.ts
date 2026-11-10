import { useCallback, useEffect, useState } from 'react';
import { NetworkError } from '../../../core/network/IHttpClient';
import { ISessionService, SessionState } from '../models/types';

export interface UseAuthSessionViewModelReturn {
  readonly sessionState: SessionState;
  readonly reintentarValidacion: () => Promise<void>;
  readonly cerrarSesion: () => Promise<void>;
  readonly notificarLoginExitoso: () => Promise<void>;
}

/**
 * ViewModel para la gestión del ciclo de vida de la sesión (MVVM)
 * - SRP: Controla el estado reactivo de sesión (cargando, autenticado, no_autenticado, fallo_conexion).
 * - DIP / ISP: Depende de ISessionService.
 * - Regla: Al abrir la app, valida la persistencia del token con SecureStore y el backend.
 */
export const useAuthSessionViewModel = (authService: ISessionService): UseAuthSessionViewModelReturn => {
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'cargando' });

  const verificarSesion = useCallback((): Promise<void> => {
    return authService.validarSesion().then(
      (usuario) => {
        setSessionState(usuario ? { status: 'autenticado', usuario } : { status: 'no_autenticado' });
      },
      (error: unknown) => {
        // Si la consulta falla, conservo el token para poder reintentar.
        setSessionState({
          status: 'fallo_conexion',
          mensaje: (error instanceof NetworkError && error.message) || 'Fallo de conexión. Reintentar',
        });
      }
    );
  }, [authService]);

  useEffect(() => {
    void verificarSesion();
  }, [verificarSesion]);

  const volverAValidarSesion = useCallback(async (): Promise<void> => {
    // Al reintentar o después de entrar, muestro la carga mientras confirmo la sesión.
    setSessionState({ status: 'cargando' });
    await verificarSesion();
  }, [verificarSesion]);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setSessionState({ status: 'no_autenticado' });
    }
  }, [authService]);

  return {
    sessionState,
    reintentarValidacion: volverAValidarSesion,
    cerrarSesion,
    notificarLoginExitoso: volverAValidarSesion,
  };
};
