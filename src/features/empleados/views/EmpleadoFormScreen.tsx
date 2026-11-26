import React from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Boton, Campo, Encabezado, estilos } from '../../../shared/ui/componentes';
import { tema } from '../../../shared/ui/tema';
import { Empleado, IEmpleadosService } from '../models/types';
import { useEmpleadoFormViewModel } from '../viewmodels/useEmpleadoFormViewModel';

export const EmpleadoFormScreen: React.FC<{
  servicio: IEmpleadosService;
  empleado?: Empleado;
  onVolver: () => void;
}> = ({ servicio, empleado, onVolver }) => {
  const vm = useEmpleadoFormViewModel(servicio, empleado, onVolver);

  return (
    <View style={estilos.pantalla}>
      <Encabezado
        titulo={empleado ? 'Editar empleado' : 'Nuevo empleado'}
        subtitulo="Registra sus datos y administra sus accesos."
        onVolver={onVolver}
      />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="Nombre completo *" placeholder="Ej. Ana López" value={vm.datos.nombre} onChangeText={vm.cambiar('nombre')} error={vm.errores.nombre} />
        <Campo
          etiqueta="Correo corporativo *"
          placeholder="nombre@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={vm.datos.correo}
          onChangeText={vm.cambiar('correo')}
          error={vm.errores.correo}
        />
        <Campo etiqueta="ID de empleado *" placeholder="Ej. EMP-0013" autoCapitalize="characters" value={vm.datos.numeroEmpleado} onChangeText={vm.cambiar('numeroEmpleado')} error={vm.errores.numeroEmpleado} />
        <Campo etiqueta="Área o departamento *" placeholder="Ej. Diseño" value={vm.datos.departamento} onChangeText={vm.cambiar('departamento')} error={vm.errores.departamento} />
        <Campo etiqueta="Cargo *" placeholder="Ej. Analista de operaciones" value={vm.datos.cargo} onChangeText={vm.cambiar('cargo')} error={vm.errores.cargo} />

        {!empleado && (
          <View style={estilos.fila}>
            <Switch value={vm.enviarBienvenida} onValueChange={vm.setEnviarBienvenida} trackColor={{ true: tema.emerald }} />
            <Text style={estilos.etiqueta}>Enviar correo de bienvenida</Text>
          </View>
        )}

        {vm.error && <Text style={estilos.mensajeError}>{vm.error}</Text>}
        <Boton texto="Guardar empleado" onPress={vm.guardar} cargando={vm.guardando} />
        {empleado?.activo && (
          <Boton texto="Desactivar empleado" variante="peligro" onPress={vm.desactivar} deshabilitado={vm.guardando} />
        )}
      </ScrollView>
    </View>
  );
};
