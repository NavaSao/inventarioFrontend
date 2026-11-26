import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalMovil } from '../../../shared/ui/ModalMovil';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { EstadoLicencia, FiltroPestana, Licencia, NuevaLicenciaDTO } from '../models/types';
import { LicenciasService } from '../services/LicenciasService';
import { AppIconBadge, SearchIcon } from '../../../shared/components/Icons';
import { LicenciaActivaModal } from './LicenciaActivaModal';

export interface LicenciasScreenProps {
  readonly licenciasService?: LicenciasService;
  readonly licenciaIdInicial?: string;
  readonly onSeleccionarLicencia?: (licencia: Licencia) => void;
}

export const colores = {
  forest: '#0F382A',
  emerald: '#107C41',
  mint: '#D1FAE5',
  mintLight: '#ECFDF5',
  background: '#F6F8F6',
  white: '#FFFFFF',
  oscuro: '#0F382A',
  grisTexto: '#61746A',
  grisSub: '#82938B',
  bordeSutil: '#E6EBE7',
  bordeInput: '#D6DDD8',
  fondoBarraProgreso: '#EAEFEA',
  // Semánticos de estado
  vigenteBg: '#D1FAE5',
  vigenteTexto: '#107C41',
  porVencerBg: '#FEF3C7',
  porVencerTexto: '#B45309',
  vencidaBg: '#FEE2E2',
  vencidaTexto: '#B91C1C',
};

const fuentes = { Inter_400Regular, Inter_600SemiBold, Inter_700Bold };

const PESTANAS: { id: FiltroPestana; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'vigente', label: 'Vigentes' },
  { id: 'por_vencer', label: 'Por vencer' },
  { id: 'vencida', label: 'Vencidas' },
];

