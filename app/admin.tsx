import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// IMPORTAMOS SVG PARA LA DONA
import Svg, { Circle } from "react-native-svg";

import BarraTareas from "./components/BarraTareas";
import GeneradorPDF from "./components/GeneradorPDF";
import { IP_DE_TU_PC } from "./config/api";

// --- SUB-COMPONENTE PARA EL GRÁFICO DE DONA ---
const GraficoDona = ({
  adentro,
  capacidad,
  color,
  icono,
  tipo,
  colorFondo,
}: any) => {
  const radio = 40;
  const circunferencia = 2 * Math.PI * radio;
  // Calculamos qué porcentaje de la dona debe pintarse
  const porcentaje = Math.min((adentro / capacidad) * 100, 100);
  const strokeDashoffset = circunferencia - (porcentaje / 100) * circunferencia;

  return (
    <View className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm mb-6 flex-row items-center justify-between">
      <View>
        <View className="flex-row items-center mb-2">
          <View className={`${colorFondo} p-3 rounded-2xl mr-3`}>
            {tipo === "Carros" ? (
              <Ionicons name="car" size={24} color={color} />
            ) : (
              <MaterialCommunityIcons
                name="motorbike"
                size={24}
                color={color}
              />
            )}
          </View>
          <View>
            <Text className="font-black text-lg text-slate-800">{tipo}</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Cupos Libres: {capacidad - adentro}
            </Text>
          </View>
        </View>
      </View>

      {/* EL DIBUJO DE LA DONA */}
      <View className="items-center justify-center relative">
        <Svg height="100" width="100" viewBox="0 0 100 100">
          {/* Círculo de fondo (gris claro) */}
          <Circle
            cx="50"
            cy="50"
            r={radio}
            stroke="#f1f5f9"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Círculo de progreso (color) */}
          <Circle
            cx="50"
            cy="50"
            r={radio}
            stroke={color}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circunferencia}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)" // Para que empiece desde arriba
          />
        </Svg>
        {/* Número en el centro de la dona */}
        <View className="absolute items-center justify-center">
          <Text className="font-black text-xl text-slate-800">{adentro}</Text>
          <Text className="text-[8px] font-bold text-slate-400 uppercase">
            Ocupados
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function AdminScreen() {
  const [nombreAdmin, setNombreAdmin] = useState("Administrador");
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Estados para el Modal de Editar Nombre
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  const [stats, setStats] = useState({
    carros: { adentro: 0, capacidad: 45, disponibles: 45 },
    motos: { adentro: 0, capacidad: 100, disponibles: 100 },
    hoy: { estudiantes: 0, profesores: 0, total: 0 },
  });

  const cargarDatos = async () => {
    try {
      const nombre = await AsyncStorage.getItem("userName");
      if (nombre) setNombreAdmin(nombre);

      const resStats = await fetch(
        `http://${IP_DE_TU_PC}:3000/api/registros/estadisticas`,
      );
      if (resStats.ok) {
        const datos = await resStats.json();
        setStats(datos);
      }
    } catch (error) {
      console.log("Error al cargar dashboard", error);
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

  const cerrarSesion = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  // Función para guardar el nuevo nombre
  const handleGuardarNombre = async () => {
    if (!nuevoNombre.trim()) {
      return Alert.alert("Error", "El nombre no puede estar vacío");
    }

    try {
      // 1. Guardarlo en la memoria del celular
      await AsyncStorage.setItem("userName", nuevoNombre);
      setNombreAdmin(nuevoNombre);
      setModalNombreVisible(false);

      // (OPCIONAL: Aquí podrías hacer un fetch PUT a tu backend si quieres que el nombre se cambie en la base de datos también)
      /*
      const userId = await AsyncStorage.getItem("userId");
      await fetch(`http://${IP_DE_TU_PC}:3000/api/auth/usuarios/editarNombre/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre }),
      });
      */
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el nombre");
    }
  };

  const datosParaPDF = [
    {
      accion: "RESUMEN",
      usuario: `Estudiantes hoy: ${stats.hoy?.estudiantes || 0}`,
      estado: "OK",
      createdAt: new Date(),
    },
    {
      accion: "RESUMEN",
      usuario: `Profesores hoy: ${stats.hoy?.profesores || 0}`,
      estado: "OK",
      createdAt: new Date(),
    },
    {
      accion: "ESTACIONAMIENTO",
      usuario: `Ocupación: ${stats.carros.adentro} Carros / ${stats.motos.adentro} Motos`,
      estado: "TOTAL",
      createdAt: new Date(),
    },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="light" />

      {/* CABECERA */}
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-20">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-black text-white italic">
              DASHBOARD
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-cyan-400 font-medium text-sm mr-2">
                Hola, {nombreAdmin}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setNuevoNombre(nombreAdmin);
                  setModalNombreVisible(true);
                }}
                className="bg-slate-800 p-1.5 rounded-full"
              >
                <Ionicons name="pencil" size={12} color="#22d3ee" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={cerrarSesion}
            className="bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="power" size={22} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              cargarDatos();
            }}
          />
        }
      >
        <BarraTareas />

        {cargando ? (
          <ActivityIndicator size="large" color="#0891b2" className="mt-10" />
        ) : (
          <View className="px-6 mt-4">
            {/* 1. RESUMEN RÁPIDO DEL DÍA */}
            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">
              Ingresos de Hoy
            </Text>
            <View className="flex-row space-x-4 mb-8">
              {/* Círculo Estudiantes */}
              <View className="flex-1 aspect-square bg-indigo-600 rounded-full shadow-lg justify-center items-center border-4 border-indigo-100">
                <Ionicons name="school" size={28} color="white" />
                <Text className="text-4xl font-black text-white mt-1">
                  {stats.hoy?.estudiantes || 0}
                </Text>
                <Text className="text-[9px] font-bold text-indigo-200 uppercase mt-1 tracking-wider">
                  Estudiantes
                </Text>
              </View>

              {/* Círculo Profesores */}
              <View className="flex-1 aspect-square bg-emerald-600 rounded-full shadow-lg justify-center items-center border-4 border-emerald-100">
                <Ionicons name="briefcase" size={28} color="white" />
                <Text className="text-4xl font-black text-white mt-1">
                  {stats.hoy?.profesores || 0}
                </Text>
                <Text className="text-[9px] font-bold text-emerald-100 uppercase mt-1 tracking-wider">
                  Profesores
                </Text>
              </View>
            </View>

            {/* 2. ESTADO DE CAPACIDAD (GRÁFICOS DE DONA) */}
            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">
              Ocupación Actual
            </Text>

            <GraficoDona
              tipo="Carros"
              adentro={stats.carros.adentro}
              capacidad={stats.carros.capacidad}
              color="#0891b2" // Cyan
              colorFondo="bg-cyan-50"
            />

            <GraficoDona
              tipo="Motos"
              adentro={stats.motos.adentro}
              capacidad={stats.motos.capacidad}
              color="#4f46e5" // Indigo
              colorFondo="bg-indigo-50"
            />

            {/* 3. REPORTE PDF DE CIERRE */}
            <View className="bg-slate-900 p-8 rounded-[40px] shadow-2xl items-center mt-4">
              <Ionicons name="document-text" size={40} color="#38bdf8" />
              <Text className="text-white font-black text-lg mt-2">
                Cierre de Día
              </Text>
              <Text className="text-slate-400 text-center text-xs mb-6">
                Genera un resumen oficial de todos los movimientos registrados
                hoy.
              </Text>
              <GeneradorPDF
                datos={datosParaPDF}
                nombreUsuario={nombreAdmin}
                tipoReporte="Resumen Estadístico Diario"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL PARA EDITAR NOMBRE */}
      <Modal visible={modalNombreVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full p-8 rounded-[35px]">
            <Text className="font-black text-xl text-slate-800 mb-2">
              Editar Perfil
            </Text>
            <Text className="text-slate-500 text-xs mb-6">
              ¿Cómo quieres que te llame el sistema?
            </Text>

            <TextInput
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Tu nombre aquí..."
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 font-medium text-slate-800"
              autoFocus
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setModalNombreVisible(false)}
                className="flex-1 bg-slate-100 py-4 rounded-2xl items-center"
              >
                <Text className="font-bold text-slate-500">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGuardarNombre}
                className="flex-1 bg-cyan-500 py-4 rounded-2xl items-center shadow-md shadow-cyan-200"
              >
                <Text className="font-black text-white">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
