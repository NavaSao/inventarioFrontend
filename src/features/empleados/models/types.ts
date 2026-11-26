export interface DatosEmpleado {
  readonly nombre: string;
  readonly correo: string;
  readonly numeroEmpleado: string;
  readonly departamento: string;
  readonly cargo: string;
}

export interface Empleado extends DatosEmpleado {
  readonly idEmpleado: string;
  readonly activo: boolean;
  readonly licenciasAsignadas: number;
}

/** Contrato del servicio (DIP): los ViewModels dependen de esta abstracción. */
export interface IEmpleadosService {
  listar(): Promise<Empleado[]>;
  buscarActivos(busqueda: string): Promise<Empleado[]>;
  registrar(datos: DatosEmpleado, enviarCorreoBienvenida: boolean): Promise<Empleado>;
  editar(idEmpleado: string, datos: DatosEmpleado): Promise<Empleado>;
  desactivar(idEmpleado: string): Promise<Empleado>;
}
