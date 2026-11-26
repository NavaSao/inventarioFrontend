import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { ModalMovil } from '../../../shared/ui/ModalMovil';
import { Boton, Buscador, Encabezado, Tarjeta, estilos } from '../../../shared/ui/componentes';
import { tema } from '../../../shared/ui/tema';
import { IEmpleadosService } from '../../empleados/models/types';
import { useSelectorEmpleadoViewModel } from '../viewmodels/useSelectorEmpleadoViewModel';

/** Paso de asignación: «¿Quién lo necesita?» (PANTALLAS · Asignar). */
export const SelectorEmpleadoModal: React.FC<{
  visible: boolean;
  servicio: IEmpleadosService;
  nombreActivo: string;
  onConfirmar: (idEmpleado: string) => void;
  onCerrar: () => void;
}> = ({ visible, servicio, nombreActivo, onConfirmar, onCerrar }) => {
  const vm = useSelectorEmpleadoViewModel(servicio, visible);

  return (
    <ModalMovil visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.pantalla}>
        <Encabezado titulo="¿Quién lo necesita?" subtitulo={`Asignar ${nombreActivo}`} onVolver={onCerrar} />
        <FlatList
          data={vm.empleados}
          keyExtractor={(e) => e.idEmpleado}
          contentContainerStyle={estilos.contenido}
          ListHeaderComponent={
            <>
              <Buscador valor={vm.busqueda} onCambiar={vm.setBusqueda} placeholder="Buscar por nombre o correo" />
              {vm.error && <Text style={estilos.mensajeError}>{vm.error}</Text>}
            </>
          }
          renderItem={({ item }) => (
            <Tarjeta
              onPress={() => vm.setSeleccionado(item.idEmpleado)}
              estilo={vm.seleccionado === item.idEmpleado ? { borderColor: tema.emerald, backgroundColor: tema.mint } : undefined}
            >
              <Text style={estilos.nombre}>{item.nombre}</Text>
              <Text style={estilos.subtitulo}>{item.departamento} · {item.correo}</Text>
            </Tarjeta>
          )}
          ListFooterComponent={
            <Boton
              texto="Confirmar asignación"
              deshabilitado={!vm.seleccionado}
              onPress={() => vm.seleccionado && onConfirmar(vm.seleccionado)}
            />
          }
        />
      </View>
    </ModalMovil>
  );
};
