import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function BarraTareas() {
  const [rol, setRol] = useState<string | null>(null);
  const rutaActual = usePathname();

  useEffect(() => {
    const obtenerRol = async () => {
      const userRol = await AsyncStorage.getItem("userRol");
      setRol(userRol);
    };
    obtenerRol();
  }, []);

  // --- MENÚ PARA EL ADMINISTRADOR (Dashboard + Gestión) ---
  const menuAdmin = [
    {
      id: 1,
      titulo: "Historial",
      icono: "documents",
      color: "bg-slate-50 border-slate-200",
      iconColor: "#64748b",
      textColor: "text-slate-500",
      ruta: "/historial",
    },
    {
      id: 2,
      titulo: "Reportes",
      icono: "warning",
      color: "bg-rose-50 border-rose-200 shadow-sm",
      iconColor: "#e11d48",
      textColor: "text-rose-600",
      ruta: "/ver-reportes",
    },
    // --- NUEVO BOTÓN PARA AUDITORÍA/MONITOREO ---
    {
      id: 6,
      titulo: "Auditoría",
      icono: "eye",
      color: "bg-fuchsia-50 border-fuchsia-200 shadow-sm",
      iconColor: "#d946ef",
      textColor: "text-fuchsia-700",
      ruta: "/monitoreo",
    },
    {
      id: 5,
      titulo: "Equipo",
      icono: "people",
      color: "bg-cyan-50 border-cyan-200 shadow-sm",
      iconColor: "#0891b2",
      textColor: "text-cyan-700",
      ruta: "/equipo",
    },
    {
      id: 3,
      titulo: "Estudiantes",
      icono: "school",
      color: "bg-indigo-50 border-indigo-200 shadow-sm",
      iconColor: "#4f46e5",
      textColor: "text-indigo-700",
      ruta: "/estudiantes",
    },
    {
      id: 4,
      titulo: "Profesores",
      icono: "briefcase",
      color: "bg-emerald-50 border-emerald-200 shadow-sm",
      iconColor: "#10b981",
      textColor: "text-emerald-700",
      ruta: "/profesores",
    },
  ];

  // --- MENÚ PARA EL VIGILANTE ---
  const menuVigilante = [
    {
      id: 1,
      titulo: "Entrada",
      icono: "log-in",
      color: "bg-cyan-50 border-cyan-400",
      iconColor: "#0891b2",
      textColor: "text-cyan-700",
      ruta: "/panel",
    },
    {
      id: 2,
      titulo: "Salida",
      icono: "log-out",
      color: "bg-cyan-50 border-cyan-400",
      iconColor: "#0891b2",
      textColor: "text-cyan-700",
      ruta: "/panel",
    },
    {
      id: 3,
      titulo: "Historial",
      icono: "documents",
      color: "bg-slate-50 border-slate-200",
      iconColor: "#64748b",
      textColor: "text-slate-500",
      ruta: "/historial",
    },
    {
      id: 4,
      titulo: "Reportar",
      icono: "warning",
      color: "bg-amber-50 border-amber-200",
      iconColor: "#f59e0b",
      textColor: "text-amber-500",
      ruta: "/reportar",
    },
    {
      id: 5,
      titulo: "Cupos",
      icono: "stats-chart",
      color: "bg-indigo-50 border-indigo-200",
      iconColor: "#6366f1",
      textColor: "text-indigo-500",
      ruta: "/cupos",
    },
  ];

  const tareasMostradas = rol === "VIGILANTE" ? menuVigilante : menuAdmin;

  const handlePress = (tarea: any) => {
    if (tarea.ruta) {
      if (tarea.ruta === "/panel" && rutaActual === "/panel") {
        Alert.alert(
          "Control de Acceso",
          "Usa el formulario de aquí abajo para registrar la " +
            tarea.titulo.toLowerCase() +
            " del vehículo.",
        );
      } else {
        router.push(tarea.ruta);
      }
    } else {
      Alert.alert(tarea.titulo, `Módulo de ${tarea.titulo} en desarrollo...`);
    }
  };

  return (
    <View className="mb-4 mt-2">
      <Text className="text-slate-500 font-bold mb-3 ml-8 text-xs uppercase tracking-widest">
        {rol === "VIGILANTE" ? "Accesos Rápidos" : "Módulos del Sistema"}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 15 }}
      >
        <View className="flex-row items-center bg-white py-4 px-6 rounded-[30px] shadow-sm border border-slate-100 space-x-6">
          {tareasMostradas.map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              onPress={() => handlePress(tarea)}
              className="items-center min-w-[65px]"
            >
              <View
                className={`w-14 h-14 rounded-full items-center justify-center border-2 ${tarea.color}`}
              >
                <Ionicons
                  name={tarea.icono as any}
                  size={24}
                  color={tarea.iconColor}
                />
              </View>
              <Text
                className={`text-[10px] font-black mt-2 tracking-widest uppercase ${tarea.textColor}`}
              >
                {tarea.titulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
