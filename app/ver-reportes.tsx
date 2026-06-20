import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker"; // <-- AÑADIDO
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import GeneradorPDF from "./components/GeneradorPDF";
import { API_URL } from "./config/api"; // <-- ACTUALIZADO A LA NUBE

export default function VerReportesScreen() {
  // ==========================================
  // ESTADOS GLOBALES DE LA PANTALLA
  // ==========================================
  const [reportesOriginales, setReportesOriginales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreAdmin, setNombreAdmin] = useState("Administrador");

  // Estados para filtros de tiempo y calendario
  const [filtroTiempo, setFiltroTiempo] = useState("TODOS");
  const [modalMesVisible, setModalMesVisible] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  /**
   * Carga todos los reportes de incidencias desde la base de datos en Vercel.
   */
  const cargarReportes = async () => {
    try {
      setCargando(true);
      const nombre = await AsyncStorage.getItem("userName");
      if (nombre) setNombreAdmin(nombre);

      // Petición a la nube
      const respuesta = await fetch(`${API_URL}/reportes/todos`);
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setReportesOriginales(datos);
      }
    } catch (error) {
      console.log("Error cargando reportes", error);
      Alert.alert("Error", "No se pudieron cargar los reportes.");
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial al entrar a la pantalla
  useEffect(() => {
    cargarReportes();
  }, []);

  /**
   * Cambia el estado de un reporte de "PENDIENTE" a "REVISADO".
   */
  const marcarComoRevisado = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/reportes/revisar/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        Alert.alert("Listo", "Reporte marcado como revisado.");
        cargarReportes(); // Recargar la lista para reflejar el cambio
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado.");
    }
  };

  /**
   * Elimina permanentemente un reporte de la base de datos tras confirmar.
   */
  const confirmarEliminar = (id: string) => {
    Alert.alert(
      "Eliminar Reporte",
      "¿Estás seguro de que quieres borrar este reporte?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/reportes/eliminar/${id}`, {
                method: "DELETE",
              });
              if (res.ok)
                // Actualiza la vista eliminando el reporte de la lista local
                setReportesOriginales((prev) =>
                  prev.filter((item) => item._id !== id),
                );
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el reporte.");
            }
          },
        },
      ],
    );
  };

  // ==========================================
  // FUNCIONES DE APOYO Y FILTROS DE TIEMPO
  // ==========================================

  const formatearFecha = (fechaTexto: string) => {
    const fecha = new Date(fechaTexto);
    return `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()} a las ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

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

  const obtenerMesesDisponibles = () => {
    const meses = reportesOriginales
      .map((item) => {
        const d = obtenerFecha(item.createdAt);
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

  // Aplicación de los filtros de tiempo a la lista de reportes
  let reportesFiltrados = reportesOriginales;
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  ).getTime();
  const inicioSemana = inicioHoy - 7 * 24 * 60 * 60 * 1000;

  if (filtroTiempo === "HOY") {
    reportesFiltrados = reportesOriginales.filter((item) => {
      const d = obtenerFecha(item.createdAt);
      return d ? d.getTime() >= inicioHoy : false;
    });
  } else if (filtroTiempo === "SEMANA") {
    reportesFiltrados = reportesOriginales.filter((item) => {
      const d = obtenerFecha(item.createdAt);
      return d ? d.getTime() >= inicioSemana : false;
    });
  } else if (filtroTiempo === "DIA_ESPECIFICO") {
    reportesFiltrados = reportesOriginales.filter((item) => {
      const d = obtenerFecha(item.createdAt);
      if (!d) return false;
      return d.toDateString() === fechaSeleccionada.toDateString();
    });
  } else if (filtroTiempo.includes("-")) {
    reportesFiltrados = reportesOriginales.filter((item) => {
      const d = obtenerFecha(item.createdAt);
      if (!d) return false;
      const mesItem = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return mesItem === filtroTiempo;
    });
  }

  // --- DATOS PARA EL PDF ---
  const datosParaPDF = reportesFiltrados.map((r) => ({
    asunto: r.asunto,
    placa: r.placaRelacionada || "N/A",
    reporte: `Vigilante: ${r.vigilanteId?.nombre || "Desconocido"}`,
    estado: r.estado,
    fecha: r.createdAt,
  }));

  // ==========================================
  // RENDERIZADO DE COMPONENTES DE LA LISTA
  // ==========================================

  const renderReporte = ({ item }: { item: any }) => {
    const esPendiente = item.estado === "PENDIENTE";

    return (
      <View
        className={`bg-white rounded-3xl shadow-sm border mb-5 overflow-hidden ${esPendiente ? "border-amber-200" : "border-slate-100"}`}
      >
        <View
          className={`px-5 py-3 flex-row justify-between items-center ${esPendiente ? "bg-amber-50" : "bg-slate-50"}`}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={esPendiente ? "warning" : "checkmark-circle"}
              size={18}
              color={esPendiente ? "#d97706" : "#0ea5e9"}
            />
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ml-2 ${esPendiente ? "text-amber-700" : "text-cyan-700"}`}
            >
              {esPendiente ? "ACCIÓN REQUERIDA" : "REVISADO"}
            </Text>
          </View>
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {formatearFecha(item.createdAt)}
          </Text>
        </View>

        <View className="p-5">
          <Text className="text-xl font-black text-slate-800 mb-2">
            {item.asunto}
          </Text>
          {item.placaRelacionada && (
            <View className="bg-slate-900 self-start px-3 py-1.5 rounded-lg mb-3 flex-row items-center shadow-sm">
              <Ionicons name="car-sport" size={14} color="#38bdf8" />
              <Text className="text-white font-black text-xs ml-2 tracking-widest">
                {item.placaRelacionada}
              </Text>
            </View>
          )}
          <Text className="text-slate-600 text-sm mt-1 leading-relaxed font-medium">
            "{item.descripcion}"
          </Text>

          <View className="mt-5 pt-4 border-t border-slate-100 flex-row items-center">
            <View className="bg-cyan-50 w-12 h-12 rounded-2xl justify-center items-center border border-cyan-100">
              <Ionicons name="shield-checkmark" size={24} color="#0891b2" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Reportado por
              </Text>
              <Text className="text-sm font-black text-slate-800 mt-0.5">
                {item.vigilanteId?.nombre || "Vigilante Desconocido"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row border-t border-slate-100">
          {esPendiente && (
            <TouchableOpacity
              onPress={() => marcarComoRevisado(item._id)}
              className="flex-[2] bg-cyan-600 py-4 flex-row justify-center items-center active:bg-cyan-700"
            >
              <Ionicons name="checkmark-done" size={20} color="white" />
              <Text className="font-black text-white ml-2 text-xs uppercase tracking-wider">
                Marcar Revisado
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => confirmarEliminar(item._id)}
            className="flex-1 bg-slate-50 py-4 flex-row justify-center items-center active:bg-slate-200"
          >
            <Ionicons name="trash" size={20} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // INTERFAZ GRÁFICA PRINCIPAL (UI)
  // ==========================================
  return (
    <View className="flex-1 bg-slate-50">
      {/* CABECERA */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="arrow-back" size={22} color="#38bdf8" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-white tracking-tight">
              Buzón de Reportes
            </Text>
            <Text className="text-cyan-400 font-medium text-sm mt-1 tracking-wide">
              Gestión de incidencias
            </Text>
          </View>
        </View>

        {/* FILTROS DE TIEMPO */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-3 mt-2"
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
        <ActivityIndicator size="large" color="#0891b2" className="mt-10" />
      ) : (
        <FlatList
          data={reportesFiltrados}
          keyExtractor={(item) => item._id}
          renderItem={renderReporte}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListHeaderComponent={
            reportesFiltrados.length > 0 ? (
              <View className="mb-6">
                <GeneradorPDF
                  datos={datosParaPDF}
                  nombreUsuario={nombreAdmin}
                  tipoReporte={`Libro de Novedades e Incidencias - ${
                    filtroTiempo === "DIA_ESPECIFICO"
                      ? fechaSeleccionada.toLocaleDateString()
                      : filtroTiempo
                  }`}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-16 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm mx-4">
              <View className="bg-emerald-50 w-24 h-24 rounded-full justify-center items-center mb-4">
                <Ionicons name="shield-checkmark" size={50} color="#10b981" />
              </View>
              <Text className="text-center text-slate-800 font-black text-lg">
                Todo está tranquilo
              </Text>
              <Text className="text-center text-slate-500 font-medium text-sm mt-2">
                No hay reportes para la fecha seleccionada.
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
                  No hay meses con reportes.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
