import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SessionUser } from '../../auth/models/types';
import { DashboardScreen } from '../../dashboard/views/DashboardScreen';
import { DashboardService } from '../../dashboard/services/DashboardService';
import { LicenciasScreen } from '../../licencias/views/LicenciasScreen';
import { LicenciasService } from '../../licencias/services/LicenciasService';
import { BottomBar, PestanaNavegacion } from '../../navigation/BottomBar';
import { UsersIcon } from '../../../shared/components/Icons';

export interface HomeScreenProps {
  readonly usuario: SessionUser;
  readonly onCerrarSesion: () => void;
  readonly dashboardService?: DashboardService;
  readonly licenciasService?: LicenciasService;
}

/**
 * Capa View - Contenedor Principal Autenticado de AssetOps
 * - Conecta las pantallas de Dashboard (HU08) y Licencias (HU05).
 * - Integra la BottomBar fija con navegación reactiva.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  usuario,
  onCerrarSesion,
  dashboardService,
  licenciasService,
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<PestanaNavegacion>('inicio');
  const [licenciaIdSeleccionada, setLicenciaIdSeleccionada] = useState<string | undefined>(undefined);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {pestanaActiva === 'inicio' && (
          <DashboardScreen
            dashboardService={dashboardService}
            licenciasService={licenciasService}
            nombreUsuario={usuario.nombre}
            onNavegarLicencias={() => {
              setLicenciaIdSeleccionada(undefined);
              setPestanaActiva('licencias');
            }}
            onRevisarLicencia={(licenciaId, software) => {
              // Enlace al detalle de licencias (PR 9 de Hugo)
              setLicenciaIdSeleccionada(software || licenciaId);
              setPestanaActiva('licencias');
            }}
          />
        )}

        {pestanaActiva === 'licencias' && (
          <LicenciasScreen
            licenciasService={licenciasService}
            licenciaIdInicial={licenciaIdSeleccionada}
            onSeleccionarLicencia={(_licencia) => {
              // Punto de conexión para Detalle de Licencia (PR 9 de Hugo - HU05)
            }}
          />
        )}

        {pestanaActiva === 'empleados' && (
          <View style={styles.empleadosPlaceholder}>
            <View style={styles.empleadosCard}>
              <View style={styles.empleadosIconBox}>
                <UsersIcon color="#107C41" size={36} />
              </View>
              <Text style={styles.empleadosTitulo}>Gestión de Empleados</Text>
              <Text style={styles.empleadosSub}>
                Sesión iniciada como {usuario.nombre} ({usuario.correo}).
              </Text>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onCerrarSesion}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <BottomBar
        pestanaActiva={pestanaActiva}
        onSeleccionarPestana={setPestanaActiva}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  content: {
    flex: 1,
  },
  empleadosPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  empleadosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  empleadosIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  empleadosTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  empleadosSub: {
    fontSize: 14,
    color: '#61746A',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#0F382A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
