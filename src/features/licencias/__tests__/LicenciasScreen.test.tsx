import React from 'react';
import { describe, test, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LicenciasScreen } from '../views/LicenciasScreen';
import { LicenciasService } from '../services/LicenciasService';
import { IHttpClient, HttpResponse } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';

class MockStorage implements ISecureStorage {
  async guardarToken(): Promise<void> {}
  async obtenerToken(): Promise<string | null> {
    return 'test-token';
  }
  async eliminarToken(): Promise<void> {}
}

class SpyHttpClient implements IHttpClient {
  public urlsConsultadas: string[] = [];

  async get<T>(url: string): Promise<HttpResponse<T>> {
    this.urlsConsultadas.push(url);
    return {
      status: 200,
      ok: true,
      data: [] as unknown as T,
    };
  }

  async post<T>(_url: string, body?: unknown): Promise<HttpResponse<T>> {
    return {
      status: 201,
      ok: true,
      data: { id: 'created-id', ...(body as Record<string, unknown>) } as unknown as T,
    };
  }
}

describe('LicenciasScreen (HU05) - Pruebas con React Testing Library', () => {
  test('Renderiza encabezado, buscador, pestañas y estado vacío sin datos fijos', async () => {
    const http = new SpyHttpClient();
    const service = new LicenciasService(http, new MockStorage(), 'http://localhost');

    render(<LicenciasScreen licenciasService={service} />);

    expect(await screen.findByRole('heading', { name: 'Licencias' })).toBeTruthy();
    expect(screen.getByPlaceholderText(/Buscar software o licencia/i)).toBeTruthy();

    expect(screen.getByRole('tab', { name: 'Todas' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Vigentes' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Por vencer' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Vencidas' })).toBeTruthy();

    expect(await screen.findByText(/No se encontraron licencias/i)).toBeTruthy();
  });

  test('Consulta el endpoint con el filtro de estado al cambiar de pestaña', async () => {
    const http = new SpyHttpClient();
    const service = new LicenciasService(http, new MockStorage(), 'http://localhost');

    render(<LicenciasScreen licenciasService={service} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Por vencer' }));
    await waitFor(() => {
      expect(http.urlsConsultadas.some((u) => u.includes('estado=por_vencer'))).toBe(true);
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    await waitFor(() => {
      expect(http.urlsConsultadas.some((u) => u.includes('estado=vigente'))).toBe(true);
    });
  });

  test('Abre y cierra el modal de registro de licencia', async () => {
    const http = new SpyHttpClient();
    const service = new LicenciasService(http, new MockStorage(), 'http://localhost');

    render(<LicenciasScreen licenciasService={service} />);

    expect(screen.queryByText('Registrar Licencia')).toBeFalsy();

    fireEvent.click(screen.getByLabelText(/Registrar nueva licencia/i));

    expect(await screen.findByText('Registrar Licencia')).toBeTruthy();
    expect(screen.getByText(/Campos obligatorios/i)).toBeTruthy();
    expect(screen.getByText(/Código de Licencia/i)).toBeTruthy();
    expect(screen.getByText(/Software \/ Aplicación/i)).toBeTruthy();

    fireEvent.click(screen.getByText('✕'));

    await waitFor(() => {
      expect(screen.queryByText('Registrar Licencia')).toBeFalsy();
    });
  });

  test('Bloquea campos y botón Guardar hasta completar cada campo obligatorio en orden', async () => {
    const http = new SpyHttpClient();
    const service = new LicenciasService(http, new MockStorage(), 'http://localhost');

    render(<LicenciasScreen licenciasService={service} />);

    fireEvent.click(screen.getByLabelText(/Registrar nueva licencia/i));
    expect(await screen.findByText('Registrar Licencia')).toBeTruthy();

    const inputCodigo = screen.getByLabelText('Código de Licencia') as HTMLInputElement;
    const inputSoftware = screen.getByLabelText('Software / Aplicación') as HTMLInputElement;
    const inputPlan = screen.getByLabelText('Plan contratado') as HTMLInputElement;
    const inputCupos = screen.getByLabelText('Cupos contratados') as HTMLInputElement;
    const inputPeriodicidad = screen.getByLabelText('Periodicidad') as HTMLInputElement;
    const inputInicio = screen.getByLabelText('Inicio Vigencia') as HTMLInputElement;
    const inputFin = screen.getByLabelText('Fin Vigencia') as HTMLInputElement;
    const btnGuardar = screen.getByRole('button', { name: /Guardar licencia/i }) as HTMLButtonElement;

    // Al inicio solo Código de Licencia está habilitado y Guardar está deshabilitado
    expect(inputCodigo.readOnly || inputCodigo.disabled).toBeFalsy();
    expect(inputSoftware.readOnly || inputSoftware.disabled).toBeTruthy();
    expect(inputPlan.readOnly || inputPlan.disabled).toBeTruthy();
    expect(btnGuardar.getAttribute('aria-disabled') === 'true' || btnGuardar.disabled).toBeTruthy();

    // Desbloqueo uno por uno
    fireEvent.change(inputCodigo, { target: { value: 'LIC-001' } });
    expect(inputSoftware.readOnly || inputSoftware.disabled).toBeFalsy();
    expect(inputPlan.readOnly || inputPlan.disabled).toBeTruthy();

    fireEvent.change(inputSoftware, { target: { value: 'App' } });
    expect(inputPlan.readOnly || inputPlan.disabled).toBeFalsy();
    expect(inputCupos.readOnly || inputCupos.disabled).toBeTruthy();

    fireEvent.change(inputPlan, { target: { value: 'Standard' } });
    expect(inputCupos.readOnly || inputCupos.disabled).toBeFalsy();
    expect(inputPeriodicidad.readOnly || inputPeriodicidad.disabled).toBeTruthy();

    fireEvent.change(inputCupos, { target: { value: '10' } });
    expect(inputPeriodicidad.readOnly || inputPeriodicidad.disabled).toBeFalsy();
    expect(inputInicio.readOnly || inputInicio.disabled).toBeTruthy();

    fireEvent.change(inputPeriodicidad, { target: { value: 'Anual' } });
    expect(inputInicio.readOnly || inputInicio.disabled).toBeFalsy();
    expect(inputFin.readOnly || inputFin.disabled).toBeTruthy();

    fireEvent.change(inputInicio, { target: { value: '2026-01-01' } });
    expect(inputFin.readOnly || inputFin.disabled).toBeFalsy();
    expect(btnGuardar.getAttribute('aria-disabled') === 'true' || btnGuardar.disabled).toBeTruthy();

    fireEvent.change(inputFin, { target: { value: '2027-01-01' } });
    expect(btnGuardar.getAttribute('aria-disabled') === 'true' || btnGuardar.disabled).toBeFalsy();
  });
});
