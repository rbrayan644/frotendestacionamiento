import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { IP_DE_TU_PC } from "./config/api";

export default function EquipoScreen() {
  const [cargando, setCargando] = useState(true);
  const [vigilantes, setVigilantes] = useState<any[]>([]);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalClaveVisible, setModalClaveVisible] = useState(false);
  const [vigilanteSeleccionado, setVigilanteSeleccionado] = useState<any>(null);
  const [nuevaClave, setNuevaClave] = useState("");

  // --- NUEVO: Estado para guardar el ID del Administrador logueado ---
  const [adminId, setAdminId] = useState<string | null>(null);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      // Obtenemos el ID de quien está usando la app
      const id = await AsyncStorage.getItem("userId");
      setAdminId(id);

      const resVig = await fetch(
        `http://${IP_DE_TU_PC}:3000/api/auth/usuarios/vigilantes`,
      );
      if (resVig.ok) {
        const datosVig = await resVig.json();
        setVigilantes(datosVig);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleCrearVigilante = async () => {
    if (!nombre || !email || !password)
      return Alert.alert("Error", "Llena todos los campos.");
    try {
      const respuesta = await fetch(
        `http://${IP_DE_TU_PC}:3000/api/auth/registrar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 👉 ENVIAMOS EL creadorId PARA LA AUDITORÍA
          body: JSON.stringify({
            nombre,
            email,
            password,
            rol: "VIGILANTE",
            creadorId: adminId,
          }),
        },
      );
      if (respuesta.ok) {
        Alert.alert("¡Éxito!", `Vigilante ${nombre} creado.`);
        setModalCrearVisible(false);
        setNombre("");
        setEmail("");
        setPassword("");
        cargarDatosIniciales();
      }
    } catch (error) {
      Alert.alert("Error", "Fallo al registrar.");
    }
  };

  const handleEliminar = (id: string, nombreVig: string) => {
    Alert.alert(
      "Eliminar Acceso",
      `¿Seguro que deseas borrar a ${nombreVig}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            // 👉 ENVIAMOS EL adminId EN EL BODY PARA QUE EL BACKEND SEPA QUIÉN BORRÓ
            await fetch(`http://${IP_DE_TU_PC}:3000/api/auth/usuarios/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adminId: adminId }),
            });
            cargarDatosIniciales();
          },
        },
      ],
    );
  };

  const handleCambiarClave = async () => {
    if (nuevaClave.length < 6) return Alert.alert("Error", "Clave muy corta.");
    const res = await fetch(
      `http://${IP_DE_TU_PC}:3000/api/auth/usuarios/${vigilanteSeleccionado._id}/password`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // 👉 ENVIAMOS EL adminId PARA LA AUDITORÍA
        body: JSON.stringify({
          nuevaPassword: nuevaClave,
          adminId: adminId,
        }),
      },
    );
    if (res.ok) {
      Alert.alert("Listo", "Clave actualizada.");
      setModalClaveVisible(false);
      setNuevaClave("");
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-slate-800 p-3 rounded-full"
        >
          <Ionicons name="arrow-back" size={22} color="#38bdf8" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-white">
            Gestión de Equipo
          </Text>
          <Text className="text-cyan-400 font-medium text-sm">
            Control de personal
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity
          onPress={() => setModalCrearVisible(true)}
          className="bg-cyan-600 py-4 rounded-2xl items-center mb-6 shadow-md"
        >
          <Text className="text-white font-black uppercase">
            + Registrar Nuevo Vigilante
          </Text>
        </TouchableOpacity>

        {cargando ? (
          <ActivityIndicator color="#0891b2" />
        ) : (
          vigilantes.map((v) => (
            <View
              key={v._id}
              className="bg-white p-5 rounded-3xl border border-slate-100 mb-4 flex-row justify-between items-center shadow-sm"
            >
              <View className="flex-1">
                <Text className="font-black text-slate-800 text-lg">
                  {v.nombre}
                </Text>
                <Text className="text-slate-400 text-xs">{v.email}</Text>
              </View>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => {
                    setVigilanteSeleccionado(v);
                    setModalClaveVisible(true);
                  }}
                  className="bg-amber-100 p-3 rounded-xl"
                >
                  <Ionicons name="key" size={18} color="#d97706" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEliminar(v._id, v.nombre)}
                  className="bg-rose-100 p-3 rounded-xl"
                >
                  <Ionicons name="trash" size={18} color="#e11d48" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL CREAR */}
      <Modal visible={modalCrearVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-white rounded-t-[40px] p-8 h-[70%]">
            <Text className="text-2xl font-black mb-6">Nuevo Usuario</Text>
            <TextInput
              className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200"
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              onPress={handleCrearVigilante}
              className="bg-cyan-600 py-4 rounded-2xl"
            >
              <Text className="text-white text-center font-black">
                CREAR CUENTA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalCrearVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-slate-400 font-bold">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CLAVE */}
      <Modal visible={modalClaveVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-[40px] p-8 w-full">
            <Text className="text-xl font-black mb-4 text-center">
              Nueva Clave para {vigilanteSeleccionado?.nombre}
            </Text>
            <TextInput
              className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200"
              placeholder="Mínimo 6 caracteres"
              value={nuevaClave}
              onChangeText={setNuevaClave}
              secureTextEntry
            />
            <TouchableOpacity
              onPress={handleCambiarClave}
              className="bg-amber-500 py-4 rounded-2xl"
            >
              <Text className="text-white text-center font-black">
                ACTUALIZAR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalClaveVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-slate-400 font-bold">
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
