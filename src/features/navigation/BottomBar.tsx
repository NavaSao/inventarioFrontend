import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GridIcon, HomeIcon, UsersIcon } from '../../shared/components/Icons';

export type PestanaNavegacion = 'inicio' | 'licencias' | 'empleados';

export interface BottomBarProps {
  readonly pestanaActiva: PestanaNavegacion;
  readonly onSeleccionarPestana: (pestana: PestanaNavegacion) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  pestanaActiva,
  onSeleccionarPestana,
}) => {
  const colorActivo = '#107C41'; // Emerald oficial AssetOps
  const colorInactivo = '#61746A';

  return (
    <View style={styles.barContainer}>
      {/* Pestaña Inicio */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSeleccionarPestana('inicio')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Inicio"
        accessibilityState={{ selected: pestanaActiva === 'inicio' }}
      >
        <HomeIcon
          color={pestanaActiva === 'inicio' ? colorActivo : colorInactivo}
          size={22}
        />
        <Text
          style={[
            styles.tabText,
            { color: pestanaActiva === 'inicio' ? colorActivo : colorInactivo },
            pestanaActiva === 'inicio' && styles.tabTextActivo,
          ]}
        >
          Inicio
        </Text>
        {pestanaActiva === 'inicio' && <View style={styles.activePill} />}
      </TouchableOpacity>

      {/* Pestaña Licencias */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSeleccionarPestana('licencias')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Licencias"
        accessibilityState={{ selected: pestanaActiva === 'licencias' }}
      >
        <GridIcon
          color={pestanaActiva === 'licencias' ? colorActivo : colorInactivo}
          size={20}
        />
        <Text
          style={[
            styles.tabText,
            { color: pestanaActiva === 'licencias' ? colorActivo : colorInactivo },
            pestanaActiva === 'licencias' && styles.tabTextActivo,
          ]}
        >
          Licencias
        </Text>
        {pestanaActiva === 'licencias' && <View style={styles.activePill} />}
      </TouchableOpacity>

      {/* Pestaña Empleados */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSeleccionarPestana('empleados')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Empleados"
        accessibilityState={{ selected: pestanaActiva === 'empleados' }}
      >
        <UsersIcon
          color={pestanaActiva === 'empleados' ? colorActivo : colorInactivo}
          size={22}
        />
        <Text
          style={[
            styles.tabText,
            { color: pestanaActiva === 'empleados' ? colorActivo : colorInactivo },
            pestanaActiva === 'empleados' && styles.tabTextActivo,
          ]}
        >
          Empleados
        </Text>
        {pestanaActiva === 'empleados' && <View style={styles.activePill} />}
      </TouchableOpacity>
    </View>
  );
};

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
