import { IHttpClient } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { Licencia, NuevaLicenciaDTO } from '../models/types';

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
      id: String(raw.id ?? raw._id ?? `lic-${Math.random()}`),
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
