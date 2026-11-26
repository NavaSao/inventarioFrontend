import { HttpResponse, IHttpClient, NetworkError } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';

export class MockStorage implements ISecureStorage {
  async guardarToken(): Promise<void> {}
  async obtenerToken(): Promise<string | null> {
    return 'test-token';
  }
  async eliminarToken(): Promise<void> {}
}

export function isoEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

interface Emp {
  idEmpleado: string;
  numeroEmpleado: string;
  nombre: string;
  correo: string;
  departamento: string;
  activo: boolean;
}

interface Asig {
  idAsignacionLicencia: string;
  idEmpleado: string;
  asignadoEn: string;
  liberadoEn: string | null;
  clave: string;
  claveLiberacion: string | null;
}

const ok = <T>(data: unknown, status = 200): HttpResponse<T> => ({
  status,
  ok: true,
  data: { status: 'success', data } as unknown as T,
});
const fallo = <T>(status: number, message: string): HttpResponse<T> => ({
  status,
  ok: false,
  data: { status: 'error', message } as unknown as T,
});

/**
 * Backend en memoria que reproduce las reglas de la API real (RG07, RG08, RG10, RG14):
 * una licencia con cupos, empleados activos, asignación/liberación idempotentes y dashboard derivado.
 */
export class FakeBackend implements IHttpClient {
  licencia = {
    idLicencia: 'lic-figma',
    codigoLicencia: 'FIG-ORG-2026',
    software: 'Figma',
    plan: 'Organization',
    periodicidad: 'Anual',
    inicioVigencia: '2025-12-01',
    finVigencia: isoEnDias(9),
    cuposContratados: 4,
  };
  empleados: Emp[] = [
    { idEmpleado: 'e1', numeroEmpleado: 'EMP-0001', nombre: 'Laura Méndez', correo: 'laura@empresa.com', departamento: 'Diseño', activo: true },
    { idEmpleado: 'e2', numeroEmpleado: 'EMP-0002', nombre: 'Carlos Vega', correo: 'carlos@empresa.com', departamento: 'Tecnología', activo: true },
    { idEmpleado: 'e3', numeroEmpleado: 'EMP-0003', nombre: 'Ana López', correo: 'ana@empresa.com', departamento: 'Producto', activo: true },
    { idEmpleado: 'e4', numeroEmpleado: 'EMP-0004', nombre: 'Daniel Ruiz', correo: 'daniel@empresa.com', departamento: 'Producto', activo: true },
    { idEmpleado: 'e5', numeroEmpleado: 'EMP-0005', nombre: 'Sofía Torres', correo: 'sofia@empresa.com', departamento: 'Diseño', activo: true },
  ];
  asignaciones: Asig[] = [
    { idAsignacionLicencia: 'a1', idEmpleado: 'e1', asignadoEn: '2026-01-10T09:00:00.000Z', liberadoEn: null, clave: 'k1', claveLiberacion: null },
    { idAsignacionLicencia: 'a2', idEmpleado: 'e2', asignadoEn: '2026-02-10T09:00:00.000Z', liberadoEn: null, clave: 'k2', claveLiberacion: null },
    { idAsignacionLicencia: 'a3', idEmpleado: 'e3', asignadoEn: '2026-03-10T09:00:00.000Z', liberadoEn: null, clave: 'k3', claveLiberacion: null },
  ];
  /** Si es > 0, la siguiente escritura se guarda pero la respuesta se pierde por red. */
  perderRespuestas = 0;
  detalleFalla = false;
  posts: Array<{ url: string; body: any; headers?: Record<string, string> }> = [];

  abiertas() {
    return this.asignaciones.filter((a) => !a.liberadoEn);
  }

  resumen() {
    const asignados = this.abiertas().length;
    const libres = Math.max(0, this.licencia.cuposContratados - asignados);
    const vencida = this.licencia.finVigencia <= isoEnDias(0);
    return {
      ...this.licencia,
      estado: vencida ? 'VENCIDA' : 'POR_VENCER',
      diasParaVencer: 9,
      cuposAsignados: asignados,
      cuposLibres: libres,
      cuposAsignables: vencida ? 0 : libres,
      porcentajeOcupacion: Math.round((asignados * 100) / this.licencia.cuposContratados),
    };
  }

