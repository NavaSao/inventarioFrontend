export type EstadoLicencia = 'vigente' | 'por_vencer' | 'vencida';
export type FiltroPestana = 'todas' | 'vigente' | 'por_vencer' | 'vencida';

export interface Licencia {
  readonly id: string;
  readonly codigoLicencia: string;
  readonly software: string;
  readonly plan: string;
  readonly estado: EstadoLicencia;
  readonly cuposContratados: number;
  readonly cuposAsignados: number;
  readonly inicioVigencia: string;
  readonly finVigencia: string;
  readonly periodicidad: string;
  readonly proveedor?: string;
  readonly referenciaContrato?: string;
  readonly costo?: number;
  readonly moneda?: string;
}

export interface NuevaLicenciaDTO {
  readonly codigoLicencia: string;
  readonly software: string;
  readonly plan: string;
  readonly periodicidad: string;
  readonly inicioVigencia: string;
  readonly finVigencia: string;
  readonly cuposContratados: number;
  readonly proveedor?: string;
  readonly referenciaContrato?: string;
  readonly costo?: number;
  readonly moneda?: string;
}

/** Empleado con un cupo abierto de la licencia (HU05 · Escenario 05.03). */
export interface EmpleadoAsignado {
  readonly idAsignacionLicencia: string;
  readonly asignadoEn: string;
  readonly idEmpleado: string;
  readonly numeroEmpleado: string;
  readonly nombre: string;
  readonly departamento: string | null;
}

/** Ficha completa de una licencia: vigencia, cupos y ocupación. */
export interface LicenciaDetalle extends Licencia {
  readonly cuposLibres: number;
  readonly cuposAsignables: number;
  readonly porcentajeOcupacion: number;
  readonly diasParaVencer: number;
  readonly empleadosAsignados: EmpleadoAsignado[];
}

/** Empleado sugerido para el Paso 2 de asignación (HU06). */
export interface EmpleadoSeleccionable {
  readonly idEmpleado: string;
  readonly numeroEmpleado: string;
  readonly nombre: string;
  readonly correo: string;
  readonly departamento: string | null;
  readonly cargo: string | null;
  readonly activo: boolean;
}

export interface PrevisualizacionAsignacion {
  readonly puedeAsignar: boolean;
  readonly motivoRechazo: string | null;
  readonly cuposLibresActuales: number;
  readonly cuposLibresResultantes: number;
  readonly porcentajeOcupacionResultante: number;
}

export interface ResultadoMovimiento {
  readonly idAsignacionLicencia: string;
  readonly cuposAsignados: number;
  readonly cuposLibres: number;
  readonly porcentajeOcupacion: number;
  readonly reintentoRecuperado: boolean;
  readonly correoNotificado?: boolean;
}
