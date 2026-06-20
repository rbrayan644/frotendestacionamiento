import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import GeneradorPDF from "./components/GeneradorPDF";
import { API_URL } from "./config/api";

export default function HistorialScreen() {
  // ==========================================
  // ESTADOS GLOBALES DE LA PANTALLA
  // ==========================================
  const [historialOriginal, setHistorialOriginal] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [miRol, setMiRol] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");

  // Estados para filtros y búsqueda
  const [filtroTiempo, setFiltroTiempo] = useState("TODOS");
  const [placaExpandida, setPlacaExpandida] = useState<string | null>(null);
  const [modalMesVisible, setModalMesVisible] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estados para selección de un día específico en el calendario
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // Estados para el Modal de Edición de Conductor
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [conductorEditando, setConductorEditando] = useState<any>(null);

  // Estados de los campos del formulario de edición
  const [editNombres, setEditNombres] = useState("");
  const [editApellidos, setEditApellidos] = useState("");
  const [editCedula, setEditCedula] = useState("");
  const [editTipoVehiculo, setEditTipoVehiculo] = useState("CARRO");
  const [editMarca, setEditMarca] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editTipoConductor, setEditTipoConductor] = useState("ESTUDIANTE");
  const [editCarrera, setEditCarrera] = useState("");
  const [editTrayecto, setEditTrayecto] = useState("");
  const [editPnf, setEditPnf] = useState("");

  // Estados para la lectura de códigos QR (Carnets)
  const [editQrCarnet, setEditQrCarnet] = useState("");
  const [escaneandoQR, setEscaneandoQR] = useState(false);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  /**
   * Carga todo el historial de accesos desde el backend.
   * Si es vigilante, carga solo los de su turno. Si es admin, carga todos.
   */
  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const userId = await AsyncStorage.getItem("userId");
      const userRol = await AsyncStorage.getItem("userRol");
      const userName = await AsyncStorage.getItem("userName");

      if (userRol) setMiRol(userRol);
      if (userName) setNombreUsuario(userName);

      if (!userId || !userRol) return setCargando(false);

      // Petición a Vercel
      const respuesta = await fetch(
        `${API_URL}/registros/historial/${userId}/${userRol}`,
      );
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setHistorialOriginal(datos);
      }
    } catch (error) {
      console.log("Error cargando historial", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // --- UTILIDADES DE FECHAS Y TIEMPO ---

  const obtenerFecha = (fechaTexto: string) => {
    if (!fechaTexto) return null;
    const d = new Date(fechaTexto);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatearDiaMes = (fecha: Date) => {
    return `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const calcularDuracion = (entradaObj: Date, salidaObj: Date) => {
    const diferenciaMs = salidaObj.getTime() - entradaObj.getTime();
    const minutos = Math.floor(diferenciaMs / 60000);
    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;

    if (horas > 0) return `${horas}h ${minsRestantes}m`;
    return `${minutos} min`;
  };

  // --- FUNCIONES DE INTERACCIÓN (UI) ---

  /**
   * Expande o colapsa el historial detallado de un vehículo
   */
  const toggleExpandir = (placa: string) => {
    if (
      Platform.OS === "ios" ||
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setPlacaExpandida(placaExpandida === placa ? null : placa);
  };

  /**
   * Cambia la fecha de búsqueda cuando el usuario usa el calendario nativo
   */
  const cambiarFecha = (event: any, date?: Date) => {
    setMostrarCalendario(Platform.OS === "ios");
    if (date) {
      setFechaSeleccionada(date);
      setFiltroTiempo("DIA_ESPECIFICO");
    }
  };

  /**
   * Elimina un registro de entrada/salida de la bitácora
   */
  const confirmarEliminar = (idRegistro: string) => {
    Alert.alert(
      "Eliminar Registro",
      "¿Estás seguro de que deseas borrar este movimiento del historial?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/registros/${idRegistro}`, {
                method: "DELETE",
              });
              if (res.ok) {
                setHistorialOriginal((prev) =>
                  prev.filter((item) => item._id !== idRegistro),
                );
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el registro.");
            }
          },
        },
      ],
    );
  };

  // --- FUNCIONES DE EDICIÓN DE CONDUCTOR ---

  /**
   * Llena los campos del modal con los datos actuales del conductor para editarlos
   */
  const abrirModalEditar = (conductor: any) => {
    setConductorEditando(conductor);
    setEditNombres(conductor.nombres || "");
    setEditApellidos(conductor.apellidos || "");
    setEditCedula(conductor.cedula || "");
    setEditTipoVehiculo(conductor.tipoVehiculo || "CARRO");
    setEditMarca(conductor.marca || "");
    setEditModelo(conductor.modelo || "");
    setEditTipoConductor(conductor.tipo || "ESTUDIANTE");
    setEditCarrera(conductor.carrera || "");
    setEditTrayecto(conductor.trayecto || "");
    setEditPnf(conductor.pnf || "");
    setEditQrCarnet(conductor.qrCarnet || "");

    setModalEditarVisible(true);
  };

  /**
   * Envía los datos editados del conductor al backend para actualizarlos
   */
  const guardarEdicion = async () => {
    try {
      const res = await fetch(
        `${API_URL}/registros/conductor/${conductorEditando._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombres: editNombres,
            apellidos: editApellidos,
            cedula: editCedula,
            tipoVehiculo: editTipoVehiculo,
            marca: editMarca,
            modelo: editModelo,
            tipo: editTipoConductor,
            carrera: editTipoConductor === "ESTUDIANTE" ? editCarrera : null,
            trayecto: editTipoConductor === "ESTUDIANTE" ? editTrayecto : null,
            pnf: editTipoConductor === "PROFESOR" ? editPnf : null,
            qrCarnet: editQrCarnet,
          }),
        },
      );

      if (res.ok) {
        Alert.alert("Éxito", "Datos actualizados correctamente.");
        setModalEditarVisible(false);
        cargarHistorial(); // Recargamos para ver los cambios
      } else {
        Alert.alert("Error", "No se pudo actualizar.");
      }
    } catch (error) {
      Alert.alert("Error", "Fallo de conexión al editar.");
    }
  };

  // --- FUNCIONES DEL LECTOR QR ---

  const abrirCamaraQR = async () => {
    if (!permisoCamara?.granted) {
      const resultado = await pedirPermisoCamara();
      if (!resultado.granted)
        return Alert.alert("Permiso", "Se necesita acceso a la cámara.");
    }
    setEscaneandoQR(true);
  };

  const handleLectorQR = ({ data }: { data: string }) => {
    setEditQrCarnet(data);
    setEscaneandoQR(false);
    Alert.alert(
      "¡Carnet Vinculado!",
      "El código se ha leído con éxito. Recuerda presionar 'Guardar Cambios' al final.",
    );
  };

  // --- LÓGICA DE FILTRADO (Buscador y Tiempos) ---

  const obtenerMesesDisponibles = () => {
    const meses = historialOriginal
      .map((item) => {
        const d = obtenerFecha(item.horaEntrada || item.createdAt);
        if (!d) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
      .filter(Boolean);
    return Array.from(new Set(meses)).sort().reverse();
  };

  const formatearNombreMes = (yyyy_mm: string) => {
    if (!yyyy_mm) return "Mes";
    const [y, m] = yyyy_mm.split("-");
    const fecha = new Date(parseInt(y), parseInt(m) - 1, 1);
    const nombre = fecha.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };

  const mesesDisponibles = obtenerMesesDisponibles() as string[];

  let historialFiltrado = historialOriginal;
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  ).getTime();
  const inicioSemana = inicioHoy - 7 * 24 * 60 * 60 * 1000;

  // Filtros de fecha
  if (filtroTiempo === "HOY") {
    historialFiltrado = historialOriginal.filter((item) => {
      const d = obtenerFecha(item.horaEntrada || item.createdAt);
      return d ? d.getTime() >= inicioHoy : false;
    });
  } else if (filtroTiempo === "SEMANA") {
    historialFiltrado = historialOriginal.filter((item) => {
      const d = obtenerFecha(item.horaEntrada || item.createdAt);
      return d ? d.getTime() >= inicioSemana : false;
    });
  } else if (filtroTiempo === "DIA_ESPECIFICO") {
    historialFiltrado = historialOriginal.filter((item) => {
      const d = obtenerFecha(item.horaEntrada || item.createdAt);
      if (!d) return false;
      return d.toDateString() === fechaSeleccionada.toDateString();
    });
  } else if (filtroTiempo.includes("-")) {
    historialFiltrado = historialOriginal.filter((item) => {
      const d = obtenerFecha(item.horaEntrada || item.createdAt);
      if (!d) return false;
      const mesItem = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return mesItem === filtroTiempo;
    });
  }

  // Filtro de búsqueda (Placa o Nombre)
  if (busqueda.trim() !== "") {
    const término = busqueda.toLowerCase();
    historialFiltrado = historialFiltrado.filter((item) => {
      const placaStr = item.conductorId?.placa?.toLowerCase() || "";
      const nombreStr =
        `${item.conductorId?.nombres || ""} ${item.conductorId?.apellidos || ""}`.toLowerCase();
      return placaStr.includes(término) || nombreStr.includes(término);
    });
  }

  // Adaptación de los datos filtrados para el PDF
  const datosParaPDF = historialFiltrado.map((item) => {
    const placa = item.conductorId?.placa || "SIN PLACA";
    const nombre =
      `${item.conductorId?.nombres || ""} ${item.conductorId?.apellidos || ""}`.trim() ||
      "Desconocido";
    const tipo = item.conductorId?.tipoVehiculo || "VEHÍCULO";
    return {
      accion: placa,
      usuario: `${nombre} (${tipo})`,
      estado: item.estado === "DENTRO" ? "INGRESÓ" : "SALIÓ",
      createdAt: item.horaEntrada || item.createdAt,
    };
  });

  // Agrupamos el historial por placa para no repetir el vehículo en la lista
  const vehículosAgrupados: Record<string, any> = {};

  historialFiltrado.forEach((item) => {
    const placa = item.conductorId?.placa || "SIN PLACA";
    if (!vehículosAgrupados[placa]) {
      vehículosAgrupados[placa] = {
        conductor: item.conductorId,
        registros: [],
        estadoActual: item.estado,
      };
    }
    vehículosAgrupados[placa].registros.push(item);
  });

  const datosListos = Object.values(vehículosAgrupados);

  // ==========================================
  // RENDERIZADO DE COMPONENTES
  // ==========================================

  const renderVehiculo = ({ item }: { item: any }) => {
    const { conductor, registros, estadoActual } = item;
    const placa = conductor?.placa || "SIN PLACA";
    const foto = conductor?.fotoPerfil;
    const estaDentro = estadoActual === "DENTRO";
    const estaExpandido = placaExpandida === placa;

    const tipoVehiculo = conductor?.tipoVehiculo?.toUpperCase();
    const esMoto = tipoVehiculo === "MOTO";

    return (
      <View
        className={`bg-white rounded-[24px] shadow-sm border mb-4 overflow-hidden ${estaExpandido ? "border-cyan-300" : "border-slate-100"}`}
      >
        {/* ENCABEZADO DEL VEHÍCULO (Click para expandir) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpandir(placa)}
          className="p-5 flex-row items-center"
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              className="w-16 h-16 rounded-[20px] mr-4 bg-slate-100"
              resizeMode="cover"
            />
          ) : (
            <View
              className={`w-16 h-16 rounded-[20px] mr-4 items-center justify-center border ${esMoto ? "bg-amber-50 border-amber-100" : "bg-cyan-50 border-cyan-100"}`}
            >
              {esMoto ? (
                <MaterialCommunityIcons
                  name="motorbike"
                  size={32}
                  color="#d97706"
                />
              ) : (
                <Ionicons name="car-sport" size={28} color="#0891b2" />
              )}
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center">
                <View
                  className={`w-3 h-3 rounded-full mr-2 shadow-sm ${estaDentro ? "bg-emerald-400" : "bg-rose-400"}`}
                />
                <Text className="font-black text-lg text-slate-800 tracking-widest">
                  {placa}
                </Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={() => abrirModalEditar(conductor)}
                  className="bg-amber-100 p-2 rounded-xl"
                >
                  <Ionicons name="pencil" size={14} color="#d97706" />
                </TouchableOpacity>
                <View className="bg-slate-800 px-3 py-1.5 rounded-xl">
                  <Text className="text-[10px] font-black text-white uppercase tracking-widest">
                    {registros.length} movs
                  </Text>
                </View>
              </View>
            </View>

            <Text
              className="font-bold text-slate-700 text-sm"
              numberOfLines={1}
            >
              {conductor?.nombres} {conductor?.apellidos}
            </Text>
            <View className="flex-row justify-between items-center mt-1">
              <Text
                className="text-slate-400 text-xs font-bold uppercase tracking-wider"
                numberOfLines={1}
              >
                {conductor?.marca} {conductor?.modelo} - {conductor?.tipo}
              </Text>
              <Ionicons
                name={estaExpandido ? "chevron-up" : "chevron-down"}
                size={20}
                color="#cbd5e1"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* DETALLE EXPANDIDO: Muestra las entradas y salidas de este vehículo */}
        {estaExpandido && (
          <View className="bg-slate-50 px-5 pb-5 pt-3 border-t border-slate-100">
            <Text className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
              Historial de Accesos
            </Text>

            {registros.map((reg: any) => {
              const entradaDate = obtenerFecha(
                reg.horaEntrada || reg.createdAt,
              );
              const salidaDate = obtenerFecha(reg.horaSalida);

              return (
                <View
                  key={reg._id}
                  className="mb-4 pl-4 border-l-2 border-slate-200"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-slate-600">
                      Entro:{" "}
                      {entradaDate ? formatearDiaMes(entradaDate) : "--/--"} a
                      las{" "}
                      {entradaDate
                        ? entradaDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => confirmarEliminar(reg._id)}
                      className="p-1"
                    >
                      <Ionicons name="trash" size={16} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>

                  {salidaDate ? (
                    <View className="flex-row justify-between mt-1 items-center">
                      <Text className="text-xs font-bold text-slate-500">
                        Salio: {formatearDiaMes(salidaDate)} a las{" "}
                        {salidaDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text className="text-xs font-black text-cyan-600">
                        {entradaDate
                          ? calcularDuracion(entradaDate, salidaDate)
                          : "N/A"}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs font-black text-emerald-500 mt-1 uppercase tracking-widest">
                      Vehículo dentro del campus
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* ================= CABECERA ================= */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="arrow-back" size={22} color="#38bdf8" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-black text-white tracking-tight">
              Historial
            </Text>
            <Text className="text-cyan-400 font-medium text-sm mt-1 tracking-wide">
              {miRol === "VIGILANTE"
                ? "Tus registros del turno"
                : "Auditoría general del sistema"}
            </Text>
          </View>
        </View>

        {/* BARRA DE BÚSQUEDA */}
        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-inner mb-4">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-white font-medium text-base"
            placeholder="Buscar placa o nombre..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="none"
          />
          {busqueda !== "" && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTROS DE TIEMPO */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-3"
        >
          <TouchableOpacity
            onPress={() => setFiltroTiempo("HOY")}
            className={`px-5 py-2.5 rounded-xl border-2 ${filtroTiempo === "HOY" ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"}`}
          >
            <Text
              className={`font-black text-xs tracking-wider uppercase ${filtroTiempo === "HOY" ? "text-white" : "text-slate-300"}`}
            >
              Hoy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroTiempo("SEMANA")}
            className={`px-5 py-2.5 rounded-xl border-2 ${filtroTiempo === "SEMANA" ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"}`}
          >
            <Text
              className={`font-black text-xs tracking-wider uppercase ${filtroTiempo === "SEMANA" ? "text-white" : "text-slate-300"}`}
            >
              7 dias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroTiempo("TODOS")}
            className={`px-5 py-2.5 rounded-xl border-2 ${filtroTiempo === "TODOS" ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"}`}
          >
            <Text
              className={`font-black text-xs tracking-wider uppercase ${filtroTiempo === "TODOS" ? "text-white" : "text-slate-300"}`}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMostrarCalendario(true)}
            className={`px-5 py-2.5 rounded-xl border-2 flex-row items-center ${filtroTiempo === "DIA_ESPECIFICO" ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"}`}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={filtroTiempo === "DIA_ESPECIFICO" ? "white" : "#cbd5e1"}
            />
            <Text
              className={`ml-2 font-black text-xs tracking-wider uppercase ${filtroTiempo === "DIA_ESPECIFICO" ? "text-white" : "text-slate-300"}`}
            >
              {filtroTiempo === "DIA_ESPECIFICO"
                ? fechaSeleccionada.toLocaleDateString()
                : "Día Exacto"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalMesVisible(true)}
            className={`px-5 py-2.5 rounded-xl border-2 flex-row items-center ${filtroTiempo.includes("-") ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"}`}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={filtroTiempo.includes("-") ? "white" : "#cbd5e1"}
            />
            <Text
              className={`ml-2 font-black text-xs tracking-wider uppercase ${filtroTiempo.includes("-") ? "text-white" : "text-slate-300"}`}
            >
              {filtroTiempo.includes("-")
                ? formatearNombreMes(filtroTiempo)
                : "Por Mes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* COMPONENTE DE CALENDARIO NATIVO */}
      {mostrarCalendario && (
        <DateTimePicker
          value={fechaSeleccionada}
          mode="date"
          display="default"
          onChange={cambiarFecha}
          maximumDate={new Date()}
        />
      )}

      {cargando ? (
        <ActivityIndicator size="large" color="#0891b2" className="mt-16" />
      ) : (
        <FlatList
          data={datosListos}
          keyExtractor={(item) =>
            item.conductor?.placa || Math.random().toString()
          }
          renderItem={renderVehiculo}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 100,
            paddingTop: 30,
          }}
          ListHeaderComponent={
            datosListos.length > 0 ? (
              <View className="mb-6">
                <GeneradorPDF
                  datos={datosParaPDF}
                  nombreUsuario={nombreUsuario}
                  tipoReporte={`Reporte de Accesos - ${
                    filtroTiempo === "DIA_ESPECIFICO"
                      ? fechaSeleccionada.toLocaleDateString()
                      : filtroTiempo
                  } ${busqueda ? "(Filtrado)" : ""}`}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-12 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm mx-4">
              <View className="bg-slate-50 w-24 h-24 rounded-full justify-center items-center mb-4 border border-slate-200">
                <Ionicons name="folder-open" size={40} color="#94a3b8" />
              </View>
              <Text className="text-center text-slate-800 font-black text-lg">
                Sin Registros
              </Text>
              <Text className="text-center text-slate-500 font-medium text-sm mt-2">
                {busqueda !== ""
                  ? "No se encontro ninguna coincidencia."
                  : "No hay vehiculos en este periodo de tiempo."}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL MESES */}
      <Modal visible={modalMesVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 max-h-[70%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-black text-slate-800">
                Filtrar por Mes
              </Text>
              <TouchableOpacity
                onPress={() => setModalMesVisible(false)}
                className="bg-slate-100 p-2.5 rounded-full"
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {mesesDisponibles.length > 0 ? (
                mesesDisponibles.map((mes) => (
                  <TouchableOpacity
                    key={mes}
                    onPress={() => {
                      setFiltroTiempo(mes);
                      setModalMesVisible(false);
                    }}
                    className={`p-5 mb-3 rounded-2xl border-2 flex-row justify-between items-center ${filtroTiempo === mes ? "bg-cyan-50 border-cyan-400" : "bg-white border-slate-100"}`}
                  >
                    <Text
                      className={`font-black text-lg ${filtroTiempo === mes ? "text-cyan-800" : "text-slate-700"}`}
                    >
                      {formatearNombreMes(mes)}
                    </Text>
                    {filtroTiempo === mes && (
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color="#0891b2"
                      />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-center text-slate-400 my-4 font-bold">
                  No hay meses registrados en el sistema.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= SÚPER MODAL EDITAR CONDUCTOR ================= */}
      <Modal
        visible={modalEditarVisible}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-white w-full rounded-t-[40px] p-8 shadow-2xl max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-800 tracking-tight">
                Editar Perfil
              </Text>
              <TouchableOpacity onPress={() => setModalEditarVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View className="bg-slate-900 self-start px-4 py-2 rounded-xl mb-6 shadow-sm">
              <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest">
                Placa:{" "}
                <Text className="text-white font-black text-base">
                  {conductorEditando?.placa}
                </Text>
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="mb-6 space-y-5"
            >
              {/* BOTÓN PARA VINCULAR CARNET QR */}
              <View className="bg-cyan-50 p-5 rounded-2xl border border-cyan-200 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-black text-cyan-900 mb-1 tracking-wide">
                    Carnet Fisico (QR)
                  </Text>
                  <Text className="text-xs font-bold text-cyan-700">
                    {editQrCarnet !== "" ? " Carnet vinculado" : " Sin carnet"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={abrirCamaraQR}
                  className="bg-cyan-600 px-4 py-3 rounded-xl flex-row items-center shadow-sm"
                >
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={18}
                    color="white"
                  />
                  <Text className="text-white font-black ml-2 text-xs uppercase tracking-wider">
                    {editQrCarnet !== "" ? "Cambiar" : "Escanear"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Tipo de Vehiculo
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setEditTipoVehiculo("CARRO")}
                    className={`flex-1 py-4 rounded-2xl border-2 flex-row justify-center items-center ${editTipoVehiculo === "CARRO" ? "bg-cyan-50 border-cyan-400" : "bg-slate-50 border-slate-100"}`}
                  >
                    <Ionicons
                      name="car"
                      size={20}
                      color={
                        editTipoVehiculo === "CARRO" ? "#0891b2" : "#94a3b8"
                      }
                    />
                    <Text
                      className={`font-black ml-2 ${editTipoVehiculo === "CARRO" ? "text-cyan-700" : "text-slate-400"}`}
                    >
                      CARRO
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditTipoVehiculo("MOTO")}
                    className={`flex-1 py-4 rounded-2xl border-2 flex-row justify-center items-center ${editTipoVehiculo === "MOTO" ? "bg-cyan-50 border-cyan-400" : "bg-slate-50 border-slate-100"}`}
                  >
                    <MaterialCommunityIcons
                      name="motorbike"
                      size={20}
                      color={
                        editTipoVehiculo === "MOTO" ? "#0891b2" : "#94a3b8"
                      }
                    />
                    <Text
                      className={`font-black ml-2 ${editTipoVehiculo === "MOTO" ? "text-cyan-700" : "text-slate-400"}`}
                    >
                      MOTO
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Tipo de Usuario
                </Text>
                <View className="flex-row justify-between space-x-3">
                  <TouchableOpacity
                    className={`flex-1 py-4 rounded-2xl border-2 ${editTipoConductor === "ESTUDIANTE" ? "bg-indigo-50 border-indigo-400" : "bg-slate-50 border-slate-100"}`}
                    onPress={() => setEditTipoConductor("ESTUDIANTE")}
                  >
                    <Text
                      className={`text-center font-black ${editTipoConductor === "ESTUDIANTE" ? "text-indigo-700" : "text-slate-400"}`}
                    >
                      ESTUDIANTE
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-4 rounded-2xl border-2 ${editTipoConductor === "PROFESOR" ? "bg-indigo-50 border-indigo-400" : "bg-slate-50 border-slate-100"}`}
                    onPress={() => setEditTipoConductor("PROFESOR")}
                  >
                    <Text
                      className={`text-center font-black ${editTipoConductor === "PROFESOR" ? "text-indigo-700" : "text-slate-400"}`}
                    >
                      PROFESOR
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Cedula
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                  keyboardType="numeric"
                  value={editCedula}
                  onChangeText={setEditCedula}
                />
              </View>

              <View>
                <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Nombres
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                  value={editNombres}
                  onChangeText={setEditNombres}
                />
              </View>

              <View>
                <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Apellidos
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                  value={editApellidos}
                  onChangeText={setEditApellidos}
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                    Marca
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                    value={editMarca}
                    onChangeText={setEditMarca}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                    Modelo
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                    value={editModelo}
                    onChangeText={setEditModelo}
                  />
                </View>
              </View>

              {editTipoConductor === "ESTUDIANTE" ? (
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                      Carrera
                    </Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                      value={editCarrera}
                      onChangeText={setEditCarrera}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                      Trayecto
                    </Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                      value={editTrayecto}
                      onChangeText={setEditTrayecto}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2 ml-1">
                    PNF
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-cyan-400 focus:bg-white"
                    value={editPnf}
                    onChangeText={setEditPnf}
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={guardarEdicion}
              className="bg-cyan-600 rounded-2xl py-4 items-center shadow-md active:bg-cyan-700"
            >
              <Text className="text-white font-black text-sm uppercase tracking-widest">
                Guardar Cambios
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL DE CÁMARA PARA LEER QR EN HISTORIAL ================= */}
      <Modal visible={escaneandoQR} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417", "ean13", "code128"],
            }}
            onBarcodeScanned={handleLectorQR}
          >
            <View className="flex-1 justify-between p-8">
              <TouchableOpacity
                onPress={() => setEscaneandoQR(false)}
                className="bg-white/20 self-end p-3 rounded-full mt-10 backdrop-blur-md"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>

              <View className="items-center mb-16">
                <View className="border-4 border-cyan-400 w-72 h-72 rounded-3xl mb-6 justify-center items-center bg-black/40 border-dashed backdrop-blur-sm">
                  <Ionicons
                    name="id-card"
                    size={80}
                    color="rgba(34, 211, 238, 0.5)"
                  />
                  <Text className="text-cyan-100 font-bold mt-6 text-center tracking-widest">
                    ESCANEANDO CARNET...{"\n"}UBICALO EN EL CENTRO
                  </Text>
                </View>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
