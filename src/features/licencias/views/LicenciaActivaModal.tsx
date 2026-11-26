import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalMovil } from '../../../shared/ui/ModalMovil';
import { Licencia } from '../models/types';
import { AppIconBadge, CheckCircleIcon, ShieldIcon } from '../../../shared/components/Icons';

export interface LicenciaActivaModalProps {
  readonly visible: boolean;
  readonly licencia: Licencia | null;
  readonly onClose: () => void;
  readonly onAsignarEmpleado?: (licencia: Licencia) => void;
}

export const colores = {
  forest: '#0F382A',
  emerald: '#107C41',
  mint: '#D1FAE5',
  mintLight: '#ECFDF5',
  background: '#F6F8F6',
  white: '#FFFFFF',
  oscuro: '#0F382A',
  grisTexto: '#61746A',
  grisSub: '#82938B',
  bordeSutil: '#E6EBE7',
};

export const LicenciaActivaModal: React.FC<LicenciaActivaModalProps> = ({
  visible,
  licencia,
  onClose,
  onAsignarEmpleado,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!licencia) return null;

  const handleCopiarClave = () => {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const total = licencia.cuposContratados || 1;
  const asignados = licencia.cuposAsignados || 0;
  const libres = Math.max(0, total - asignados);
  const porcentaje = Math.min(100, Math.round((asignados / total) * 100));

  const esVencida = licencia.estado === 'vencida';
  const esPorVencer = licencia.estado === 'por_vencer';

  const heroTitulo = esVencida
    ? 'Licencia Vencida'
    : esPorVencer
    ? 'Licencia Próxima a Vencer'
    : 'Tu licencia está activa';

  const heroSubtitulo = esVencida
    ? 'Esta suscripción ha caducado en la fecha estipulada. Requiere renovación para poder asignar nuevos cupos.'
    : esPorVencer
    ? 'El contrato vence en menos de 30 días. Te sugerimos revisar la renovación con el proveedor.'
    : 'Suscripción corporativa validada y sincronizada correctamente con los servidores de TI.';

  const heroPillText = esVencida
    ? 'ESTADO: VENCIDA / CADUCADA'
    : esPorVencer
    ? 'ESTADO: PRÓXIMA A VENCER'
    : 'ESTADO: ACTIVA Y OPERATIVA';

  const colorEstado = esVencida ? '#EF4444' : esPorVencer ? '#F59E0B' : colores.emerald;

  return (
    <ModalMovil
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Barra superior con botón cerrar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerBarTitle}>Comprobante Oficial</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar estado de licencia"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tarjeta Hero Forest: Estado dinámico de la licencia */}
            <View style={styles.heroCard}>
              <View style={styles.iconCircleWrapper}>
                <CheckCircleIcon color={colorEstado} size={54} />
              </View>

              <Text style={styles.heroTitulo}>{heroTitulo}</Text>
              <Text style={styles.heroSubtitulo}>{heroSubtitulo}</Text>

              <View
                style={[
                  styles.heroPill,
                  {
                    backgroundColor: esVencida
                      ? 'rgba(239, 68, 68, 0.18)'
                      : esPorVencer
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'rgba(209, 250, 229, 0.15)',
                    borderColor: esVencida
                      ? 'rgba(239, 68, 68, 0.5)'
                      : esPorVencer
                      ? 'rgba(245, 158, 11, 0.5)'
                      : 'rgba(209, 250, 229, 0.4)',
                  },
                ]}
              >
                <View style={[styles.heroPillDot, { backgroundColor: colorEstado }]} />
                <Text
                  style={[
                    styles.heroPillText,
                    {
                      color: esVencida ? '#FCA5A5' : esPorVencer ? '#FDE68A' : '#D1FAE5',
                    },
                  ]}
                >
                  {heroPillText}
                </Text>
              </View>
            </View>

            {/* Ficha técnica del software */}
            <View style={styles.cardSeccion}>
              <View style={styles.softwareFila}>
                <AppIconBadge software={licencia.software} size={50} />
                <View style={styles.softwareInfo}>
                  <Text style={styles.softwareNombre}>{licencia.software}</Text>
                  <Text style={styles.softwarePlan}>
                    {licencia.plan} • Facturación {licencia.periodicidad || 'Anual'}
                  </Text>
                </View>
              </View>

              {/* Clave de producto y botón de copiado */}
              <View style={styles.claveBox}>
                <View style={styles.claveHeaderRow}>
                  <Text style={styles.claveEtiqueta}>Código de Activación TI</Text>
                  <TouchableOpacity
                    style={[styles.botonCopiar, copiado && styles.botonCopiado]}
                    onPress={handleCopiarClave}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.botonCopiarTexto, copiado && styles.botonCopiadoTexto]}>
                      {copiado ? 'Clave copiada' : 'Copiar clave'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.claveCodigo}>{licencia.codigoLicencia}</Text>
              </View>
            </View>

            {/* Capacidad y cupos de uso */}
            <View style={styles.cardSeccion}>
              <View style={styles.seccionHeader}>
                <Text style={styles.seccionTitulo}>Capacidad de puestos</Text>
                <Text style={styles.seccionValor}>{porcentaje}% en uso</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${porcentaje}%` }]} />
              </View>

              <View style={styles.metricasRow}>
                <View style={styles.metricaItem}>
                  <Text style={styles.metricaNumero}>{asignados}</Text>
                  <Text style={styles.metricaEtiqueta}>Puestos asignados</Text>
                </View>
                <View style={styles.metricaSeparador} />
                <View style={styles.metricaItem}>
                  <Text style={[styles.metricaNumero, { color: colores.emerald }]}>{libres}</Text>
                  <Text style={styles.metricaEtiqueta}>Puestos disponibles</Text>
                </View>
                <View style={styles.metricaSeparador} />
                <View style={styles.metricaItem}>
                  <Text style={styles.metricaNumero}>{total}</Text>
                  <Text style={styles.metricaEtiqueta}>Total contratados</Text>
                </View>
              </View>
            </View>

            {/* Vigencia y Fechas contractuales */}
            <View style={styles.cardSeccion}>
              <Text style={styles.seccionTitulo}>Periodo de vigencia</Text>
              <View style={styles.detallesList}>
                <View style={styles.detalleFila}>
                  <Text style={styles.detalleLabel}>Fecha de activación:</Text>
                  <Text style={styles.detalleValor}>{licencia.inicioVigencia}</Text>
                </View>
                <View style={styles.detalleFila}>
                  <Text style={styles.detalleLabel}>Próxima renovación:</Text>
                  <Text style={[styles.detalleValor, { color: colores.emerald }]}>
                    {licencia.finVigencia}
                  </Text>
                </View>
                {licencia.proveedor && (
                  <View style={styles.detalleFila}>
                    <Text style={styles.detalleLabel}>Proveedor autorizado:</Text>
                    <Text style={styles.detalleValor}>{licencia.proveedor}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bloque de Seguridad y Auditoría TI */}
            <View style={styles.seguridadBox}>
              <View style={styles.seguridadIconBox}>
                <ShieldIcon color={colores.emerald} size={20} />
              </View>
              <View style={styles.seguridadTextBox}>
                <Text style={styles.seguridadTitulo}>Certificación y Cumplimiento TI</Text>
                <Text style={styles.seguridadSub}>
                  Licencia registrada bajo políticas corporativas. Cumple con auditoría de software AssetOps.
                </Text>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.accionesContainer}>
              {onAsignarEmpleado && (
                <TouchableOpacity
                  style={styles.botonPrimario}
                  onPress={() => {
                    onClose();
                    onAsignarEmpleado(licencia);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.botonPrimarioTexto}>Asignar a un empleado</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.botonSecundario}
                onPress={onClose}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.botonSecundarioTexto}>Aceptar y volver</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ModalMovil>
  );
};

export default LicenciaActivaModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.background,
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colores.white,
    borderBottomWidth: 1,
    borderBottomColor: colores.bordeSutil,
  },
  headerBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.forest,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.forest,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colores.forest,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F382A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircleWrapper: {
    marginBottom: 14,
  },
  heroTitulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colores.white,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitulo: {
    fontSize: 13,
    color: '#D1E0D9',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 250, 229, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(209, 250, 229, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1FAE5',
    letterSpacing: 0.4,
  },
  cardSeccion: {
    backgroundColor: colores.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    shadowColor: '#0F382A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  softwareFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  softwareInfo: {
    marginLeft: 14,
    flex: 1,
  },
  softwareNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.forest,
    marginBottom: 2,
  },
  softwarePlan: {
    fontSize: 13,
    color: colores.grisTexto,
  },
  claveBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  claveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  claveEtiqueta: {
    fontSize: 11,
    fontWeight: '600',
    color: colores.grisTexto,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  botonCopiar: {
    backgroundColor: colores.mintLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 124, 65, 0.2)',
  },
  botonCopiado: {
    backgroundColor: colores.emerald,
  },
  botonCopiarTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: colores.emerald,
  },
  botonCopiadoTexto: {
    color: colores.white,
  },
  claveCodigo: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.forest,
    letterSpacing: 0.8,
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.forest,
  },
  seccionValor: {
    fontSize: 12,
    fontWeight: '600',
    color: colores.emerald,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EAEFEA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colores.emerald,
    borderRadius: 4,
  },
  metricasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metricaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricaNumero: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.forest,
  },
  metricaEtiqueta: {
    fontSize: 11,
    color: colores.grisTexto,
    marginTop: 2,
    textAlign: 'center',
  },
  metricaSeparador: {
    width: 1,
    height: 24,
    backgroundColor: colores.bordeSutil,
  },
  detallesList: {
    marginTop: 8,
  },
  detalleFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F4',
  },
  detalleLabel: {
    fontSize: 13,
    color: colores.grisTexto,
  },
  detalleValor: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.forest,
  },
  seguridadBox: {
    flexDirection: 'row',
    backgroundColor: colores.mintLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    marginBottom: 20,
    alignItems: 'center',
  },
  seguridadIconBox: {
    marginRight: 12,
  },
  seguridadTextBox: {
    flex: 1,
  },
  seguridadTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.forest,
    marginBottom: 2,
  },
  seguridadSub: {
    fontSize: 11,
    color: colores.grisTexto,
    lineHeight: 16,
  },
  accionesContainer: {
    gap: 10,
  },
  botonPrimario: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colores.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colores.emerald,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  botonPrimarioTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.white,
  },
  botonSecundario: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colores.white,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colores.forest,
  },
});
