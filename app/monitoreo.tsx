import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import GeneradorPDF from "./components/GeneradorPDF";
import { API_URL } from "./config/api";

export default function MonitoreoScreen() {
  // ==========================================
  // ESTADOS
  // ==========================================
  const [logsOriginales, setLogsOriginales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [miRol, setMiRol] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [busqueda, setBusqueda] = useState("");

  const [filtroTiempo, setFiltroTiempo] = useState("HOY");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  /**
   * Carga la bitácora de auditoría desde el backend.
   * Filtra automáticamente según el rol del usuario (Admin o SuperAdmin).
   */
  const cargarAuditoria = async () => {
    try {
      setCargando(true);
      const rol = await AsyncStorage.getItem("userRol");
      const nombre = await AsyncStorage.getItem("userName");

      if (rol) setMiRol(rol);
      if (nombre) setNombreUsuario(nombre);

      if (!rol) return setCargando(false);

      // Petición a Vercel
      const respuesta = await fetch(`${API_URL}/auditoria/${rol}`);
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setLogsOriginales(datos);
      }
    } catch (error) {
      console.log("Error cargando auditoría", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  // ==========================================
  // FUNCIONES DE APOYO
  // ==========================================

  const obtenerFecha = (fechaTexto: string) => {
    if (!fechaTexto) return null;
    const d = new Date(fechaTexto);
    return isNaN(d.getTime()) ? null : d;
  };

  const cambiarFecha = (event: any, date?: Date) => {
    setMostrarCalendario(Platform.OS === "ios");
    if (date) {
      setFechaSeleccionada(date);
      setFiltroTiempo("DIA_ESPECIFICO");
    }
  };

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================
  let logsFiltrados = logsOriginales;
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  ).getTime();
  const inicioSemana = inicioHoy - 7 * 24 * 60 * 60 * 1000;

  if (filtroTiempo === "HOY") {
    logsFiltrados = logsOriginales.filter((item) => {
      const d = obtenerFecha(item.fecha);
      return d ? d.getTime() >= inicioHoy : false;
    });
  } else if (filtroTiempo === "SEMANA") {
    logsFiltrados = logsOriginales.filter((item) => {
      const d = obtenerFecha(item.fecha);
      return d ? d.getTime() >= inicioSemana : false;
    });
  } else if (filtroTiempo === "DIA_ESPECIFICO") {
    logsFiltrados = logsOriginales.filter((item) => {
      const d = obtenerFecha(item.fecha);
      if (!d) return false;
      return d.toDateString() === fechaSeleccionada.toDateString();
    });
  }

  // Filtrado por buscador
  if (busqueda.trim() !== "") {
    const término = busqueda.toLowerCase();
    logsFiltrados = logsFiltrados.filter((item) => {
      const usuarioStr = item.usuario?.toLowerCase() || "";
      const accionStr = item.accion?.toLowerCase() || "";
      return usuarioStr.includes(término) || accionStr.includes(término);
    });
  }

  // Preparación de datos para el reporte PDF
  const datosParaPDF = logsFiltrados.map((log) => ({
    usuario: log.usuario || "Desconocido",
    rol: log.rol || "N/A",
    accion: log.accion,
    fecha: log.fecha,
  }));

  // ==========================================
  // INTERFAZ GRÁFICA (UI)
  // ==========================================

  const getIconoAccion = (accion: string) => {
    if (accion.includes("ENTRADA"))
      return { icon: "log-in", color: "#10b981", bg: "bg-emerald-100" };
    if (accion.includes("SALIDA"))
      return { icon: "log-out", color: "#f43f5e", bg: "bg-rose-100" };
    if (accion.includes("NUEVA") || accion.includes("REGISTRO"))
      return { icon: "person-add", color: "#0ea5e9", bg: "bg-cyan-100" };
    return { icon: "flash", color: "#6366f1", bg: "bg-indigo-100" };
  };

  const renderLog = ({ item }: { item: any }) => {
    const ui = getIconoAccion(item.accion || "");

    return (
      <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4 flex-row items-center">
        <View
          className={`w-12 h-12 rounded-2xl justify-center items-center ${ui.bg}`}
        >
          <Ionicons name={ui.icon as any} size={24} color={ui.color} />
        </View>
        <View className="ml-4 flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text
              className="font-black text-slate-800 text-sm flex-1 mr-2"
              numberOfLines={2}
            >
              {item.usuario}{" "}
              <Text className="font-medium text-slate-500">hizo:</Text>{" "}
              {item.accion}
            </Text>
            <Text className="text-[9px] font-bold text-slate-400 mt-1">
              {item.fecha
                ? new Date(item.fecha).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
          </View>
          <View className="mt-2 self-start bg-slate-800 px-2 py-1 rounded-md">
            <Text className="text-[8px] font-black text-white uppercase tracking-widest">
              {item.rol}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="arrow-back" size={22} color="#38bdf8" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-black text-white">Auditoría</Text>
            <Text className="text-cyan-400 font-medium text-sm mt-1">
              {miRol === "SUPERADMIN"
                ? "Monitoreo de Administradores"
                : "Monitoreo de Vigilantes"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-inner mb-4">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-white font-medium text-base"
            placeholder="Buscar usuario o acción..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

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
        </ScrollView>
      </View>

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
          data={logsFiltrados}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderLog}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListHeaderComponent={
            logsFiltrados.length > 0 ? (
              <View className="mb-6">
                <GeneradorPDF
                  datos={datosParaPDF}
                  nombreUsuario={nombreUsuario}
                  tipoReporte={`Bitácora de Auditoría`}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-12 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm mx-4">
              <Ionicons name="eye-off" size={40} color="#94a3b8" />
              <Text className="text-center text-slate-800 font-black text-lg mt-4">
                Sin Actividad
              </Text>
              <Text className="text-center text-slate-500 font-medium text-sm mt-2">
                No hay registros para hoy.
              </Text>
            </View>
          }
        />
      )}
      <StatusBar style="light" />
    </View>
  );
}
