import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ArrowLeftIcon, PlusIcon, SearchIcon } from '../components/Icons';
import { tema, Tono, tonos } from './tema';

export const Encabezado: React.FC<{
  titulo: string;
  subtitulo?: string;
  onVolver?: () => void;
  onAgregar?: () => void;
  accion?: { texto: string; onPress: () => void };
}> = ({ titulo, subtitulo, onVolver, onAgregar, accion }) => (
  <View style={estilos.encabezado}>
    <View style={estilos.fila}>
      {onVolver && (
        <TouchableOpacity onPress={onVolver} style={estilos.botonIcono} accessibilityLabel="Volver">
          <ArrowLeftIcon color={tema.forest} size={18} />
        </TouchableOpacity>
      )}
      <Text style={[estilos.titulo, onVolver && estilos.tituloSecundario]} accessibilityRole="header">
        {titulo}
      </Text>
      {accion && (
        <TouchableOpacity onPress={accion.onPress} accessibilityRole="button">
          <Text style={estilos.enlace}>{accion.texto}</Text>
        </TouchableOpacity>
      )}
      {onAgregar && (
        <TouchableOpacity onPress={onAgregar} style={estilos.botonAgregar} accessibilityLabel="Agregar">
          <PlusIcon size={18} />
        </TouchableOpacity>
      )}
    </View>
    {subtitulo && <Text style={estilos.subtitulo}>{subtitulo}</Text>}
  </View>
);

export const Boton: React.FC<{
  texto: string;
  onPress: () => void;
  variante?: 'principal' | 'secundario' | 'peligro';
  cargando?: boolean;
  deshabilitado?: boolean;
}> = ({ texto, onPress, variante = 'principal', cargando, deshabilitado }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={deshabilitado || cargando}
    style={[estilos.boton, estilos[variante], (deshabilitado || cargando) && estilos.inactivo]}
    accessibilityRole="button"
  >
    {cargando ? (
      <ActivityIndicator color={variante === 'principal' ? tema.blanco : tema.emerald} />
    ) : (
      <Text style={[estilos.textoBoton, variante !== 'principal' && estilos[`texto_${variante}`]]}>{texto}</Text>
    )}
  </TouchableOpacity>
);

export const Campo: React.FC<TextInputProps & { etiqueta: string; error?: string }> = ({
  etiqueta,
  error,
  ...props
}) => (
  <View style={estilos.campo}>
    <Text style={estilos.etiqueta}>{etiqueta}</Text>
    <TextInput
      placeholderTextColor="#8D9F95"
      accessibilityLabel={etiqueta}
      style={[estilos.input, !!error && estilos.inputError, props.editable === false && estilos.inactivo]}
      {...props}
    />
    {error && <Text style={estilos.error}>{error}</Text>}
  </View>
);

export const Buscador: React.FC<{ valor: string; onCambiar: (texto: string) => void; placeholder: string }> = ({
  valor,
  onCambiar,
  placeholder,
}) => (
  <View style={estilos.buscador}>
    <SearchIcon color={tema.textoSuave} size={16} />
    <TextInput
      value={valor}
      onChangeText={onCambiar}
      placeholder={placeholder}
      placeholderTextColor="#8D9F95"
      style={estilos.inputBuscador}
      accessibilityLabel={placeholder}
    />
  </View>
);

export const Insignia: React.FC<{ texto: string; tono: Tono }> = ({ texto, tono }) => (
  <View style={[estilos.insignia, { backgroundColor: tonos[tono].fondo }]}>
    <Text style={[estilos.textoInsignia, { color: tonos[tono].texto }]}>{texto}</Text>
  </View>
);

export const Tarjeta: React.FC<{ children: React.ReactNode; onPress?: () => void; estilo?: ViewStyle }> = ({
  children,
  onPress,
  estilo,
}) =>
  onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[estilos.tarjeta, estilo]}>
      {children}
    </TouchableOpacity>
  ) : (
    <View style={[estilos.tarjeta, estilo]}>{children}</View>
  );

/** Estado de carga / error con reintento / vacío (tolerancia a fallos de red). */
export const EstadoCarga: React.FC<{ cargando: boolean; error: string | null; vacio?: string; onReintentar: () => void }> = ({
  cargando,
  error,
  vacio,
  onReintentar,
}) => {
  if (cargando) return <ActivityIndicator style={estilos.estado} color={tema.emerald} />;
  if (error) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.mensajeError}>{error}</Text>
        <Boton texto="Reintentar" variante="secundario" onPress={onReintentar} />
      </View>
    );
  }
  return vacio ? <Text style={[estilos.estado, estilos.subtitulo]}>{vacio}</Text> : null;
};

export const Dato: React.FC<{ etiqueta: string; valor: string }> = ({ etiqueta, valor }) => (
  <View style={estilos.dato}>
    <Text style={estilos.subtitulo}>{etiqueta}</Text>
    <Text style={estilos.valorDato}>{valor}</Text>
  </View>
);

export const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: tema.fondo },
  contenido: { paddingHorizontal: tema.margen, paddingBottom: 110 },
  encabezado: { paddingHorizontal: tema.margen, paddingTop: 20, paddingBottom: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { flex: 1, fontSize: 28, fontWeight: '700', color: tema.texto, letterSpacing: -0.5 },
  tituloSecundario: { fontSize: 20 },
  subtitulo: { fontSize: 13, color: tema.textoSuave, marginTop: 4 },
  enlace: { color: tema.emerald, fontWeight: '700', fontSize: 14 },
  botonIcono: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: tema.blanco,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tema.borde,
  },
  botonAgregar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: tema.emerald,
    alignItems: 'center', justifyContent: 'center',
  },
  boton: {
    height: tema.altoBoton, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  principal: { backgroundColor: tema.emerald },
  secundario: { backgroundColor: tema.mint },
  peligro: { backgroundColor: tema.rojo.fondo },
  textoBoton: { color: tema.blanco, fontWeight: '700', fontSize: 15 },
  texto_secundario: { color: tema.emerald },
  texto_peligro: { color: tema.rojo.texto },
  inactivo: { opacity: 0.5 },
  campo: { marginBottom: 14 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: tema.texto, marginBottom: 6 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: tema.borde,
    backgroundColor: tema.blanco, paddingHorizontal: 16, fontSize: 15, color: tema.texto,
  },
  inputError: { borderColor: tema.rojo.texto },
  error: { color: tema.rojo.texto, fontSize: 12, marginTop: 4 },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 12,
    backgroundColor: tema.blanco, borderWidth: 1, borderColor: tema.borde, paddingHorizontal: 14, marginBottom: 12,
  },
  inputBuscador: { flex: 1, fontSize: 14, color: tema.texto },
  insignia: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  textoInsignia: { fontSize: 12, fontWeight: '700' },
  tarjeta: {
    backgroundColor: tema.blanco, borderRadius: tema.radioTarjeta, padding: 16,
    borderWidth: 1, borderColor: tema.borde, marginBottom: 10,
  },
  estado: { marginTop: 32, alignItems: 'center', textAlign: 'center' },
  mensajeError: { color: tema.rojo.texto, textAlign: 'center', marginBottom: 4 },
  dato: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  valorDato: { fontSize: 13, fontWeight: '600', color: tema.texto, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  nombre: { fontSize: 15, fontWeight: '700', color: tema.texto },
});
