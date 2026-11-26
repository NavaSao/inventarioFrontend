import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { IEmpleadosService } from '../../empleados/models/types';
import { Activo, IActivosService } from '../models/types';
import { ActivoDetalleScreen } from './ActivoDetalleScreen';
import { ActivoFormScreen } from './ActivoFormScreen';
import { ActivosScreen } from './ActivosScreen';

type Vista =
  | { tipo: 'lista' }
  | { tipo: 'detalle'; idActivo: string }
  | { tipo: 'form'; activo?: Activo; etiqueta?: string };

/** Pila de navegación de la pestaña Equipos. */
export const ActivosNavegador: React.FC<{ servicio: IActivosService; empleadosServicio: IEmpleadosService }> = ({
  servicio,
  empleadosServicio,
}) => {
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });

  const volver = () => {
    if (vista.tipo === 'lista') return false;
    setVista(vista.tipo === 'form' && vista.activo ? { tipo: 'detalle', idActivo: vista.activo.idActivo } : { tipo: 'lista' });
    return true;
  };

  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', volver);
    return () => suscripcion.remove();
  });

  switch (vista.tipo) {
    case 'detalle':
      return (
        <ActivoDetalleScreen
          servicio={servicio}
          empleadosServicio={empleadosServicio}
          idActivo={vista.idActivo}
          onVolver={volver}
          onEditar={(activo) => setVista({ tipo: 'form', activo })}
        />
      );
    case 'form':
      return (
        <ActivoFormScreen
          servicio={servicio}
          activo={vista.activo}
          etiquetaEscaneada={vista.etiqueta}
          onVolver={volver}
          onGuardado={(idActivo) => setVista({ tipo: 'detalle', idActivo })}
        />
      );
    default:
      return (
        <ActivosScreen
          servicio={servicio}
          onAbrir={(idActivo) => setVista({ tipo: 'detalle', idActivo })}
          onNuevo={(etiqueta) => setVista({ tipo: 'form', etiqueta })}
        />
      );
  }
};
