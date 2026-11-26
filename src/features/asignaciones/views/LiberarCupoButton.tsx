import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModalMovil } from '../../../shared/ui/ModalMovil';
import { generarUuid } from '../../../core/utils/uuid';
import { EmpleadoAsignado, LicenciaDetalle } from '../../licencias/models/types';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import {
  fechaHoyIso,
  formatearFecha,
  paleta,
  parsearFecha,
  ui,
  useTipografia,
} from '../../licencias/views/detalleUi';

export interface LiberarCupoButtonProps {
  readonly licenciasService?: LicenciasService;
  readonly empleado: EmpleadoAsignado;
  readonly licencia: LicenciaDetalle;
  readonly onLiberado?: (mensaje: string) => void;
}

/** Valida la fecha de liberación: formato AAAA-MM-DD, no futura y no anterior a la asignación. */
export function validarFechaLiberacion(fecha: string, asignadoEn: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'Usa el formato AAAA-MM-DD.';
  const f = parsearFecha(fecha);
  const [y, m, d] = fecha.split('-').map(Number);
  if (!f || f.getFullYear() !== y || f.getMonth() + 1 !== m || f.getDate() !== d) return 'La fecha no es válida.';
  if (fecha > fechaHoyIso()) return 'La fecha no puede ser futura.';
  const asignacion = parsearFecha(asignadoEn);
  if (asignacion) {
    const dia = new Date(asignacion.getFullYear(), asignacion.getMonth(), asignacion.getDate());
    if (f < dia) return 'La fecha no puede ser anterior a la asignación.';
  }
  return null;
}

/**
 * HU07 · Liberar un cupo de licencia: botón por empleado + confirmación.
 * La clave de liberación se conserva entre reintentos para no duplicar el movimiento (RG14).
 */
export const LiberarCupoButton: React.FC<LiberarCupoButtonProps> = ({
  licenciasService,
  empleado,
  licencia,
  onLiberado,
}) => {
  const t = useTipografia();
  const [visible, setVisible] = useState(false);
  const [fecha, setFecha] = useState(fechaHoyIso());
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clave = useRef<string | null>(null);

  const errorFecha = validarFechaLiberacion(fecha, empleado.asignadoEn);
  const vencida = licencia.estado === 'vencida';

  const abrir = () => {
    clave.current = generarUuid();
    setFecha(fechaHoyIso());
    setError(null);
    setVisible(true);
  };

  const cerrar = () => {
    if (enviando) return;
    clave.current = null;
    setVisible(false);
  };

  const confirmar = async () => {
    if (!licenciasService || errorFecha || enviando) return;
    if (!clave.current) clave.current = generarUuid();
    setEnviando(true);
    setError(null);
    try {
      const r = await licenciasService.liberarCupo(empleado.idAsignacionLicencia, clave.current, fecha);
      clave.current = null;
      setVisible(false);
      onLiberado?.(
        vencida
          ? `Cupo de ${empleado.nombre} liberado y cerrado en el historial. La licencia sigue vencida.`
          : `Cupo de ${empleado.nombre} liberado · ${r.cuposLibres} ${r.cuposLibres === 1 ? 'puesto libre' : 'puestos libres'} · ${r.porcentajeOcupacion}% de ocupación`
      );
    } catch (e: any) {
      // Se conserva la clave: el reintento recupera el movimiento previo si ya se guardó.
      setError(e?.message || 'No se pudo liberar el cupo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.boton}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`Liberar cupo de ${empleado.nombre}`}
      >
        <Text style={[styles.botonTexto, t.semibold]}>Liberar</Text>
      </TouchableOpacity>

      <ModalMovil visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={styles.fondo}>
          <View style={styles.caja}>
            <Text style={[styles.titulo, t.bold]}>Liberar cupo</Text>
            <Text style={[styles.sub, t.regular]}>
              Se retirará {licencia.software} a {empleado.nombre}. El movimiento queda registrado en el historial con
              la fecha y el administrador que lo realiza.
            </Text>

            <View style={styles.resumen}>
              <View style={styles.filaEntre}>
                <Text style={[styles.sub, t.regular]}>Puestos libres</Text>
                <Text style={[styles.valor, t.bold]} testID="preview-libres">
                  {licencia.cuposLibres} → {Math.min(licencia.cuposContratados, licencia.cuposLibres + 1)}
                </Text>
              </View>
              <View style={[styles.filaEntre, { marginTop: 6 }]}>
                <Text style={[styles.sub, t.regular]}>Asignado desde</Text>
                <Text style={[styles.valor, t.semibold]}>{formatearFecha(empleado.asignadoEn)}</Text>
              </View>
            </View>

            {vencida ? (
              <View style={styles.alertaVencida}>
                <Text style={[{ color: paleta.rojoTexto, fontSize: 12 }, t.semibold]}>
                  La licencia está vencida: el cupo se cerrará en el historial, pero no habilitará nuevas
                  asignaciones.
                </Text>
              </View>
            ) : null}

            <Text style={[styles.label, t.semibold]}>Fecha de liberación</Text>
            <TextInput
              style={[styles.input, errorFecha ? styles.inputError : null]}
              value={fecha}
              onChangeText={setFecha}
              placeholder="AAAA-MM-DD"
              accessibilityLabel="Fecha de liberación"
              maxLength={10}
              editable={!enviando}
            />
            {errorFecha ? <Text style={styles.errorCampo}>{errorFecha}</Text> : null}

            {error ? (
              <View style={[ui.errorCaja, { marginTop: 12 }]} accessibilityRole="alert">
                <Text style={ui.errorTexto}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.confirmar, (!!errorFecha || enviando) && ui.botonDeshabilitado]}
              onPress={() => void confirmar()}
              disabled={!!errorFecha || enviando}
              accessibilityRole="button"
              accessibilityLabel={error ? 'Reintentar liberación' : 'Confirmar liberación'}
              accessibilityState={{ disabled: !!errorFecha || enviando }}
            >
              {enviando ? (
                <ActivityIndicator color={paleta.white} />
              ) : (
                <Text style={[ui.botonPrimarioTexto, t.bold]}>{error ? 'Reintentar liberación' : 'Confirmar liberación'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelar} onPress={cerrar} accessibilityRole="button">
              <Text style={[{ color: paleta.gris, fontSize: 14 }, t.semibold]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalMovil>
    </>
  );
};

export default LiberarCupoButton;

const styles = StyleSheet.create({
  boton: {
    borderWidth: 1,
    borderColor: '#F5C2C2',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonTexto: { color: paleta.rojoTexto, fontSize: 13 },
  fondo: { flex: 1, backgroundColor: 'rgba(15,56,42,0.45)', justifyContent: 'center', padding: 24 },
  caja: { backgroundColor: paleta.white, borderRadius: 20, padding: 22 },
  titulo: { fontSize: 20, color: paleta.texto, marginBottom: 8 },
  sub: { fontSize: 13, color: paleta.gris, lineHeight: 18 },
  valor: { fontSize: 14, color: paleta.texto },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumen: { backgroundColor: paleta.bg, borderRadius: 14, padding: 14, marginTop: 14 },
  alertaVencida: { backgroundColor: paleta.rojoBg, borderRadius: 12, padding: 12, marginTop: 12 },
  label: { fontSize: 13, color: paleta.texto, marginTop: 16, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDD8',
    paddingHorizontal: 14,
    fontSize: 15,
    color: paleta.texto,
    backgroundColor: paleta.white,
  },
  inputError: { borderColor: '#DC2626' },
  errorCampo: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  confirmar: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  cancelar: { alignItems: 'center', paddingVertical: 12 },
});
