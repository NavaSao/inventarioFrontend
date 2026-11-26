import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmpleadoAsignado, LicenciaDetalle } from '../models/types';
import { LicenciasService } from '../services/LicenciasService';
import { Avatar, ESTADO_UI, Encabezado, formatearFecha, paleta, ui, useTipografia } from './detalleUi';

export interface EmpleadosAsignadosScreenProps {
  readonly licenciasService?: LicenciasService;
  readonly idLicencia: string;
  readonly onVolver?: () => void;
  /**
   * Acción «Liberar cupo» por empleado (HU07). Si se omite, el listado es de solo lectura.
   * Recibe la licencia actual para que el flujo de liberación muestre cupos y vigencia.
   */
  readonly renderLiberar?: (
    empleado: EmpleadoAsignado,
    licencia: LicenciaDetalle,
    alLiberar: (mensaje: string) => void
  ) => React.ReactNode;
}

/**
 * Capa View · Empleados asignados a una licencia (HU05 · Escenario 05.03).
 * Listado sobre el que se ejecuta la liberación de cupos (HU07).
 */
export const EmpleadosAsignadosScreen: React.FC<EmpleadosAsignadosScreenProps> = ({
  licenciasService,
  idLicencia,
  onVolver,
  renderLiberar,
}) => {
  const t = useTipografia();
  const [detalle, setDetalle] = useState<LicenciaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!licenciasService) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      setDetalle(await licenciasService.obtenerDetalle(idLicencia));
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el listado.');
    } finally {
      setCargando(false);
    }
  }, [licenciasService, idLicencia]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const alLiberar = (mensaje: string) => {
    setAviso(mensaje);
    void cargar();
  };

  return (
    <View style={styles.flex}>
      <Encabezado titulo="Empleados asignados" onVolver={onVolver} />

      {cargando && !detalle ? (
        <View style={ui.centro}>
          <ActivityIndicator color={paleta.emerald} size="large" />
        </View>
      ) : error ? (
        <View style={ui.centro}>
          <Text style={[styles.sub, t.regular, { textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity
            style={[ui.botonPrimario, { marginTop: 16, paddingHorizontal: 28 }]}
            onPress={() => void cargar()}
            accessibilityRole="button"
          >
            <Text style={[ui.botonPrimarioTexto, t.bold]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : detalle ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[ui.card, { marginBottom: 14 }]}>
            <View style={styles.filaEntre}>
              <Text style={[styles.software, t.bold]}>
                {detalle.software} · {detalle.plan}
              </Text>
              <View style={[styles.badge, { backgroundColor: ESTADO_UI[detalle.estado].bg }]}>
                <Text style={[{ color: ESTADO_UI[detalle.estado].texto, fontSize: 12 }, t.semibold]}>
                  {ESTADO_UI[detalle.estado].label}
                </Text>
              </View>
            </View>
            <Text style={[styles.sub, t.regular, { marginTop: 6 }]} testID="resumen-cupos">
              {detalle.cuposAsignados} de {detalle.cuposContratados} asignados · {detalle.cuposLibres}{' '}
              {detalle.cuposLibres === 1 ? 'libre' : 'libres'}
            </Text>
          </View>

          {aviso ? (
            <View style={styles.aviso} accessibilityRole="alert">
              <Text style={[styles.avisoTexto, t.semibold]}>{aviso}</Text>
            </View>
          ) : null}

          {detalle.empleadosAsignados.length === 0 ? (
            <View style={[ui.card, { alignItems: 'center', paddingVertical: 28 }]}>
              <Text style={[styles.software, t.semibold]}>Sin empleados asignados</Text>
              <Text style={[styles.sub, t.regular, { marginTop: 4 }]}>Todos los puestos de esta licencia están libres.</Text>
            </View>
          ) : (
            <View style={ui.card}>
              {detalle.empleadosAsignados.map((emp, i, arr) => (
                <View
                  key={emp.idAsignacionLicencia}
                  style={[styles.fila, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                  accessibilityLabel={`Empleado asignado ${emp.nombre}`}
                >
                  <Avatar nombre={emp.nombre} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nombre, t.semibold]}>{emp.nombre}</Text>
                    <Text style={[styles.meta, t.regular]}>
                      {[emp.departamento, emp.numeroEmpleado].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={[styles.meta, t.regular]}>Asignado el {formatearFecha(emp.asignadoEn)}</Text>
                  </View>
                  {renderLiberar?.(emp, detalle, alLiberar)}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
};

export default EmpleadosAsignadosScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: paleta.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  filaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  software: { fontSize: 15, color: paleta.texto, flexShrink: 1 },
  sub: { fontSize: 13, color: paleta.gris },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: paleta.borde },
  nombre: { fontSize: 14, color: paleta.texto },
  meta: { fontSize: 12, color: paleta.grisSub, marginTop: 2 },
  aviso: { backgroundColor: paleta.mint, borderRadius: 14, padding: 12, marginBottom: 12 },
  avisoTexto: { color: paleta.emerald, fontSize: 13 },
});
