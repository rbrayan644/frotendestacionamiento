import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { IP_DE_TU_PC } from "../config/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch(
        `http://${IP_DE_TU_PC}:3000/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        },
      );

      const datos = await respuesta.json();

      if (respuesta.ok) {
        const rolUsuario = datos.rol ? datos.rol.toUpperCase() : "DESCONOCIDO";

        if (datos.id) {
          await AsyncStorage.setItem("userId", datos.id);
        }
        await AsyncStorage.setItem("userRol", rolUsuario);
        if (datos.nombre) {
          await AsyncStorage.setItem("userName", datos.nombre);
        }
        if (datos.token) {
          await AsyncStorage.setItem("userToken", datos.token);
        }

        if (rolUsuario === "SUPERADMIN") {
          router.replace("/superadmin");
        } else if (rolUsuario === "ADMIN") {
          router.replace("/admin");
        } else {
          router.replace("/panel");
        }
      } else {
        Alert.alert(
          "Error de acceso",
          datos.mensaje || "Credenciales incorrectas",
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Revisa que el backend esté encendido y la IP sea correcta.",
      );
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
        <View className="items-center justify-center pt-24 pb-12 px-6">
          <View className="flex-row items-center">
            <Text className="text-7xl font-black text-white tracking-tighter">
              UPTAIET
            </Text>
          </View>
          {/* 👇 AQUÍ SE CORRIGIÓ EL ERROR (tracking-widest en vez de tracking-[0.3em]) 👇 */}
          <Text className="text-cyan-400 font-bold text-xs mt-4 uppercase tracking-widest text-center">
            Control de Accesos
          </Text>
        </View>

        {/* ================= FORMULARIO BLANCO ================= */}
        <View className="bg-white flex-1 rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl">
          <Text className="text-2xl font-black text-slate-800 mb-8 tracking-tight">
            Iniciar Sesión
          </Text>

          <View className="space-y-6">
            <View>
              <Text className="text-slate-500 font-bold mb-2 ml-2 text-xs uppercase tracking-widest">
                Correo Electrónico
              </Text>
              <View className="flex-row items-center bg-slate-50 px-5 py-4 rounded-[20px] border border-slate-200">
                <Ionicons name="mail" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-3 text-slate-800 font-bold text-base"
                  placeholder="ejemplo@upt.edu.ve"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View className="mb-2">
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

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Recuperación",
                  "Por favor contacta al Administrador del sistema para reiniciar tu contraseña.",
                )
              }
              className="self-end mb-4"
            >
              <Text className="text-cyan-600 font-bold text-sm">
                ¿Olvidaste tu clave?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-cyan-600 py-5 rounded-[20px] shadow-lg shadow-cyan-500/30 active:bg-cyan-700 flex-row items-center justify-center mt-2"
              onPress={handleLogin}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-center text-white font-black text-sm uppercase tracking-widest mr-2">
                    Acceder al Sistema
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-500 font-medium text-sm">
                ¿No tienes cuenta?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/registro")}>
                <Text className="text-slate-900 font-black text-sm underline">
                  Regístrate
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
