import React from 'react';
import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AsignarLicenciaScreen } from '../views/AsignarLicenciaScreen';
import { LiberarCupoButton, validarFechaLiberacion } from '../views/LiberarCupoButton';
import { EmpleadosAsignadosScreen } from '../../licencias/views/EmpleadosAsignadosScreen';
import { LicenciaDetalleScreen } from '../../licencias/views/LicenciaDetalleScreen';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { DashboardScreen } from '../../dashboard/views/DashboardScreen';
import { DashboardService } from '../../dashboard/services/DashboardService';
import { FakeBackend, MockStorage, isoEnDias } from './fakeBackend';

function crear() {
  const backend = new FakeBackend();
  const storage = new MockStorage();
  return {
    backend,
    service: new LicenciasService(backend, storage, 'http://localhost'),
    dashboard: new DashboardService(backend, storage, 'http://localhost'),
  };
}

async function verDetalle(service: LicenciasService) {
  cleanup();
  render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" />);
  await screen.findByTestId('cupos-asignados');
  return {
    asignados: screen.getByTestId('cupos-asignados').textContent,
    libres: screen.getByTestId('cupos-libres').textContent,
    ocupacion: screen.getByTestId('porcentaje-ocupacion').textContent,
  };
}

async function verDashboard(dashboard: DashboardService) {
  cleanup();
  render(<DashboardScreen dashboardService={dashboard} />);
  await screen.findByText(/4 puestos de software/i);
}

function renderListadoConLiberar(service: LicenciasService) {
  return render(
    <EmpleadosAsignadosScreen
      licenciasService={service}
      idLicencia="lic-figma"
      renderLiberar={(empleado, licencia, alLiberar) => (
        <LiberarCupoButton licenciasService={service} empleado={empleado} licencia={licencia} onLiberado={alLiberar} />
      )}
    />
  );
}

