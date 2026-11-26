import { ApiClient } from '../../../core/network/ApiClient';
import { DatosEmpleado, Empleado, IEmpleadosService } from '../models/types';

export class EmpleadosService implements IEmpleadosService {
  constructor(private readonly api: ApiClient) {}

  listar(): Promise<Empleado[]> {
    return this.api.get('/api/empleados');
  }

  /** Empleados activos para el selector de asignación (búsqueda por nombre o correo). */
  buscarActivos(busqueda: string): Promise<Empleado[]> {
    const params = new URLSearchParams({ soloActivos: 'true', limite: '20' });
    if (busqueda.trim()) params.append('busqueda', busqueda.trim());
    return this.api.get(`/api/empleados/selector?${params}`);
  }

  registrar(datos: DatosEmpleado, enviarCorreoBienvenida: boolean): Promise<Empleado> {
    return this.api.post('/api/empleados', { ...datos, enviarCorreoBienvenida });
  }

  editar(idEmpleado: string, datos: DatosEmpleado): Promise<Empleado> {
    return this.api.put(`/api/empleados/${idEmpleado}`, datos);
  }

  desactivar(idEmpleado: string): Promise<Empleado> {
    return this.api.patch(`/api/empleados/${idEmpleado}/desactivar`);
  }
}
