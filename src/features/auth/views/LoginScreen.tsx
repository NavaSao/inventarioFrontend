import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IAuthService } from '../models/types';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

export interface LoginScreenProps {
  readonly authService?: IAuthService;
}

/**
 * Capa View (V - Interfaz de Usuario)
 * - SRP: Componente declarativo puro. Cero lógica de negocio, cero regex y cero normalización.
 * - Consume exclusivamente el estado y comandos expuestos por `useLoginViewModel`.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ authService }) => {
  const {
    correo,
    password,
    mostrarPassword,
    cargando,
    errorMensaje,
    setCorreo,
    setPassword,
    toggleMostrarPassword,
    ejecutarLogin,
  } = useLoginViewModel(authService);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>AssetOps</Text>
          <Text style={styles.subtitle}>Control de Inventario y Activos</Text>
        </View>

        {errorMensaje && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{errorMensaje}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@empresa.com"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!cargando}
            value={correo}
            onChangeText={setCorreo}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!cargando}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMostrarPassword}
              disabled={cargando}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>
                {mostrarPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
          onPress={ejecutarLogin}
          disabled={cargando}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC', // Slate 50
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8', // Slate 400
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444', // Red 500
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5', // Red 300
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1', // Slate 300
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A', // Slate 900
    borderWidth: 1,
    borderColor: '#334155', // Slate 700
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleText: {
    color: '#38BDF8', // Sky 400
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2563EB', // Blue 600
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 50,
  },
  loginButtonDisabled: {
    backgroundColor: '#1E40AF',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
