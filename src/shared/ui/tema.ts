/** Tokens del sistema de diseño AssetOps (PANTALLAS · 01 Color y 05 Escala). */
export const tema = {
  forest: '#0F382A',
  emerald: '#107C41',
  mint: '#D1FAE5',
  fondo: '#F6F8F6',
  blanco: '#FFFFFF',
  texto: '#0F382A',
  textoSuave: '#61746A',
  borde: '#E8EFEA',
  ambar: { fondo: '#FEF3C7', texto: '#B45309' },
  rojo: { fondo: '#FDECE9', texto: '#9C2E24' },
  gris: { fondo: '#EEF2EF', texto: '#61746A' },
  margen: 24,
  radioTarjeta: 16,
  altoBoton: 52,
} as const;

export type Tono = 'verde' | 'ambar' | 'rojo' | 'gris';

export const tonos: Record<Tono, { fondo: string; texto: string }> = {
  verde: { fondo: tema.mint, texto: tema.emerald },
  ambar: tema.ambar,
  rojo: tema.rojo,
  gris: tema.gris,
};
