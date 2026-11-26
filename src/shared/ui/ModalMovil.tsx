import React from 'react';
import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native';

/** Dimensiones del teléfono que simula la versión web (mismo marco que App.tsx). */
export const marcoMovil = StyleSheet.create({
  marco: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    ...Platform.select({
      web: { maxHeight: 930, borderRadius: 40, marginVertical: 12 },
      default: {},
    }),
  },
});

/**
 * Modal que en web se dibuja dentro del marco del teléfono en lugar de cubrir
 * toda la ventana del navegador. En Android/iOS es un Modal normal.
 */
export const ModalMovil: React.FC<ModalProps> = ({ children, transparent, ...props }) => {
  if (Platform.OS !== 'web') {
    return <Modal transparent={transparent} {...props}>{children}</Modal>;
  }
  return (
    <Modal transparent {...props}>
      <View style={[estilos.fondo, !transparent && estilos.fondoOpaco]}>
        <View style={[marcoMovil.marco, !transparent && estilos.marcoOpaco]}>{children}</View>
      </View>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fondoOpaco: { backgroundColor: '#090D16' },
  marcoOpaco: { backgroundColor: '#FFFFFF' },
});
