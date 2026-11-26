import { useCallback, useEffect, useMemo, useState } from 'react';
import { Empleado, IEmpleadosService } from '../models/types';

/** ViewModel del catálogo de empleados: carga, búsqueda local e indicadores. */
export const useEmpleadosViewModel = (servicio: IEmpleadosService) => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEmpleados(await servicio.listar());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [servicio]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return empleados.filter((e) =>
      [e.nombre, e.correo, e.departamento, e.numeroEmpleado].some((campo) => campo?.toLowerCase().includes(texto))
    );
  }, [empleados, busqueda]);

  const activos = empleados.filter((e) => e.activo);

  return {
    empleados: filtrados,
    busqueda,
    setBusqueda,
    cargando,
    error,
    recargar: cargar,
    totalActivos: activos.length,
    totalAreas: new Set(activos.map((e) => e.departamento)).size,
  };
};
