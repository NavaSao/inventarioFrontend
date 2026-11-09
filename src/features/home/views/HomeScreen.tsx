import React from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SessionUser } from '../../auth/models/types';

export interface HomeScreenProps {
  readonly usuario: SessionUser;
  readonly onCerrarSesion: () => void;
}

/**
 * Capa View - Pantalla Principal (HomeScreen)
 * - Muestra la sesión autenticada recuperada o recién iniciada.
 * - Brinda información del usuario y acción de cierre de sesión.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ usuario, onCerrarSesion }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Sesión Activa</Text>
          </View>
          <Text style={styles.title}>AssetOps</Text>
          <Text style={styles.subtitle}>Panel de Control y Activos</Text>
        </View>

        <View style={styles.userInfoCard}>
          <Text style={styles.userSectionTitle}>Datos del Usuario</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nombre:</Text>
            <Text style={styles.fieldValue}>{usuario.nombre}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Correo:</Text>
            <Text style={styles.fieldValue}>{usuario.correo}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ID de Usuario:</Text>
            <Text style={styles.fieldValueMono}>{usuario.idUsuario}</Text>
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            🔒 Tu sesión está guardada de forma segura con Expo SecureStore. Al cerrar y reabrir la app, entrarás automáticamente.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onCerrarSesion}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1E293B', // Slate 800
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155', // Slate 700
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E', // Green 500
    marginRight: 6,
  },
  badgeText: {
    color: '#86EFAC', // Green 300
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  userInfoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  userSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8', // Sky 400
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  fieldValueMono: {
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#BAE6FD',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#DC2626', // Red 600
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
