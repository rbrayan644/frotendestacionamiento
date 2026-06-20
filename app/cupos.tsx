import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "./config/api";

export default function CuposScreen() {
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [stats, setStats] = useState({
    carros: { adentro: 0, capacidad: 45, disponibles: 45 },
    motos: { adentro: 0, capacidad: 100, disponibles: 100 },
  });

  const cargarDatos = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/registros/estadisticas`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setStats(datos);
      }
    } catch (error) {
      console.log("Error al cargar cupos", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const carrosLlenos = stats.carros.disponibles <= 0;
  const motosLlenas = stats.motos.disponibles <= 0;

  return (
    <View className="flex-1 bg-slate-50">
      {/* ================= CABECERA MODERNA UPTAI ================= */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
        >
          <Ionicons name="arrow-back" size={22} color="#818cf8" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-white tracking-tight">
            Disponibilidad
          </Text>
          <Text className="text-indigo-400 font-medium text-sm mt-1 tracking-wide">
            Control de aforo en vivo
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
        }
      >
        <Text className="text-center text-slate-400 mb-6 font-bold uppercase tracking-widest text-xs">
          Desliza hacia abajo para actualizar
        </Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#4f46e5" className="mt-10" />
        ) : (
          <View className="space-y-6">
            {/* TARJETA CARROS */}
            <View
              className={`bg-white rounded-[30px] p-6 shadow-sm border-2 ${carrosLlenos ? "border-rose-400" : "border-slate-100"}`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View
                    className={`p-3 rounded-2xl mr-3 border ${carrosLlenos ? "bg-rose-50 border-rose-200" : "bg-cyan-50 border-cyan-100"}`}
                  >
                    <Ionicons
                      name="car-sport"
                      size={32}
                      color={carrosLlenos ? "#e11d48" : "#0891b2"}
                    />
                  </View>
                  <Text className="text-2xl font-black text-slate-800">
                    Carros
                  </Text>
                </View>
                <View
                  className={`px-4 py-1.5 rounded-xl border ${carrosLlenos ? "bg-rose-100 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <Text
                    className={`font-black text-[10px] tracking-widest uppercase ${carrosLlenos ? "text-rose-700" : "text-emerald-700"}`}
                  >
                    {carrosLlenos ? "LLENO" : "DISPONIBLE"}
                  </Text>
                </View>
              </View>
              <View className="items-center py-4">
                <Text
                  className={`text-7xl font-black tracking-tighter ${carrosLlenos ? "text-rose-600" : "text-cyan-600"}`}
                >
                  {stats.carros.disponibles}
                </Text>
                <Text className="text-slate-400 font-black uppercase tracking-widest mt-1 text-xs">
                  Cupos Libres
                </Text>
              </View>
              <View className="flex-row justify-between pt-5 border-t border-slate-100 mt-2">
                <Text className="text-slate-500 font-bold text-sm">
                  Adentro:{" "}
                  <Text className="text-slate-800">{stats.carros.adentro}</Text>
                </Text>
                <Text className="text-slate-500 font-bold text-sm">
                  Capacidad:{" "}
                  <Text className="text-slate-800">
                    {stats.carros.capacidad}
                  </Text>
                </Text>
              </View>
            </View>

            {/* TARJETA MOTOS */}
            <View
              className={`bg-white rounded-[30px] p-6 shadow-sm border-2 ${motosLlenas ? "border-rose-400" : "border-slate-100"}`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View
                    className={`p-3 rounded-2xl mr-3 border ${motosLlenas ? "bg-rose-50 border-rose-200" : "bg-indigo-50 border-indigo-100"}`}
                  >
                    <MaterialCommunityIcons
                      name="motorbike"
                      size={32}
                      color={motosLlenas ? "#e11d48" : "#4f46e5"}
                    />
                  </View>
                  <Text className="text-2xl font-black text-slate-800">
                    Motos
                  </Text>
                </View>
                <View
                  className={`px-4 py-1.5 rounded-xl border ${motosLlenas ? "bg-rose-100 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <Text
                    className={`font-black text-[10px] tracking-widest uppercase ${motosLlenas ? "text-rose-700" : "text-emerald-700"}`}
                  >
                    {motosLlenas ? "LLENO" : "DISPONIBLE"}
                  </Text>
                </View>
              </View>
              <View className="items-center py-4">
                <Text
                  className={`text-7xl font-black tracking-tighter ${motosLlenas ? "text-rose-600" : "text-indigo-600"}`}
                >
                  {stats.motos.disponibles}
                </Text>
                <Text className="text-slate-400 font-black uppercase tracking-widest mt-1 text-xs">
                  Cupos Libres
                </Text>
              </View>
              <View className="flex-row justify-between pt-5 border-t border-slate-100 mt-2">
                <Text className="text-slate-500 font-bold text-sm">
                  Adentro:{" "}
                  <Text className="text-slate-800">{stats.motos.adentro}</Text>
                </Text>
                <Text className="text-slate-500 font-bold text-sm">
                  Capacidad:{" "}
                  <Text className="text-slate-800">
                    {stats.motos.capacidad}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
