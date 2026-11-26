import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, Campo, Encabezado, estilos } from '../../../shared/ui/componentes';
import { CamaraModal } from '../../../shared/ui/CamaraModal';
import { tema } from '../../../shared/ui/tema';
import { Activo, IActivosService } from '../models/types';
import { useActivoFormViewModel } from '../viewmodels/useActivoFormViewModel';

export const ActivoFormScreen: React.FC<{
  servicio: IActivosService;
  activo?: Activo;
  etiquetaEscaneada?: string;
  onVolver: () => void;
  onGuardado: (idActivo: string) => void;
}> = ({ servicio, activo, etiquetaEscaneada, onVolver, onGuardado }) => {
  const vm = useActivoFormViewModel(servicio, activo, etiquetaEscaneada, onGuardado);
  const [camara, setCamara] = useState<'escaner' | 'foto' | null>(null);
  const fotoActual = vm.foto
    ? `data:image/jpeg;base64,${vm.foto}`
    : activo?.fotoReferencia && servicio.urlFoto(activo.fotoReferencia);

  return (
    <View style={estilos.pantalla}>
      <Encabezado
        titulo={activo ? 'Editar equipo' : 'Nuevo equipo'}
        subtitulo={etiquetaEscaneada ? 'Etiqueta sin registrar: asóciala a este equipo.' : 'Registra los datos del activo.'}
        onVolver={onVolver}
      />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {fotoActual ? <Image source={{ uri: fotoActual }} style={propios.foto} /> : null}
        <Boton texto={fotoActual ? 'Cambiar foto' : 'Tomar foto'} variante="secundario" onPress={() => setCamara('foto')} />
        <View style={{ height: 16 }} />

        <Campo etiqueta="Nombre *" placeholder="Ej. Laptop Dell Latitude 5440" value={vm.datos.nombre} onChangeText={vm.cambiar('nombre')} error={vm.errores.nombre} />
        <Campo etiqueta="Número de serie *" autoCapitalize="characters" value={vm.datos.numeroSerie} onChangeText={vm.cambiar('numeroSerie')} error={vm.errores.numeroSerie} />
        <Campo
          etiqueta="Etiqueta UUID *"
          placeholder="Escanea la etiqueta preimpresa"
          autoCapitalize="none"
          value={vm.datos.etiqueta}
          onChangeText={vm.cambiar('etiqueta')}
          error={vm.errores.etiqueta}
        />
        <Text style={[estilos.enlace, propios.escanear]} onPress={() => setCamara('escaner')} accessibilityRole="button">
          Escanear etiqueta
        </Text>
        <Campo etiqueta="Categoría *" placeholder="Ej. Laptop, Monitor, Periférico" value={vm.datos.categoria} onChangeText={vm.cambiar('categoria')} error={vm.errores.categoria} />
        <Campo etiqueta="Ubicación *" placeholder="Ej. Oficina CDMX · Piso 2" value={vm.datos.ubicacion} onChangeText={vm.cambiar('ubicacion')} error={vm.errores.ubicacion} />
        <Campo etiqueta="Marca" value={vm.datos.marca} onChangeText={vm.cambiar('marca')} />
        <Campo etiqueta="Modelo" value={vm.datos.modelo} onChangeText={vm.cambiar('modelo')} />

        {vm.error && <Text style={estilos.mensajeError}>{vm.error}</Text>}
        <Boton texto="Guardar equipo" onPress={vm.guardar} cargando={vm.guardando} />
      </ScrollView>

      <CamaraModal
        visible={camara === 'foto'}
        modo="foto"
        onCerrar={() => setCamara(null)}
        onFoto={(base64) => {
          vm.setFoto(base64);
          setCamara(null);
        }}
      />
      <CamaraModal
        visible={camara === 'escaner'}
        modo="escaner"
        onCerrar={() => setCamara(null)}
        onEscaneado={(codigo) => {
          vm.cambiar('etiqueta')(codigo);
          setCamara(null);
        }}
      />
    </View>
  );
};

const propios = StyleSheet.create({
  foto: { width: '100%', height: 180, borderRadius: tema.radioTarjeta, backgroundColor: tema.blanco },
  escanear: { marginTop: -6, marginBottom: 14 },
});
