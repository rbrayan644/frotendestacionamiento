import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
import { IP_DE_TU_PC } from "../config/api";
import GeneradorPDF from "./GeneradorPDF";

export default function AuditoriaTab() {
  const [logsOriginales, setLogsOriginales] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [vigilantes, setVigilantes] = useState<any[]>([]);

  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Estado para saber qué Admin (y su equipo) estamos viendo
  const [adminSeleccionado, setAdminSeleccionado] = useState<string>("TODOS");

  const [filtroTiempo, setFiltroTiempo] = useState("TODOS");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // Hacemos 3 peticiones al mismo tiempo para que sea rapidísimo
      const [resAuditoria, resAdmins, resVig] = await Promise.all([
        fetch(`http://${IP_DE_TU_PC}:3000/api/auditoria/SUPERADMIN`),
        fetch(`http://${IP_DE_TU_PC}:3000/api/auth/usuarios/admins`),
        fetch(`http://${IP_DE_TU_PC}:3000/api/auth/usuarios/vigilantes`),
      ]);

      if (resAuditoria.ok) setLogsOriginales(await resAuditoria.json());
      if (resAdmins.ok) setAdmins(await resAdmins.json());
      if (resVig.ok) setVigilantes(await resVig.json());
    } catch (error) {
      console.log("Error cargando datos de auditoría", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  let logsFiltrados = logsOriginales;

  // =========================================================
  // 1. FILTRO DE EQUIPO (ADMIN + SUS VIGILANTES)
  // =========================================================
  if (adminSeleccionado !== "TODOS") {
    // Buscamos los IDs de los vigilantes que fueron creados por este Admin
    const idsVigilantesDelAdmin = vigilantes
      .filter((v) => v.creadorId === adminSeleccionado)
      .map((v) => v._id);

    // Filtramos la bitácora: Solo mostramos si el usuarioId es el del Admin, o está en la lista de sus vigilantes
    logsFiltrados = logsFiltrados.filter(
      (log) =>
        log.usuarioId === adminSeleccionado ||
        idsVigilantesDelAdmin.includes(log.usuarioId),
    );
  }

  // =========================================================
  // 2. FILTROS DE TIEMPO
  // =========================================================
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  ).getTime();
  const inicioSemana = inicioHoy - 7 * 24 * 60 * 60 * 1000;

  if (filtroTiempo === "HOY") {
    logsFiltrados = logsFiltrados.filter((item) => {
      const d = obtenerFecha(item.fecha);
      return d ? d.getTime() >= inicioHoy : false;
    });
  } else if (filtroTiempo === "SEMANA") {
    logsFiltrados = logsFiltrados.filter((item) => {
      const d = obtenerFecha(item.fecha);
      return d ? d.getTime() >= inicioSemana : false;
    });
  } else if (filtroTiempo === "DIA_ESPECIFICO") {
    logsFiltrados = logsFiltrados.filter((item) => {
      const d = obtenerFecha(item.fecha);
      if (!d) return false;
      return d.toDateString() === fechaSeleccionada.toDateString();
    });
  }

  // =========================================================
  // 3. BÚSQUEDA POR TEXTO
  // =========================================================
  if (busqueda.trim() !== "") {
    const término = busqueda.toLowerCase();
    logsFiltrados = logsFiltrados.filter((item) => {
      const usuarioStr = item.usuario?.toLowerCase() || "";
      const accionStr = item.accion?.toLowerCase() || "";
      return usuarioStr.includes(término) || accionStr.includes(término);
    });
  }

  // Obtener el nombre del Admin seleccionado para el PDF
  const nombreAdminSeleccionado =
    adminSeleccionado === "TODOS"
      ? "General"
      : admins.find((a) => a._id === adminSeleccionado)?.nombre ||
        "Desconocido";

  const datosParaPDF = logsFiltrados.map((log) => ({
    usuario: log.usuario || "Desconocido",
    rol: log.rol || "N/A",
    accion: log.accion,
    fecha: log.fecha,
  }));

  const getIconoAccion = (accion: string) => {
    if (accion.includes("ENTRADA"))
      return { icon: "log-in", color: "#10b981", bg: "bg-emerald-100" };
    if (accion.includes("SALIDA"))
      return { icon: "log-out", color: "#f43f5e", bg: "bg-rose-100" };
    if (
      accion.includes("NUEV") ||
      accion.includes("CREÓ") ||
      accion.includes("REGISTRÓ")
    )
      return { icon: "person-add", color: "#0ea5e9", bg: "bg-cyan-100" };
    if (accion.includes("EDITÓ") || accion.includes("ACTUALIZÓ"))
      return { icon: "create", color: "#f59e0b", bg: "bg-amber-100" };
    if (
      accion.includes("ELIMINÓ") ||
      accion.includes("BORRÓ") ||
      accion.includes("RECHAZÓ")
    )
      return { icon: "trash", color: "#64748b", bg: "bg-slate-200" };
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
              <Text
                className={`${item.rol === "ADMIN" ? "text-indigo-600" : "text-cyan-600"}`}
              >
                {item.usuario}
              </Text>
              <Text className="font-medium text-slate-500"> hizo: </Text>
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
          <View className="flex-row justify-between items-center mt-2">
            <View
              className={`px-2 py-1 rounded-md ${item.rol === "ADMIN" ? "bg-indigo-800" : "bg-slate-800"}`}
            >
              <Text className="text-[8px] font-black text-white uppercase tracking-widest">
                {item.rol}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-slate-400">
              {item.fecha ? new Date(item.fecha).toLocaleDateString() : ""}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 mt-4">
      {/* BUSCADOR */}
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm mb-3 mx-1">
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          className="flex-1 ml-3 text-slate-800 font-medium text-sm"
          placeholder="Buscar administrador, vigilante o acción..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* NUEVO: PÍLDORAS EXCLUSIVAS DE ADMINISTRADORES */}
      <View className="mb-4 mx-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2"
        >
          <TouchableOpacity
            onPress={() => setAdminSeleccionado("TODOS")}
            className={`px-5 py-2.5 rounded-full border ${
              adminSeleccionado === "TODOS"
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <Text
              className={`font-black text-[10px] tracking-wider uppercase ${adminSeleccionado === "TODOS" ? "text-white" : "text-slate-500"}`}
            >
              Global (Todos)
            </Text>
          </TouchableOpacity>

          {admins.map((admin) => (
            <TouchableOpacity
              key={admin._id}
              onPress={() => setAdminSeleccionado(admin._id)}
              className={`px-5 py-2.5 rounded-full border ${
                adminSeleccionado === admin._id
                  ? "bg-indigo-600 border-indigo-700 shadow-sm"
                  : "bg-white border-slate-200"
              }`}
            >
              <Text
                className={`font-black text-[10px] tracking-wider uppercase ${adminSeleccionado === admin._id ? "text-white" : "text-slate-500"}`}
              >
                Equipo: {admin.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FILTROS DE TIEMPO */}
      <View className="mb-4 mx-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-3"
        >
          <TouchableOpacity
            onPress={() => setFiltroTiempo("HOY")}
            className={`px-4 py-2 rounded-xl border ${filtroTiempo === "HOY" ? "bg-indigo-500 border-indigo-400" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`font-black text-[10px] tracking-wider uppercase ${filtroTiempo === "HOY" ? "text-white" : "text-slate-500"}`}
            >
              Hoy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroTiempo("SEMANA")}
            className={`px-4 py-2 rounded-xl border ${filtroTiempo === "SEMANA" ? "bg-indigo-500 border-indigo-400" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`font-black text-[10px] tracking-wider uppercase ${filtroTiempo === "SEMANA" ? "text-white" : "text-slate-500"}`}
            >
              7 dias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltroTiempo("TODOS")}
            className={`px-4 py-2 rounded-xl border ${filtroTiempo === "TODOS" ? "bg-indigo-500 border-indigo-400" : "bg-white border-slate-200"}`}
          >
            <Text
              className={`font-black text-[10px] tracking-wider uppercase ${filtroTiempo === "TODOS" ? "text-white" : "text-slate-500"}`}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMostrarCalendario(true)}
            className={`px-4 py-2 rounded-xl border flex-row items-center ${filtroTiempo === "DIA_ESPECIFICO" ? "bg-indigo-500 border-indigo-400" : "bg-white border-slate-200"}`}
          >
            <Ionicons
              name="calendar"
              size={12}
              color={filtroTiempo === "DIA_ESPECIFICO" ? "white" : "#64748b"}
            />
            <Text
              className={`ml-2 font-black text-[10px] tracking-wider uppercase ${filtroTiempo === "DIA_ESPECIFICO" ? "text-white" : "text-slate-500"}`}
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

      {/* LISTA Y PDF */}
      {cargando ? (
        <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
      ) : (
        <FlatList
          data={logsFiltrados}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderLog}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            logsFiltrados.length > 0 ? (
              <View className="mb-6">
                <GeneradorPDF
                  datos={datosParaPDF}
                  nombreUsuario={"Super Admin"}
                  tipoReporte={`Auditoría - Equipo: ${nombreAdminSeleccionado}`}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center mt-10 bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm">
              <View className="bg-slate-50 w-20 h-20 rounded-full justify-center items-center mb-4 border border-slate-200">
                <Ionicons name="eye-off" size={32} color="#94a3b8" />
              </View>
              <Text className="text-center text-slate-800 font-black text-lg">
                Sin Movimientos
              </Text>
              <Text className="text-center text-slate-500 font-medium text-xs mt-2 px-4">
                No hay registros para{" "}
                {adminSeleccionado === "TODOS"
                  ? "estos filtros"
                  : `el equipo de ${nombreAdminSeleccionado}`}
                .
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
