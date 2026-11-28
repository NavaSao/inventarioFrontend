export interface DashboardMetricas {
  readonly cuposTotales: number;
  readonly aplicacionesActivas: number;
  readonly cuposOcupados: number;
  readonly cuposAsignables: number;
  readonly cuposLibres: number;
  readonly porcentajeUso: number;
}

export interface AlertaVencimiento {
  readonly id: string | number;
  readonly software: string;
  readonly diasRestantes: number;
  readonly cupos: number;
  readonly finVigencia: string;
  readonly licenciaId?: string;
}

export interface ActividadReciente {
  readonly id: string | number;
  readonly software: string;
  readonly tipo: 'asignacion' | 'liberacion' | 'vencimiento' | string;
  readonly titulo: string;
  readonly empleado: string;
  readonly fecha: string;
}

export interface DashboardData {
  readonly metricas: DashboardMetricas;
  readonly vencimientosMenos30Dias: AlertaVencimiento[];
  readonly actividadReciente: ActividadReciente[];
}

export type EstadoCargaDashboard = 'cargando' | 'error_conexion' | 'exito';

export interface DashboardAlertsState {
  readonly estadoCarga: EstadoCargaDashboard;
  readonly alertas: AlertaVencimiento[];
  readonly errorMensaje: string | null;
  readonly refrescando: boolean;
}

/**
 * Contrato segregado de solo lectura para alertas del dashboard (ISP / DIP).
 */
export interface IDashboardAlertsReadRepository {
  obtenerAlertasVencimiento(): Promise<AlertaVencimiento[]>;
}
