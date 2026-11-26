import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Boton, Buscador, Encabezado, EstadoCarga, Insignia, Tarjeta, estilos } from '../../../shared/ui/componentes';
import { CamaraModal } from '../../../shared/ui/CamaraModal';
import { tema } from '../../../shared/ui/tema';
import { ESTADOS_ACTIVO, EstadoActivo, IActivosService } from '../models/types';
import { useActivosViewModel } from '../viewmodels/useActivosViewModel';

const FILTROS: (EstadoActivo | undefined)[] = [undefined, 'DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO'];

export const ActivosScreen: React.FC<{
  servicio: IActivosService;
  onAbrir: (idActivo: string) => void;
  onNuevo: (etiqueta?: string) => void;
}> = ({ servicio, onAbrir, onNuevo }) => {
  const vm = useActivosViewModel(servicio);
  const [escaneando, setEscaneando] = useState(false);

  const alEscanear = async (etiqueta: string) => {
    setEscaneando(false);
    const resultado = await vm.resolverEscaneo(etiqueta);
    if (resultado?.tipo === 'encontrado') onAbrir(resultado.idActivo);
    if (resultado?.tipo === 'nuevo') onNuevo(resultado.etiqueta);
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Equipos" subtitulo="Inventario de hardware de tu organización." onAgregar={() => onNuevo()} />
      <FlatList
        data={vm.activos}
        keyExtractor={(a) => a.idActivo}
        contentContainerStyle={estilos.contenido}
        ListHeaderComponent={
          <>
            <Boton texto="Escanear etiqueta" onPress={() => setEscaneando(true)} />
            <View style={{ height: 12 }} />
            <Buscador valor={vm.busqueda} onCambiar={vm.setBusqueda} placeholder="Buscar por nombre, serie o ubicación" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={propios.filtros}>
              {FILTROS.map((filtro) => (
                <TouchableOpacity
                  key={filtro ?? 'todos'}
                  onPress={() => vm.setEstado(filtro)}
                  style={[propios.filtro, vm.estado === filtro && propios.filtroActivo]}
                >
                  <Text style={[propios.textoFiltro, vm.estado === filtro && propios.textoFiltroActivo]}>
                    {filtro ? ESTADOS_ACTIVO[filtro].texto : 'Todos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EstadoCarga
              cargando={vm.cargando}
              error={vm.error}
              vacio={vm.activos.length === 0 ? 'No hay equipos registrados con ese criterio.' : undefined}
              onReintentar={vm.recargar}
            />
          </>
        }
        renderItem={({ item }) => (
          <Tarjeta onPress={() => onAbrir(item.idActivo)}>
            <Text style={estilos.nombre}>{item.nombre}</Text>
            <Text style={estilos.subtitulo}>
              {item.categoria} · Serie {item.numeroSerie} · {item.ubicacion}
            </Text>
            <View style={{ marginTop: 10 }}>
              <Insignia {...ESTADOS_ACTIVO[item.estado]} />
            </View>
          </Tarjeta>
        )}
      />
      <CamaraModal visible={escaneando} modo="escaner" onEscaneado={alEscanear} onCerrar={() => setEscaneando(false)} />
    </View>
  );
};

const propios = StyleSheet.create({
  filtros: { marginBottom: 12, flexGrow: 0 },
  filtro: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: tema.blanco, marginRight: 8, borderWidth: 1, borderColor: tema.borde },
  filtroActivo: { backgroundColor: tema.forest, borderColor: tema.forest },
  textoFiltro: { fontSize: 13, color: tema.textoSuave, fontWeight: '600' },
  textoFiltroActivo: { color: tema.blanco },
});
