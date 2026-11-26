import { useCallback, useEffect, useState } from 'react';
import { ActivoDetalle, IActivosService } from '../models/types';

/** ViewModel de la ficha del activo y de sus movimientos (asignación, devolución, mantenimiento). */
export const useActivoDetalleViewModel = (servicio: IActivosService, idActivo: string) => {
  const [activo, setActivo] = useState<ActivoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setActivo(await servicio.consultar(idActivo));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [servicio, idActivo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const mover = async (mensaje: string, operacion: () => Promise<ActivoDetalle>) => {
    setProcesando(true);
    setError(null);
    setAviso(null);
    try {
      setActivo(await operacion());
      setAviso(mensaje);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  return {
    activo,
    cargando,
    procesando,
    error,
    aviso,
    recargar: cargar,
    asignar: (idEmpleado: string) => mover('Activo asignado.', () => servicio.asignar(idActivo, idEmpleado)),
    devolver: (nota: string) =>
      mover('Devolución registrada. El activo está disponible.', () => servicio.devolver(idActivo, nota)),
    iniciarMantenimiento: (nota: string) =>
      mover('Activo enviado a mantenimiento.', () => servicio.iniciarMantenimiento(idActivo, nota)),
    cerrarMantenimiento: (nota: string) =>
      mover('Mantenimiento cerrado. El activo está disponible.', () => servicio.cerrarMantenimiento(idActivo, nota)),
  };
};
