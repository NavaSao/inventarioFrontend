export function leerRespuestaAuth(cuerpo: unknown) {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return { datos: null };
  }

  // Acepto ambos formatos mientras se integra la arquitectura nueva del backend.
  if ('status' in cuerpo && 'message' in cuerpo && 'data' in cuerpo) {
    return {
      datos: cuerpo.data,
      mensaje: typeof cuerpo.message === 'string' ? cuerpo.message : undefined,
    };
  }

  return {
    datos: cuerpo,
    mensaje: 'mensaje' in cuerpo && typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje : undefined,
  };
}
