/**
 * CQRS - Query de solo lectura para obtener las alertas de vencimiento del dashboard (HU08).
 * No realiza mutaciones ni produce efectos secundarios.
 */
export class GetDashboardAlertsQuery {
  constructor(public readonly diasLimite: number = 30) {}
}
