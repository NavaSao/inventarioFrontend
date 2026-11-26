import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalMovil } from '../../../shared/ui/ModalMovil';
import { AppIconBadge, ArrowRightIcon, PlusIcon, UsersIcon, WifiOffIcon } from '../../../shared/components/Icons';
import { LicenciaDetalle } from '../models/types';
import { LicenciasService } from '../services/LicenciasService';
import { BarraProgreso, ESTADO_UI, Encabezado, formatearFecha, paleta, ui, useTipografia } from './detalleUi';

export const CORREO_SOPORTE_TI = process.env.EXPO_PUBLIC_CORREO_TI || 'ti@empresa.com';

export interface LicenciaDetalleScreenProps {
  readonly licenciasService?: LicenciasService;
  readonly idLicencia: string;
  readonly onVolver?: () => void;
  /** Abre el listado de empleados asignados (desde donde se liberan cupos · HU07). */
  readonly onVerAsignados?: (licencia: LicenciaDetalle) => void;
  /** Paso 1 → Paso 2 del flujo guiado de asignación (HU06). */
  readonly onAsignar?: (licencia: LicenciaDetalle) => void;
  /** Mensaje de un movimiento recién completado (asignación/liberación). */
  readonly aviso?: string | null;
}

/** Construye el enlace de correo con la solicitud de renovación dirigida a TI. */
export function construirSolicitudRenovacion(lic: LicenciaDetalle, correo = CORREO_SOPORTE_TI): string {
  const asunto = `Solicitud de renovación · ${lic.software} (${lic.codigoLicencia})`;
  const cuerpo = [
    'Solicito la renovación de la siguiente licencia:',
    '',
    `Software: ${lic.software} · ${lic.plan}`,
    `ID de licencia: ${lic.codigoLicencia}`,
    `Periodicidad: ${lic.periodicidad}`,
    `Fin de vigencia: ${formatearFecha(lic.finVigencia)}`,
    `Puestos contratados: ${lic.cuposContratados} (${lic.cuposAsignados} asignados)`,
  ].join('\n');
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

function textoVigencia(lic: LicenciaDetalle): string {
  const fin = formatearFecha(lic.finVigencia);
  if (lic.estado === 'vencida') return `Venció el ${fin} · No admite nuevas asignaciones`;
  if (lic.estado === 'por_vencer') {
    const dias = Math.max(0, lic.diasParaVencer);
    return `Vence el ${fin} · Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }
  return `Vigente hasta el ${fin}`;
}

/**
 * Capa View · Detalle de licencia (HU05 · Escenario 05.03 · Figma «Detalle de licencia»).
 * Muestra vigencia, cupos, ocupación, ID de licencia, empleados asignados y la opción de renovación.
 * Es el Paso 1 del flujo guiado de asignación (HU06).
 */
export const LicenciaDetalleScreen: React.FC<LicenciaDetalleScreenProps> = ({
  licenciasService,
  idLicencia,
  onVolver,
  onVerAsignados,
  onAsignar,
  aviso,
}) => {
  const t = useTipografia();
  const [detalle, setDetalle] = useState<LicenciaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renovacionVisible, setRenovacionVisible] = useState(false);
  const [renovacionEstado, setRenovacionEstado] = useState<'idle' | 'enviada' | 'error'>('idle');

  const cargar = useCallback(async () => {
    if (!licenciasService) {
      setCargando(false);
      return;
    }
    setError(null);
    try {
      setDetalle(await licenciasService.obtenerDetalle(idLicencia));
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la licencia.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [licenciasService, idLicencia]);

  useEffect(() => {
    setCargando(true);
    void cargar();
  }, [cargar]);

  const solicitarRenovacion = async () => {
    if (!detalle) return;
    try {
      await Linking.openURL(construirSolicitudRenovacion(detalle));
      setRenovacionEstado('enviada');
    } catch {
      setRenovacionEstado('error');
    }
  };

  if (cargando) {
    return (
      <View style={styles.flex}>
        <Encabezado titulo="Detalle de licencia" onVolver={onVolver} />
        <View style={ui.centro}>
          <ActivityIndicator color={paleta.emerald} size="large" />
          <Text style={[styles.sub, t.regular, { marginTop: 12 }]}>Cargando licencia...</Text>
        </View>
      </View>
    );
  }

  // Escenario de error: una carga fallida nunca se presenta como una licencia vacía.
  if (error || !detalle) {
    return (
      <View style={styles.flex}>
        <Encabezado titulo="Detalle de licencia" onVolver={onVolver} />
        <View style={ui.centro}>
          <WifiOffIcon color="#DC2626" size={32} />
          <Text style={[styles.errorTitulo, t.bold]}>No se pudo cargar la licencia</Text>
          <Text style={[styles.sub, t.regular, { textAlign: 'center' }]}>{error || 'Sin datos del servidor.'}</Text>
          <TouchableOpacity
            style={[ui.botonPrimario, { marginTop: 20, paddingHorizontal: 28 }]}
            onPress={() => {
              setCargando(true);
              void cargar();
            }}
            accessibilityRole="button"
          >
            <Text style={[ui.botonPrimarioTexto, t.bold]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const estado = ESTADO_UI[detalle.estado];
  const puedeAsignar = detalle.estado !== 'vencida' && detalle.cuposAsignables > 0;
  const motivoBloqueo =
    detalle.estado === 'vencida'
      ? 'La licencia está vencida: no admite nuevas asignaciones.'
      : detalle.cuposLibres === 0
      ? 'No hay puestos libres en esta licencia.'
      : detalle.cuposAsignables === 0
      ? 'La vigencia de esta licencia aún no inicia.'
      : null;
  const nAsignados = detalle.empleadosAsignados.length;

  return (
    <View style={styles.flex}>
      <Encabezado titulo="Detalle de licencia" onVolver={onVolver} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              void cargar();
            }}
            tintColor={paleta.emerald}
          />
        }
      >
        {aviso ? (
          <View style={styles.aviso} accessibilityRole="alert">
            <Text style={[styles.avisoTexto, t.semibold]}>{aviso}</Text>
          </View>
        ) : null}

        {/* Encabezado de la licencia */}
        <View style={[ui.card, styles.filaCentro]}>
          <AppIconBadge software={detalle.software} size={52} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.titulo, t.bold]}>{detalle.software}</Text>
            <Text style={[styles.sub, t.regular]}>
              {detalle.plan} · Plan {detalle.periodicidad.toLowerCase()}
            </Text>
            <View style={[styles.badge, { backgroundColor: estado.bg }]}>
              <Text style={[styles.badgeTexto, { color: estado.texto }, t.semibold]}>{estado.label}</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de ocupación */}
        <View style={styles.ocupacion} accessibilityLabel="Ocupación de la licencia">
          <View style={styles.filaEntre}>
            <View>
              <Text style={[styles.ocupacionNumero, t.bold]} testID="cupos-asignados">
                {detalle.cuposAsignados} / {detalle.cuposContratados}
              </Text>
              <Text style={[styles.ocupacionSub, t.regular]}>puestos asignados</Text>
            </View>
            <View style={styles.libresPill}>
              <Text style={[styles.libresTexto, t.bold]} testID="cupos-libres">
                {detalle.cuposLibres} {detalle.cuposLibres === 1 ? 'libre' : 'libres'}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <BarraProgreso porcentaje={detalle.porcentajeOcupacion} color={paleta.mint} fondo="rgba(255,255,255,0.15)" />
          </View>
          <Text style={[styles.ocupacionSub, t.regular, { marginTop: 8 }]} testID="porcentaje-ocupacion">
            {detalle.porcentajeOcupacion}% de ocupación
          </Text>
        </View>

        {/* Vigencia */}
        <View style={[styles.vigencia, { backgroundColor: estado.bg }]}>
          <Text style={[{ color: estado.texto, fontSize: 13 }, t.semibold]}>{textoVigencia(detalle)}</Text>
        </View>

        {/* Información */}
        <Text style={[styles.seccion, t.bold]}>Información de la licencia</Text>
        <View style={ui.card}>
          {[
            ['ID de licencia', detalle.codigoLicencia],
            ['Renovación', detalle.periodicidad],
            ['Inicio de vigencia', formatearFecha(detalle.inicioVigencia)],
            ['Fin de vigencia', formatearFecha(detalle.finVigencia)],
            ...(detalle.proveedor ? [['Proveedor', detalle.proveedor]] : []),
          ].map(([k, v], i, arr) => (
            <View key={k} style={[styles.filaEntre, styles.infoFila, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={[styles.sub, t.regular]}>{k}</Text>
              <Text style={[styles.infoValor, t.semibold]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Empleados asignados */}
        <TouchableOpacity
          style={[ui.card, styles.filaCentro, { marginTop: 14 }]}
          onPress={() => onVerAsignados?.(detalle)}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${nAsignados} empleados asignados`}
        >
          <UsersIcon color={paleta.emerald} size={20} />
          <Text style={[styles.verAsignados, t.semibold]}>
            Ver {nAsignados} {nAsignados === 1 ? 'empleado asignado' : 'empleados asignados'}
          </Text>
          <ArrowRightIcon color={paleta.gris} size={14} />
        </TouchableOpacity>

        {/* Acciones */}
        <TouchableOpacity
          style={[ui.botonPrimario, { marginTop: 20 }, !puedeAsignar && ui.botonDeshabilitado]}
          onPress={() => puedeAsignar && onAsignar?.(detalle)}
          disabled={!puedeAsignar}
          accessibilityRole="button"
          accessibilityLabel="Asignar licencia"
          accessibilityState={{ disabled: !puedeAsignar }}
        >
          <PlusIcon color={paleta.white} size={16} />
          <Text style={[ui.botonPrimarioTexto, t.bold, { marginLeft: 8 }]}>Asignar licencia</Text>
        </TouchableOpacity>
        {motivoBloqueo ? (
          <Text style={[styles.motivo, t.regular]}>{motivoBloqueo}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.renovar}
          onPress={() => {
            setRenovacionEstado('idle');
            setRenovacionVisible(true);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.renovarTexto, t.semibold]}>Solicitar renovación</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmación de renovación */}
      <ModalMovil visible={renovacionVisible} transparent animationType="fade" onRequestClose={() => setRenovacionVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            {renovacionEstado === 'enviada' ? (
              <>
                <Text style={[styles.titulo, t.bold]}>Solicitud preparada</Text>
                <Text style={[styles.sub, t.regular, { marginTop: 8 }]}>
                  Se abrió tu aplicación de correo con la solicitud de renovación de {detalle.software} dirigida a{' '}
                  {CORREO_SOPORTE_TI}. Envíala para completar el trámite.
                </Text>
                <TouchableOpacity
                  style={[ui.botonPrimario, { marginTop: 20 }]}
                  onPress={() => setRenovacionVisible(false)}
                  accessibilityRole="button"
                >
                  <Text style={[ui.botonPrimarioTexto, t.bold]}>Entendido</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.titulo, t.bold]}>Solicitar renovación</Text>
                <Text style={[styles.sub, t.regular, { marginTop: 8 }]}>
                  Se enviará a TI ({CORREO_SOPORTE_TI}) la solicitud para renovar {detalle.software} ·{' '}
                  {detalle.codigoLicencia}, que {detalle.estado === 'vencida' ? 'venció' : 'vence'} el{' '}
                  {formatearFecha(detalle.finVigencia)}. La renovación crea un nuevo periodo de vigencia.
                </Text>
                {renovacionEstado === 'error' ? (
                  <View style={[ui.errorCaja, { marginTop: 12 }]}>
                    <Text style={ui.errorTexto}>
                      No se pudo abrir la aplicación de correo. Escribe a {CORREO_SOPORTE_TI}.
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[ui.botonPrimario, { marginTop: 20 }]}
                  onPress={() => void solicitarRenovacion()}
                  accessibilityRole="button"
                >
                  <Text style={[ui.botonPrimarioTexto, t.bold]}>Enviar solicitud</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renovar} onPress={() => setRenovacionVisible(false)} accessibilityRole="button">
                  <Text style={[styles.renovarTexto, t.semibold]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ModalMovil>
    </View>
  );
};

export default LicenciaDetalleScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: paleta.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  filaCentro: { flexDirection: 'row', alignItems: 'center' },
  filaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 20, color: paleta.texto },
  sub: { fontSize: 13, color: paleta.gris },
  errorTitulo: { fontSize: 17, color: paleta.texto, marginTop: 12, marginBottom: 6 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeTexto: { fontSize: 12 },
  ocupacion: { backgroundColor: paleta.forest, borderRadius: 20, padding: 20, marginTop: 14 },
  ocupacionNumero: { fontSize: 34, color: paleta.white },
  ocupacionSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  libresPill: { backgroundColor: paleta.emerald, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  libresTexto: { color: paleta.white, fontSize: 13 },
  vigencia: { borderRadius: 14, padding: 14, marginTop: 14 },
  seccion: { fontSize: 16, color: paleta.texto, marginTop: 22, marginBottom: 10 },
  infoFila: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: paleta.borde },
  infoValor: { fontSize: 13, color: paleta.texto },
  verAsignados: { flex: 1, marginLeft: 12, fontSize: 14, color: paleta.texto },
  motivo: { fontSize: 12, color: paleta.rojoTexto, textAlign: 'center', marginTop: 8 },
  renovar: { alignItems: 'center', paddingVertical: 14 },
  renovarTexto: { color: paleta.emerald, fontSize: 14 },
  aviso: { backgroundColor: paleta.mint, borderRadius: 14, padding: 12, marginBottom: 12 },
  avisoTexto: { color: paleta.emerald, fontSize: 13 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(15,56,42,0.45)', justifyContent: 'center', padding: 24 },
  modalCaja: { backgroundColor: paleta.white, borderRadius: 20, padding: 22 },
});
