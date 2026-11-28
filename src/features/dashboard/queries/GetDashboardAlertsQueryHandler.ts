import { AlertaVencimiento, IDashboardAlertsReadRepository } from '../models/types';
import { GetDashboardAlertsQuery } from './GetDashboardAlertsQuery';

export interface IGetDashboardAlertsQueryHandler {
  handle(query?: GetDashboardAlertsQuery): Promise<AlertaVencimiento[]>;
}

/**
 * CQRS QueryHandler de solo lectura para alertas de vencimiento en Inicio (HU08).
 * - SRP: Responsabilidad única de consultar alertas del dashboard.
 * - DIP / ISP: Depende de la abstracción IDashboardAlertsReadRepository.
 */
export class GetDashboardAlertsQueryHandler implements IGetDashboardAlertsQueryHandler {
  constructor(private readonly alertsRepository: IDashboardAlertsReadRepository) {}

  async handle(query: GetDashboardAlertsQuery = new GetDashboardAlertsQuery()): Promise<AlertaVencimiento[]> {
    const alertas = await this.alertsRepository.obtenerAlertasVencimiento();
    return alertas.filter((alerta) => alerta.diasRestantes <= query.diasLimite);
  }
}
