import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuditoriaTab from "./components/AuditoriaTab";
import { API_URL } from "./config/api";

export default function SuperAdminScreen() {
  // ==========================================
  // ESTADOS GLOBALES DE LA PANTALLA
  // ==========================================
  const [nombreAdmin, setNombreAdmin] = useState("Super Admin");
  const [cargando, setCargando] = useState(true);

  // Controla qué pestaña principal estamos viendo
  const [pestañaActual, setPestañaActual] = useState<
    "APROBACIONES" | "ACTIVOS" | "AUDITORIA"
  >("ACTIVOS");

  // NUEVO: Controla el filtro por rol
  const [filtroRol, setFiltroRol] = useState<"TODOS" | "ADMIN" | "SUPERADMIN">(
    "TODOS",
  );

  // Listas de usuarios
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const nombre = await AsyncStorage.getItem("userName");
      if (nombre) setNombreAdmin(nombre);

      // 1. Cargar solicitudes pendientes
      const resPendientes = await fetch(`${API_URL}/auth/usuarios/pendientes`);
      if (resPendientes.ok) setPendientes(await resPendientes.json());

      // 2. Cargar administradores ya activos
      const resActivos = await fetch(`${API_URL}/auth/usuarios/admins`);
      if (resActivos.ok) setActivos(await resActivos.json());
    } catch (error) {
      console.log("Error al cargar datos", error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (pestañaActual !== "AUDITORIA") {
        cargarDatos();
      }
    }, [pestañaActual]),
  );

  const cerrarSesion = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  const handleAprobar = async (id: string, nombre: string, rol: string) => {
    Alert.alert(
      "Aprobar Administrador",
      `¿Dar acceso como ${rol} a ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: async () => {
            try {
              const res = await fetch(
                `${API_URL}/auth/usuarios/aprobar/${id}`,
                {
                  method: "PUT",
                },
              );
              if (res.ok) {
                Alert.alert("Éxito", "Usuario aprobado.");
                cargarDatos();
              }
            } catch (e) {
              Alert.alert("Error", "Fallo de conexión.");
            }
          },
        },
      ],
    );
  };

  const handleEliminar = async (
    id: string,
    nombre: string,
    esRechazo: boolean,
  ) => {
    const titulo = esRechazo ? "Rechazar Solicitud" : "Eliminar Administrador";
    const mensaje = esRechazo
      ? `¿Rechazar a ${nombre}?`
      : `¿Quitarle el acceso al sistema a ${nombre} definitivamente?`;

    Alert.alert(titulo, mensaje, [
      { text: "Cancelar", style: "cancel" },
      {
        text: esRechazo ? "Rechazar" : "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/auth/usuarios/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Realizado", "Usuario eliminado del sistema.");
              cargarDatos();
            }
          } catch (e) {
            Alert.alert("Error", "Fallo de conexión.");
          }
        },
      },
    ]);
  };

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================
  const obtenerDatosLista = () => {
    let datos = pestañaActual === "APROBACIONES" ? pendientes : activos;

    // Aplicamos el filtro de rol seleccionado
    if (filtroRol !== "TODOS") {
      datos = datos.filter((user) => user.rol === filtroRol);
    }

    return datos;
  };

  const obtenerRender = () => {
    if (pestañaActual === "APROBACIONES") return renderPendiente;
    return renderActivo;
  };

  // ==========================================
  // RENDERIZADO DE COMPONENTES DE LA LISTA
  // ==========================================

  // Tarjeta PENDIENTES
  const renderPendiente = ({ item }: { item: any }) => {
    const esSuper = item.rol === "SUPERADMIN";

    return (
      <View
        className={`bg-white p-6 rounded-[30px] shadow-sm border mb-4 ${esSuper ? "border-purple-200" : "border-slate-100"}`}
      >
        <View className="flex-row items-center mb-4 border-b border-slate-50 pb-4">
          <View
            className={`w-14 h-14 rounded-2xl justify-center items-center border ${esSuper ? "bg-purple-50 border-purple-100" : "bg-indigo-50 border-indigo-100"}`}
          >
            <Ionicons
              name="time"
              size={24}
              color={esSuper ? "#7e22ce" : "#4f46e5"}
            />
          </View>
          <View className="ml-4 flex-1">
            <Text
              className="font-black text-lg text-slate-800"
              numberOfLines={1}
            >
              {item.nombre}
            </Text>
            <Text
              className="text-slate-500 font-bold text-xs mb-1"
              numberOfLines={1}
            >
              {item.email}
            </Text>
            {/* ETIQUETA VISUAL DE ROL  */}
            <View
              className={`self-start px-2 py-1 rounded-md ${esSuper ? "bg-purple-100" : "bg-cyan-100"}`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${esSuper ? "text-purple-700" : "text-cyan-700"}`}
              >
                {item.rol || "ADMIN"}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row space-x-3 mt-2">
          <TouchableOpacity
            onPress={() => handleEliminar(item._id, item.nombre, true)}
            className="flex-1 bg-rose-50 py-3 rounded-2xl border border-rose-200 flex-row justify-center items-center"
          >
            <Ionicons name="close" size={18} color="#e11d48" />
            <Text className="text-rose-700 font-black ml-1 text-xs uppercase tracking-wider">
              Rechazar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAprobar(item._id, item.nombre, item.rol)}
            className="flex-1 bg-emerald-500 py-3 rounded-2xl shadow-sm flex-row justify-center items-center"
          >
            <Ionicons name="checkmark" size={18} color="white" />
            <Text className="text-white font-black ml-1 text-xs uppercase tracking-wider">
              Aprobar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Tarjeta ACTIVOS
  const renderActivo = ({ item }: { item: any }) => {
    const esSuper = item.rol === "SUPERADMIN";

    return (
      <View
        className={`bg-white p-6 rounded-[30px] shadow-sm border mb-4 flex-row items-center ${esSuper ? "border-purple-200" : "border-slate-100"}`}
      >
        <View
          className={`w-14 h-14 rounded-2xl justify-center items-center border ${esSuper ? "bg-purple-50 border-purple-100" : "bg-emerald-50 border-emerald-100"}`}
        >
          <Ionicons
            name="person"
            size={24}
            color={esSuper ? "#7e22ce" : "#10b981"}
          />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-black text-lg text-slate-800" numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text
            className="text-slate-500 font-bold text-xs mb-1"
            numberOfLines={1}
          >
            {item.email}
          </Text>
          {/* ETIQUETA VISUAL DE ROL  */}
          <View
            className={`self-start px-2 py-1 rounded-md ${esSuper ? "bg-purple-100" : "bg-cyan-100"}`}
          >
            <Text
              className={`text-[10px] font-black uppercase tracking-widest ${esSuper ? "text-purple-700" : "text-cyan-700"}`}
            >
              {item.rol || "ADMIN"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleEliminar(item._id, item.nombre, false)}
          className="bg-rose-100 p-3 rounded-xl border border-rose-200 ml-2"
        >
          <Ionicons name="trash" size={18} color="#e11d48" />
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // INTERFAZ GRÁFICA PRINCIPAL (UI)
  // ==========================================
  return (
    <View className="flex-1 bg-slate-50">
      <View className="pt-14 pb-6 px-4 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row justify-between items-center mb-6 px-2">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl font-black text-white tracking-tight">
                UPTAIET
              </Text>
              <View className="bg-yellow-400 px-2 py-0.5 ml-1 rounded-md"></View>
            </View>
            <Text className="text-purple-400 font-medium text-sm mt-1 tracking-wide">
              Panel de Super Admin
            </Text>
          </View>
          <TouchableOpacity
            onPress={cerrarSesion}
            className="bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="power" size={22} color="#f43f5e" />
          </TouchableOpacity>
        </View>

        {/* SELECTOR DE PESTAÑAS PRINCIPALES */}
        <View className="flex-row bg-slate-800 p-1.5 rounded-2xl">
          <TouchableOpacity
            onPress={() => {
              setPestañaActual("APROBACIONES");
              setFiltroRol("TODOS"); // Reiniciar el filtro
            }}
            className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${pestañaActual === "APROBACIONES" ? "bg-indigo-500 shadow-md" : "bg-transparent"}`}
          >
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ${pestañaActual === "APROBACIONES" ? "text-white" : "text-slate-400"}`}
            >
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setPestañaActual("ACTIVOS");
              setFiltroRol("TODOS"); // Reiniciar el filtro
            }}
            className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${pestañaActual === "ACTIVOS" ? "bg-indigo-500 shadow-md" : "bg-transparent"}`}
          >
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ${pestañaActual === "ACTIVOS" ? "text-white" : "text-slate-400"}`}
            >
              Activos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPestañaActual("AUDITORIA")}
            className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${pestañaActual === "AUDITORIA" ? "bg-indigo-500 shadow-md" : "bg-transparent"}`}
          >
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ${pestañaActual === "AUDITORIA" ? "text-white" : "text-slate-400"}`}
            >
              Auditoría
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTRO SECUNDARIO POR ROL (Solo visible en Aprobaciones y Activos) */}
      {pestañaActual !== "AUDITORIA" && (
        <View className="flex-row px-6 mt-4 space-x-2">
          <TouchableOpacity
            onPress={() => setFiltroRol("TODOS")}
            className={`px-4 py-2 rounded-full border ${filtroRol === "TODOS" ? "bg-slate-800 border-slate-800" : "bg-white border-slate-300"}`}
          >
            <Text
              className={`font-bold text-xs ${filtroRol === "TODOS" ? "text-white" : "text-slate-500"}`}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroRol("ADMIN")}
            className={`px-4 py-2 rounded-full border ${filtroRol === "ADMIN" ? "bg-cyan-600 border-cyan-600" : "bg-white border-slate-300"}`}
          >
            <Text
              className={`font-bold text-xs ${filtroRol === "ADMIN" ? "text-white" : "text-slate-500"}`}
            >
              Admins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroRol("SUPERADMIN")}
            className={`px-4 py-2 rounded-full border ${filtroRol === "SUPERADMIN" ? "bg-purple-600 border-purple-600" : "bg-white border-slate-300"}`}
          >
            <Text
              className={`font-bold text-xs ${filtroRol === "SUPERADMIN" ? "text-white" : "text-slate-500"}`}
            >
              Super Admins
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {pestañaActual === "AUDITORIA" ? (
        <View className="flex-1 px-4 mt-4">
          <AuditoriaTab />
        </View>
      ) : cargando ? (
        <ActivityIndicator size="large" color="#4f46e5" className="mt-16" />
      ) : (
        <FlatList
          data={obtenerDatosLista()}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={obtenerRender()}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-8 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm mx-4">
              <View className="bg-indigo-50 w-24 h-24 rounded-full justify-center items-center mb-4 border border-indigo-100">
                <Ionicons
                  name={
                    pestañaActual === "APROBACIONES"
                      ? "checkmark-done"
                      : "people"
                  }
                  size={40}
                  color="#4f46e5"
                />
              </View>
              <Text className="text-center text-slate-800 font-black text-lg">
                {pestañaActual === "APROBACIONES"
                  ? "Todo al día"
                  : "Sin Resultados"}
              </Text>
              <Text className="text-center text-slate-500 font-medium text-sm mt-2">
                {pestañaActual === "APROBACIONES"
                  ? "No hay usuarios pendientes con este rol."
                  : "No se encontraron administradores con este rol."}
              </Text>
            </View>
          }
        />
      )}

      <StatusBar style="light" />
    </View>
  );
}
