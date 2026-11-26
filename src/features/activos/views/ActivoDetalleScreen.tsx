import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, Dato, Encabezado, EstadoCarga, Insignia, Tarjeta, estilos } from '../../../shared/ui/componentes';
import { NotaModal } from '../../../shared/ui/NotaModal';
import { tema } from '../../../shared/ui/tema';
import { IEmpleadosService } from '../../empleados/models/types';
import { ActivoDetalle, ESTADOS_ACTIVO, IActivosService } from '../models/types';
import { useActivoDetalleViewModel } from '../viewmodels/useActivoDetalleViewModel';
import { SelectorEmpleadoModal } from './SelectorEmpleadoModal';

type Nota = { titulo: string; etiqueta: string; boton: string; obligatoria?: boolean; accion: (nota: string) => void };

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export const ActivoDetalleScreen: React.FC<{
  servicio: IActivosService;
  empleadosServicio: IEmpleadosService;
  idActivo: string;
  onVolver: () => void;
  onEditar: (activo: ActivoDetalle) => void;
}> = ({ servicio, empleadosServicio, idActivo, onVolver, onEditar }) => {
  const vm = useActivoDetalleViewModel(servicio, idActivo);
  const [asignando, setAsignando] = useState(false);
  const [nota, setNota] = useState<Nota | null>(null);
  const activo = vm.activo;

  return (
    <View style={estilos.pantalla}>
      <Encabezado
        titulo="Ficha del equipo"
        onVolver={onVolver}
        accion={activo ? { texto: 'Editar', onPress: () => onEditar(activo) } : undefined}
      />
      <ScrollView contentContainerStyle={estilos.contenido}>
        {!activo ? (
          <EstadoCarga cargando={vm.cargando} error={vm.error} onReintentar={vm.recargar} />
        ) : (
          <>
            <Tarjeta>
              {activo.fotoReferencia && (
                <Image source={{ uri: servicio.urlFoto(activo.fotoReferencia) }} style={propios.foto} accessibilityLabel="Foto del equipo" />
              )}
              <Text style={propios.nombre}>{activo.nombre}</Text>
              <Text style={estilos.subtitulo}>{[activo.marca, activo.modelo].filter(Boolean).join(' · ') || activo.categoria}</Text>
              <View style={{ marginTop: 10 }}>
                <Insignia {...ESTADOS_ACTIVO[activo.estado]} />
              </View>
            </Tarjeta>

            {activo.asignacionActual && (
              <Tarjeta estilo={propios.destacado}>
                <Text style={estilos.etiqueta}>Asignado a</Text>
                <Text style={estilos.nombre}>{activo.asignacionActual.empleado.nombre}</Text>
                <Text style={estilos.subtitulo}>
                  {activo.asignacionActual.empleado.departamento} · desde el {fecha(activo.asignacionActual.entregadoEn)}
                </Text>
              </Tarjeta>
            )}

            {activo.mantenimientoActual && (
              <Tarjeta estilo={{ backgroundColor: tema.ambar.fondo, borderColor: tema.ambar.fondo }}>
                <Text style={[estilos.etiqueta, { color: tema.ambar.texto }]}>
                  En mantenimiento desde el {fecha(activo.mantenimientoActual.iniciadoEn)}
                </Text>
                <Text style={estilos.subtitulo}>{activo.mantenimientoActual.notaInicial}</Text>
              </Tarjeta>
            )}

            <Tarjeta>
              <Text style={estilos.etiqueta}>Información del equipo</Text>
              <Dato etiqueta="Número de serie" valor={activo.numeroSerie} />
              <Dato etiqueta="Categoría" valor={activo.categoria} />
              <Dato etiqueta="Ubicación" valor={activo.ubicacion} />
              <Dato etiqueta="Etiqueta UUID" valor={activo.etiqueta} />
            </Tarjeta>

            {vm.aviso && <Text style={propios.aviso}>{vm.aviso}</Text>}
            {vm.error && <Text style={estilos.mensajeError}>{vm.error}</Text>}

            {activo.estado === 'DISPONIBLE' && (
              <>
                <Boton texto="Asignar a empleado" onPress={() => setAsignando(true)} cargando={vm.procesando} />
                <Boton
                  texto="Enviar a mantenimiento"
                  variante="secundario"
                  deshabilitado={vm.procesando}
                  onPress={() =>
                    setNota({
                      titulo: 'Enviar a mantenimiento',
                      etiqueta: 'Describe la falla o el servicio',
                      boton: 'Registrar salida',
                      obligatoria: true,
                      accion: vm.iniciarMantenimiento,
                    })
                  }
                />
              </>
            )}
            {activo.estado === 'ASIGNADO' && (
              <Boton
                texto="Registrar devolución"
                cargando={vm.procesando}
                onPress={() =>
                  setNota({ titulo: 'Registrar devolución', etiqueta: 'Estado del equipo al recibirlo', boton: 'Confirmar devolución', accion: vm.devolver })
                }
              />
            )}
            {activo.estado === 'EN_MANTENIMIENTO' && (
              <Boton
                texto="Cerrar mantenimiento"
                cargando={vm.procesando}
                onPress={() =>
                  setNota({ titulo: 'Cerrar mantenimiento', etiqueta: 'Resolución', boton: 'Marcar como disponible', accion: vm.cerrarMantenimiento })
                }
              />
            )}

            <SelectorEmpleadoModal
              visible={asignando}
              servicio={empleadosServicio}
              nombreActivo={activo.nombre}
              onCerrar={() => setAsignando(false)}
              onConfirmar={(idEmpleado) => {
                setAsignando(false);
                void vm.asignar(idEmpleado);
              }}
            />
          </>
        )}
      </ScrollView>

      {nota && (
        <NotaModal
          visible
          titulo={nota.titulo}
          etiqueta={nota.etiqueta}
          obligatoria={nota.obligatoria}
          textoConfirmar={nota.boton}
          onCerrar={() => setNota(null)}
          onConfirmar={(texto) => {
            setNota(null);
            nota.accion(texto);
          }}
        />
      )}
    </View>
  );
};

const propios = StyleSheet.create({
  foto: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, backgroundColor: tema.fondo },
  nombre: { fontSize: 22, fontWeight: '700', color: tema.texto },
  destacado: { backgroundColor: tema.mint, borderColor: tema.mint },
  aviso: { color: tema.emerald, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
