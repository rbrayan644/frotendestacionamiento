import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- IMPORTADO
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import GeneradorPDF from "./components/GeneradorPDF"; // <-- IMPORTAMOS EL COMPONENTE
import { API_URL } from "./config/api"; // <-- ACTUALIZADO A LA NUBE

export default function ProfesoresScreen() {
  // ==========================================
  // ESTADOS GLOBALES DE LA PANTALLA
  // ==========================================
  const [profesores, setProfesores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [nombreAdmin, setNombreAdmin] = useState("Administrador"); // <-- PARA LA FIRMA DEL PDF

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  /**
   * Carga la lista completa de conductores que tienen el rol de "PROFESOR"
   * directamente desde la base de datos en Vercel.
   */
  const cargarProfesores = async () => {
    try {
      setCargando(true);
      const respuesta = await fetch(
        `${API_URL}/registros/conductores/PROFESOR`,
      );
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setProfesores(datos);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la base de datos de profesores.");
    } finally {
      setCargando(false);
    }
  };

  // Se ejecuta al cargar la pantalla por primera vez
  useEffect(() => {
    cargarProfesores();
    // Buscamos el nombre del usuario logueado para que el PDF salga firmado por él
    AsyncStorage.getItem("userName").then((nombre) => {
      if (nombre) setNombreAdmin(nombre);
    });
  }, []);

  /**
   * Muestra una alerta de confirmación antes de eliminar permanentemente a un profesor.
   */
  const confirmarEliminar = (id: string, nombreCompleto: string) => {
    Alert.alert(
      "Eliminar Profesor",
      `¿Estás seguro de que deseas borrar a ${nombreCompleto} de la base de datos? Esta acción es irreversible.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/registros/conductor/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                // Actualizamos la lista localmente sin tener que recargar toda la base de datos
                setProfesores((prev) => prev.filter((item) => item._id !== id));
                Alert.alert("Éxito", "Profesor eliminado del sistema.");
              } else {
                Alert.alert("Error", "No se pudo eliminar al profesor.");
              }
            } catch (error) {
              Alert.alert("Error de conexión", "Fallo al intentar eliminar.");
            }
          },
        },
      ],
    );
  };

  // ==========================================
  // LÓGICA DE FILTRADO Y EXPORTACIÓN
  // ==========================================

  // Filtra la lista en tiempo real basado en lo que el usuario escriba en el buscador
  const profesoresFiltrados = profesores.filter((prof) => {
    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${prof.nombres} ${prof.apellidos}`.toLowerCase();
    const cedula = prof.cedula?.toLowerCase() || "";
    const placa = prof.placa?.toLowerCase() || "";

    return (
      nombreCompleto.includes(termino) ||
      cedula.includes(termino) ||
      placa.includes(termino)
    );
  });

  // --- ADAPTAMOS LOS DATOS PARA LA TABLA DEL PDF ---
  // Utilizamos "profesoresFiltrados" para que el PDF imprima solo lo que buscas
  const datosParaPDF = profesoresFiltrados.map((p) => ({
    accion: p.placa || "SIN PLACA",
    usuario: `${p.nombres} ${p.apellidos} (C.I: ${p.cedula || "N/A"})`,
    estado: p.tipoVehiculo || "PROFESOR",
    createdAt: p.createdAt || new Date().toISOString(),
  }));

  // ==========================================
  // RENDERIZADO DE COMPONENTES DE LA LISTA
  // ==========================================

  const renderProfesor = ({ item }: { item: any }) => {
    const esMoto = item.tipoVehiculo === "MOTO";
    const nombreCompleto = `${item.nombres} ${item.apellidos}`;

    return (
      <View className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-5 overflow-hidden">
        <View className="p-5 flex-row items-center">
          {/* ICONO DEL VEHÍCULO */}
          <View
            className={`w-14 h-14 rounded-2xl justify-center items-center mr-4 border ${esMoto ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}
          >
            {esMoto ? (
              <MaterialCommunityIcons
                name="motorbike"
                size={30}
                color="#d97706"
              />
            ) : (
              <Ionicons name="car-sport" size={28} color="#059669" />
            )}
          </View>

          {/* DATOS DEL PROFESOR */}
          <View className="flex-1">
            <Text
              className="text-lg font-black text-slate-800"
              numberOfLines={1}
            >
              {nombreCompleto}
            </Text>
            <Text className="text-xs font-black text-slate-400 mb-2 tracking-wider">
              C.I: {item.cedula || "No registrada"}
            </Text>

            <View className="flex-row flex-wrap">
              <View className="bg-slate-900 px-3 py-1 rounded-lg mr-2 mb-2 shadow-sm flex-row items-center">
                <Ionicons name="car-sport" size={12} color="#38bdf8" />
                <Text className="text-xs font-black text-white ml-1 tracking-widest">
                  {item.placa}
                </Text>
              </View>
              {item.pnf && (
                <View className="bg-emerald-100 px-3 py-1 rounded-lg mb-2 border border-emerald-200">
                  <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mt-0.5">
                    {item.pnf}
                  </Text>
                </View>
              )}
            </View>

            {/* ESTADO DEL CARNET QR */}
            <View className="mt-1 flex-row items-center">
              <Ionicons
                name={item.qrCarnet ? "id-card" : "id-card-outline"}
                size={14}
                color={item.qrCarnet ? "#0891b2" : "#94a3b8"}
              />
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ml-1 mt-0.5 ${item.qrCarnet ? "text-cyan-700" : "text-slate-400"}`}
              >
                {item.qrCarnet ? "Carnet Vinculado" : "Sin Carnet Físico"}
              </Text>
            </View>
          </View>
        </View>

        {/* 👇 BOTÓN ROJO PARA ELIMINAR 👇 */}
        <TouchableOpacity
          onPress={() => confirmarEliminar(item._id, nombreCompleto)}
          className="bg-rose-50 py-3 flex-row justify-center items-center border-t border-rose-100 active:bg-rose-100"
        >
          <Ionicons name="trash" size={16} color="#e11d48" />
          <Text className="text-rose-600 font-black ml-2 text-[10px] uppercase tracking-widest mt-0.5">
            Eliminar Registro
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // INTERFAZ GRÁFICA PRINCIPAL (UI)
  // ==========================================
  return (
    <View className="flex-1 bg-slate-50">
      {/* ================= CABECERA MODERNA UPTAI ================= */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="arrow-back" size={22} color="#34d399" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-black text-white tracking-tight">
              Directorio
            </Text>
            <Text className="text-emerald-400 font-medium text-sm mt-1 tracking-wide">
              Profesores registrados
            </Text>
          </View>

          <View className="bg-emerald-500 px-4 py-2 rounded-2xl items-center justify-center shadow-lg border border-emerald-400">
            <Text className="text-white font-black text-xl">
              {profesoresFiltrados.length}
            </Text>
            <Text className="text-emerald-100 text-[9px] font-black uppercase tracking-widest">
              Total
            </Text>
          </View>
        </View>

        {/* BARRA DE BÚSQUEDA */}
        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-inner">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-white font-medium text-base"
            placeholder="Buscar por nombre, cédula o placa..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda !== "" && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LISTADO O SPINNER DE CARGA */}
      {cargando ? (
        <ActivityIndicator size="large" color="#10b981" className="mt-16" />
      ) : (
        <FlatList
          data={profesoresFiltrados}
          keyExtractor={(item) => item._id}
          renderItem={renderProfesor}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 100,
            paddingTop: 30,
          }}
          /* 👇 AQUÍ INSERTAMOS EL BOTÓN DEL PDF AL INICIO DE LA LISTA 👇 */
          ListHeaderComponent={
            profesoresFiltrados.length > 0 ? (
              <View className="mb-6">
                <GeneradorPDF
                  datos={datosParaPDF}
                  nombreUsuario={nombreAdmin}
                  tipoReporte={`Directorio de Profesores ${busqueda ? "(Filtrado)" : ""}`}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-12 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm mx-4">
              <View className="bg-emerald-50 w-24 h-24 rounded-full justify-center items-center mb-4">
                <Ionicons name="briefcase" size={40} color="#10b981" />
              </View>
              <Text className="text-center text-slate-800 font-black text-lg">
                Directorio Vacío
              </Text>
              <Text className="text-center text-slate-500 font-medium text-sm mt-2">
                {busqueda !== ""
                  ? "No se encontró ningún profesor con esos datos."
                  : "Aún no hay profesores registrados en el sistema."}
              </Text>
            </View>
          }
        />
      )}

      <StatusBar style="light" />
    </View>
  );
}
