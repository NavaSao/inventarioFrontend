/**
 * Capa de Infraestructura - Abstracción de Almacenamiento Seguro (DIP)
 * Protege a la aplicación de acoplarse directamente a librerías de hardware específicas.
 */

export interface ISecureStorage {
  guardarToken(token: string): Promise<void>;
  obtenerToken(): Promise<string | null>;
  eliminarToken(): Promise<void>;
}

