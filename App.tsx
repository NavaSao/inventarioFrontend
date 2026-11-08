import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { IAuthService, LoginCredentials } from './src/features/auth/models/types';
import { LoginScreen } from './src/features/auth/views/LoginScreen';

/**
 * Adaptador de infraestructura temporal (DIP) para integración con el endpoint CQRS de Diana.
 */
const authServiceAdapter: IAuthService = {
  async login(credentials: LoginCredentials): Promise<void> {
    // Simulación de latencia de red mientras se conecta el endpoint real
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    console.log(
      '[AssetOps Auth] Payload normalizado listo para el endpoint de Diana:',
      JSON.stringify(credentials, null, 2)
    );
  },
};

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <LoginScreen authService={authServiceAdapter} />
    </>
  );
}
