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

export type ActivosPorEstado = Readonly<Record<'DISPONIBLE' | 'ASIGNADO' | 'EN_MANTENIMIENTO' | 'DADO_DE_BAJA', number>>;

export interface DashboardData {
  readonly activosPorEstado: ActivosPorEstado;
  readonly metricas: DashboardMetricas;
  readonly vencimientosMenos30Dias: AlertaVencimiento[];
  readonly actividadReciente: ActividadReciente[];
}
