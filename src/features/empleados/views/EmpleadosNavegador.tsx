import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { Empleado, IEmpleadosService } from '../models/types';
import { EmpleadoFormScreen } from './EmpleadoFormScreen';
import { EmpleadosScreen } from './EmpleadosScreen';

type Vista = { tipo: 'lista' } | { tipo: 'form'; empleado?: Empleado };

/** Pila de navegación de la pestaña Empleados. */
export const EmpleadosNavegador: React.FC<{ servicio: IEmpleadosService; onCerrarSesion: () => void }> = ({
  servicio,
  onCerrarSesion,
}) => {
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const volver = () => {
    if (vista.tipo === 'lista') return false;
    setVista({ tipo: 'lista' });
    return true;
  };

  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', volver);
    return () => suscripcion.remove();
  });

  return vista.tipo === 'form' ? (
    <EmpleadoFormScreen servicio={servicio} empleado={vista.empleado} onVolver={volver} />
  ) : (
    <EmpleadosScreen
      servicio={servicio}
      onNuevo={() => setVista({ tipo: 'form' })}
      onEditar={(empleado) => setVista({ tipo: 'form', empleado })}
      onCerrarSesion={onCerrarSesion}
    />
  );
};
