import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ComputerIcon, GridIcon, HomeIcon, UsersIcon } from '../../shared/components/Icons';

export type PestanaNavegacion = 'inicio' | 'licencias' | 'equipos' | 'empleados';

export interface BottomBarProps {
  readonly pestanaActiva: PestanaNavegacion;
  readonly onSeleccionarPestana: (pestana: PestanaNavegacion) => void;
}

const PESTANAS: { id: PestanaNavegacion; texto: string; Icono: typeof HomeIcon }[] = [
  { id: 'inicio', texto: 'Inicio', Icono: HomeIcon },
  { id: 'licencias', texto: 'Licencias', Icono: GridIcon },
  { id: 'equipos', texto: 'Equipos', Icono: ComputerIcon },
  { id: 'empleados', texto: 'Empleados', Icono: UsersIcon },
];

const colorActivo = '#107C41'; // Emerald oficial AssetOps
const colorInactivo = '#61746A';

export const BottomBar: React.FC<BottomBarProps> = ({ pestanaActiva, onSeleccionarPestana }) => (
  <View style={styles.barContainer}>
    {PESTANAS.map(({ id, texto, Icono }) => {
      const activa = pestanaActiva === id;
      const color = activa ? colorActivo : colorInactivo;
      return (
        <TouchableOpacity
          key={id}
          style={styles.tabButton}
          onPress={() => onSeleccionarPestana(id)}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel={texto}
          accessibilityState={{ selected: activa }}
        >
          <Icono color={color} size={21} />
          <Text style={[styles.tabText, { color }, activa && styles.tabTextActivo]}>{texto}</Text>
          {activa && <View style={styles.activePill} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

export default BottomBar;

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EFEA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
    shadowColor: '#0F382A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActivo: {
    fontWeight: '700',
  },
  activePill: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#107C41',
    marginTop: 3,
  },
});
