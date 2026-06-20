import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
import { API_URL } from "../config/api";

export default function RegistroScreen() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("ADMIN");
  const [cargando, setCargando] = useState(false);

  const handleRegistrar = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Campos incompletos", "Por favor llena todos los datos.");
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch(`${API_URL}/auth/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre,
          email: email.trim(),
          password: password,
          rol: rol,
        }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        // 👇 AQUÍ ESTÁ EL CAMBIO: Mensaje más claro sobre la sala de espera 👇
        Alert.alert(
          "¡Solicitud Enviada!",
          "Tu cuenta fue creada exitosamente, pero requiere APROBACIÓN. Un administrador debe autorizar tu acceso para poder iniciar sesión.",
        );
        router.back();
      } else {
        Alert.alert("Error al registrar", datos.mensaje || "Hubo un problema");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-900"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* ================= LOGO Y ENCABEZADO UPTAI ================= */}
        <View className="items-center justify-center pt-20 pb-10 px-6">
          <View className="flex-row items-center">
            <Text className="text-6xl font-black text-white tracking-tighter">
              UPTAIET
            </Text>
            <View className="bg-yellow-400 px-3 py-1.5 ml-2 rounded-xl shadow-lg">
              <Text className="text-slate-900 font-extrabold text-2xl"></Text>
            </View>
          </View>
          <Text className="text-cyan-400 font-bold text-xs mt-3 uppercase tracking-widest text-center">
            Alta de Personal
          </Text>
        </View>

        {/* ================= FORMULARIO BLANCO ================= */}
        <View className="bg-white flex-1 rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl">
          <Text className="text-2xl font-black text-slate-800 mb-8 tracking-tight">
            Crear Cuenta
          </Text>

          <View className="space-y-5">
            {/* Campo Nombre */}
            <View>
              <Text className="text-slate-500 font-bold mb-2 ml-2 text-xs uppercase tracking-widest">
                Nombre Completo
              </Text>
              <View className="flex-row items-center bg-slate-50 px-5 py-4 rounded-[20px] border border-slate-200">
                <Ionicons name="person" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-3 text-slate-800 font-bold text-base"
                  placeholder="Ej: Carlos Pérez"
                  placeholderTextColor="#cbd5e1"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
            </View>

            {/* Campo Correo */}
            <View>
              <Text className="text-slate-500 font-bold mb-2 ml-2 text-xs uppercase tracking-widest">
                Correo Electrónico
              </Text>
              <View className="flex-row items-center bg-slate-50 px-5 py-4 rounded-[20px] border border-slate-200">
                <Ionicons name="mail" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-3 text-slate-800 font-bold text-base"
                  placeholder="admin@upt.edu.ve"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View>
              <Text className="text-slate-500 font-bold mb-2 ml-2 text-xs uppercase tracking-widest">
                Contraseña
              </Text>
              <View className="flex-row items-center bg-slate-50 px-5 py-4 rounded-[20px] border border-slate-200">
                <Ionicons name="lock-closed" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-3 text-slate-800 font-bold text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Selector de Rol */}
            <View className="pt-2">
              <Text className="text-slate-500 font-bold mb-3 ml-2 text-xs uppercase tracking-widest">
                Nivel de Acceso
              </Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className={`flex-1 py-4 rounded-2xl border-2 ${rol === "ADMIN" ? "bg-cyan-50 border-cyan-400 shadow-sm" : "bg-slate-50 border-slate-100"}`}
                  onPress={() => setRol("ADMIN")}
                >
                  <Text
                    className={`text-center font-black text-xs uppercase tracking-widest ${rol === "ADMIN" ? "text-cyan-700" : "text-slate-400"}`}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-4 rounded-2xl border-2 ${rol === "SUPERADMIN" ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-slate-50 border-slate-100"}`}
                  onPress={() => setRol("SUPERADMIN")}
                >
                  <Text
                    className={`text-center font-black text-xs uppercase tracking-widest ${rol === "SUPERADMIN" ? "text-indigo-700" : "text-slate-400"}`}
                  >
                    Super Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              className="w-full bg-cyan-600 py-5 rounded-[20px] shadow-lg shadow-cyan-500/30 active:bg-cyan-700 flex-row items-center justify-center mt-6"
              onPress={handleRegistrar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-center text-white font-black text-sm uppercase tracking-widest mr-2">
                    Enviar Solicitud
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Volver al Login */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-500 font-medium text-sm">
                ¿Ya tienes cuenta?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-slate-900 font-black text-sm underline">
                  Inicia Sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
