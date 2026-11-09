import React, { useMemo } from 'react';
import {
  ActivityIndicator,
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
import { LoginScreen } from './src/features/auth/views/LoginScreen';
import { HomeScreen } from './src/features/home/views/HomeScreen';

/**
 * Composition Root de la aplicación (SOLID - Dependency Inversion)
 * - Instancia las implementaciones de infraestructura (FetchHttpClient, ExpoSecureStorage).
 * - Inyecta las dependencias al AuthService.
 * - Consume el ViewModel de Sesión para conmutar las Vistas reactivamente.
 */
export default function App() {
  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const httpClient = useMemo(() => new FetchHttpClient(), []);
  const secureStorage = useMemo(() => new ExpoSecureStorage(), []);
  const authService = useMemo(
    () => new AuthService(httpClient, secureStorage, baseUrl),
    [baseUrl, httpClient, secureStorage]
  );

  const { sessionState, reintentarValidacion, cerrarSesion, notificarLoginExitoso } =
    useAuthSessionViewModel(authService);

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar style="light" />

      {sessionState.status === 'cargando' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Verificando sesión segura...</Text>
        </View>
      )}

      {sessionState.status === 'fallo_conexion' && (
        <View style={styles.centerContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Fallo de conexión. Reintentar</Text>
            <Text style={styles.errorDescription}>
              No se pudo contactar al servidor en {baseUrl}. Tu sesión permanece segura en el dispositivo.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={reintentarValidacion}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
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
        <HomeScreen usuario={sessionState.usuario} onCerrarSesion={cerrarSesion} />
      )}

      {sessionState.status === 'no_autenticado' && (
        <LoginScreen authService={authService} onLoginExitoso={notificarLoginExitoso} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
  },
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
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
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
