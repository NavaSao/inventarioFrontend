import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generarUuid } from '../../../core/utils/uuid';
import { CheckCircleIcon, GridIcon, SearchIcon } from '../../../shared/components/Icons';
import { EmpleadoSeleccionable, LicenciaDetalle, PrevisualizacionAsignacion } from '../../licencias/models/types';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { Avatar, Encabezado, paleta, ui, useTipografia } from '../../licencias/views/detalleUi';

export interface AsignarLicenciaScreenProps {
  readonly licenciasService?: LicenciasService;
  readonly idLicencia: string;
  readonly onVolver?: () => void;
  /** Se invoca tras una asignación confirmada por el servidor. */
  readonly onAsignado?: (mensaje: string) => void;
  /** Retardo de búsqueda (ms); configurable para pruebas. */
  readonly retardoBusqueda?: number;
}

/**
 * Capa View · Asignar licencia, Paso 2 de 2 (HU06 · Figma «Asignar licencia»).
 * El Paso 1 es el Detalle de licencia. Aquí se elige al empleado, se previsualizan los puestos
 * resultantes y se confirma. La clave de asignación se conserva entre reintentos (RG14).
 */
export const AsignarLicenciaScreen: React.FC<AsignarLicenciaScreenProps> = ({
  licenciasService,
  idLicencia,
  onVolver,
  onAsignado,
  retardoBusqueda = 300,
}) => {
  const t = useTipografia();
  const [licencia, setLicencia] = useState<LicenciaDetalle | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState<EmpleadoSeleccionable[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<EmpleadoSeleccionable | null>(null);
  const [preview, setPreview] = useState<PrevisualizacionAsignacion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const clave = useRef<string | null>(null);

  const cargarLicencia = async () => {
    if (!licenciasService) return;
    setErrorCarga(null);
    try {
      setLicencia(await licenciasService.obtenerDetalle(idLicencia));
    } catch (e: any) {
      setErrorCarga(e?.message || 'No se pudo cargar la licencia.');
    }
  };

  useEffect(() => {
    void cargarLicencia();
  }, [licenciasService, idLicencia]);

  // Búsqueda de empleados activos (con retardo para no saturar la API mientras se escribe).
  useEffect(() => {
    if (!licenciasService) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda(null);
      try {
        const lista = await licenciasService.buscarEmpleadosParaAsignar(busqueda);
        if (!cancelado) setEmpleados(lista);
      } catch (e: any) {
        if (!cancelado) setErrorBusqueda(e?.message || 'No se pudieron cargar los empleados.');
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, busqueda ? retardoBusqueda : 0);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [licenciasService, busqueda, retardoBusqueda]);

  // Previsualización calculada por el servidor para el empleado elegido.
  useEffect(() => {
    setPreview(null);
    if (!licenciasService || !seleccionado) return;
    let cancelado = false;
    licenciasService
      .previsualizarAsignacion(idLicencia, seleccionado.idEmpleado)
      .then((p) => !cancelado && setPreview(p))
      .catch(() => undefined); // si falla, se usa el cálculo local y el servidor valida al confirmar
    return () => {
      cancelado = true;
    };
  }, [licenciasService, idLicencia, seleccionado]);

  const yaAsignados = useMemo(
    () => new Set(licencia?.empleadosAsignados.map((e) => e.idEmpleado) ?? []),
    [licencia]
  );
  const candidatos = empleados.filter((e) => e.activo && !yaAsignados.has(e.idEmpleado));

  const libres = licencia?.cuposLibres ?? 0;
  const libresResultantes = preview ? preview.cuposLibresResultantes : Math.max(0, libres - 1);
  const motivoLocal =
    licencia?.estado === 'vencida'
      ? 'La licencia está vencida: no admite nuevas asignaciones.'
      : licencia && licencia.cuposAsignables <= 0
      ? 'No hay puestos disponibles para asignar.'
      : null;
  const motivo = motivoLocal ?? (preview && !preview.puedeAsignar ? preview.motivoRechazo : null);
  const puedeConfirmar = !!seleccionado && !motivo && !enviando;

  const seleccionar = (emp: EmpleadoSeleccionable) => {
    if (enviando) return;
    const mismo = seleccionado?.idEmpleado === emp.idEmpleado;
    setSeleccionado(mismo ? null : emp);
    clave.current = mismo ? null : generarUuid();
    setErrorAsignar(null);
  };

  const confirmar = async () => {
    if (!licenciasService || !seleccionado || !puedeConfirmar) return;
    if (!clave.current) clave.current = generarUuid();
    setEnviando(true);
    setErrorAsignar(null);
    try {
      const r = await licenciasService.asignarLicencia(idLicencia, seleccionado.idEmpleado, clave.current);
      clave.current = null;
      const correo = r.correoNotificado ? ' Se notificó por correo.' : '';
      onAsignado?.(
        `${licencia?.software ?? 'Licencia'} asignada a ${seleccionado.nombre} · ${r.cuposLibres} ${
          r.cuposLibres === 1 ? 'puesto libre' : 'puestos libres'
        }.${correo}`
      );
    } catch (e: any) {
      // Se mantiene la clave: si el servidor ya guardó el movimiento, el reintento lo recupera.
      setErrorAsignar(e?.message || 'No se pudo asignar la licencia.');
      // Ante un rechazo del servidor se refrescan los cupos. Ante un fallo de red no: el movimiento
      // pudo guardarse y refrescar bloquearía el reintento que lo recupera.
      if (e?.name !== 'NetworkError') void cargarLicencia();
    } finally {
      setEnviando(false);
    }
  };

  if (errorCarga) {
    return (
      <View style={styles.flex}>
        <Encabezado titulo="Asignar licencia" onVolver={onVolver} />
        <View style={ui.centro}>
          <Text style={[styles.sub, t.regular, { textAlign: 'center' }]}>{errorCarga}</Text>
          <TouchableOpacity
            style={[ui.botonPrimario, { marginTop: 16, paddingHorizontal: 28 }]}
            onPress={() => void cargarLicencia()}
            accessibilityRole="button"
          >
            <Text style={[ui.botonPrimarioTexto, t.bold]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Encabezado titulo="Asignar licencia" onVolver={enviando ? undefined : onVolver} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.paso, t.bold]}>PASO 2 DE 2 · EMPLEADO</Text>
        <Text style={[styles.titulo, t.bold]}>¿Quién la necesita?</Text>
        <Text style={[styles.sub, t.regular]}>Selecciona un empleado para darle acceso.</Text>

        <View style={styles.licenciaCard}>
          <View style={styles.licenciaIcono}>
            <GridIcon color={paleta.emerald} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.licenciaNombre, t.bold]}>
              {licencia ? `${licencia.software} ${licencia.plan}` : 'Cargando licencia...'}
            </Text>
            {licencia ? (
              <Text style={[styles.licenciaSub, t.regular]} testID="puestos-disponibles">
                {licencia.cuposAsignables} {licencia.cuposAsignables === 1 ? 'puesto disponible' : 'puestos disponibles'}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.buscador}>
          <SearchIcon color={paleta.grisSub} size={16} />
          <TextInput
            style={[styles.buscadorInput, t.regular]}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre o correo"
            placeholderTextColor={paleta.grisSub}
            accessibilityLabel="Buscar por nombre o correo"
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.seccion, t.bold]}>{busqueda ? 'Resultados' : 'Sugeridos para asignar'}</Text>

        {errorBusqueda ? (
          <View style={ui.errorCaja}>
            <Text style={ui.errorTexto}>{errorBusqueda}</Text>
          </View>
        ) : buscando && empleados.length === 0 ? (
          <ActivityIndicator color={paleta.emerald} style={{ marginTop: 16 }} />
        ) : candidatos.length === 0 ? (
          <Text style={[styles.sub, t.regular]}>
            {busqueda ? 'Ningún empleado activo coincide con la búsqueda.' : 'No hay empleados activos disponibles.'}
          </Text>
        ) : (
          candidatos.map((emp) => {
            const activo = seleccionado?.idEmpleado === emp.idEmpleado;
            return (
              <TouchableOpacity
                key={emp.idEmpleado}
                style={[styles.empleado, activo && styles.empleadoActivo]}
                onPress={() => seleccionar(emp)}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo }}
                accessibilityLabel={`Seleccionar a ${emp.nombre}`}
              >
                <Avatar nombre={emp.nombre} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.empNombre, t.semibold]}>{emp.nombre}</Text>
                  <Text style={[styles.empMeta, t.regular]}>
                    {[emp.departamento, emp.correo].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={[styles.radio, activo && styles.radioActivo]}>
                  {activo ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Pie con previsualización y confirmación */}
      <View style={styles.pie}>
        <View style={styles.resumen}>
          <Text style={[styles.resumenTexto, t.semibold]}>
            {seleccionado ? '1 empleado seleccionado' : 'Ningún empleado seleccionado'}
          </Text>
          {seleccionado && !motivo ? (
            <Text style={[styles.resumenLibres, t.bold]} testID="libres-al-asignar">
              {libresResultantes} {libresResultantes === 1 ? 'libre' : 'libres'} al asignar
            </Text>
          ) : null}
        </View>
        {motivo ? <Text style={[styles.motivo, t.regular]}>{motivo}</Text> : null}
        {errorAsignar ? (
          <View style={[ui.errorCaja, { marginBottom: 10 }]} accessibilityRole="alert">
            <Text style={ui.errorTexto}>{errorAsignar}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[ui.botonPrimario, !puedeConfirmar && ui.botonDeshabilitado]}
          onPress={() => void confirmar()}
          disabled={!puedeConfirmar}
          accessibilityRole="button"
          accessibilityLabel={errorAsignar ? 'Reintentar asignación' : 'Confirmar asignación'}
          accessibilityState={{ disabled: !puedeConfirmar }}
        >
          {enviando ? (
            <ActivityIndicator color={paleta.white} />
          ) : (
            <>
              <CheckCircleIcon color={paleta.white} size={18} />
              <Text style={[ui.botonPrimarioTexto, t.bold, { marginLeft: 8 }]}>
                {errorAsignar ? 'Reintentar asignación' : 'Confirmar asignación'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.nota, t.regular]}>Se notificará al empleado por correo.</Text>
      </View>
    </View>
  );
};

export default AsignarLicenciaScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: paleta.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  paso: { fontSize: 11, letterSpacing: 1, color: paleta.emerald, marginTop: 4 },
  titulo: { fontSize: 26, color: paleta.texto, marginTop: 6 },
  sub: { fontSize: 13, color: paleta.gris, marginTop: 4 },
  licenciaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paleta.mint,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
  },
  licenciaIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: paleta.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  licenciaNombre: { fontSize: 15, color: paleta.texto },
  licenciaSub: { fontSize: 12, color: paleta.emerald, marginTop: 2 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6DDD8',
    backgroundColor: paleta.white,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  buscadorInput: { flex: 1, marginLeft: 10, fontSize: 14, color: paleta.texto },
  seccion: { fontSize: 14, color: paleta.texto, marginTop: 20, marginBottom: 10 },
  empleado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paleta.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paleta.borde,
    padding: 12,
    marginBottom: 8,
  },
  empleadoActivo: { borderColor: paleta.emerald, backgroundColor: paleta.mintLight },
  empNombre: { fontSize: 14, color: paleta.texto },
  empMeta: { fontSize: 12, color: paleta.grisSub, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9D3CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActivo: { backgroundColor: paleta.emerald, borderColor: paleta.emerald },
  check: { color: paleta.white, fontSize: 12, fontWeight: '700' },
  pie: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: paleta.borde,
    backgroundColor: paleta.white,
  },
  resumen: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resumenTexto: { fontSize: 13, color: paleta.texto },
  resumenLibres: { fontSize: 13, color: paleta.emerald },
  motivo: { fontSize: 12, color: paleta.rojoTexto, marginBottom: 10 },
  nota: { fontSize: 12, color: paleta.grisSub, textAlign: 'center', marginTop: 8 },
});