export const LicenciasScreen: React.FC<LicenciasScreenProps> = ({
  licenciasService,
  licenciaIdInicial,
  onSeleccionarLicencia,
}) => {
  const [fuentesListas] = useFonts(fuentes);
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState<FiltroPestana>('todas');
  const [refrescando, setRefrescando] = useState(false);
  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [licenciaActivaModal, setLicenciaActivaModal] = useState<Licencia | null>(null);

  // Formulario nueva licencia
  const [codigoLicencia, setCodigoLicencia] = useState('');
  const [software, setSoftware] = useState('');
  const [plan, setPlan] = useState('');
  const [periodicidad, setPeriodicidad] = useState('');
  const [inicioVigencia, setInicioVigencia] = useState('');
  const [finVigencia, setFinVigencia] = useState('');
  const [cuposContratados, setCuposContratados] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [referenciaContrato, setReferenciaContrato] = useState('');
  const [costo, setCosto] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});

  // Desbloqueo secuencial de campos obligatorios
  const codigoValido = codigoLicencia.trim().length > 0;
  const softwareHabilitado = codigoValido;
  const softwareValido = softwareHabilitado && software.trim().length > 0;
  const planHabilitado = softwareValido;
  const planValido = planHabilitado && plan.trim().length > 0;
  const cuposHabilitado = planValido;
  const cuposNumActual = parseInt(cuposContratados, 10);
  const cuposValido =
    cuposHabilitado &&
    cuposContratados.trim().length > 0 &&
    !isNaN(cuposNumActual) &&
    cuposNumActual >= 1;
  const periodicidadHabilitada = cuposValido;
  const periodicidadValida = periodicidadHabilitada && periodicidad.trim().length > 0;
  const inicioHabilitado = periodicidadValida;
  const inicioValido = inicioHabilitado && inicioVigencia.trim().length > 0;
  const finHabilitado = inicioValido;
  const finValido = finHabilitado && finVigencia.trim().length > 0;
  const opcionalesHabilitados = finValido;

  const limpiarErrorCampo = (campo: string) => {
    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const regular = fuentesListas ? styles.interRegular : undefined;
  const semibold = fuentesListas ? styles.interSemibold : styles.semibold;
  const bold = fuentesListas ? styles.interBold : styles.bold;

  const cargarLicencias = async () => {
    if (!licenciasService) return;
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await licenciasService.obtenerLicencias(busqueda, pestanaActiva);
      setLicencias(data);
    } catch (err: any) {
      setErrorCarga(err?.message || 'No se pudieron cargar las licencias del servidor.');
      setLicencias([]);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarLicencias();
  }, [licenciasService, busqueda, pestanaActiva]);

  useEffect(() => {
    if (licenciaIdInicial && onSeleccionarLicencia) {
      const encontrada = licencias.find(
        (l) => l.id === licenciaIdInicial || l.software.toLowerCase().includes(licenciaIdInicial.toLowerCase())
      );
      if (encontrada) onSeleccionarLicencia(encontrada);
    }
  }, [licenciaIdInicial, licencias, onSeleccionarLicencia]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarLicencias();
  };

  // Filtrado reactivo en UI
  const licenciasFiltradas = useMemo(() => {
    return licencias.filter((lic) => {
      if (pestanaActiva !== 'todas') {
        if (lic.estado !== pestanaActiva) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        return (
          lic.software.toLowerCase().includes(q) ||
          lic.plan.toLowerCase().includes(q) ||
          lic.codigoLicencia.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [licencias, pestanaActiva, busqueda]);

  const totalCuposFiltrados = useMemo(() => {
    return licenciasFiltradas.reduce((acc, curr) => acc + curr.cuposContratados, 0);
  }, [licenciasFiltradas]);

  const limpiarFormulario = () => {
    setCodigoLicencia('');
    setSoftware('');
    setPlan('');
    setPeriodicidad('');
    setInicioVigencia('');
    setFinVigencia('');
    setCuposContratados('');
    setProveedor('');
    setReferenciaContrato('');
    setCosto('');
    setMoneda('USD');
    setErrorFormulario(null);
    setErroresCampos({});
  };

  const handleCrearLicencia = async () => {
    setErrorFormulario(null);

    const cod = codigoLicencia.trim().toUpperCase();
    const sw = software.trim();
    const pl = plan.trim();
    const per = periodicidad.trim();
    const ini = inicioVigencia.trim();
    const fin = finVigencia.trim();
    const cuposNum = parseInt(cuposContratados, 10);

    const nuevosErrores: Record<string, string> = {};
    if (!cod) nuevosErrores.codigoLicencia = 'El código de licencia es obligatorio.';
    if (!sw) nuevosErrores.software = 'El software o aplicación es obligatorio.';
    if (!pl) nuevosErrores.plan = 'El plan contratado es obligatorio.';
    if (!cuposContratados.trim()) {
      nuevosErrores.cuposContratados = 'Los cupos son obligatorios.';
    } else if (isNaN(cuposNum) || cuposNum < 1) {
      nuevosErrores.cuposContratados = 'Debe ser un número mayor o igual a 1.';
    }
    if (!per) nuevosErrores.periodicidad = 'La periodicidad es obligatoria.';
    if (!ini) nuevosErrores.inicioVigencia = 'La fecha de inicio es obligatoria.';
    if (!fin) nuevosErrores.finVigencia = 'La fecha de fin es obligatoria.';
    if (costo.trim() && !moneda.trim()) {
      nuevosErrores.moneda = 'Indica la moneda del costo.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      setErrorFormulario('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    setErroresCampos({});

    const dto: NuevaLicenciaDTO = {
      codigoLicencia: cod,
      software: sw,
      plan: pl,
      periodicidad: per,
      inicioVigencia: ini,
      finVigencia: fin,
      cuposContratados: cuposNum,
      proveedor: proveedor.trim() || undefined,
      referenciaContrato: referenciaContrato.trim() || undefined,
      costo: costo.trim() ? parseFloat(costo) : undefined,
      moneda: costo.trim() ? moneda.trim() : undefined,
    };

    if (!licenciasService) {
      setErrorFormulario('Servicio de licencias no disponible.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await licenciasService.crearLicencia(dto);
      if (respuesta) {
        setLicencias((prev) => [
          respuesta,
          ...prev.filter((l) => l.codigoLicencia !== respuesta.codigoLicencia),
        ]);
        if (pestanaActiva !== 'todas' && respuesta.estado !== pestanaActiva) {
          setPestanaActiva(respuesta.estado);
        }
      }
      await cargarLicencias();

      limpiarFormulario();
      setModalNuevoVisible(false);
      if (respuesta) {
        setLicenciaActivaModal(respuesta);
      }
    } catch (err: any) {
      setErrorFormulario(err.message || 'Error al guardar la licencia.');
    } finally {
      setGuardando(false);
    }
  };

  const badgePropsPorEstado = (estado: EstadoLicencia) => {
    switch (estado) {
      case 'vigente':
        return {
          bg: colores.vigenteBg,
          text: colores.vigenteTexto,
          dot: colores.emerald,
          label: 'Vigente',
        };
      case 'por_vencer':
        return {
          bg: colores.porVencerBg,
          text: colores.porVencerTexto,
          dot: '#D97706',
          label: 'Por vencer',
        };
      case 'vencida':
        return {
          bg: colores.vencidaBg,
          text: colores.vencidaTexto,
          dot: '#DC2626',
          label: 'Vencida',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Superior Corporativo */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitlesCol}>
            <Text style={[styles.titulo, bold]} accessibilityRole="header">
              Licencias
            </Text>
            <Text style={[styles.subtitulo, regular]}>
              Gestión y optimización de suscripciones
            </Text>
          </View>
          <TouchableOpacity
            style={styles.botonCrearPill}
            onPress={() => {
              limpiarFormulario();
              setModalNuevoVisible(true);
            }}
            activeOpacity={0.85}
            accessibilityLabel="Registrar nueva licencia"
            accessibilityRole="button"
          >
            <Text style={[styles.botonCrearPillTexto, bold]}>+ Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador de alta precisión */}
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={colores.emerald} />
          <TextInput
            style={[styles.searchInput, regular]}
            placeholder="Buscar software o licencia"
            placeholderTextColor={colores.grisSub}
            value={busqueda}
            onChangeText={setBusqueda}
            clearButtonMode="while-editing"
            accessibilityLabel="Buscar software o licencia"
          />
        </View>

        {errorCarga && (
          <View style={[styles.errorAlert, { marginHorizontal: 20 }]}>
            <Text style={[styles.errorAlertText, regular]}>{errorCarga}</Text>
          </View>
        )}

        {cargando && licencias.length === 0 && (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colores.emerald} />
          </View>
        )}

        {/* Pestañas de filtro tipo pill con segmentación suave */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {PESTANAS.map((tab) => {
              const activa = pestanaActiva === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabChip, activa && styles.tabChipActiva]}
                  onPress={() => setPestanaActiva(tab.id)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activa }}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      activa
                        ? [styles.tabChipTextActiva, bold]
                        : [styles.tabChipTextInactiva, semibold],
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Contador dinámico de resultados */}
        <View style={styles.contadorRow}>
          <View style={styles.contadorDot} />
          <Text style={[styles.contadorTexto, semibold]}>
            {licenciasFiltradas.length}{' '}
            {licenciasFiltradas.length === 1 ? 'aplicación' : 'aplicaciones'} ·{' '}
            {totalCuposFiltrados} puestos
          </Text>
        </View>

        {/* Lista de tarjetas de licencias */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              tintColor={colores.emerald}
            />
          }
        >
          {licenciasFiltradas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitulo, semibold]}>No se encontraron licencias</Text>
              <Text style={[styles.emptySub, regular]}>
                Intenta con otro término de búsqueda o cambia la pestaña de filtro.
              </Text>
            </View>
          ) : (
            licenciasFiltradas.map((lic) => {
              const badge = badgePropsPorEstado(lic.estado);
              const totalContratado = lic.cuposContratados || 1;
              const porcentaje = Math.min(
                100,
                Math.round((lic.cuposAsignados / totalContratado) * 100)
              );
              const cuposLibres = Math.max(0, lic.cuposContratados - lic.cuposAsignados);

              const colorProgreso =
                lic.estado === 'vencida'
                  ? '#DC2626'
                  : lic.estado === 'por_vencer'
                  ? '#D97706'
                  : colores.emerald;

              return (
                <TouchableOpacity
                  key={lic.id}
                  style={styles.card}
                  onPress={() => onSeleccionarLicencia?.(lic)}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalle de licencia ${lic.software}`}
                >
                  {/* Encabezado de la tarjeta: Software + Estado */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <AppIconBadge software={lic.software} size={46} />
                      <View style={styles.cardTitleInfo}>
                        <Text style={[styles.cardTitle, bold]}>{lic.software}</Text>
                        <Text style={[styles.cardPlan, regular]}>
                          {lic.plan} • {lic.periodicidad}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <View style={[styles.badgeDot, { backgroundColor: badge.dot }]} />
                      <Text style={[styles.badgeText, { color: badge.text }, bold]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Sección de Capacidad y Ocupación */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressTextRow}>
                      <Text style={[styles.progressLabel, semibold]}>
                        {lic.cuposAsignados} de {lic.cuposContratados} puestos ocupados
                      </Text>
                      <View style={styles.pctPill}>
                        <Text style={[styles.pctPillText, bold]}>{porcentaje}%</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${porcentaje}%`,
                            backgroundColor: colorProgreso,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.cuposLibresSub, regular]}>
                      {cuposLibres === 1 ? '1 puesto disponible' : `${cuposLibres} puestos disponibles`}
                    </Text>
                  </View>

                  {/* Pie de tarjeta con fechas y código monospace */}
                  <View style={styles.cardFooter}>
                    <View style={styles.vigenciaCol}>
                      <Text style={[styles.cardFooterText, regular]}>
                        {lic.estado === 'vencida'
                          ? `Venció el ${lic.finVigencia}`
                          : `Vence el ${lic.finVigencia}`}
                      </Text>
                    </View>
                    <View style={styles.codigoPill}>
                      <Text style={[styles.cardCodigo, semibold]}>
                        {lic.codigoLicencia}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Modal / Formulario Nueva Licencia */}
      {modalNuevoVisible && (
        <ModalMovil
          visible={modalNuevoVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalNuevoVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <KeyboardAvoidingView
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, bold]}>Registrar Licencia</Text>
                  <Text style={[styles.modalSub, regular]}>
                    Ingresa los detalles del contrato de software
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalNuevoVisible(false)}
                  style={styles.modalCloseButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.formScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {errorFormulario && (
                  <View style={styles.errorAlert} accessibilityRole="alert">
                    <Text style={[styles.errorAlertText, regular]}>{errorFormulario}</Text>
                  </View>
                )}

                <Text style={[styles.requiredLegend, regular]}>
                  <Text style={styles.requiredAsterisk}>*</Text> Campos obligatorios
                </Text>

                <Text style={[styles.inputLabel, semibold]}>
                  Código de Licencia <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  accessibilityLabel="Código de Licencia"
                  style={[styles.input, bold, erroresCampos.codigoLicencia && styles.inputError]}
                  placeholder="EJ. MS-365-PRO"
                  placeholderTextColor={colores.grisSub}
                  value={codigoLicencia}
                  onChangeText={(text) => {
                    setCodigoLicencia(text.toUpperCase());
                    limpiarErrorCampo('codigoLicencia');
                  }}
                  autoCapitalize="characters"
                />
                {erroresCampos.codigoLicencia && (
                  <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.codigoLicencia}</Text>
                )}

                <Text style={[styles.inputLabel, semibold]}>
                  Software / Aplicación <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View pointerEvents={softwareHabilitado ? 'auto' : 'none'}>
                  <TextInput
                    accessibilityLabel="Software / Aplicación"
                    style={[
                      styles.input,
                      regular,
                      !softwareHabilitado && styles.inputBloqueado,
                      erroresCampos.software && styles.inputError,
                    ]}
                    placeholder="Ej. Figma, Microsoft 365"
                    placeholderTextColor={colores.grisSub}
                    editable={softwareHabilitado}
                    selectTextOnFocus={softwareHabilitado}
                    value={software}
                    onChangeText={(text) => {
                      setSoftware(text);
                      limpiarErrorCampo('software');
                    }}
                  />
                </View>
                {erroresCampos.software && (
                  <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.software}</Text>
                )}

                <Text style={[styles.inputLabel, semibold]}>
                  Plan contratado <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View pointerEvents={planHabilitado ? 'auto' : 'none'}>
                  <TextInput
                    accessibilityLabel="Plan contratado"
                    style={[
                      styles.input,
                      regular,
                      !planHabilitado && styles.inputBloqueado,
                      erroresCampos.plan && styles.inputError,
                    ]}
                    placeholder="Ej. Organization, Business Standard"
                    placeholderTextColor={colores.grisSub}
                    editable={planHabilitado}
                    selectTextOnFocus={planHabilitado}
                    value={plan}
                    onChangeText={(text) => {
                      setPlan(text);
                      limpiarErrorCampo('plan');
                    }}
                  />
                </View>
                {erroresCampos.plan && (
                  <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.plan}</Text>
                )}

                <View style={styles.rowInputs}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>
                      Cupos contratados <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View pointerEvents={cuposHabilitado ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Cupos contratados"
                        style={[
                          styles.input,
                          regular,
                          !cuposHabilitado && styles.inputBloqueado,
                          erroresCampos.cuposContratados && styles.inputError,
                        ]}
                        placeholder="10"
                        placeholderTextColor={colores.grisSub}
                        editable={cuposHabilitado}
                        selectTextOnFocus={cuposHabilitado}
                        keyboardType="number-pad"
                        value={cuposContratados}
                        onChangeText={(text) => {
                          setCuposContratados(text);
                          limpiarErrorCampo('cuposContratados');
                        }}
                      />
                    </View>
                    {erroresCampos.cuposContratados && (
                      <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.cuposContratados}</Text>
                    )}
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>
                      Periodicidad <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View pointerEvents={periodicidadHabilitada ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Periodicidad"
                        style={[
                          styles.input,
                          regular,
                          !periodicidadHabilitada && styles.inputBloqueado,
                          erroresCampos.periodicidad && styles.inputError,
                        ]}
                        placeholder="Anual / Mensual"
                        placeholderTextColor={colores.grisSub}
                        editable={periodicidadHabilitada}
                        selectTextOnFocus={periodicidadHabilitada}
                        value={periodicidad}
                        onChangeText={(text) => {
                          setPeriodicidad(text);
                          limpiarErrorCampo('periodicidad');
                        }}
                      />
                    </View>
                    {erroresCampos.periodicidad && (
                      <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.periodicidad}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>
                      Inicio Vigencia <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View pointerEvents={inicioHabilitado ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Inicio Vigencia"
                        style={[
                          styles.input,
                          regular,
                          !inicioHabilitado && styles.inputBloqueado,
                          erroresCampos.inicioVigencia && styles.inputError,
                        ]}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colores.grisSub}
                        editable={inicioHabilitado}
                        selectTextOnFocus={inicioHabilitado}
                        value={inicioVigencia}
                        onChangeText={(text) => {
                          setInicioVigencia(text);
                          limpiarErrorCampo('inicioVigencia');
                        }}
                      />
                    </View>
                    {erroresCampos.inicioVigencia && (
                      <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.inicioVigencia}</Text>
                    )}
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>
                      Fin Vigencia <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View pointerEvents={finHabilitado ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Fin Vigencia"
                        style={[
                          styles.input,
                          regular,
                          !finHabilitado && styles.inputBloqueado,
                          erroresCampos.finVigencia && styles.inputError,
                        ]}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colores.grisSub}
                        editable={finHabilitado}
                        selectTextOnFocus={finHabilitado}
                        value={finVigencia}
                        onChangeText={(text) => {
                          setFinVigencia(text);
                          limpiarErrorCampo('finVigencia');
                        }}
                      />
                    </View>
                    {erroresCampos.finVigencia && (
                      <Text style={[styles.fieldErrorText, regular]}>{erroresCampos.finVigencia}</Text>
                    )}
                  </View>
                </View>

                <Text style={[styles.inputLabel, semibold]}>Proveedor (opcional)</Text>
                <View pointerEvents={opcionalesHabilitados ? 'auto' : 'none'}>
                  <TextInput
                    accessibilityLabel="Proveedor"
                    style={[styles.input, regular, !opcionalesHabilitados && styles.inputBloqueado]}
                    placeholder="Ej. Microsoft Corporation"
                    placeholderTextColor={colores.grisSub}
                    editable={opcionalesHabilitados}
                    selectTextOnFocus={opcionalesHabilitados}
                    value={proveedor}
                    onChangeText={setProveedor}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>Costo (opcional)</Text>
                    <View pointerEvents={opcionalesHabilitados ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Costo"
                        style={[styles.input, regular, !opcionalesHabilitados && styles.inputBloqueado]}
                        placeholder="Ej. 1200"
                        placeholderTextColor={colores.grisSub}
                        editable={opcionalesHabilitados}
                        selectTextOnFocus={opcionalesHabilitados}
                        keyboardType="numeric"
                        value={costo}
                        onChangeText={setCosto}
                      />
                    </View>
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={[styles.inputLabel, semibold]}>Moneda</Text>
                    <View pointerEvents={opcionalesHabilitados ? 'auto' : 'none'}>
                      <TextInput
                        accessibilityLabel="Moneda"
                        style={[styles.input, regular, !opcionalesHabilitados && styles.inputBloqueado]}
                        placeholder="USD / MXN"
                        placeholderTextColor={colores.grisSub}
                        editable={opcionalesHabilitados}
                        selectTextOnFocus={opcionalesHabilitados}
                        value={moneda}
                        onChangeText={(t) => setMoneda(t.toUpperCase())}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.botonGuardar,
                    (guardando || !opcionalesHabilitados) && styles.botonDeshabilitado,
                  ]}
                  onPress={handleCrearLicencia}
                  disabled={guardando || !opcionalesHabilitados}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={colores.white} />
                  ) : (
                    <Text style={[styles.botonGuardarTexto, bold]}>Guardar licencia</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </ModalMovil>
      )}

      {/* Modal Pantalla de Licencia Activa */}
      <LicenciaActivaModal
        visible={licenciaActivaModal !== null}
        licencia={licenciaActivaModal}
        onClose={() => setLicenciaActivaModal(null)}
      />
    </SafeAreaView>
  );
};

