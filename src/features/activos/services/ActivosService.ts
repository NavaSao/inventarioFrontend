import { ApiClient, ApiError } from '../../../core/network/ApiClient';
import { Activo, ActivoDetalle, DatosActivo, EstadoActivo, IActivosService } from '../models/types';

export class ActivosService implements IActivosService {
  constructor(private readonly api: ApiClient) {}

  listar(busqueda: string, estado?: EstadoActivo): Promise<Activo[]> {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.append('busqueda', busqueda.trim());
    if (estado) params.append('estado', estado);
    return this.api.get(`/api/activos?${params}`);
  }

  consultar(idActivo: string): Promise<ActivoDetalle> {
    return this.api.get(`/api/activos/${idActivo}`);
  }

  async escanear(etiqueta: string): Promise<ActivoDetalle | null> {
    try {
      return await this.api.get<ActivoDetalle>(`/api/activos/etiqueta/${encodeURIComponent(etiqueta)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  registrar(datos: DatosActivo): Promise<Activo> {
    return this.api.post('/api/activos', datos);
  }

  editar(idActivo: string, datos: DatosActivo): Promise<Activo> {
    return this.api.put(`/api/activos/${idActivo}`, datos);
  }

  subirFoto(idActivo: string, base64: string): Promise<ActivoDetalle> {
    return this.api.put(`/api/activos/${idActivo}/foto`, base64, 'text/plain');
  }

  asignar(idActivo: string, idEmpleado: string): Promise<ActivoDetalle> {
    return this.api.post(`/api/activos/${idActivo}/asignar`, { idEmpleado });
  }

  devolver(idActivo: string, nota: string): Promise<ActivoDetalle> {
    return this.api.post(`/api/activos/${idActivo}/devolver`, { nota });
  }

  iniciarMantenimiento(idActivo: string, nota: string): Promise<ActivoDetalle> {
    return this.api.post(`/api/activos/${idActivo}/mantenimiento`, { nota });
  }

  cerrarMantenimiento(idActivo: string, nota: string): Promise<ActivoDetalle> {
    return this.api.post(`/api/activos/${idActivo}/mantenimiento/cerrar`, { nota });
  }

  urlFoto(fotoReferencia: string): string {
    return `${this.api.baseUrl}${fotoReferencia}`;
  }
}
