import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { ArrowLeftIcon } from '../../../shared/components/Icons';
import { EstadoLicencia } from '../models/types';

/** Paleta AssetOps (Figma · 01 Color y superficies). */
export const paleta = {
  forest: '#0F382A',
  emerald: '#107C41',
  mint: '#D1FAE5',
  mintLight: '#ECFDF5',
  bg: '#F6F8F6',
  white: '#FFFFFF',
  texto: '#0F382A',
  gris: '#61746A',
  grisSub: '#82938B',
  borde: '#E6EBE7',
  ambarBg: '#FEF3C7',
  ambarTexto: '#B45309',
  rojoBg: '#FEE2E2',
  rojoTexto: '#B91C1C',
};

export const ESTADO_UI: Record<EstadoLicencia, { label: string; bg: string; texto: string; barra: string }> = {
  vigente: { label: 'Vigente', bg: paleta.mint, texto: paleta.emerald, barra: paleta.emerald },
  por_vencer: { label: 'Por vencer', bg: paleta.ambarBg, texto: paleta.ambarTexto, barra: '#D97706' },
  vencida: { label: 'Vencida', bg: paleta.rojoBg, texto: paleta.rojoTexto, barra: '#DC2626' },
};

const fuentes = { Inter_400Regular, Inter_600SemiBold, Inter_700Bold };

/** Devuelve estilos de texto Inter cuando las fuentes ya cargaron. */
export function useTipografia() {
  const [listas] = useFonts(fuentes);
  return {
    regular: listas ? { fontFamily: 'Inter_400Regular' } : undefined,
    semibold: listas ? { fontFamily: 'Inter_600SemiBold' } : { fontWeight: '600' as const },
    bold: listas ? { fontFamily: 'Inter_700Bold' } : { fontWeight: '700' as const },
  };
}

/** Convierte 'AAAA-MM-DD' (o ISO) a una fecha local sin desfase de zona horaria. */
export function parsearFecha(valor: string): Date | null {
  if (!valor) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  const d = m && valor.length <= 10 ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/** "30 nov. 2026" */
export function formatearFecha(valor: string): string {
  const d = parsearFecha(valor);
  if (!d) return valor || '—';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fechaHoyIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export const Avatar: React.FC<{ nombre: string }> = ({ nombre }) => (
  <View style={ui.avatar}>
    <Text style={ui.avatarTexto}>{iniciales(nombre)}</Text>
  </View>
);

export const Encabezado: React.FC<{ titulo: string; onVolver?: () => void; derecha?: React.ReactNode }> = ({
  titulo,
  onVolver,
  derecha,
}) => {
  const t = useTipografia();
  return (
    <View style={ui.header}>
      {onVolver ? (
        <TouchableOpacity
          style={ui.backBtn}
          onPress={onVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <View style={{ marginLeft: 4 }}>
            <ArrowLeftIcon color={paleta.texto} size={18} />
          </View>
        </TouchableOpacity>
      ) : null}
      <Text style={[ui.headerTitulo, t.bold]} accessibilityRole="header">
        {titulo}
      </Text>
      <View style={{ flex: 1 }} />
      {derecha}
    </View>
  );
};

export const BarraProgreso: React.FC<{ porcentaje: number; color: string; fondo?: string }> = ({
  porcentaje,
  color,
  fondo = '#EAEFEA',
}) => (
  <View style={[ui.barra, { backgroundColor: fondo }]}>
    <View style={[ui.barraRelleno, { width: `${Math.min(100, Math.max(0, porcentaje))}%`, backgroundColor: color }]} />
  </View>
);

export const ui = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.white,
    borderWidth: 1,
    borderColor: paleta.borde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitulo: { fontSize: 20, color: paleta.texto },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: { color: paleta.emerald, fontWeight: '700', fontSize: 14 },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' },
  barraRelleno: { height: 6, borderRadius: 3 },
  card: {
    backgroundColor: paleta.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: paleta.borde,
    padding: 16,
  },
  botonPrimario: {
    height: 52,
    borderRadius: 14,
    backgroundColor: paleta.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  botonPrimarioTexto: { color: paleta.white, fontSize: 15 },
  botonDeshabilitado: { backgroundColor: '#A7C4B3' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorCaja: {
    backgroundColor: '#FDECE9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F8C9C1',
  },
  errorTexto: { color: '#9C2E24', fontSize: 13, lineHeight: 18 },
});
