import { useState } from 'react';
import { DatosEmpleado, Empleado, IEmpleadosService } from '../models/types';

const VACIO: DatosEmpleado = { nombre: '', correo: '', numeroEmpleado: '', departamento: '', cargo: '' };
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ViewModel del alta / edición / desactivación de un empleado. */
export const useEmpleadoFormViewModel = (servicio: IEmpleadosService, empleado: Empleado | undefined, onListo: () => void) => {
  const [datos, setDatos] = useState<DatosEmpleado>({
    nombre: empleado?.nombre ?? '',
    correo: empleado?.correo ?? '',
    numeroEmpleado: empleado?.numeroEmpleado ?? '',
    departamento: empleado?.departamento ?? '',
    cargo: empleado?.cargo ?? '',
  });
  const [enviarBienvenida, setEnviarBienvenida] = useState(true);
  const [errores, setErrores] = useState<Partial<Record<keyof DatosEmpleado, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof DatosEmpleado) => (valor: string) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
  };

  const validar = () => {
    const nuevos: typeof errores = {};
    (Object.keys(VACIO) as (keyof DatosEmpleado)[]).forEach((campo) => {
      if (!datos[campo].trim()) nuevos[campo] = 'Campo obligatorio';
    });
    if (datos.correo.trim() && !CORREO.test(datos.correo.trim())) nuevos.correo = 'Correo inválido';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const ejecutar = async (operacion: () => Promise<unknown>) => {
    setGuardando(true);
    setError(null);
    try {
      await operacion();
      onListo();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    if (!validar()) return;
    void ejecutar(() =>
      empleado ? servicio.editar(empleado.idEmpleado, datos) : servicio.registrar(datos, enviarBienvenida)
    );
  };

  const desactivar = () => {
    if (empleado) void ejecutar(() => servicio.desactivar(empleado.idEmpleado));
  };

  return { datos, cambiar, errores, error, guardando, guardar, desactivar, enviarBienvenida, setEnviarBienvenida };
};
