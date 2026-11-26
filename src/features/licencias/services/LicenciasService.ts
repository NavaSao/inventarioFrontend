import { IHttpClient } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import {
  EmpleadoAsignado,
  EmpleadoSeleccionable,
  Licencia,
  LicenciaDetalle,
  NuevaLicenciaDTO,
  PrevisualizacionAsignacion,
  ResultadoMovimiento,
} from '../models/types';

function mensajeDe(data: any, porDefecto: string): string {
  return data?.message || data?.mensaje || porDefecto;
}

export function calcularEstadoLicencia(finVigenciaStr?: string): Licencia['estado'] {
  if (!finVigenciaStr) return 'vigente';
  const partes = finVigenciaStr.split(/[-T\s]/);
  let fin: Date;
  if (partes.length >= 3) {
    const y = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10) - 1;
    const d = parseInt(partes[2], 10);
    fin = new Date(y, m, d);
  } else {
    fin = new Date(finVigenciaStr);
  }

  if (isNaN(fin.getTime())) return 'vigente';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const dias = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return 'vencida';
  if (dias <= 30) return 'por_vencer';
  return 'vigente';
}

export class LicenciasService {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly secureStorage: ISecureStorage,
    private readonly baseUrl: string
  ) {}

  async obtenerLicencias(busqueda?: string, estado?: string): Promise<Licencia[]> {
    const token = await this.secureStorage.obtenerToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (busqueda && busqueda.trim()) {
      params.append('busqueda', busqueda.trim());
    }
    if (estado && estado !== 'todas') {
      params.append('estado', estado);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.httpClient.get<any>(
      `${this.baseUrl}/api/licencias${queryString}`,
      headers
    );

    if (!response.ok || !response.data) {
      throw new Error(response.data?.mensaje || 'No se pudieron obtener las licencias del servidor.');
    }

    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data.data)
      ? response.data.data
      : Array.isArray(response.data.licencias)
      ? response.data.licencias
      : [];

    return rawList.map((item: any) => this.normalizarLicencia(item));
  }

  async crearLicencia(dto: NuevaLicenciaDTO): Promise<Licencia> {
    const token = await this.secureStorage.obtenerToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.httpClient.post<any>(
      `${this.baseUrl}/api/licencias`,
      dto,
      headers
    );

    if (response.ok && response.data) {
      const payload = response.data.data || response.data.licencia || response.data;
      return this.normalizarLicencia(payload);
    }

    if (response.status === 409) {
      throw new Error(response.data?.mensaje || 'El código de licencia ya está registrado.');
    }
    if (response.status === 400) {
      throw new Error(response.data?.mensaje || 'Los datos de la licencia son inválidos.');
    }

    throw new Error(response.data?.mensaje || 'No se pudo registrar la licencia en el servidor.');
  }

  private async cabeceras(extra?: Record<string, string>): Promise<Record<string, string>> {
    const token = await this.secureStorage.obtenerToken();
    const headers: Record<string, string> = { ...extra };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /** HU05 · Escenario 05.03: ficha de la licencia con ocupación y empleados asignados. */
  async obtenerDetalle(idLicencia: string): Promise<LicenciaDetalle> {
    const response = await this.httpClient.get<any>(
      `${this.baseUrl}/api/licencias/${encodeURIComponent(idLicencia)}`,
      await this.cabeceras()
    );
    if (!response.ok || !response.data) {
      if (response.status === 404) throw new Error('La licencia no existe o fue eliminada.');
      throw new Error(mensajeDe(response.data, 'No se pudo obtener el detalle de la licencia.'));
    }
    const raw = response.data.data || response.data;
    const base = this.normalizarLicencia(raw);
    const empleadosAsignados: EmpleadoAsignado[] = (
      Array.isArray(raw.empleadosAsignados) ? raw.empleadosAsignados : []
    ).map((c: any) => ({
      idAsignacionLicencia: String(c.idAsignacionLicencia),
      asignadoEn: String(c.asignadoEn ?? ''),
      idEmpleado: String(c.empleado?.idEmpleado ?? ''),
      numeroEmpleado: String(c.empleado?.numeroEmpleado ?? ''),
      nombre: String(c.empleado?.nombre ?? 'Empleado'),
      departamento: c.empleado?.departamento ?? null,
    }));
    const contratados = base.cuposContratados;
    const asignados = Number(raw.cuposAsignados ?? empleadosAsignados.length);
    const cuposLibres = Number(raw.cuposLibres ?? Math.max(0, contratados - asignados));
    return {
      ...base,
      cuposAsignados: asignados,
      cuposLibres,
      cuposAsignables: Number(raw.cuposAsignables ?? (base.estado === 'vencida' ? 0 : cuposLibres)),
      porcentajeOcupacion: Number(
        raw.porcentajeOcupacion ?? (contratados > 0 ? Math.round((asignados * 100) / contratados) : 0)
      ),
      diasParaVencer: Math.ceil(Number(raw.diasParaVencer ?? 0)),
      empleadosAsignados,
    };
  }

  /** HU06 · Paso 2: empleados activos sugeridos o buscados por nombre/correo. */
  async buscarEmpleadosParaAsignar(busqueda?: string): Promise<EmpleadoSeleccionable[]> {
    const params = new URLSearchParams({ soloActivos: 'true', limite: '20' });
    if (busqueda && busqueda.trim()) params.append('busqueda', busqueda.trim());
    const response = await this.httpClient.get<any>(
      `${this.baseUrl}/api/empleados/selector?${params.toString()}`,
      await this.cabeceras()
    );
    if (!response.ok || !response.data) {
      throw new Error(mensajeDe(response.data, 'No se pudieron obtener los empleados.'));
    }
    const lista = Array.isArray(response.data) ? response.data : response.data.data;
    return (Array.isArray(lista) ? lista : []).map((e: any) => ({
      idEmpleado: String(e.idEmpleado),
      numeroEmpleado: String(e.numeroEmpleado ?? ''),
      nombre: String(e.nombre ?? ''),
      correo: String(e.correo ?? ''),
      departamento: e.departamento ?? null,
      cargo: e.cargo ?? null,
      activo: e.activo !== false,
    }));
  }

  /** HU06 · Escenario 06.01: cálculo del servidor de los puestos libres resultantes. */
  async previsualizarAsignacion(idLicencia: string, idEmpleado: string): Promise<PrevisualizacionAsignacion> {
    const response = await this.httpClient.get<any>(
      `${this.baseUrl}/api/licencias/${encodeURIComponent(idLicencia)}/asignar/previsualizacion?idEmpleado=${encodeURIComponent(idEmpleado)}`,
      await this.cabeceras()
    );
    if (!response.ok || !response.data) {
      throw new Error(mensajeDe(response.data, 'No se pudo previsualizar la asignación.'));
    }
    const raw = response.data.data || response.data;
    return {
      puedeAsignar: Boolean(raw.puedeAsignar),
      motivoRechazo: raw.motivoRechazo ?? null,
      cuposLibresActuales: Number(raw.cuposLibresActuales ?? 0),
      cuposLibresResultantes: Number(raw.cuposLibresResultantes ?? 0),
      porcentajeOcupacionResultante: Number(raw.porcentajeOcupacionResultante ?? 0),
    };
  }

  /**
   * HU06: asigna un cupo. `claveAsignacion` se reutiliza al reintentar tras un fallo de red para
   * que el backend recupere el movimiento previo sin consumir otro cupo (RG14 · Escenario 06.04).
   */
  async asignarLicencia(
    idLicencia: string,
    idEmpleado: string,
    claveAsignacion: string
  ): Promise<ResultadoMovimiento> {
    const response = await this.httpClient.post<any>(
      `${this.baseUrl}/api/licencias/${encodeURIComponent(idLicencia)}/asignar`,
      { idEmpleado, claveAsignacion },
      await this.cabeceras({ 'Idempotency-Key': claveAsignacion })
    );
    if (!response.ok || !response.data) {
      if (response.status === 409) {
        throw new Error(mensajeDe(response.data, 'No hay cupos disponibles para esta licencia.'));
      }
      throw new Error(mensajeDe(response.data, 'No se pudo asignar la licencia.'));
    }
    const raw = response.data.data || response.data;
    return {
      idAsignacionLicencia: String(raw.asignacion?.idAsignacionLicencia ?? ''),
      cuposAsignados: Number(raw.cuposAsignados ?? 0),
      cuposLibres: Number(raw.cuposLibresActualizados ?? raw.cuposLibresResultantes ?? 0),
      porcentajeOcupacion: Number(raw.porcentajeOcupacion ?? 0),
      reintentoRecuperado: Boolean(raw.reintentoRecuperado),
      correoNotificado: Boolean(raw.correoNotificado),
    };
  }

  /** HU07: libera un cupo con fecha válida; `claveLiberacion` se reutiliza al reintentar (RG14). */
  async liberarCupo(
    idAsignacionLicencia: string,
    claveLiberacion: string,
    fechaLiberacion?: string
  ): Promise<ResultadoMovimiento> {
    const response = await this.httpClient.post<any>(
      `${this.baseUrl}/api/licencias/asignaciones/${encodeURIComponent(idAsignacionLicencia)}/liberar`,
      { claveLiberacion, ...(fechaLiberacion ? { fechaLiberacion } : {}) },
      await this.cabeceras({ 'Idempotency-Key': claveLiberacion })
    );
    if (!response.ok || !response.data) {
      throw new Error(mensajeDe(response.data, 'No se pudo liberar el cupo.'));
    }
    const raw = response.data.data || response.data;
    return {
      idAsignacionLicencia: String(raw.asignacion?.idAsignacionLicencia ?? idAsignacionLicencia),
      cuposAsignados: Number(raw.cuposAsignados ?? 0),
      cuposLibres: Number(raw.cuposLibresActualizados ?? 0),
      porcentajeOcupacion: Number(raw.porcentajeOcupacion ?? 0),
      reintentoRecuperado: Boolean(raw.reintentoRecuperado),
    };
  }

  private normalizarLicencia(raw: any): Licencia {
    let estado: Licencia['estado'] = 'vigente';
    if (raw.estado) {
      const est = String(raw.estado || '').toLowerCase().replace(/[\s-]/g, '_');
      if (est === 'por_vencer' || est === 'porvencer') estado = 'por_vencer';
      else if (est === 'vencida' || est === 'vencido') estado = 'vencida';
      else if (est === 'vigente') estado = 'vigente';
      else estado = calcularEstadoLicencia(raw.finVigencia || raw.fechaVencimiento);
    } else {
      estado = calcularEstadoLicencia(raw.finVigencia || raw.fechaVencimiento);
    }

    return {
      id: String(raw.idLicencia ?? raw.id ?? raw._id ?? `lic-${Math.random()}`),
      codigoLicencia: String(raw.codigoLicencia || '').toUpperCase(),
      software: String(raw.software || 'Software'),
      plan: String(raw.plan || 'Estándar'),
      estado,
      cuposContratados: Number(raw.cuposContratados ?? raw.cupos ?? 0),
      cuposAsignados: Number(raw.cuposAsignados ?? raw.ocupados ?? 0),
      inicioVigencia: String(raw.inicioVigencia || ''),
      finVigencia: String(raw.finVigencia || raw.fechaVencimiento || ''),
      periodicidad: String(raw.periodicidad || 'Anual'),
      proveedor: raw.proveedor ? String(raw.proveedor) : undefined,
      referenciaContrato: raw.referenciaContrato ? String(raw.referenciaContrato) : undefined,
      costo: raw.costo !== undefined ? Number(raw.costo) : undefined,
      moneda: raw.moneda ? String(raw.moneda) : undefined,
    };
  }
}
