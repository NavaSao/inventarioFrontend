import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Buscador, Encabezado, EstadoCarga, Insignia, Tarjeta, estilos } from '../../../shared/ui/componentes';
import { tema } from '../../../shared/ui/tema';
import { Empleado, IEmpleadosService } from '../models/types';
import { useEmpleadosViewModel } from '../viewmodels/useEmpleadosViewModel';

export const EmpleadosScreen: React.FC<{
  servicio: IEmpleadosService;
  onNuevo: () => void;
  onEditar: (empleado: Empleado) => void;
  onCerrarSesion: () => void;
}> = ({ servicio, onNuevo, onEditar, onCerrarSesion }) => {
  const vm = useEmpleadosViewModel(servicio);

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Empleados" subtitulo="Personas y accesos de tu organización." onAgregar={onNuevo} />
      <FlatList
        data={vm.empleados}
        keyExtractor={(e) => e.idEmpleado}
        contentContainerStyle={estilos.contenido}
        refreshing={false}
        onRefresh={vm.recargar}
        ListHeaderComponent={
          <>
            <Buscador valor={vm.busqueda} onCambiar={vm.setBusqueda} placeholder="Buscar empleado o área" />
            <View style={propios.resumen}>
              <Text style={propios.cifra}>{vm.totalActivos}</Text>
              <Text style={propios.leyenda}>empleados activos</Text>
              <View style={propios.separador} />
              <Text style={propios.cifra}>{vm.totalAreas}</Text>
              <Text style={propios.leyenda}>áreas de trabajo</Text>
            </View>
            <EstadoCarga
              cargando={vm.cargando}
              error={vm.error}
              vacio={vm.empleados.length === 0 ? 'No hay empleados que coincidan.' : undefined}
              onReintentar={vm.recargar}
            />
          </>
        }
        renderItem={({ item }) => (
          <Tarjeta onPress={() => onEditar(item)}>
            <View style={estilos.fila}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{item.nombre}</Text>
                <Text style={estilos.subtitulo}>{item.departamento} · {item.cargo}</Text>
              </View>
              {item.activo ? (
                <Text style={estilos.enlace}>
                  {item.licenciasAsignadas} {item.licenciasAsignadas === 1 ? 'licencia' : 'licencias'}
                </Text>
              ) : (
                <Insignia texto="Inactivo" tono="gris" />
              )}
            </View>
          </Tarjeta>
        )}
        ListFooterComponent={
          <Text style={[estilos.enlace, propios.salir]} onPress={onCerrarSesion} accessibilityRole="button">
            Cerrar sesión
          </Text>
        }
      />
    </View>
  );
};

const propios = StyleSheet.create({
  resumen: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tema.forest,
    borderRadius: tema.radioTarjeta, padding: 20, marginBottom: 16,
  },
  cifra: { color: tema.blanco, fontSize: 26, fontWeight: '700' },
  leyenda: { color: tema.mint, fontSize: 12, flex: 1 },
  separador: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(209,250,229,0.3)', marginHorizontal: 8 },
  salir: { textAlign: 'center', marginTop: 24, color: tema.rojo.texto },
});
