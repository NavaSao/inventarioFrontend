import { IHttpClient } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';
import { AlertaVencimiento, ActividadReciente, DashboardData } from '../models/types';

export const DASHBOARD_VACIO: DashboardData = {
  metricas: {
    cuposTotales: 0,
    aplicacionesActivas: 0,
    cuposOcupados: 0,
    cuposAsignables: 0,
    cuposLibres: 0,
    porcentajeUso: 0,
  },
  vencimientosMenos30Dias: [],
  actividadReciente: [],
};

export class DashboardService {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly secureStorage: ISecureStorage,
    private readonly baseUrl: string
  ) {}

  async obtenerDashboard(): Promise<DashboardData> {
    const token = await this.secureStorage.obtenerToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.httpClient.get<any>(
      `${this.baseUrl}/api/dashboard`,
      headers
    );

    if (!response.ok || !response.data) {
      throw new Error(response.data?.mensaje || 'Error al obtener datos del dashboard');
    }

    const raw = response.data.data || response.data;
    const metricasRaw = raw.metricas || raw;
    const cuposTotales = Number(metricasRaw.cuposTotales ?? 0);
    const cuposOcupados = Number(metricasRaw.cuposOcupados ?? 0);
    const cuposAsignables = Number(metricasRaw.cuposAsignables ?? 0);
    const cuposLibres = Number(metricasRaw.cuposLibres ?? Math.max(0, cuposTotales - cuposOcupados));
    const porcentajeUso = Number(
      metricasRaw.porcentajeUso ??
        (cuposTotales > 0 ? Math.round((cuposOcupados / cuposTotales) * 100) : 0)
    );
    const aplicacionesActivas = Number(metricasRaw.aplicacionesActivas ?? 0);

    let vencimientos: AlertaVencimiento[] = [];
    if (Array.isArray(raw.vencimientosMenos30Dias)) {
      vencimientos = raw.vencimientosMenos30Dias;
    } else if (Array.isArray(raw.alertas?.vencimientosMenos30Dias?.contratos)) {
      vencimientos = raw.alertas.vencimientosMenos30Dias.contratos.map((c: any) => ({
        id: String(c.idContrato || c.idLicencia || c.id || ''),
        software: String(c.software || 'Software'),
        diasRestantes: Number(c.diasParaVencer ?? c.diasRestantes ?? 0),
        cupos: Number(c.cuposContratados ?? c.cupos ?? c.cuposTotales ?? 0),
        finVigencia: String(c.finVigencia || ''),
        licenciaId: String(c.idLicencia || c.idContrato || ''),
      }));
    }

    let actividad: ActividadReciente[] = [];
    if (Array.isArray(raw.actividadReciente)) {
      actividad = raw.actividadReciente.map((item: any, idx: number) => {
        const empNombre =
          typeof item.empleado === 'object' && item.empleado !== null
            ? item.empleado.nombre || item.empleado.correo || 'Empleado'
            : String(item.empleado || 'Empleado');

        let fechaStr = '';
        if (item.fecha) {
          const d = new Date(item.fecha);
          if (!isNaN(d.getTime())) {
            fechaStr = d.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
          } else {
            fechaStr = String(item.fecha);
          }
        }

        const tipoNorm = String(item.tipo || '').toLowerCase();
        const esAsig = tipoNorm.includes('asig');

        return {
          id: String(item.idMovimiento || item.id || `act-${idx}`),
          software: String(item.software || 'Software'),
          tipo: esAsig ? ('asignacion' as const) : ('liberacion' as const),
          titulo: String(
            item.titulo || `${item.software || 'Software'} ${esAsig ? 'asignado' : 'liberado'}`
          ),
          empleado: empNombre,
          fecha: fechaStr,
        };
      });
    }

    return {
      metricas: {
        cuposTotales,
        aplicacionesActivas,
        cuposOcupados,
        cuposAsignables,
        cuposLibres,
        porcentajeUso,
      },
      vencimientosMenos30Dias: vencimientos,
      actividadReciente: actividad,
    };
  }
}
