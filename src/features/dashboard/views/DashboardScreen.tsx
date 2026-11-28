import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { AlertaVencimiento, IDashboardAlertsReadRepository } from '../models/types';
import { DashboardService } from '../services/DashboardService';
import { useDashboardAlertsViewModel } from '../viewmodels/useDashboardAlertsViewModel';
import { useDashboardResumenViewModel } from '../viewmodels/useDashboardResumenViewModel';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { Licencia } from '../../licencias/models/types';
import {
  AppIconBadge,
  BellIcon,
  ClockIcon,
  DocumentIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  UsersIcon,
  WifiOffIcon,
  ZapIcon,
} from '../../../shared/components/Icons';

export interface DashboardScreenProps {
  readonly dashboardService?: DashboardService;
  readonly alertsRepository?: IDashboardAlertsReadRepository;
  readonly licenciasService?: LicenciasService;
  readonly nombreUsuario?: string;
  readonly onNavegarLicencias?: () => void;
  readonly onRevisarLicencia?: (licenciaId?: string, software?: string) => void;
}

export const colores = {
  // Paleta Oficial AssetOps (Figma): Forest, Emerald, Menta
  forest: '#0F382A',
  forestDark: '#09261C',
  forestLight: '#164E3A',
  emerald: '#107C41',
  emeraldLight: '#10B981',
  mint: '#D1FAE5',
  mintLight: '#ECFDF5',
  mintBorder: '#A7F3D0',
  background: '#F6F8F6',
  cardBg: '#FFFFFF',
  textDark: '#0F382A',
  textMuted: '#61746A',
  textSub: '#8D9F95',
  bordeCard: '#E8EFEA',
  bordeSutil: '#D9E3DC',
  // Semánticos
  ambarBg: '#FEF3C7',
  ambarBorde: '#FDE68A',
  ambarTexto: '#B45309',
  ambarBadge: '#FFFBEB',
  errorBg: '#FDECE9',
  errorTexto: '#9C2E24',
};

