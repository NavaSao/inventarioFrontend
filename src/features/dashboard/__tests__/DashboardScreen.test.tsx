import React from 'react';
import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardScreen } from '../views/DashboardScreen';
import { DashboardService, DASHBOARD_VACIO } from '../services/DashboardService';
import { IHttpClient, HttpResponse, NetworkError } from '../../../core/network/IHttpClient';
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

  test('Renderiza alertas de vencimiento reales del backend y enlaza «Revisar licencia» con su licenciaId', async () => {
    class AlertsHttpClient implements IHttpClient {
      async get<T>(): Promise<HttpResponse<T>> {
        return {
          status: 200,
          ok: true,
          data: {
            status: 'success',
            data: {
              metricas: {
                aplicacionesActivas: 2,
                totalContratos: 2,
                cuposTotales: 10,
                cuposOcupados: 8,
                porcentajeUso: 80,
                cuposLibres: 2,
                cuposAsignables: 2,
              },
              alertas: {
                vencimientosMenos30Dias: {
                  total: 1,
                  contratos: [
                    {
                      idLicencia: 'lic-figma-1',
                      codigoLicencia: 'FIG-2026',
                      software: 'Figma',
                      plan: 'Organization',
                      finVigencia: '2026-12-10',
                      diasParaVencer: 12,
                      cuposContratados: 10,
                      cuposAsignados: 8,
                      cuposLibres: 2,
                      cuposAsignables: 2,
                    },
                  ],
                },
                vencidos: { total: 0, contratos: [] },
              },
              actividadReciente: [],
            },
          } as unknown as T,
        };
      }
      async post<T>(): Promise<HttpResponse<T>> {
        return { status: 200, ok: true, data: {} as T };
      }
    }

    const alertsService = new DashboardService(new AlertsHttpClient(), new MockStorage(), 'http://localhost');
    const onRevisarLicencia = jest.fn();

    render(
      <DashboardScreen
        dashboardService={alertsService}
        onRevisarLicencia={onRevisarLicencia}
      />
    );

    expect(await screen.findByText(/Figma vence en 12 días/i)).toBeTruthy();
    expect(screen.getByText(/10 puestos · Renueva antes del 2026-12-10/i)).toBeTruthy();

    fireEvent.click(screen.getByTestId('boton-revisar-licencia'));

    expect(onRevisarLicencia).toHaveBeenCalledTimes(1);
    expect(onRevisarLicencia).toHaveBeenCalledWith('lic-figma-1', 'Figma');
  });

  test('Recupera las alertas del dashboard al reintentar después de una API desconectada', async () => {
    class RecoverableHttpClient implements IHttpClient {
      public desconectado = true;
      public intentos = 0;

      async get<T>(): Promise<HttpResponse<T>> {
        this.intentos += 1;
        if (this.desconectado) {
          throw new NetworkError('API desconectada: no se pudo contactar al servidor');
        }
        return {
          status: 200,
          ok: true,
          data: {
            status: 'success',
            data: {
              metricas: DASHBOARD_VACIO.metricas,
              alertas: {
                vencimientosMenos30Dias: {
                  total: 1,
                  contratos: [
                    {
                      idLicencia: 'lic-slack-9',
                      codigoLicencia: 'SLK-2026',
                      software: 'Slack',
                      plan: 'Pro',
                      finVigencia: '2026-12-15',
                      diasParaVencer: 7,
                      cuposContratados: 20,
                      cuposAsignados: 15,
                      cuposLibres: 5,
                      cuposAsignables: 5,
                    },
                  ],
                },
                vencidos: { total: 0, contratos: [] },
              },
              actividadReciente: [],
            },
          } as unknown as T,
        };
      }

      async post<T>(): Promise<HttpResponse<T>> {
        return { status: 200, ok: true, data: {} as T };
      }
    }

    const recoverableHttp = new RecoverableHttpClient();
    const recoverableService = new DashboardService(recoverableHttp, new MockStorage(), 'http://offline-api');

    render(<DashboardScreen dashboardService={recoverableService} />);

    expect(await screen.findByTestId('estado-error-conexion')).toBeTruthy();
    expect(screen.getByText(/API desconectada/i)).toBeTruthy();
    expect(screen.queryByTestId('tarjeta-alerta-vencimiento')).toBeNull();

    recoverableHttp.desconectado = false;
    fireEvent.click(screen.getByTestId('boton-reintentar'));

    expect(await screen.findByTestId('tarjeta-alerta-vencimiento')).toBeTruthy();
    expect(screen.getByText(/Slack vence en 7 días/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByTestId('estado-error-conexion')).toBeNull();
    });
    expect(recoverableHttp.intentos).toBe(2);
  });
});
