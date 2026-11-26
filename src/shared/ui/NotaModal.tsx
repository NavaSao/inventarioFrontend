import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { ModalMovil } from './ModalMovil';
import { Boton, Campo } from './componentes';
import { tema } from './tema';

/** Pide una nota antes de confirmar un movimiento (obligatoria para iniciar mantenimiento). */
export const NotaModal: React.FC<{
  visible: boolean;
  titulo: string;
  etiqueta: string;
  obligatoria?: boolean;
  textoConfirmar: string;
  onConfirmar: (nota: string) => void;
  onCerrar: () => void;
}> = ({ visible, titulo, etiqueta, obligatoria, textoConfirmar, onConfirmar, onCerrar }) => {
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string>();

  const confirmar = () => {
    if (obligatoria && !nota.trim()) {
      setError('La nota es obligatoria.');
      return;
    }
    onConfirmar(nota.trim());
    setNota('');
    setError(undefined);
  };

  return (
    <ModalMovil visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.fondo}>
        <View style={estilos.hoja}>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Campo
            etiqueta={`${etiqueta}${obligatoria ? ' *' : ' (opcional)'}`}
            value={nota}
            onChangeText={(texto) => { setNota(texto); setError(undefined); }}
            error={error}
            multiline
            maxLength={500}
            style={estilos.area}
          />
          <Boton texto={textoConfirmar} onPress={confirmar} />
          <Boton texto="Cancelar" variante="secundario" onPress={onCerrar} />
        </View>
      </KeyboardAvoidingView>
    </ModalMovil>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,56,42,0.45)' },
  hoja: { backgroundColor: tema.blanco, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: tema.margen, paddingBottom: 36 },
  titulo: { fontSize: 20, fontWeight: '700', color: tema.texto, marginBottom: 16 },
  area: {
    minHeight: 96, borderRadius: 12, borderWidth: 1, borderColor: tema.borde,
    padding: 14, fontSize: 15, color: tema.texto, textAlignVertical: 'top',
  },
});
