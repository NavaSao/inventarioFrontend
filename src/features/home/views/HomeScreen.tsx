import React, { useEffect, useState } from 'react';
import { BackHandler, SafeAreaView, StyleSheet, View } from 'react-native';
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
import { ActivosNavegador } from '../../activos/views/ActivosNavegador';
import { IActivosService } from '../../activos/models/types';
import { EmpleadosNavegador } from '../../empleados/views/EmpleadosNavegador';
import { IEmpleadosService } from '../../empleados/models/types';

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
  readonly activosService: IActivosService;
  readonly empleadosService: IEmpleadosService;
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
  activosService,
  empleadosService,
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
            onNavegarEquipos={() => setPestanaActiva('equipos')}
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

        {pestanaActiva === 'equipos' && (
          <ActivosNavegador servicio={activosService} empleadosServicio={empleadosService} />
        )}

        {pestanaActiva === 'empleados' && (
          <EmpleadosNavegador servicio={empleadosService} onCerrarSesion={onCerrarSesion} />
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
});
