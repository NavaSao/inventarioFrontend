import { useState } from 'react';
import { Activo, DatosActivo, IActivosService } from '../models/types';

const OBLIGATORIOS: (keyof DatosActivo)[] = ['nombre', 'numeroSerie', 'etiqueta', 'categoria', 'ubicacion'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ViewModel del registro / edición de un activo con su fotografía. */
export const useActivoFormViewModel = (
  servicio: IActivosService,
  activo: Activo | undefined,
  etiquetaEscaneada: string | undefined,
  onGuardado: (idActivo: string) => void
) => {
  const [datos, setDatos] = useState<DatosActivo>({
    nombre: activo?.nombre ?? '',
    numeroSerie: activo?.numeroSerie ?? '',
    etiqueta: activo?.etiqueta ?? etiquetaEscaneada ?? '',
    categoria: activo?.categoria ?? '',
    ubicacion: activo?.ubicacion ?? '',
    marca: activo?.marca ?? '',
    modelo: activo?.modelo ?? '',
  });
  const [foto, setFoto] = useState<string>();
  const [errores, setErrores] = useState<Partial<Record<keyof DatosActivo, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof DatosActivo) => (valor: string) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
  };

  const validar = () => {
    const nuevos: typeof errores = {};
    OBLIGATORIOS.forEach((campo) => {
      if (!datos[campo].trim()) nuevos[campo] = 'Campo obligatorio';
    });
    if (datos.etiqueta.trim() && !UUID.test(datos.etiqueta.trim())) nuevos.etiqueta = 'La etiqueta debe ser un UUID';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    setError(null);
    try {
      const guardado = activo ? await servicio.editar(activo.idActivo, datos) : await servicio.registrar(datos);
      if (foto) await servicio.subirFoto(guardado.idActivo, foto);
      onGuardado(guardado.idActivo);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return { datos, cambiar, errores, error, guardando, guardar, foto, setFoto };
};
