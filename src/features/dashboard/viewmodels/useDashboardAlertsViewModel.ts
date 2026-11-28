import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertaVencimiento,
  EstadoCargaDashboard,
  IDashboardAlertsReadRepository,
} from '../models/types';
import { GetDashboardAlertsQuery } from '../queries/GetDashboardAlertsQuery';
import {
  GetDashboardAlertsQueryHandler,
  IGetDashboardAlertsQueryHandler,
} from '../queries/GetDashboardAlertsQueryHandler';

export interface UseDashboardAlertsViewModelOptions {
  readonly alertsRepository?: IDashboardAlertsReadRepository;
  readonly queryHandler?: IGetDashboardAlertsQueryHandler;
  readonly onNavigateToLicense?: (licenciaId: string, software?: string) => void;
}

export interface UseDashboardAlertsViewModelReturn {
  readonly estadoCarga: EstadoCargaDashboard;
  readonly cargando: boolean;
  readonly errorConexion: boolean;
  readonly errorMensaje: string | null;
  readonly refrescando: boolean;
  readonly alertas: AlertaVencimiento[];
  readonly onRetry: () => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly onReviewLicense: (alerta: AlertaVencimiento) => void;
}

/**
 * Capa ViewModel (VM) para las Alertas de Vencimiento del Dashboard (HU08).
 * - MVVM estricto: Orquesta la consulta CQRS de solo lectura y gestiona estados reactivos
 *   (cargando, error_conexion, exito) y navegación hacia Detalle de licencia.
 * - DIP: Depende de IDashboardAlertsReadRepository / IGetDashboardAlertsQueryHandler.
 */
export const useDashboardAlertsViewModel = ({
  alertsRepository,
  queryHandler,
  onNavigateToLicense,
}: UseDashboardAlertsViewModelOptions): UseDashboardAlertsViewModelReturn => {
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaDashboard>('cargando');
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [alertas, setAlertas] = useState<AlertaVencimiento[]>([]);

  const handler = useMemo<IGetDashboardAlertsQueryHandler | null>(() => {
    if (queryHandler) {
      return queryHandler;
    }
    if (alertsRepository) {
      return new GetDashboardAlertsQueryHandler(alertsRepository);
    }
    return null;
  }, [alertsRepository, queryHandler]);

  const consultarAlertas = useCallback(async (): Promise<void> => {
    if (!handler) {
      setAlertas([]);
      setErrorMensaje(null);
      setEstadoCarga('exito');
      setRefrescando(false);
      return;
    }

    setEstadoCarga('cargando');
    setErrorMensaje(null);

    try {
      const resultado = await handler.handle(new GetDashboardAlertsQuery());
      setAlertas(resultado);
      setEstadoCarga('exito');
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'No se pudo contactar al servidor. Comprueba tu conexión a internet.';
      setErrorMensaje(mensaje);
      setEstadoCarga('error_conexion');
    } finally {
      setRefrescando(false);
    }
  }, [handler]);

  useEffect(() => {
    void consultarAlertas();
  }, [consultarAlertas]);

  const onRetry = useCallback(async (): Promise<void> => {
    await consultarAlertas();
  }, [consultarAlertas]);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefrescando(true);
    await consultarAlertas();
  }, [consultarAlertas]);

  const onReviewLicense = useCallback(
    (alerta: AlertaVencimiento): void => {
      const licenciaId = alerta.licenciaId || String(alerta.id);
      onNavigateToLicense?.(licenciaId, alerta.software);
    },
    [onNavigateToLicense]
  );

  return {
    estadoCarga,
    cargando: estadoCarga === 'cargando',
    errorConexion: estadoCarga === 'error_conexion',
    errorMensaje,
    refrescando,
    alertas,
    onRetry,
    onRefresh,
    onReviewLicense,
  };
};
