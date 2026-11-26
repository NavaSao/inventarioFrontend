import { Tono } from '../../../shared/ui/tema';

export type EstadoActivo = 'DISPONIBLE' | 'ASIGNADO' | 'EN_MANTENIMIENTO' | 'DADO_DE_BAJA';

export const ESTADOS_ACTIVO: Record<EstadoActivo, { texto: string; tono: Tono }> = {
  DISPONIBLE: { texto: 'Disponible', tono: 'verde' },
  ASIGNADO: { texto: 'Asignado', tono: 'gris' },
  EN_MANTENIMIENTO: { texto: 'En mantenimiento', tono: 'ambar' },
  DADO_DE_BAJA: { texto: 'Dado de baja', tono: 'rojo' },
};

export interface DatosActivo {
  readonly nombre: string;
  readonly numeroSerie: string;
  readonly etiqueta: string;
  readonly categoria: string;
  readonly ubicacion: string;
  readonly marca: string;
  readonly modelo: string;
}

export interface Activo extends Omit<DatosActivo, 'marca' | 'modelo'> {
  readonly idActivo: string;
  readonly marca: string | null;
  readonly modelo: string | null;
  readonly estado: EstadoActivo;
  readonly fotoReferencia: string | null;
}

export interface ActivoDetalle extends Activo {
  readonly asignacionActual: {
    readonly entregadoEn: string;
    readonly empleado: { readonly idEmpleado: string; readonly nombre: string; readonly numeroEmpleado: string; readonly departamento: string | null };
  } | null;
  readonly mantenimientoActual: { readonly iniciadoEn: string; readonly notaInicial: string } | null;
}

export interface IActivosService {
  listar(busqueda: string, estado?: EstadoActivo): Promise<Activo[]>;
  consultar(idActivo: string): Promise<ActivoDetalle>;
  /** Devuelve `null` si la etiqueta escaneada aún no pertenece a ningún activo. */
  escanear(etiqueta: string): Promise<ActivoDetalle | null>;
  registrar(datos: DatosActivo): Promise<Activo>;
  editar(idActivo: string, datos: DatosActivo): Promise<Activo>;
  subirFoto(idActivo: string, base64: string): Promise<ActivoDetalle>;
  asignar(idActivo: string, idEmpleado: string): Promise<ActivoDetalle>;
  devolver(idActivo: string, nota: string): Promise<ActivoDetalle>;
  iniciarMantenimiento(idActivo: string, nota: string): Promise<ActivoDetalle>;
  cerrarMantenimiento(idActivo: string, nota: string): Promise<ActivoDetalle>;
  urlFoto(fotoReferencia: string): string;
}
