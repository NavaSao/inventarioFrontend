import React, { useEffect, useState } from 'react';
import {
  BackHandler,
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
import { LicenciaDetalleScreen } from '../../licencias/views/LicenciaDetalleScreen';
import { EmpleadosAsignadosScreen } from '../../licencias/views/EmpleadosAsignadosScreen';
import { AsignarLicenciaScreen } from '../../asignaciones/views/AsignarLicenciaScreen';
import { LiberarCupoButton } from '../../asignaciones/views/LiberarCupoButton';
import { BottomBar, PestanaNavegacion } from '../../navigation/BottomBar';
import { UsersIcon } from '../../../shared/components/Icons';

/** Pila de navegación dentro de la pestaña Licencias. */
export type VistaLicencias =
  | { readonly tipo: 'catalogo' }
  | { readonly tipo: 'detalle'; readonly id: string; readonly aviso?: string }
  | { readonly tipo: 'asignados'; readonly id: string }
  | { readonly tipo: 'asignar'; readonly id: string };

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
  const [vista, setVista] = useState<VistaLicencias>({ tipo: 'catalogo' });

  const volver = (): boolean => {
    if (pestanaActiva !== 'licencias' || vista.tipo === 'catalogo') return false;
    setVista(vista.tipo === 'detalle' ? { tipo: 'catalogo' } : { tipo: 'detalle', id: vista.id });
    return true;
  };

  // Botón físico «atrás» de Android regresa dentro del flujo de licencias.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', volver);
    return () => sub.remove();
  });

  const seleccionarPestana = (p: PestanaNavegacion) => {
    setVista({ tipo: 'catalogo' });
    setLicenciaIdSeleccionada(undefined);
    setPestanaActiva(p);
  };

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
              setVista({ tipo: 'catalogo' });
              setPestanaActiva('licencias');
            }}
            onRevisarLicencia={(licenciaId, software) => {
              // «Revisar licencia» abre directo la ficha de detalle (HU08 · Escenario 08.02).
              if (licenciaId) {
                setVista({ tipo: 'detalle', id: licenciaId });
              } else {
                setVista({ tipo: 'catalogo' });
                setLicenciaIdSeleccionada(software);
              }
              setPestanaActiva('licencias');
            }}
          />
        )}

        {pestanaActiva === 'licencias' && vista.tipo === 'catalogo' && (
          <LicenciasScreen
            licenciasService={licenciasService}
            licenciaIdInicial={licenciaIdSeleccionada}
            onSeleccionarLicencia={(licencia) => {
              setLicenciaIdSeleccionada(undefined);
              setVista({ tipo: 'detalle', id: licencia.id });
            }}
          />
        )}

        {pestanaActiva === 'licencias' && vista.tipo === 'detalle' && (
          <LicenciaDetalleScreen
            key={`detalle-${vista.id}-${vista.aviso ?? ''}`}
            licenciasService={licenciasService}
            idLicencia={vista.id}
            aviso={vista.aviso}
            onVolver={() => setVista({ tipo: 'catalogo' })}
            onVerAsignados={(lic) => setVista({ tipo: 'asignados', id: lic.id })}
            onAsignar={(lic) => setVista({ tipo: 'asignar', id: lic.id })}
          />
        )}

        {pestanaActiva === 'licencias' && vista.tipo === 'asignados' && (
          <EmpleadosAsignadosScreen
            licenciasService={licenciasService}
            idLicencia={vista.id}
            onVolver={() => setVista({ tipo: 'detalle', id: vista.id })}
            renderLiberar={(empleado, licencia, alLiberar) => (
              <LiberarCupoButton
                licenciasService={licenciasService}
                empleado={empleado}
                licencia={licencia}
                onLiberado={alLiberar}
              />
            )}
          />
        )}

        {pestanaActiva === 'licencias' && vista.tipo === 'asignar' && (
          <AsignarLicenciaScreen
            licenciasService={licenciasService}
            idLicencia={vista.id}
            onVolver={() => setVista({ tipo: 'detalle', id: vista.id })}
            onAsignado={(mensaje) => setVista({ tipo: 'detalle', id: vista.id, aviso: mensaje })}
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
        onSeleccionarPestana={seleccionarPestana}
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
