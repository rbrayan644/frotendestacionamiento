import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  modoAccion: string;
  setModoAccion: (modo: string) => void;
  limpiarFormulario: () => void;
}

export default function HerramientasPanel({
  modoAccion,
  setModoAccion,
  limpiarFormulario,
}: Props) {
  return (
    <View className="mb-4 mt-2">
      <Text className="text-slate-500 font-bold mb-3 ml-8 text-xs uppercase tracking-widest">
        Accesos Rápidos
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 15 }}
      >
        <View className="flex-row items-center bg-white py-4 px-6 rounded-[30px] shadow-sm border border-slate-100 space-x-6">
          <TouchableOpacity
            onPress={() => {
              setModoAccion("ENTRADA");
              limpiarFormulario();
            }}
            className="items-center min-w-[60px]"
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
                modoAccion === "ENTRADA"
                  ? "bg-cyan-50 border-cyan-400 shadow-sm"
                  : "bg-slate-50 border-transparent"
              }`}
            >
              <Ionicons
                name="log-in"
                size={26}
                color={modoAccion === "ENTRADA" ? "#0891b2" : "#94a3b8"}
              />
            </View>
            <Text
              className={`text-[11px] font-extrabold mt-2 tracking-wide ${
                modoAccion === "ENTRADA" ? "text-cyan-700" : "text-slate-400"
              }`}
            >
              ENTRAR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setModoAccion("SALIDA");
              limpiarFormulario();
            }}
            className="items-center min-w-[60px]"
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
                modoAccion === "SALIDA"
                  ? "bg-cyan-50 border-cyan-400 shadow-sm"
                  : "bg-slate-50 border-transparent"
              }`}
            >
              <Ionicons
                name="log-out"
                size={26}
                color={modoAccion === "SALIDA" ? "#0891b2" : "#94a3b8"}
              />
            </View>
            <Text
              className={`text-[11px] font-extrabold mt-2 tracking-wide ${
                modoAccion === "SALIDA" ? "text-cyan-700" : "text-slate-400"
              }`}
            >
              SALIR
            </Text>
          </TouchableOpacity>

          <View className="w-[1px] h-10 bg-slate-200 mx-2" />

          <TouchableOpacity
            onPress={() => router.push("/historial")}
            className="items-center min-w-[60px]"
          >
            <View className="w-14 h-14 rounded-full items-center justify-center bg-slate-50 border-2 border-transparent">
              <Ionicons name="documents" size={24} color="#64748b" />
            </View>
            <Text className="text-[11px] font-bold mt-2 text-slate-500">
              Historial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/reportar")}
            className="items-center min-w-[60px]"
          >
            <View className="w-14 h-14 rounded-full items-center justify-center bg-slate-50 border-2 border-transparent">
              <Ionicons name="warning" size={24} color="#f59e0b" />
            </View>
            <Text className="text-[11px] font-bold mt-2 text-amber-500">
              Reportar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/cupos")}
            className="items-center min-w-[60px]"
          >
            <View className="w-14 h-14 rounded-full items-center justify-center bg-slate-50 border-2 border-transparent">
              <Ionicons name="stats-chart" size={24} color="#6366f1" />
            </View>
            <Text className="text-[11px] font-bold mt-2 text-indigo-500">
              Cupos
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
