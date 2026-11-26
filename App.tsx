import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { getApiBaseUrl } from './src/core/config';
import { FetchHttpClient } from './src/core/network/FetchHttpClient';
import { ExpoSecureStorage } from './src/core/storage/ExpoSecureStorage';
import { AuthService } from './src/features/auth/services/AuthService';
import { useAuthSessionViewModel } from './src/features/auth/viewmodels/useAuthSessionViewModel';
import { LoginScreen, loginBackgroundColor } from './src/features/auth/views/LoginScreen';
import { HomeScreen } from './src/features/home/views/HomeScreen';
import { DashboardService } from './src/features/dashboard/services/DashboardService';
import { LicenciasService } from './src/features/licencias/services/LicenciasService';
import { WifiOffIcon } from './src/shared/components/Icons';

/**
 * Composition Root de la aplicación (SOLID - Dependency Inversion)
 * - Instancia las implementaciones de infraestructura (FetchHttpClient, ExpoSecureStorage).
 * - Inyecta las dependencias a los servicios (AuthService, DashboardService, LicenciasService).
 * - Conecta las vistas reactivamente.
 */
export default function App() {
  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const httpClient = useMemo(() => new FetchHttpClient(), []);
  const secureStorage = useMemo(() => new ExpoSecureStorage(), []);
  const authService = useMemo(
    () => new AuthService(httpClient, secureStorage, baseUrl),
    [baseUrl, httpClient, secureStorage]
  );
  const dashboardService = useMemo(
    () => new DashboardService(httpClient, secureStorage, baseUrl),
    [baseUrl, httpClient, secureStorage]
  );
  const licenciasService = useMemo(
    () => new LicenciasService(httpClient, secureStorage, baseUrl),
    [baseUrl, httpClient, secureStorage]
  );

  const { sessionState, reintentarValidacion, cerrarSesion, notificarLoginExitoso } =
    useAuthSessionViewModel(authService);
  const autenticado = sessionState.status === 'autenticado';
  const mostrandoLogin = sessionState.status === 'no_autenticado';

  const handleCerrarSesion = () => {
    void cerrarSesion();
  };

  return (
    <View style={styles.rootContainer}>
      <View
        style={[
          styles.deviceFrame,
          mostrandoLogin && styles.loginRoot,
          autenticado && styles.appRoot,
        ]}
      >
        <StatusBar style={mostrandoLogin || autenticado ? 'dark' : 'light'} />
        {Platform.OS === 'web' && (
          <View style={styles.notchContainer} pointerEvents="none">
            <View style={styles.notchPill} />
          </View>
        )}

        {sessionState.status === 'cargando' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Verificando sesión segura...</Text>
          </View>
        )}

        {sessionState.status === 'fallo_conexion' && (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconBox}>
                <WifiOffIcon color="#EF4444" size={32} />
              </View>
              <Text style={styles.errorTitle}>Fallo de conexión</Text>
              <Text style={styles.errorDescription}>
                No se pudo contactar al servidor en {baseUrl}. Verifica que el backend esté activo e intenta de nuevo.
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={reintentarValidacion}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>Reintentar conexión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cerrarSesion}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Ingresar con otra cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sessionState.status === 'autenticado' && (
          <HomeScreen
            usuario={sessionState.usuario}
            onCerrarSesion={handleCerrarSesion}
            dashboardService={dashboardService}
            licenciasService={licenciasService}
          />
        )}

        {mostrandoLogin && (
          <LoginScreen
            authService={authService}
            onLoginExitoso={notificarLoginExitoso}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#090D16', // Deep Obsidian canvas on desktop web
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        height: '100%',
        maxHeight: 930,
        borderRadius: 40,
        boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        marginVertical: 12,
      },
      default: {},
    }),
  },
  notchContainer: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  notchPill: {
    width: 90,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
  },
  loginRoot: { backgroundColor: loginBackgroundColor },
  appRoot: { backgroundColor: '#F8FAFC' },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    alignItems: 'center',
  },
  errorIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
