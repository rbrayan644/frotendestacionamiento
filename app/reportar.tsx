import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import GeneradorPDF from "./components/GeneradorPDF"; // <-- IMPORTAMOS EL COMPONENTE
import { IP_DE_TU_PC } from "./config/api";

export default function ReportarScreen() {
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [placaRelacionada, setPlacaRelacionada] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Estado para guardar el nombre del vigilante para la firma del PDF
  const [nombreVigilante, setNombreVigilante] = useState("Vigilante de Turno");

  // Cargar el nombre del vigilante al abrir la pantalla
  useEffect(() => {
    const cargarNombre = async () => {
      const nombre = await AsyncStorage.getItem("userName");
      if (nombre) setNombreVigilante(nombre);
    };
    cargarNombre();
  }, []);

  const enviarReporte = async () => {
    if (!asunto.trim() || !descripcion.trim()) {
      return Alert.alert(
        "Campos vacíos",
        "El asunto y la descripción son obligatorios para poder enviar el reporte.",
      );
    }

    try {
      setEnviando(true);
      const vigilanteId = await AsyncStorage.getItem("userId");

      if (!vigilanteId) {
        setEnviando(false);
        return Alert.alert(
          "Error",
          "No se encontró tu sesión. Vuelve a iniciar sesión.",
        );
      }

      // Limpiamos la placa por si el vigilante la escribió en minúsculas o con espacios
      const placaLimpia = placaRelacionada.trim().toUpperCase();

      const respuesta = await fetch(
        `http://${IP_DE_TU_PC}:3000/api/reportes/crear`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vigilanteId,
            asunto,
            descripcion,
            placaRelacionada: placaLimpia,
          }),
        },
      );

      if (respuesta.ok) {
        Alert.alert(
          "✅ Reporte Enviado",
          "Los administradores han sido notificados.",
        );
        router.back(); // Regresamos al panel
      } else {
        Alert.alert("Error", "No se pudo enviar el reporte.");
      }
    } catch (error) {
      Alert.alert(
        "Error de conexión",
        "Revisa que tu servidor esté encendido.",
      );
    } finally {
      setEnviando(false);
    }
  };

  // --- PREPARAMOS LOS DATOS EN VIVO PARA EL PDF ---
  const formularioLleno =
    asunto.trim().length > 0 && descripcion.trim().length > 0;

  const datosParaPDF = [
    {
      accion: placaRelacionada.toUpperCase() || "SIN PLACA",
      usuario: `ASUNTO: ${asunto} | DETALLES: ${descripcion}`,
      estado: "INCIDENCIA",
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      {/* ================= CABECERA MODERNA UPTAI ================= */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-10 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-slate-800 p-3 rounded-full border border-slate-700"
        >
          <Ionicons name="arrow-back" size={22} color="#f43f5e" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-white tracking-tight">
            Reportar Incidencia
          </Text>
          <Text className="text-rose-400 font-medium text-sm mt-1 tracking-wide">
            Notificar a la administración
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          paddingTop: 24,
        }}
      >
        {/* CAJA DE ADVERTENCIA */}
        <View className="bg-amber-50 border border-amber-200 p-5 rounded-3xl mb-6 flex-row items-center shadow-sm">
          <View className="bg-amber-100 p-2 rounded-full">
            <Ionicons name="warning" size={28} color="#d97706" />
          </View>
          <Text className="text-amber-800 ml-3 flex-1 text-xs font-bold leading-relaxed tracking-wide">
            Usa este formulario para reportar faltas de respeto, daños a la
            propiedad o cualquier eventualidad grave durante tu turno.
          </Text>
        </View>

        {/* FORMULARIO */}
        <View className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100">
          <View className="mb-5">
            <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
              Asunto del Reporte *
            </Text>
            <TextInput
              className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 text-slate-800 font-black focus:border-rose-400 focus:bg-white"
              placeholder="Ej: Estudiante grosero en la puerta"
              placeholderTextColor="#94a3b8"
              value={asunto}
              onChangeText={setAsunto}
            />
          </View>

          <View className="mb-5">
            <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
              Placa Involucrada (Opcional)
            </Text>
            <TextInput
              className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 text-slate-800 font-black uppercase focus:border-rose-400 focus:bg-white"
              placeholder="ABC-123"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={placaRelacionada}
              onChangeText={setPlacaRelacionada}
            />
          </View>

          <View className="mb-8">
            <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
              Descripción de los hechos *
            </Text>
            <TextInput
              className="bg-slate-50 px-5 py-5 rounded-3xl border border-slate-200 text-slate-800 text-left font-medium focus:border-rose-400 focus:bg-white"
              placeholder="Describe detalladamente qué sucedió..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={descripcion}
              onChangeText={setDescripcion}
              style={{ minHeight: 140 }}
            />
          </View>

          {/* BOTÓN DE ENVIAR A LA BASE DE DATOS */}
          <TouchableOpacity
            onPress={enviarReporte}
            disabled={enviando}
            className={`py-4 rounded-2xl shadow-sm flex-row justify-center items-center mb-4 ${enviando ? "bg-slate-400" : "bg-rose-500 active:bg-rose-600"}`}
          >
            {enviando ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-black text-sm uppercase tracking-widest ml-2">
                  Enviar a Administración
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* BOTÓN DE DESCARGAR COPIA EN PDF (Aparece solo si hay texto) */}
          {formularioLleno && (
            <View className="pt-4 border-t border-slate-100 mt-2">
              <GeneradorPDF
                datos={datosParaPDF}
                nombreUsuario={nombreVigilante}
                tipoReporte="Copia de Incidencia (Borrador)"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
