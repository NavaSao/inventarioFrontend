import { useCallback, useEffect, useState } from 'react';
import { Licencia } from '../../licencias/models/types';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { DashboardData, EstadoCargaDashboard } from '../models/types';
import { DASHBOARD_VACIO, DashboardService } from '../services/DashboardService';

export interface UseDashboardResumenViewModelReturn {
  readonly estadoCarga: EstadoCargaDashboard;
  readonly errorMensaje: string | null;
  readonly refrescando: boolean;
  readonly datos: DashboardData;
  readonly licencias: Licencia[];
  readonly recargar: () => Promise<void>;
  readonly refrescar: () => Promise<void>;
}

/**
 * ViewModel para métricas, gráfico y actividad reciente del Dashboard (HU08).
 * Mantiene la Vista libre de llamadas HTTP y bloques try/catch de red.
 */
export const useDashboardResumenViewModel = (
  dashboardService?: DashboardService,
  licenciasService?: LicenciasService
): UseDashboardResumenViewModelReturn => {
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaDashboard>('cargando');
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [datos, setDatos] = useState<DashboardData>(DASHBOARD_VACIO);
  const [licencias, setLicencias] = useState<Licencia[]>([]);

  const cargarResumen = useCallback(async (): Promise<void> => {
    if (!dashboardService) {
      setEstadoCarga('exito');
      setRefrescando(false);
      return;
    }

    setEstadoCarga('cargando');
    setErrorMensaje(null);

    try {
      const [data, licenciasReales] = await Promise.all([
        dashboardService.obtenerDashboard(),
        licenciasService ? licenciasService.obtenerLicencias().catch(() => []) : Promise.resolve([]),
      ]);
      setDatos(data);
      setLicencias(licenciasReales);
      setEstadoCarga('exito');
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : 'No se pudo contactar al servidor.';
      setErrorMensaje(mensaje);
      setEstadoCarga('error_conexion');
    } finally {
      setRefrescando(false);
    }
  }, [dashboardService, licenciasService]);

  useEffect(() => {
    void cargarResumen();
  }, [cargarResumen]);

  const refrescar = useCallback(async (): Promise<void> => {
    setRefrescando(true);
    await cargarResumen();
  }, [cargarResumen]);

  return {
    estadoCarga,
    errorMensaje,
    refrescando,
    datos,
    licencias,
    recargar: cargarResumen,
    refrescar,
  };
};
