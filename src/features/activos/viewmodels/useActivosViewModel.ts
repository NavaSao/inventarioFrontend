import { useCallback, useEffect, useState } from 'react';
import { Activo, EstadoActivo, IActivosService } from '../models/types';

export type ResultadoEscaneo = { tipo: 'encontrado'; idActivo: string } | { tipo: 'nuevo'; etiqueta: string };

/** ViewModel del inventario de hardware: búsqueda, filtro por estado y resolución del escaneo. */
export const useActivosViewModel = (servicio: IActivosService) => {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoActivo>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setActivos(await servicio.listar(busqueda, estado));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [servicio, busqueda, estado]);

  // Espero a que el usuario deje de escribir antes de consultar al servidor.
  useEffect(() => {
    const espera = setTimeout(() => void cargar(), 300);
    return () => clearTimeout(espera);
  }, [cargar]);

  /** Si la etiqueta existe abre la ficha; si no, ofrece registrar un equipo nuevo con ella. */
  const resolverEscaneo = async (etiqueta: string): Promise<ResultadoEscaneo | null> => {
    setError(null);
    try {
      const activo = await servicio.escanear(etiqueta);
      return activo ? { tipo: 'encontrado', idActivo: activo.idActivo } : { tipo: 'nuevo', etiqueta };
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  };

  return { activos, busqueda, setBusqueda, estado, setEstado, cargando, error, recargar: cargar, resolverEscaneo };
};
