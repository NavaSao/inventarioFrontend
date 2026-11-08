import type { IAuthService, LoginCredentials } from '../models/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function verificar(condicion: boolean, mensajeError: string): void {
  if (!condicion) {
    throw new Error(`Fallo en prueba: ${mensajeError}`);
  }
}

/**
 * Pruebas directas del flujo MVVM de Login (Tarea 3) con contraseña "12345"
 */
export async function ejecutarPruebasDirectas(): Promise<void> {
  console.log('=== INICIANDO PRUEBAS DIRECTAS MVVM LOGIN ===\n');

  let ultimoPayloadRecibido: LoginCredentials | null = null;

  const mockAuthService: IAuthService = {
    async login(credentials: LoginCredentials): Promise<void> {
      ultimoPayloadRecibido = credentials;
      console.log(
        '[AssetOps Auth] Payload listo para enviar a API:',
        credentials
      );
    },
  };

  const validarYDespachar = async (
    correo: string,
    password: string
  ): Promise<string | null> => {
    const correoLimpio = correo.trim();
    const passwordLimpia = password.trim();

    if (!correoLimpio || !passwordLimpia) {
      return 'Por favor ingresa tu correo y contraseña.';
    }

    if (!EMAIL_REGEX.test(correoLimpio)) {
      return 'Ingresa un formato de correo electrónico válido.';
    }

    const payloadNormalizado: LoginCredentials = Object.freeze({
      correo: correoLimpio.toLowerCase(),
      password,
    });

    await mockAuthService.login(payloadNormalizado);
    return null;
  };

  // Prueba 1: Validación de campos vacíos
  const errorVacios = await validarYDespachar('   ', '');
  verificar(
    errorVacios === 'Por favor ingresa tu correo y contraseña.',
    'Debería rechazar campos vacíos'
  );
  console.log('✅ Prueba 1 (Campos vacíos): PASÓ ->', errorVacios);

  // Prueba 2: Validación de formato erróneo de correo (contraseña "12345")
  const errorFormato = await validarYDespachar('usuario_sin_dominio', '12345');
  verificar(
    errorFormato === 'Ingresa un formato de correo electrónico válido.',
    'Debería rechazar formato de correo inválido'
  );
  console.log('✅ Prueba 2 (Formato erróneo de correo): PASÓ ->', errorFormato);

  // Prueba 3: Conmutación de visibilidad de contraseña (toggle) con "12345"
  const estadoVisibilidad = { mostrarPassword: false };
  const toggleMostrarPassword = (): void => {
    estadoVisibilidad.mostrarPassword = !estadoVisibilidad.mostrarPassword;
  };
  toggleMostrarPassword();
  verificar(
    estadoVisibilidad.mostrarPassword === true,
    'Debería mostrar la contraseña "12345"'
  );
  toggleMostrarPassword();
  verificar(
    estadoVisibilidad.mostrarPassword === false,
    'Debería ocultar la contraseña "12345"'
  );
  console.log('✅ Prueba 3 (Toggle mostrar/ocultar contraseña "12345"): PASÓ');

  // Prueba 4: Impresión limpia del payload normalizado con contraseña "12345"
  const errorExito = await validarYDespachar('  DIANA.Admin@AssetOps.COM  ', '12345');
  verificar(errorExito === null, 'No debería retornar error con datos válidos');
  verificar(
    ultimoPayloadRecibido !== null &&
      (ultimoPayloadRecibido as LoginCredentials).correo === 'diana.admin@assetops.com' &&
      (ultimoPayloadRecibido as LoginCredentials).password === '12345',
    'El payload normalizado debe tener correo en minúsculas y password "12345"'
  );
  console.log('✅ Prueba 4 (Payload normalizado con contraseña "12345"): PASÓ\n');
}

ejecutarPruebasDirectas();
