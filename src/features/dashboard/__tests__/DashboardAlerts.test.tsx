import React from 'react';
import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { NetworkError } from '../../../core/network/IHttpClient';
import { AlertaVencimiento, IDashboardAlertsReadRepository } from '../models/types';
import { GetDashboardAlertsQuery } from '../queries/GetDashboardAlertsQuery';
import { GetDashboardAlertsQueryHandler } from '../queries/GetDashboardAlertsQueryHandler';
import { useDashboardAlertsViewModel } from '../viewmodels/useDashboardAlertsViewModel';
import { DashboardService } from '../services/DashboardService';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { HomeScreen } from '../../home/views/HomeScreen';
import { FakeBackend, MockStorage } from '../../asignaciones/__tests__/fakeBackend';

const ALERTA_FIGMA: AlertaVencimiento = {
  id: 'lic-figma',
  licenciaId: 'lic-figma',
  software: 'Figma',
  diasRestantes: 9,
  cupos: 4,
  finVigencia: '2026-12-06',
};

describe('HU08 - CQRS, ViewModel MVVM y Navegación de Alertas del Dashboard', () => {
  test('GetDashboardAlertsQueryHandler consulta en solo lectura sin mutar datos y respeta diasLimite', async () => {
    const datosOriginales: AlertaVencimiento[] = [
      ALERTA_FIGMA,
      {
        id: 'lic-largo',
        licenciaId: 'lic-largo',
        software: 'Adobe CC',
        diasRestantes: 45,
        cupos: 12,
        finVigencia: '2027-01-15',
      },
    ];

    const repo: IDashboardAlertsReadRepository = {
      obtenerAlertasVencimiento: jest.fn(async () => datosOriginales),
    };

    const handler = new GetDashboardAlertsQueryHandler(repo);
    const resultado = await handler.handle(new GetDashboardAlertsQuery(30));

    expect(repo.obtenerAlertasVencimiento).toHaveBeenCalledTimes(1);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.licenciaId).toBe('lic-figma');
    expect(datosOriginales).toHaveLength(2);
  });

  test('useDashboardAlertsViewModel maneja API desconectada y se recupera al ejecutar onRetry', async () => {
    let apiDesconectada = true;
    const repo: IDashboardAlertsReadRepository = {
      obtenerAlertasVencimiento: jest.fn(async () => {
        if (apiDesconectada) {
          throw new NetworkError('API desconectada: tiempo de espera agotado');
        }
        return [ALERTA_FIGMA];
      }),
    };

    const onNavigateToLicense = jest.fn();
    const { result } = renderHook(() =>
      useDashboardAlertsViewModel({
        alertsRepository: repo,
        onNavigateToLicense,
      })
    );

    await waitFor(() => {
      expect(result.current.estadoCarga).toBe('error_conexion');
    });

    expect(result.current.cargando).toBe(false);
    expect(result.current.errorConexion).toBe(true);
    expect(result.current.errorMensaje).toContain('API desconectada');
    expect(result.current.alertas).toEqual([]);

    apiDesconectada = false;

    await act(async () => {
      await result.current.onRetry();
    });

    expect(result.current.estadoCarga).toBe('exito');
    expect(result.current.cargando).toBe(false);
    expect(result.current.errorConexion).toBe(false);
    expect(result.current.errorMensaje).toBeNull();
    expect(result.current.alertas).toEqual([ALERTA_FIGMA]);
    expect(repo.obtenerAlertasVencimiento).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.onReviewLicense(ALERTA_FIGMA);
    });

    expect(onNavigateToLicense).toHaveBeenCalledTimes(1);
    expect(onNavigateToLicense).toHaveBeenCalledWith('lic-figma', 'Figma');
  });

  test('Pulsar «Revisar licencia» en Inicio navega directo a Detalle de licencia con el idLicencia correcto', async () => {
    const backend = new FakeBackend();
    const storage = new MockStorage();
    const baseGet = backend.get.bind(backend);

    backend.get = async <T,>(url: string) => {
      if (url.includes('/api/dashboard')) {
        return {
          status: 200,
          ok: true,
          data: {
            status: 'success',
            data: {
              metricas: {
                aplicacionesActivas: 1,
                totalContratos: 1,
                cuposTotales: 4,
                cuposOcupados: 3,
                porcentajeUso: 75,
                cuposLibres: 1,
                cuposAsignables: 1,
              },
              alertas: {
                vencimientosMenos30Dias: {
                  total: 1,
                  contratos: [
                    {
                      idLicencia: backend.licencia.idLicencia,
                      codigoLicencia: backend.licencia.codigoLicencia,
                      software: backend.licencia.software,
                      plan: backend.licencia.plan,
                      finVigencia: backend.licencia.finVigencia,
                      diasParaVencer: 9,
                      cuposContratados: backend.licencia.cuposContratados,
                      cuposAsignados: 3,
                      cuposLibres: 1,
                      cuposAsignables: 1,
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
      return baseGet<T>(url);
    };

    const dashboardService = new DashboardService(backend, storage, 'http://localhost');
    const licenciasService = new LicenciasService(backend, storage, 'http://localhost');

    render(
      <HomeScreen
        usuario={{ idUsuario: 'u-1', nombre: 'Admin TI', correo: 'admin@assetops.test' }}
        onCerrarSesion={jest.fn()}
        dashboardService={dashboardService}
        licenciasService={licenciasService}
      />
    );

    expect(await screen.findByText(/Figma vence en 9 días/i)).toBeTruthy();

    fireEvent.click(screen.getByTestId('boton-revisar-licencia'));

    expect(await screen.findByText('Detalle de licencia')).toBeTruthy();
    expect(await screen.findByText('FIG-ORG-2026')).toBeTruthy();
  });
});
