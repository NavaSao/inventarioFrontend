import React, { useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ILoginService } from '../models/types';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

export interface LoginScreenProps {
  readonly authService?: ILoginService;
  readonly onLoginExitoso?: () => void;
}

const marca = require('../../../../assets/login/marca.png');
const ojo = require('../../../../assets/login/ojo.png');
const flecha = require('../../../../assets/login/flecha.png');
const escudo = require('../../../../assets/login/escudo.png');
const fuentes = { Inter_400Regular, Inter_600SemiBold, Inter_700Bold };

export const loginBackgroundColor = '#F6F8F6';
const colores = {
  marca: '#0F382A',
  accion: '#107C41',
  menta: '#D1FAE5',
  blanco: '#FFFFFF',
  secundario: '#61746A',
  borde: '#D9E3DC',
  error: '#9C2E24',
  fondoError: '#FDECE9',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ authService, onLoginExitoso }) => {
  const [fuentesListas] = useFonts(fuentes);
  const [ayudaVisible, setAyudaVisible] = useState(false);
  const inputPassword = useRef<React.ComponentRef<typeof TextInput>>(null);
  const correoTi = process.env.EXPO_PUBLIC_TI_EMAIL?.trim();
  const regular = fuentesListas && styles.interRegular;
  const semibold = fuentesListas ? styles.interSemibold : styles.semibold;
  const bold = fuentesListas ? styles.interBold : styles.bold;
  const {
    correo,
    password,
    mostrarPassword,
    cargando,
    errorMensaje,
    puedeReintentar,
    setCorreo,
    setPassword,
    toggleMostrarPassword,
    ejecutarLogin,
  } = useLoginViewModel(authService, onLoginExitoso);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Image source={marca} style={styles.brandIcon} />
            <Text style={[styles.brandName, bold]}>AssetOps</Text>
          </View>

          <View style={styles.rolePill}>
            <Text style={[styles.roleText, bold]}>ADMINISTRADOR</Text>
          </View>

          <Text accessibilityRole="header" style={[styles.title, bold]}>
            {'Bienvenido\nde nuevo.'}
          </Text>
          <Text style={[styles.description, regular]}>
            Todo en un solo lugar. Administra licencias y sus asignaciones a tus empleados desde donde estés.
          </Text>

          <View style={styles.form}>
            {errorMensaje && (
              <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
                <Text style={[styles.errorText, regular]}>{errorMensaje}</Text>
              </View>
            )}

            <Text style={[styles.label, semibold]}>Correo electrónico</Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
              style={[styles.input, regular]}
              placeholder="admin@empresa.com"
              placeholderTextColor={colores.secundario}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => inputPassword.current?.focus()}
              editable={!cargando}
              value={correo}
              onChangeText={setCorreo}
            />

            <Text style={[styles.label, styles.passwordLabel, semibold]}>Contraseña</Text>
            <View style={styles.passwordGroup}>
              <TextInput
                ref={inputPassword}
                accessibilityLabel="Contraseña"
                style={[styles.passwordInput, regular]}
                placeholder="••••••••••••"
                placeholderTextColor={colores.secundario}
                autoComplete="current-password"
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={ejecutarLogin}
                editable={!cargando}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={styles.passwordToggle}
                onPress={toggleMostrarPassword}
                disabled={cargando}
              >
                <Image source={ojo} style={styles.eyeIcon} />
                {mostrarPassword && <View style={styles.eyeStrike} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setAyudaVisible(true)}
              style={styles.forgotButton}
            >
              <Text style={[styles.helpLink, semibold]}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
              onPress={ejecutarLogin}
              disabled={cargando}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ busy: cargando, disabled: cargando }}
            >
              {cargando ? <ActivityIndicator color={colores.blanco} /> : (
                <>
                  <Text style={[styles.loginButtonText, bold]}>
                    {puedeReintentar ? 'Reintentar' : 'Iniciar sesión'}
                  </Text>
                  <Image source={flecha} style={styles.arrowIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.secureRow}>
            <Image source={escudo} style={styles.securityIcon} />
            <Text style={[styles.secureText, regular]}>Acceso seguro para administradores</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Contacta con TI"
            onPress={() => setAyudaVisible(true)}
            style={styles.contactButton}
          >
            <Text style={[styles.contactText, regular]}>¿Necesitas acceso? Contacta con TI.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={ayudaVisible}
        onRequestClose={() => setAyudaVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={[styles.modalTitle, bold]}>Contacta con TI</Text>
            <Text style={[styles.modalText, regular]}>
              Tu equipo de TI puede ayudarte a recuperar la contraseña o confirmar tu acceso.
            </Text>
            {correoTi && (
              <Text
                style={[styles.helpLink, styles.modalEmail, semibold]}
                accessibilityRole="link"
                selectable
                onPress={() => {
                  void Linking.openURL(`mailto:${correoTi}`).catch(() => {
                    // El correo queda visible para copiarlo si el teléfono no tiene un cliente configurado.
                  });
                }}
              >
                {correoTi}
              </Text>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.modalClose}
              onPress={() => setAyudaVisible(false)}
            >
              <Text style={[styles.loginButtonText, bold]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: loginBackgroundColor,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.select({
      web: 74,
      android: (StatusBar.currentHeight ?? 24) + 28,
      default: 28,
    }),
    paddingBottom: 24,
  },
  content: { width: '100%', maxWidth: 400 },
  interRegular: { fontFamily: 'Inter_400Regular' },
  interSemibold: { fontFamily: 'Inter_600SemiBold' },
  interBold: { fontFamily: 'Inter_700Bold' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 36, height: 36 },
  brandName: { fontSize: 24, lineHeight: 30, color: colores.marca },
  rolePill: {
    alignSelf: 'flex-start',
    minWidth: 146,
    minHeight: 26,
    justifyContent: 'center',
    marginTop: 28,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colores.menta,
  },
  roleText: { color: colores.marca, fontSize: 10, lineHeight: 14 },
  title: { marginTop: 21, color: colores.marca, fontSize: 36, lineHeight: 42 },
  description: { marginTop: 19, color: colores.secundario, fontSize: 15, lineHeight: 23 },
  form: { marginTop: 28 },
  errorBanner: {
    backgroundColor: colores.fondoError,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colores.error, fontSize: 14, lineHeight: 20 },
  label: { color: colores.marca, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colores.marca,
    fontSize: 14,
  },
  passwordLabel: { marginTop: 21 },
  passwordGroup: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
  },
  passwordInput: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colores.marca,
    fontSize: 14,
  },
  passwordToggle: {
    width: 54,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { width: 22, height: 22 },
  eyeStrike: {
    position: 'absolute',
    width: 21,
    height: 2,
    backgroundColor: colores.secundario,
    transform: [{ rotate: '-45deg' }],
  },
  forgotButton: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  helpLink: { color: colores.accion, fontSize: 13, lineHeight: 18 },
  loginButton: {
    minHeight: 52,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 48,
    borderRadius: 16,
    backgroundColor: colores.accion,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { textAlign: 'center', fontSize: 14, lineHeight: 20, color: colores.blanco },
  arrowIcon: { position: 'absolute', right: 22, width: 20, height: 20 },
  secureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  securityIcon: { width: 20, height: 20 },
  secureText: { color: colores.secundario, fontSize: 11, lineHeight: 16 },
  contactButton: { minHeight: 44, marginTop: 18, justifyContent: 'center', alignItems: 'center' },
  contactText: { color: colores.secundario, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 56, 42, 0.35)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    backgroundColor: colores.blanco,
  },
  modalTitle: { color: colores.marca, fontSize: 22, lineHeight: 28 },
  modalText: { marginTop: 10, color: colores.secundario, fontSize: 15, lineHeight: 22 },
  modalEmail: { marginTop: 12 },
  modalClose: {
    minHeight: 44,
    marginTop: 20,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colores.accion,
  },
});
