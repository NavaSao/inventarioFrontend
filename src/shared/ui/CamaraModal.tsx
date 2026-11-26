import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModalMovil } from './ModalMovil';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Boton } from './componentes';
import { tema } from './tema';

type Props =
  | { visible: boolean; onCerrar: () => void; modo: 'escaner'; onEscaneado: (codigo: string) => void }
  | { visible: boolean; onCerrar: () => void; modo: 'foto'; onFoto: (base64: string) => void };

/**
 * Cámara a pantalla completa con marco de escaneo (QR / código de barras)
 * o captura de fotografía JPEG en base64.
 */
export const CamaraModal: React.FC<Props> = (props) => {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);
  const leido = useRef(false);
  const [capturando, setCapturando] = useState(false);

  const alEscanear = ({ data }: { data: string }) => {
    // La cámara emite varias lecturas por segundo; solo proceso la primera.
    if (props.modo !== 'escaner' || leido.current) return;
    leido.current = true;
    props.onEscaneado(data.trim());
  };

  const tomarFoto = async () => {
    if (props.modo !== 'foto' || !camara.current) return;
    setCapturando(true);
    try {
      const foto = await camara.current.takePictureAsync({ base64: true, quality: 0.4 });
      if (foto?.base64) props.onFoto(foto.base64);
    } finally {
      setCapturando(false);
    }
  };

  return (
    <ModalMovil visible={props.visible} animationType="slide" onShow={() => { leido.current = false; }} onRequestClose={props.onCerrar}>
      <View style={estilos.fondo}>
        {!permiso?.granted ? (
          <View style={estilos.permiso}>
            <Text style={estilos.texto}>AssetOps necesita acceso a la cámara para {props.modo === 'escaner' ? 'escanear etiquetas' : 'fotografiar el equipo'}.</Text>
            <Boton texto="Permitir cámara" onPress={pedirPermiso} />
          </View>
        ) : (
          <CameraView
            ref={camara}
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'datamatrix'] }}
            onBarcodeScanned={props.modo === 'escaner' ? alEscanear : undefined}
          />
        )}

        {permiso?.granted && (
          <View style={estilos.capa} pointerEvents="box-none">
            <Text style={estilos.texto}>
              {props.modo === 'escaner' ? 'Centra la etiqueta dentro del marco' : 'Encuadra el equipo y toma la foto'}
            </Text>
            {props.modo === 'escaner' && <View style={estilos.marco} />}
            {props.modo === 'foto' && (
              <TouchableOpacity style={estilos.disparador} onPress={tomarFoto} disabled={capturando} accessibilityLabel="Tomar foto" />
            )}
          </View>
        )}

        <TouchableOpacity style={estilos.cerrar} onPress={props.onCerrar} accessibilityRole="button">
          <Text style={estilos.textoCerrar}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ModalMovil>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#000' },
  permiso: { flex: 1, justifyContent: 'center', padding: tema.margen, backgroundColor: tema.forest },
  capa: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 24 },
  texto: { color: tema.blanco, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  marco: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: tema.mint },
  disparador: {
    position: 'absolute', bottom: 60, width: 72, height: 72, borderRadius: 36,
    backgroundColor: tema.blanco, borderWidth: 5, borderColor: tema.mint,
  },
  cerrar: { position: 'absolute', top: 50, right: tema.margen, padding: 8 },
  textoCerrar: { color: tema.blanco, fontWeight: '700', fontSize: 15 },
});
