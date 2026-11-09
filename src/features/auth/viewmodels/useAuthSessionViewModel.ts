import { useCallback, useEffect, useState } from 'react';
import { NetworkError } from '../../../core/network/IHttpClient';
import { ISessionService, SessionState, SessionUser } from '../models/types';

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

  const verificarSesion = useCallback(async (): Promise<void> => {
    setSessionState({ status: 'cargando' });
    try {
      const usuario: SessionUser | null = await authService.validarSesion();
      if (usuario) {
        setSessionState({ status: 'autenticado', usuario });
      } else {
        setSessionState({ status: 'no_autenticado' });
      }
    } catch (error: unknown) {
      if (error instanceof NetworkError) {
        // Fallo de red: el token se conserva en storage y se permite reintentar
        setSessionState({
          status: 'fallo_conexion',
          mensaje: error.message || 'Fallo de conexión. Reintentar',
        });
        return;
      }

      // Cualquier otro error inesperado muestra fallback
      setSessionState({
        status: 'fallo_conexion',
        mensaje: 'Fallo de conexión. Reintentar',
      });
    }
  }, [authService]);

  useEffect(() => {
    void verificarSesion();
  }, [verificarSesion]);

  const reintentarValidacion = useCallback(async (): Promise<void> => {
    await verificarSesion();
  }, [verificarSesion]);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setSessionState({ status: 'no_autenticado' });
    }
  }, [authService]);

  const notificarLoginExitoso = useCallback(async (): Promise<void> => {
    await verificarSesion();
  }, [verificarSesion]);

  return {
    sessionState,
    reintentarValidacion,
    cerrarSesion,
    notificarLoginExitoso,
  };
};
