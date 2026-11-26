import { DashboardService, DASHBOARD_VACIO } from '../services/DashboardService';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { IHttpClient, HttpResponse } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[FALLO] Falló la prueba: ${message}`);
  }
}

class MockStorage implements ISecureStorage {
  constructor(private token: string | null = 'jwt-token-valido') {}
  async guardarToken(t: string): Promise<void> { this.token = t; }
  async obtenerToken(): Promise<string | null> { return this.token; }
  async eliminarToken(): Promise<void> { this.token = null; }
}

class SpyHttpClient implements IHttpClient {
  public ultimasCabeceras: Record<string, string> = {};
  public ultimaUrl: string = '';
  public codigosRegistrados = new Set<string>();

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    this.ultimaUrl = url;
    this.ultimasCabeceras = headers || {};

    if (url.includes('/api/dashboard')) {
      return {
        status: 200,
        ok: true,
        data: DASHBOARD_VACIO as unknown as T,
      };
    }

    if (url.includes('/api/licencias')) {
      return {
        status: 200,
        ok: true,
        data: [] as unknown as T,
      };
    }

    return { status: 404, ok: false, data: {} as T };
  }

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    this.ultimaUrl = url;
    this.ultimasCabeceras = headers || {};

    if (url.includes('/api/licencias')) {
      const dto = body as any;
      const codigo = dto?.codigoLicencia ? String(dto.codigoLicencia).toUpperCase() : '';
      if (this.codigosRegistrados.has(codigo)) {
        return {
          status: 409,
          ok: false,
          data: { mensaje: 'El código de licencia ya está registrado.' } as unknown as T,
        };
      }
      this.codigosRegistrados.add(codigo);
      return {
        status: 201,
        ok: true,
        data: { id: 'lic-1', ...(body as any) } as T,
      };
    }

    return { status: 400, ok: false, data: {} as T };
  }
}

export async function correrPruebas(): Promise<void> {
  console.log('=== INICIANDO PRUEBAS UNITARIAS SPRINT 2 (HU08 y HU05) ===\n');

  const storage = new MockStorage('jwt-token-valido');
  const http = new SpyHttpClient();
  const dashboardService = new DashboardService(http, storage, 'http://127.0.0.1:3000');
  const licenciasService = new LicenciasService(http, storage, 'http://127.0.0.1:3000');

  // PRUEBA 1: Dashboard consulta API con Bearer y devuelve ceros sin inventar datos
  console.log('Prueba 1: Consulta a GET /api/dashboard con Bearer...');
  const dashData = await dashboardService.obtenerDashboard();
  assert(http.ultimaUrl.includes('/api/dashboard'), 'Debe consultar GET /api/dashboard');
  assert(http.ultimasCabeceras['Authorization'] === 'Bearer jwt-token-valido', 'Debe enviar cabecera Authorization: Bearer');
  assert(dashData.metricas.cuposTotales === 0, 'Sin registros, cuposTotales debe ser 0');
  assert(dashData.vencimientosMenos30Dias.length === 0, 'Sin registros, vencimientos debe ser []');
  assert(dashData.actividadReciente.length === 0, 'Sin registros, actividadReciente debe ser []');
  console.log('[OK] Prueba 1 PASÓ.');

  // PRUEBA 2: Consulta de licencias con filtros por estado
  console.log('\nPrueba 2: Consulta de GET /api/licencias con filtros...');
  const todas = await licenciasService.obtenerLicencias();
  assert(Array.isArray(todas) && todas.length === 0, 'Debe retornar arreglo vacío cuando no hay registros');

  await licenciasService.obtenerLicencias(undefined, 'por_vencer');
  assert(http.ultimaUrl.includes('estado=por_vencer'), 'Debe enviar query param estado=por_vencer');
  console.log('[OK] Prueba 2 PASÓ.');

  // PRUEBA 3: Creación de licencia y normalización de código
  console.log('\nPrueba 3: Creación de licencia (POST /api/licencias)...');
  const nueva = await licenciasService.crearLicencia({
    codigoLicencia: 'cod-01',
    software: 'App',
    plan: 'Standard',
    periodicidad: 'Anual',
    inicioVigencia: '2026-01-01',
    finVigencia: '2027-01-01',
    cuposContratados: 5,
  });

  assert(http.ultimaUrl.includes('/api/licencias'), 'Debe apuntar a POST /api/licencias');
  assert(nueva.codigoLicencia === 'COD-01', 'El código de licencia debe normalizarse a mayúsculas');
  assert(http.ultimasCabeceras['Authorization'] === 'Bearer jwt-token-valido', 'Debe enviar cabecera Authorization: Bearer');
  console.log('[OK] Prueba 3 PASÓ.');

  // PRUEBA 4: Validación de duplicados (409)
  console.log('\nPrueba 4: Detección de código de licencia duplicado...');
  let lanzoError = false;
  try {
    await licenciasService.crearLicencia({
      codigoLicencia: 'COD-01',
      software: 'App',
      plan: 'Standard',
      periodicidad: 'Anual',
      inicioVigencia: '2026-01-01',
      finVigencia: '2027-01-01',
      cuposContratados: 5,
    });
  } catch (err: any) {
    lanzoError = true;
    assert(err.message.includes('ya está registrado'), 'Debe propagar el error 409 del backend');
  }
  assert(lanzoError, 'Debe lanzar error al intentar duplicar un código de licencia');
  console.log('[OK] Prueba 4 PASÓ.');

  console.log('\n[EXITO] TODAS LAS PRUEBAS DE SPRINT 2 PASARON SATISFACTORIAMENTE!');
}
