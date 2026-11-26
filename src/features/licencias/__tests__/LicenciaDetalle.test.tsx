import React from 'react';
import { describe, test, expect, jest, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Linking } from 'react-native';
import { LicenciaDetalleScreen } from '../views/LicenciaDetalleScreen';
import { EmpleadosAsignadosScreen } from '../views/EmpleadosAsignadosScreen';
import { LicenciasService } from '../services/LicenciasService';
import { FakeBackend, MockStorage } from '../../asignaciones/__tests__/fakeBackend';

function crear() {
  const backend = new FakeBackend();
  const service = new LicenciasService(backend, new MockStorage(), 'http://localhost');
  return { backend, service };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Detalle de licencia (HU05 · Escenario 05.03)', () => {
  test('Muestra vigencia, cupos, ocupación e ID de licencia desde la API', async () => {
    const { service } = crear();
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" />);

    expect(await screen.findByText('Figma')).toBeTruthy();
    expect(screen.getByTestId('cupos-asignados').textContent).toBe('3 / 4');
    expect(screen.getByTestId('cupos-libres').textContent).toBe('1 libre');
    expect(screen.getByTestId('porcentaje-ocupacion').textContent).toBe('75% de ocupación');
    expect(screen.getByText('Por vencer')).toBeTruthy();
    expect(screen.getByText(/Quedan 9 días/)).toBeTruthy();
    expect(screen.getByText('FIG-ORG-2026')).toBeTruthy();
    expect(screen.getByText('Anual')).toBeTruthy();
  });

  test('Un fallo de conexión muestra error con reintento, no una licencia vacía', async () => {
    const { backend, service } = crear();
    backend.detalleFalla = true;
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" />);

    expect(await screen.findByText(/No se pudo cargar la licencia/)).toBeTruthy();
    expect(screen.queryByTestId('cupos-asignados')).toBeNull();

    backend.detalleFalla = false;
    fireEvent.click(screen.getByText('Reintentar'));
    expect(await screen.findByText('Figma')).toBeTruthy();
  });

  test('«Ver empleados asignados» abre el listado con los empleados de la licencia', async () => {
    const { service } = crear();
    const onVerAsignados = jest.fn();
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" onVerAsignados={onVerAsignados} />);

    fireEvent.click(await screen.findByLabelText('Ver 3 empleados asignados'));
    expect(onVerAsignados).toHaveBeenCalledTimes(1);

    render(<EmpleadosAsignadosScreen licenciasService={service} idLicencia="lic-figma" />);
    expect(await screen.findByText('Laura Méndez')).toBeTruthy();
    expect(screen.getByText('Carlos Vega')).toBeTruthy();
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.getByTestId('resumen-cupos').textContent).toContain('3 de 4 asignados');
  });

  test('«Solicitar renovación» confirma y abre el correo a TI con los datos de la licencia', async () => {
    const { service } = crear();
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" />);

    fireEvent.click(await screen.findByText('Solicitar renovación'));
    expect(await screen.findByText('Enviar solicitud')).toBeTruthy();
    fireEvent.click(screen.getByText('Enviar solicitud'));

    await waitFor(() => expect(openURL).toHaveBeenCalledTimes(1));
    const url = String(openURL.mock.calls[0]![0]);
    expect(url.startsWith('mailto:')).toBe(true);
    expect(decodeURIComponent(url)).toContain('FIG-ORG-2026');
    expect(await screen.findByText('Solicitud preparada')).toBeTruthy();
  });

  test('«Solicitar renovación» informa si no se puede abrir el correo', async () => {
    const { service } = crear();
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('sin app') as never);
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" />);

    fireEvent.click(await screen.findByText('Solicitar renovación'));
    fireEvent.click(await screen.findByText('Enviar solicitud'));
    expect(await screen.findByText(/No se pudo abrir la aplicación de correo/)).toBeTruthy();
  });

  test('Una licencia vencida bloquea «Asignar licencia» e indica la causa', async () => {
    const { backend, service } = crear();
    backend.licencia.finVigencia = '2026-01-01';
    const onAsignar = jest.fn();
    render(<LicenciaDetalleScreen licenciasService={service} idLicencia="lic-figma" onAsignar={onAsignar} />);

    expect(await screen.findByText(/no admite nuevas asignaciones/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Asignar licencia'));
    expect(onAsignar).not.toHaveBeenCalled();
  });
});
