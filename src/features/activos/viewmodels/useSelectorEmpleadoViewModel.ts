import { useEffect, useState } from 'react';
import { Empleado, IEmpleadosService } from '../../empleados/models/types';

/** ViewModel del selector de empleado activo para asignar un equipo. */
export const useSelectorEmpleadoViewModel = (servicio: IEmpleadosService, visible: boolean) => {
  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const espera = setTimeout(() => {
      servicio.buscarActivos(busqueda).then(
        (lista) => { setEmpleados(lista); setError(null); },
        (e: Error) => setError(e.message)
      );
    }, 300);
    return () => clearTimeout(espera);
  }, [servicio, busqueda, visible]);

  return { busqueda, setBusqueda, empleados, seleccionado, setSeleccionado, error };
};
