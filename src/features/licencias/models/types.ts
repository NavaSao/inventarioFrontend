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