describe('Asignar licencia · Paso 2 (HU06)', () => {
  test('Sugiere solo empleados sin la licencia, previsualiza cupos y confirma la asignación', async () => {
    const { backend, service, dashboard } = crear();
    const onAsignado = jest.fn();
    render(<AsignarLicenciaScreen licenciasService={service} idLicencia="lic-figma" onAsignado={onAsignado} retardoBusqueda={0} />);

    expect(await screen.findByText('PASO 2 DE 2 · EMPLEADO')).toBeTruthy();
    expect((await screen.findByTestId('puestos-disponibles')).textContent).toBe('1 puesto disponible');
    expect(await screen.findByText('Daniel Ruiz')).toBeTruthy();
    expect(screen.getByText('Sofía Torres')).toBeTruthy();
    // Ya asignados (RG07: no asignar dos veces la misma licencia)
    expect(screen.queryByText('Laura Méndez')).toBeNull();

    const confirmar = screen.getByLabelText('Confirmar asignación');
    expect(confirmar.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(screen.getByLabelText('Seleccionar a Daniel Ruiz'));
    expect((await screen.findByTestId('libres-al-asignar')).textContent).toBe('0 libres al asignar');

    fireEvent.click(screen.getByLabelText('Confirmar asignación'));
    await waitFor(() => expect(onAsignado).toHaveBeenCalledTimes(1));
    expect(String(onAsignado.mock.calls[0]![0])).toContain('Daniel Ruiz');
    expect(String(onAsignado.mock.calls[0]![0])).toContain('Se notificó por correo');

    const post = backend.posts[0]!;
    expect(post.body.idEmpleado).toBe('e4');
    expect(post.headers?.['Idempotency-Key']).toBe(post.body.claveAsignacion);

    // El cambio de cupos se refleja en el detalle...
    expect(await verDetalle(service)).toEqual({
      asignados: '4 / 4',
      libres: '0 libres',
      ocupacion: '100% de ocupación',
    });
    // ...y en el dashboard.
    await verDashboard(dashboard);
    expect(screen.getByText(/4 Asignados/i)).toBeTruthy();
    expect(screen.getByText(/0 Disponibles/i)).toBeTruthy();
  });

  test('Reintento tras fallo de red reutiliza la clave y no consume otro cupo (06.04)', async () => {
    const { backend, service } = crear();
    backend.perderRespuestas = 1;
    const onAsignado = jest.fn();
    render(<AsignarLicenciaScreen licenciasService={service} idLicencia="lic-figma" onAsignado={onAsignado} retardoBusqueda={0} />);

    fireEvent.click(await screen.findByLabelText('Seleccionar a Daniel Ruiz'));
    fireEvent.click(screen.getByLabelText('Confirmar asignación'));
    expect(await screen.findByText(/Fallo de conexión/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Reintentar asignación'));
    await waitFor(() => expect(onAsignado).toHaveBeenCalledTimes(1));

    expect(backend.posts).toHaveLength(2);
    expect(backend.posts[0]!.body.claveAsignacion).toBe(backend.posts[1]!.body.claveAsignacion);
    expect(backend.abiertas()).toHaveLength(4);
  });

  test('Cupos agotados: muestra la causa y no permite confirmar (06.02)', async () => {
    const { backend, service } = crear();
    backend.licencia.cuposContratados = 3;
    render(<AsignarLicenciaScreen licenciasService={service} idLicencia="lic-figma" retardoBusqueda={0} />);

    expect((await screen.findByTestId('puestos-disponibles')).textContent).toBe('0 puestos disponibles');
    fireEvent.click(await screen.findByLabelText('Seleccionar a Daniel Ruiz'));
    expect(await screen.findByText(/No hay puestos disponibles/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Confirmar asignación'));
    expect(backend.posts).toHaveLength(0);
  });

  test('Si otro administrador toma el último cupo, se informa «cupos agotados» (06.03)', async () => {
    const { backend, service } = crear();
    const onAsignado = jest.fn();
    render(<AsignarLicenciaScreen licenciasService={service} idLicencia="lic-figma" onAsignado={onAsignado} retardoBusqueda={0} />);
    fireEvent.click(await screen.findByLabelText('Seleccionar a Daniel Ruiz'));
    await screen.findByTestId('libres-al-asignar');

    // Asignación concurrente desde otro dispositivo
    backend.asignaciones.push({ idAsignacionLicencia: 'x', idEmpleado: 'e5', asignadoEn: '', liberadoEn: null, clave: 'otra', claveLiberacion: null });

    fireEvent.click(screen.getByLabelText('Confirmar asignación'));
    expect(await screen.findByText(/Cupos agotados/)).toBeTruthy();
    expect(onAsignado).not.toHaveBeenCalled();
    expect(backend.abiertas()).toHaveLength(4);
  });
});

describe('Liberar cupo (HU07)', () => {
  test('Libera desde el listado con confirmación y actualiza detalle y dashboard (07.01)', async () => {
    const { backend, service, dashboard } = crear();
    renderListadoConLiberar(service);

    fireEvent.click(await screen.findByLabelText('Liberar cupo de Carlos Vega'));
    expect(await screen.findByText('Liberar cupo')).toBeTruthy();
    expect(screen.getByTestId('preview-libres').textContent).toBe('1 → 2');

    fireEvent.click(screen.getByLabelText('Confirmar liberación'));
    expect(await screen.findByText(/Cupo de Carlos Vega liberado · 2 puestos libres · 50% de ocupación/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Carlos Vega')).toBeNull());

    const post = backend.posts[0]!;
    expect(post.url).toContain('/api/licencias/asignaciones/a2/liberar');
    expect(post.body.fechaLiberacion).toBe(isoEnDias(0));
    expect(post.headers?.['Idempotency-Key']).toBe(post.body.claveLiberacion);

    expect(await verDetalle(service)).toEqual({
      asignados: '2 / 4',
      libres: '2 libres',
      ocupacion: '50% de ocupación',
    });
    await verDashboard(dashboard);
    expect(screen.getByText(/2 Asignados/i)).toBeTruthy();
    expect(screen.getByText(/2 Disponibles/i)).toBeTruthy();
  });

  test('Cancelar no libera el cupo', async () => {
    const { backend, service } = crear();
    renderListadoConLiberar(service);
    fireEvent.click(await screen.findByLabelText('Liberar cupo de Ana López'));
    fireEvent.click(await screen.findByText('Cancelar'));
    expect(backend.posts).toHaveLength(0);
    expect(backend.abiertas()).toHaveLength(3);
  });

  test('Rechaza fechas inválidas, futuras o anteriores a la asignación', () => {
    expect(validarFechaLiberacion('2026-13-40', '2026-01-10')).toMatch(/no es válida/);
    expect(validarFechaLiberacion('10/01/2026', '2026-01-10')).toMatch(/AAAA-MM-DD/);
    expect(validarFechaLiberacion(isoEnDias(2), '2026-01-10')).toMatch(/futura/);
    expect(validarFechaLiberacion('2026-01-01', '2026-01-10')).toMatch(/anterior/);
    expect(validarFechaLiberacion(isoEnDias(0), '2026-01-10')).toBeNull();
  });

  test('Reintento de liberación tras fallo de red no duplica el movimiento', async () => {
    const { backend, service } = crear();
    backend.perderRespuestas = 1;
    renderListadoConLiberar(service);

    fireEvent.click(await screen.findByLabelText('Liberar cupo de Laura Méndez'));
    fireEvent.click(await screen.findByLabelText('Confirmar liberación'));
    expect(await screen.findByText(/Fallo de conexión/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Reintentar liberación'));
    expect(await screen.findByText(/Cupo de Laura Méndez liberado/)).toBeTruthy();
    expect(backend.posts[0]!.body.claveLiberacion).toBe(backend.posts[1]!.body.claveLiberacion);
    expect(backend.abiertas()).toHaveLength(2);
  });

  test('Liberar en una licencia vencida avisa que no habilita nuevas asignaciones (07.02)', async () => {
    const { backend, service } = crear();
    backend.licencia.finVigencia = '2026-01-01';
    renderListadoConLiberar(service);

    fireEvent.click(await screen.findByLabelText('Liberar cupo de Ana López'));
    expect(await screen.findByText(/no habilitará nuevas asignaciones/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Confirmar liberación'));
    expect(await screen.findByText(/cerrado en el historial. La licencia sigue vencida/)).toBeTruthy();
  });
});
