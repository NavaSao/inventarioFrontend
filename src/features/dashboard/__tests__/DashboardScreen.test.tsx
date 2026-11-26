import React from 'react';
import { describe, test, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardScreen } from '../views/DashboardScreen';
import { DashboardService, DASHBOARD_VACIO } from '../services/DashboardService';
import { IHttpClient, HttpResponse } from '../../../core/network/IHttpClient';
import { ISecureStorage } from '../../../core/storage/ISecureStorage';

class MockStorage implements ISecureStorage {
  async guardarToken(): Promise<void> {}
  async obtenerToken(): Promise<string | null> {
    return 'test-token';
  }
  async eliminarToken(): Promise<void> {}
}

class EmptyApiHttpClient implements IHttpClient {
  async get<T>(): Promise<HttpResponse<T>> {
    return {
      status: 200,
      ok: true,
      data: DASHBOARD_VACIO as unknown as T,
    };
  }
  async post<T>(): Promise<HttpResponse<T>> {
    return { status: 200, ok: true, data: {} as T };
  }
}

describe('DashboardScreen (HU08) - Pruebas con React Testing Library', () => {
  const service = new DashboardService(new EmptyApiHttpClient(), new MockStorage(), 'http://localhost');

  test('Renderiza el estado vacío sin datos fijos cuando la API no tiene registros', async () => {
    render(<DashboardScreen dashboardService={service} nombreUsuario="Admin" />);

    expect(await screen.findByText(/0 puestos de software/i)).toBeTruthy();
    expect(screen.getByText(/0 aplicaciones en tu organización/i)).toBeTruthy();
    expect(screen.getByText(/0 Asignados/i)).toBeTruthy();
    expect(screen.getByText(/0 Disponibles/i)).toBeTruthy();
    expect(screen.getByText(/No hay actividad reciente registrada/i)).toBeTruthy();
  });

  test('Abre y cierra el modal "Ver todo" de actividad reciente', async () => {
    render(<DashboardScreen dashboardService={service} />);

    expect(await screen.findByText(/^Actividad reciente$/i)).toBeTruthy();
    expect(screen.queryByText(/Historial de Actividad/i)).toBeFalsy();

    fireEvent.click(screen.getByText(/Ver todo/i));

    expect(await screen.findByText(/Historial de Actividad/i)).toBeTruthy();

    fireEvent.click(screen.getByText('✕'));

    await waitFor(() => {
      expect(screen.queryByText(/Historial de Actividad/i)).toBeFalsy();
    });
  });

  test('Muestra estado de error de conexión con la API desconectada y botón de reintento', async () => {
    class FailingHttpClient implements IHttpClient {
      public intentos = 0;
      async get<T>(): Promise<HttpResponse<T>> {
        this.intentos++;
        throw new Error('Network request failed: API desconectada');
      }
      async post<T>(): Promise<HttpResponse<T>> {
        throw new Error('API desconectada');
      }
    }

    const failingHttp = new FailingHttpClient();
    const failingService = new DashboardService(failingHttp, new MockStorage(), 'http://offline-api');

    render(<DashboardScreen dashboardService={failingService} />);

    expect(await screen.findByText(/Fallo de conexión/i)).toBeTruthy();
    expect(screen.getByText(/API desconectada/i)).toBeTruthy();

    const botonReintentar = screen.getByText(/Reintentar conexión/i);
    fireEvent.click(botonReintentar);

    await waitFor(() => {
      expect(failingHttp.intentos).toBeGreaterThanOrEqual(2);
    });
  });
});