const fuentes = { Inter_400Regular, Inter_600SemiBold, Inter_700Bold };

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  dashboardService,
  alertsRepository,
  licenciasService,
  nombreUsuario,
  onNavegarLicencias,
  onRevisarLicencia,
}) => {
  const [fuentesListas] = useFonts(fuentes);
  const [modalActividadVisible, setModalActividadVisible] = useState(false);
  const [errorDescartado, setErrorDescartado] = useState(false);

  const resumenVm = useDashboardResumenViewModel(dashboardService, licenciasService);
  const alertsVm = useDashboardAlertsViewModel({
    alertsRepository: alertsRepository ?? dashboardService,
    onNavigateToLicense: (licenciaId, software) => {
      if (onRevisarLicencia) {
        onRevisarLicencia(licenciaId, software);
      } else if (onNavegarLicencias) {
        onNavegarLicencias();
      }
    },
  });

  const estadoCarga =
    alertsVm.errorConexion || resumenVm.estadoCarga === 'error_conexion'
      ? 'error_conexion'
      : alertsVm.cargando || resumenVm.estadoCarga === 'cargando'
      ? 'cargando'
      : 'exito';
  const errorMensaje = alertsVm.errorMensaje || resumenVm.errorMensaje;
  const refrescando = alertsVm.refrescando || resumenVm.refrescando;

  const handleRetry = () => {
    setErrorDescartado(false);
    void alertsVm.onRetry();
    void resumenVm.recargar();
  };

  const onRefresh = () => {
    setErrorDescartado(false);
    void alertsVm.onRefresh();
    void resumenVm.refrescar();
  };

  const regular = fuentesListas ? styles.interRegular : undefined;
  const semibold = fuentesListas ? styles.interSemibold : styles.semibold;
  const bold = fuentesListas ? styles.interBold : styles.bold;

  // Formato de fecha actual en español
  const fechaHoyFormateada = (() => {
    const ahora = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    const f = ahora.toLocaleDateString('es-ES', opciones);
    return f.charAt(0).toUpperCase() + f.slice(1);
  })();

  const saludo = nombreUsuario
    ? `Hola, ${nombreUsuario.split(' ')[0]}`
    : 'Hola, administradora';

  const { metricas, actividadReciente } = resumenVm.datos;
  const vencimientosMenos30Dias: AlertaVencimiento[] = alertsVm.alertas;
  const licencias = resumenVm.licencias;
  const hayDiferenciaCupos = metricas.cuposLibres > metricas.cuposAsignables;

  // Datos reales para el gráfico de barras verticales de ocupación
  const datosBarras = licencias.slice(0, 7).map((lic) => {
    const total = lic.cuposContratados || 1;
    const pct = Math.round((lic.cuposAsignados / total) * 100);
    const palabras = lic.software.trim().split(/\s+/);
    const label =
      palabras.length >= 2
        ? (palabras[0][0] + palabras[1][0]).toUpperCase()
        : lic.software.substring(0, 2).toUpperCase();
    return {
      id: lic.id,
      label,
      software: lic.software,
      pct,
      activo: pct >= 85,
    };
  });

  // Software en uso calculado a partir de las licencias reales del backend
  const softwareEnUso = licencias.slice(0, 5).map((lic) => {
    const color =
      lic.estado === 'vencida'
        ? '#DC2626'
        : lic.estado === 'por_vencer'
        ? '#D97706'
        : colores.emerald;
    return {
      id: lic.id,
      nombre: lic.software,
      ocupados: lic.cuposAsignados,
      total: lic.cuposContratados || 1,
      color,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colores.emerald} />
        }
      >
        {/* Header Superior Corporativo */}
        <View style={styles.headerRow}>
          <View style={styles.headerProfile}>
            <View style={styles.avatarCircle}>
              <Text style={[styles.avatarText, bold]}>
                {(nombreUsuario || 'US').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.saludo, bold]} accessibilityRole="header">
                {saludo}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerSquircleBtn}
              onPress={onNavegarLicencias}
              activeOpacity={0.8}
              accessibilityLabel="Buscar licencias"
            >
              <SearchIcon color={colores.forest} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerSquircleBtn}
              activeOpacity={0.8}
              accessibilityLabel="Notificaciones"
              accessibilityRole="button"
            >
              <BellIcon color={colores.forest} size={18} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de Estado: Cargando */}
        {estadoCarga === 'cargando' && (
          <View style={styles.loadingBanner} testID="estado-cargando">
            <ActivityIndicator size="small" color={colores.emerald} />
            <Text style={[styles.loadingTextSmall, regular]}>
              Sincronizando métricas de tu organización...
            </Text>
          </View>
        )}

        {/* Estado de Error de Conexión */}
        {estadoCarga === 'error_conexion' && !errorDescartado && (
          <View style={styles.errorCardContainer} testID="estado-error-conexion">
            <View style={styles.errorCard}>
              <View style={styles.errorIconWrap}>
                <WifiOffIcon color={colores.errorTexto} size={24} />
              </View>
              <Text style={[styles.errorTitle, bold]}>Fallo de conexión</Text>
              <Text style={[styles.errorDescription, regular]}>
                {errorMensaje || 'No se pudo contactar al servidor. Comprueba tu conexión a internet.'}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.85}
                accessibilityRole="button"
                testID="boton-reintentar"
              >
                <Text style={[styles.retryButtonText, bold]}>Reintentar conexión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => setErrorDescartado(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={[styles.dismissButtonText, semibold]}>Ocultar aviso y ver métricas</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hero Card Forest Elegante (#0F382A) con Widget Circular */}
        <View style={styles.heroCard} testID="tarjeta-metricas">
          <View style={styles.heroLeftCol}>
            <View style={styles.heroTagBadge}>
              <SparkleIcon color={colores.mint} size={13} />
              <Text style={[styles.heroTagText, bold]}>TU INVENTARIO, AL DÍA</Text>
            </View>

            <Text style={[styles.metricHero, bold]} testID="texto-cupos-totales">
              {metricas.cuposTotales} puestos de software
            </Text>

            <Text style={[styles.metricSubtitle, regular]}>
              {metricas.aplicacionesActivas} aplicaciones en tu organización
            </Text>

            <View style={styles.heroStatusBar}>
              <View style={styles.heroStatusDot} />
              <Text style={[styles.heroStatusText, semibold]}>Sincronizado en tiempo real</Text>
            </View>
          </View>

          {/* Widget Circular Donut Chart */}
          <View style={styles.donutWidget}>
            <View style={styles.donutRing}>
              <View style={styles.donutCenterCircle}>
                <Text style={[styles.donutNumber, bold]}>
                  {metricas.porcentajeUso}%
                </Text>
                <Text style={[styles.donutLabel, regular]}>en uso</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2 Columnas de Tarjetas Flotantes: Asignados y Disponibles */}
        <View style={styles.metricsTwoCol}>
          {/* Tarjeta Asignados */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <Text style={[styles.subMetricTitle, regular]}>Puestos activos</Text>
              <View style={[styles.subMetricIconBox, { backgroundColor: colores.mintLight }]}>
                <UsersIcon color={colores.emerald} size={16} />
              </View>
            </View>
            <Text style={[styles.splitValue, bold]} testID="texto-cupos-ocupados">
              {metricas.cuposOcupados} Asignados
            </Text>
            <Text style={[styles.splitSub, regular]}>
              {metricas.porcentajeUso}% de uso
            </Text>
          </View>

          {/* Tarjeta Disponibles */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <Text style={[styles.subMetricTitle, regular]}>Disponibilidad</Text>
              <View style={[styles.subMetricIconBox, { backgroundColor: '#E0F2FE' }]}>
                <ZapIcon color="#0284C7" size={16} />
              </View>
            </View>
            <Text style={[styles.splitValue, bold]} testID="texto-cupos-asignables">
              {metricas.cuposAsignables} Disponibles
            </Text>
            <Text style={[styles.splitSub, regular]}>
              Listos para asignar
            </Text>
          </View>
        </View>

        {/* Tooltip de distinción obligatoria de Cupos */}
        {hayDiferenciaCupos && (
          <View style={styles.tooltipCuposCard} testID="texto-auxiliar-cupos">
            <View style={styles.tooltipDot} />
            <Text style={[styles.tooltipCuposText, regular]}>
              {metricas.cuposLibres} libres en total ({metricas.cuposAsignables} asignables en contratos vigentes)
            </Text>
          </View>
        )}

        {/* SECCIÓN ESTADÍSTICA: Gráfico de Barras Verticales (se muestra al existir licencias) */}
        {datosBarras.length > 0 && (
          <View style={styles.chartSectionCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={[styles.chartSectionCategory, regular]}>Consumo de cupos</Text>
                <View style={styles.chartMainMetricRow}>
                  <Text style={[styles.chartMainValue, bold]}>{metricas.cuposOcupados}</Text>
                  <Text style={[styles.chartMainUnit, regular]}>puestos ocupados</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.chartActionBtn}
                onPress={onNavegarLicencias}
                activeOpacity={0.7}
              >
                <Text style={[styles.chartActionBtnText, bold]}>Detalle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.barChartContainer}>
              {datosBarras.map((item) => {
                const alturaBarra = Math.min(Math.max((item.pct / 120) * 110, 20), 110);
                return (
                  <View key={item.id} style={styles.barCol}>
                    <Text
                      style={[
                        styles.barPercentText,
                        regular,
                        item.activo && styles.barPercentTextActive,
                      ]}
                    >
                      {item.pct}%
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: alturaBarra },
                          item.activo ? styles.barFillActive : styles.barFillNormal,
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabelText,
                        regular,
                        item.activo && styles.barLabelTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Alerta de Vencimiento en tono cálido (#FEF3C7) */}
        {vencimientosMenos30Dias.length > 0 && (
          <View style={styles.alertaCard} testID="tarjeta-alerta-vencimiento">
            {vencimientosMenos30Dias.map((alerta, index) => {
              const esUltima = index === vencimientosMenos30Dias.length - 1;
              return (
                <View
                  key={alerta.id}
                  style={[styles.alertaRow, !esUltima && styles.alertaRowSeparador]}
                >
                  <View style={styles.alertaIconContainer}>
                    <ClockIcon color={colores.ambarTexto} size={20} />
                  </View>
                  <View style={styles.alertaContent}>
                    <View style={styles.alertaPill}>
                      <Text style={[styles.alertaPillText, bold]}>
                        VENCE EN {alerta.diasRestantes} DÍAS
                      </Text>
                    </View>
                    <Text style={[styles.alertaTitulo, bold]}>
                      {alerta.software} vence en {alerta.diasRestantes} días
                    </Text>
                    <Text style={[styles.alertaSubtexto, regular]}>
                      {alerta.cupos} puestos · Renueva antes del {alerta.finVigencia}
                    </Text>
                    <TouchableOpacity
                      onPress={() => alertsVm.onReviewLicense(alerta)}
                      activeOpacity={0.85}
                      style={styles.alertaBoton}
                      accessibilityRole="button"
                      accessibilityLabel="Revisar licencia"
                      testID="boton-revisar-licencia"
                    >
                      <Text style={[styles.alertaBotonTexto, bold]}>Revisar licencia →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Sección: Software en Uso (se muestra automáticamente al existir licencias) */}
        {softwareEnUso.length > 0 && (
          <View style={styles.softwareSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, bold]}>Software en uso</Text>
              <TouchableOpacity onPress={onNavegarLicencias} activeOpacity={0.7}>
                <Text style={[styles.linkVerTodo, bold]}>Ver catálogo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.softwareList}>
              {softwareEnUso.map((sw) => {
                const pct = Math.round((sw.ocupados / sw.total) * 100);
                return (
                  <TouchableOpacity
                    key={sw.id}
                    style={styles.softwareCard}
                    onPress={onNavegarLicencias}
                    activeOpacity={0.8}
                  >
                    <AppIconBadge software={sw.nombre} size={44} />
                    <View style={styles.softwareInfoCol}>
                      <View style={styles.softwareTitleRow}>
                        <Text style={[styles.softwareNombre, bold]}>{sw.nombre}</Text>
                        <Text style={[styles.softwarePct, bold, { color: sw.color }]}>
                          {pct}%
                        </Text>
                      </View>
                      <Text style={[styles.softwarePuestos, regular]}>
                        {sw.ocupados} de {sw.total} puestos ocupados
                      </Text>
                      <View style={styles.softwareProgressTrack}>
                        <View
                          style={[
                            styles.softwareProgressFill,
                            { width: `${pct}%`, backgroundColor: sw.color },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.softwareArrowPill}>
                      <Text style={[styles.softwareArrowText, bold]}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Sección: Actividad Reciente */}
        <View style={styles.actividadSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, bold]}>Actividad reciente</Text>
              <View style={styles.countPill}>
                <Text style={[styles.countPillText, semibold]}>{actividadReciente.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setModalActividadVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              testID="boton-ver-todo"
            >
              <Text style={[styles.linkVerTodo, bold]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actividadLista} testID="lista-actividad-reciente">
            {actividadReciente.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={[styles.actividadSubtexto, regular]}>
                  No hay actividad reciente registrada.
                </Text>
              </View>
            ) : (
              actividadReciente.slice(0, 4).map((act, index) => {
                const esAsignacion = act.tipo === 'asignacion';
                const esUltimo = index === Math.min(actividadReciente.length, 4) - 1;
                return (
                  <View
                    key={act.id}
                    style={[styles.actividadItem, esUltimo && styles.actividadItemUltimo]}
                  >
                    <AppIconBadge software={act.software} size={42} />
                    <View style={styles.actividadInfo}>
                      <Text style={[styles.actividadTitulo, semibold]}>{act.titulo}</Text>
                      <Text style={[styles.actividadSubtexto, regular]}>
                        Empleado:{' '}
                        <Text style={styles.empleadoHighlight}>
                          {typeof act.empleado === 'object' && act.empleado !== null
                            ? (act.empleado as any).nombre || (act.empleado as any).correo || 'Empleado'
                            : String(act.empleado || 'Empleado')}
                        </Text>
                      </Text>
                      <Text style={[styles.actividadFecha, regular]}>{act.fecha}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: esAsignacion ? colores.mintLight : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          semibold,
                          { color: esAsignacion ? colores.emerald : colores.textMuted },
                        ]}
                      >
                        {esAsignacion ? 'Asignado' : 'Liberado'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal Historial de Actividad */}
      {modalActividadVisible && (
        <Modal
          visible={modalActividadVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalActividadVisible(false)}
          testID="modal-actividad"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, bold]}>Historial de Actividad</Text>
                <Text style={[styles.modalSubtitle, regular]}>
                  {actividadReciente.length} eventos registrados en tu tenant
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalActividadVisible(false)}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                testID="boton-cerrar-modal-actividad"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {actividadReciente.map((act) => {
                const esAsignacion = act.tipo === 'asignacion';
                return (
                  <View key={act.id} style={styles.modalItem}>
                    <AppIconBadge software={act.software} size={44} />
                    <View style={styles.actividadInfo}>
                      <Text style={[styles.actividadTitulo, semibold]}>{act.titulo}</Text>
                      <Text style={[styles.actividadSubtexto, regular]}>
                        Empleado:{' '}
                      <Text style={styles.empleadoHighlight}>
                        {typeof act.empleado === 'object' && act.empleado !== null
                          ? (act.empleado as any).nombre || (act.empleado as any).correo || 'Empleado'
                          : String(act.empleado || 'Empleado')}
                      </Text>
                      </Text>
                      <Text style={[styles.modalItemFecha, regular]}>{act.fecha}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: esAsignacion ? colores.mintLight : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          semibold,
                          { color: esAsignacion ? colores.emerald : colores.textMuted },
                        ]}
                      >
                        {esAsignacion ? 'Asignado' : 'Liberado'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 110,
  },
  interRegular: { fontFamily: 'Inter_400Regular' },
  interSemibold: { fontFamily: 'Inter_600SemiBold' },
  interBold: { fontFamily: 'Inter_700Bold' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },

  // Header superior
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.mint,
    borderWidth: 2,
    borderColor: colores.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colores.forest,
    fontSize: 15,
  },
  headerGreeting: {
    fontSize: 12,
    color: colores.textMuted,
    lineHeight: 14,
  },
  saludo: {
    fontSize: 18,
    color: colores.forest,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSquircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    position: 'relative',
  },
  notificationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colores.emerald,
    position: 'absolute',
    top: 9,
    right: 9,
  },

  // Hero Card Forest (#0F382A)
  heroCard: {
    backgroundColor: colores.forest,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: colores.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroTagText: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: colores.mint,
  },
  metricHero: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginBottom: 10,
  },
  heroStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  heroStatusText: {
    fontSize: 11,
    color: '#D1FAE5',
  },

  // Widget Donut Circular
  donutWidget: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    borderColor: colores.emerald,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutNumber: {
    fontSize: 16,
    color: colores.forest,
    lineHeight: 18,
    letterSpacing: -0.5,
  },
  donutLabel: {
    fontSize: 9,
    color: colores.textMuted,
  },

  // 2 Columnas métricas
  metricsTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colores.bordeCard,
  },
  subMetricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subMetricTitle: {
    fontSize: 12,
    color: colores.textMuted,
  },
  subMetricIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitValue: {
    fontSize: 18,
    color: colores.forest,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  splitSub: {
    fontSize: 11,
    color: colores.textMuted,
  },

  // Tooltip
  tooltipCuposCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colores.emerald,
  },
  tooltipCuposText: {
    fontSize: 11,
    color: colores.textMuted,
    flex: 1,
  },

  // SECCIÓN GRÁFICO DE BARRAS VERTICALES
  chartSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.bordeCard,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  chartSectionCategory: {
    fontSize: 12,
    color: colores.textMuted,
    marginBottom: 2,
  },
  chartMainMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  chartMainValue: {
    fontSize: 26,
    color: colores.forest,
    letterSpacing: -0.8,
  },
  chartMainUnit: {
    fontSize: 13,
    color: colores.textMuted,
  },
  chartTargetText: {
    fontSize: 11,
    color: colores.textSub,
    marginLeft: 6,
  },
  chartTargetHighlight: {
    color: colores.emerald,
    fontWeight: '600',
  },
  chartActionBtn: {
    backgroundColor: colores.mintLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.mintBorder,
  },
  chartActionBtnText: {
    fontSize: 11,
    color: colores.emerald,
  },

  // Contenedor de barras
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barPercentText: {
    fontSize: 10,
    color: colores.textSub,
    marginBottom: 6,
  },
  barPercentTextActive: {
    color: colores.emerald,
    fontWeight: '700',
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFillNormal: {
    backgroundColor: '#A7F3D0',
  },
  barFillActive: {
    backgroundColor: colores.emerald,
  },
  barLabelText: {
    fontSize: 11,
    color: colores.textMuted,
    marginTop: 6,
  },
  barLabelTextActive: {
    color: colores.forest,
    fontWeight: '700',
  },

  // 2 Tarjetas Sparklines
  sparklinesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  sparklineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colores.bordeCard,
  },
  sparklineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sparklineIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparklineTitle: {
    fontSize: 12,
    color: colores.textMuted,
  },
  miniWaveBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 26,
    marginBottom: 8,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    marginBottom: 8,
    gap: 2,
  },
  pulseLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#A7F3D0',
  },
  pulsePeak: {
    width: 8,
    height: 16,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: colores.emerald,
  },
  pulseDrop: {
    width: 8,
    height: 16,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colores.emerald,
  },
  sparklineNumber: {
    fontSize: 17,
    color: colores.forest,
    letterSpacing: -0.3,
  },
  sparklineSub: {
    fontSize: 10,
    color: colores.textSub,
    marginTop: 1,
  },

  // Alerta
  alertaCard: {
    backgroundColor: colores.ambarBg,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colores.ambarBorde,
  },
  alertaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertaRowSeparador: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 83, 9, 0.18)',
  },
  alertaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertaContent: {
    flex: 1,
  },
  alertaPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  alertaPillText: {
    fontSize: 10,
    color: '#92400E',
    letterSpacing: 0.4,
  },
  alertaTitulo: {
    fontSize: 14,
    color: colores.ambarTexto,
    marginBottom: 2,
  },
  alertaSubtexto: {
    fontSize: 11,
    color: '#92400E',
    marginBottom: 10,
  },
  alertaBoton: {
    alignSelf: 'flex-start',
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  alertaBotonTexto: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  // Software en uso
  softwareSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: colores.forest,
    letterSpacing: -0.3,
  },
  linkVerTodo: {
    fontSize: 12,
    color: colores.emerald,
  },
  softwareList: {
    gap: 10,
  },
  softwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colores.bordeCard,
  },
  softwareInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  softwareTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  softwareNombre: {
    fontSize: 13,
    color: colores.forest,
  },
  softwarePct: {
    fontSize: 12,
  },
  softwarePuestos: {
    fontSize: 11,
    color: colores.textMuted,
    marginBottom: 6,
  },
  softwareProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  softwareProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  softwareArrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  softwareArrowText: {
    fontSize: 14,
    color: colores.forest,
  },

  // Actividad Reciente
  actividadSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    backgroundColor: colores.mintLight,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 11,
    color: colores.emerald,
  },
  actividadLista: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colores.bordeCard,
  },
  actividadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actividadItemUltimo: {
    borderBottomWidth: 0,
  },
  actividadInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  actividadTitulo: {
    fontSize: 13,
    color: colores.forest,
    marginBottom: 1,
  },
  actividadSubtexto: {
    fontSize: 11,
    color: colores.textMuted,
  },
  empleadoHighlight: {
    color: colores.forest,
    fontWeight: '600',
  },
  actividadFecha: {
    fontSize: 10,
    color: colores.textSub,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colores.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colores.bordeSutil,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 17,
    color: colores.forest,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colores.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: colores.textMuted,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
  },
  modalItemFecha: {
    fontSize: 10,
    color: colores.textSub,
    marginTop: 2,
  },

  // Estados de carga y error
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.mintLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colores.mintBorder,
  },
  loadingTextSmall: {
    fontSize: 12,
    color: colores.forest,
  },
  errorCardContainer: {
    marginBottom: 14,
  },
  errorCard: {
    backgroundColor: colores.errorBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 15,
    color: colores.errorTexto,
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colores.errorTexto,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  dismissButton: {
    paddingVertical: 4,
  },
  dismissButtonText: {
    color: colores.errorTexto,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