export default LicenciasScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.background,
  },
  container: {
    flex: 1,
  },
  interRegular: {
    fontFamily: 'Inter_400Regular',
  },
  interSemibold: {
    fontFamily: 'Inter_600SemiBold',
  },
  interBold: {
    fontFamily: 'Inter_700Bold',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitlesCol: {
    flex: 1,
    paddingRight: 12,
  },
  titulo: {
    fontSize: 26,
    color: colores.forest,
    letterSpacing: -0.4,
  },
  subtitulo: {
    fontSize: 13,
    color: colores.grisTexto,
    marginTop: 2,
  },
  botonCrearPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colores.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colores.emerald,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  botonCrearPillTexto: {
    fontSize: 13,
    color: colores.white,
    letterSpacing: 0.2,
  },
  bannerActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowColor: '#0F382A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  bannerActivaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  bannerActivaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#107C41',
    marginRight: 10,
  },
  bannerActivaTextos: {
    flex: 1,
  },
  bannerActivaTitulo: {
    fontSize: 13,
    color: '#0F382A',
  },
  bannerActivaSub: {
    fontSize: 11,
    color: '#61746A',
    marginTop: 1,
  },
  bannerActivaBoton: {
    backgroundColor: '#107C41',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  bannerActivaBotonTexto: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colores.oscuro,
  },
  tabsWrapper: {
    marginBottom: 6,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colores.white,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
  },
  tabChipActiva: {
    backgroundColor: colores.forest,
    borderColor: colores.forest,
  },
  tabChipText: {
    fontSize: 13,
  },
  tabChipTextActiva: {
    color: colores.white,
  },
  tabChipTextInactiva: {
    color: colores.grisTexto,
  },
  contadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  contadorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colores.emerald,
    marginRight: 8,
  },
  contadorTexto: {
    fontSize: 12,
    color: colores.grisTexto,
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 90,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitulo: {
    fontSize: 16,
    color: colores.oscuro,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colores.grisSub,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colores.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    shadowColor: '#0F382A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: colores.forest,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardPlan: {
    fontSize: 12,
    color: colores.grisTexto,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: colores.forest,
  },
  pctPill: {
    backgroundColor: colores.mintLight,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  pctPillText: {
    fontSize: 11,
    color: colores.emerald,
  },
  progressBarBackground: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colores.fondoBarraProgreso,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cuposLibresSub: {
    fontSize: 11,
    color: colores.grisSub,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
    paddingTop: 10,
  },
  vigenciaCol: {
    flex: 1,
  },
  cardFooterText: {
    fontSize: 12,
    color: colores.grisTexto,
  },
  codigoPill: {
    backgroundColor: '#F1F5F3',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  cardCodigo: {
    fontSize: 11,
    color: colores.forest,
    letterSpacing: 0.4,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colores.white,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colores.bordeSutil,
  },
  modalTitle: {
    fontSize: 18,
    color: colores.forest,
  },
  modalSub: {
    fontSize: 12,
    color: colores.grisTexto,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: colores.forest,
    fontWeight: '700',
  },
  formScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  requiredLegend: {
    fontSize: 12,
    color: colores.grisTexto,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    color: colores.forest,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FBFDFB',
    borderWidth: 1,
    borderColor: colores.bordeInput,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colores.forest,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputBloqueado: {
    backgroundColor: '#F1F5F3',
    borderColor: '#E2E8E4',
    color: colores.grisSub,
    opacity: 0.65,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  botonGuardar: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colores.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colores.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    fontSize: 16,
    color: colores.white,
  },
});