  async get<T>(url: string): Promise<HttpResponse<T>> {
    const u = new URL(url);
    const path = u.pathname;
    if (path === '/api/dashboard') {
      const r = this.resumen();
      return ok<T>({
        metricas: {
          cuposTotales: r.cuposContratados,
          aplicacionesActivas: 1,
          cuposOcupados: r.cuposAsignados,
          cuposAsignables: r.cuposAsignables,
          cuposLibres: r.cuposLibres,
          porcentajeUso: r.porcentajeOcupacion,
        },
        vencimientosMenos30Dias: [],
        actividadReciente: [],
      });
    }
    if (path === '/api/licencias') return ok<T>([this.resumen()]);
    if (path === '/api/empleados/selector') {
      const q = (u.searchParams.get('busqueda') || '').toLowerCase();
      return ok<T>(
        this.empleados.filter(
          (e) => e.activo && (!q || e.nombre.toLowerCase().includes(q) || e.correo.includes(q))
        )
      );
    }
    if (path === `/api/licencias/${this.licencia.idLicencia}/asignar/previsualizacion`) {
      const r = this.resumen();
      const idEmp = u.searchParams.get('idEmpleado');
      const duplicada = this.abiertas().some((a) => a.idEmpleado === idEmp);
      return ok<T>({
        puedeAsignar: r.cuposAsignables > 0 && !duplicada,
        motivoRechazo: duplicada ? 'El empleado ya tiene esta licencia asignada' : r.cuposAsignables > 0 ? null : 'No hay cupos disponibles',
        cuposLibresActuales: r.cuposLibres,
        cuposLibresResultantes: Math.max(0, r.cuposLibres - 1),
        porcentajeOcupacionResultante: 0,
      });
    }
    if (path === `/api/licencias/${this.licencia.idLicencia}`) {
      if (this.detalleFalla) throw new NetworkError('Fallo de conexión. Reintentar');
      return ok<T>({
        ...this.resumen(),
        empleadosAsignados: this.abiertas().map((a) => {
          const e = this.empleados.find((x) => x.idEmpleado === a.idEmpleado)!;
          return {
            idAsignacionLicencia: a.idAsignacionLicencia,
            asignadoEn: a.asignadoEn,
            empleado: { idEmpleado: e.idEmpleado, numeroEmpleado: e.numeroEmpleado, nombre: e.nombre, departamento: e.departamento },
          };
        }),
      });
    }
    return fallo<T>(404, 'Licencia no encontrada');
  }

  private responder<T>(r: HttpResponse<T>): HttpResponse<T> {
    if (this.perderRespuestas > 0) {
      this.perderRespuestas--;
      throw new NetworkError('Fallo de conexión. Reintentar');
    }
    return r;
  }

  async post<T>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    this.posts.push({ url, body, headers });
    const path = new URL(url).pathname;

    if (path === `/api/licencias/${this.licencia.idLicencia}/asignar`) {
      const previa = this.asignaciones.find((a) => a.clave === body.claveAsignacion);
      if (previa) return this.responder(ok<T>({ ...this.payload(previa), reintentoRecuperado: true }));
      const r = this.resumen();
      if (r.estado === 'VENCIDA') return fallo<T>(409, 'La licencia está vencida');
      if (r.cuposLibres <= 0) return fallo<T>(409, 'Cupos agotados: no hay puestos disponibles');
      if (this.abiertas().some((a) => a.idEmpleado === body.idEmpleado)) {
        return fallo<T>(409, 'El empleado ya tiene esta licencia asignada');
      }
      const nueva: Asig = {
        idAsignacionLicencia: `a${this.asignaciones.length + 1}`,
        idEmpleado: body.idEmpleado,
        asignadoEn: new Date().toISOString(),
        liberadoEn: null,
        clave: body.claveAsignacion,
        claveLiberacion: null,
      };
      this.asignaciones.push(nueva);
      return this.responder(ok<T>({ ...this.payload(nueva), reintentoRecuperado: false, correoNotificado: true }, 201));
    }

    const m = /^\/api\/licencias\/asignaciones\/([^/]+)\/liberar$/.exec(path);
    if (m) {
      const a = this.asignaciones.find((x) => x.idAsignacionLicencia === m[1]);
      if (!a) return fallo<T>(404, 'Asignación no encontrada');
      if (a.liberadoEn) {
        if (a.claveLiberacion === body.claveLiberacion) {
          return this.responder(ok<T>({ ...this.payload(a), reintentoRecuperado: true }));
        }
        return fallo<T>(409, 'La asignación ya fue liberada');
      }
      a.liberadoEn = body.fechaLiberacion;
      a.claveLiberacion = body.claveLiberacion;
      return this.responder(ok<T>({ ...this.payload(a), reintentoRecuperado: false }));
    }
    return fallo<T>(404, 'No encontrado');
  }

  private payload(a: Asig) {
    const r = this.resumen();
    return {
      asignacion: { idAsignacionLicencia: a.idAsignacionLicencia },
      cuposAsignados: r.cuposAsignados,
      cuposLibresActualizados: r.cuposLibres,
      porcentajeOcupacion: r.porcentajeOcupacion,
    };
  }
}
