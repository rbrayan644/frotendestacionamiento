import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import HerramientasPanel from "./components/HerramientasPanel";
import { API_URL } from "./config/api"; // <-- Actualizado a la nube

export default function PanelScreen() {
  // ==========================================
  // ESTADOS GLOBALES DE LA PANTALLA
  // ==========================================
  const [modoAccion, setModoAccion] = useState("ENTRADA");

  // Campos del formulario del vehículo/conductor
  const [placa, setPlaca] = useState("");
  const [cedula, setCedula] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("CARRO");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipoConductor, setTipoConductor] = useState("ESTUDIANTE");
  const [trayecto, setTrayecto] = useState("");
  const [carrera, setCarrera] = useState("");
  const [pnf, setPnf] = useState("");

  // Cámara y Escaneo
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [qrCarnet, setQrCarnet] = useState("");
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [tipoEscaneo, setTipoEscaneo] = useState<"NONE" | "OCR" | "QR">("NONE");
  const [procesandoCamara, setProcesandoCamara] = useState(false);
  const cameraRef = useRef<any>(null);

  // Estadísticas de ocupación para bloquear entradas si está lleno
  const [stats, setStats] = useState({
    carros: { disponibles: 45, capacidad: 45 },
    motos: { disponibles: 100, capacidad: 100 },
  });

  // ==========================================
  // FUNCIONES DE CARGA Y BÚSQUEDA
  // ==========================================

  /**
   * Consulta a Vercel la cantidad de cupos disponibles.
   */
  const cargarEstadisticas = async () => {
    try {
      const res = await fetch(`${API_URL}/registros/estadisticas`);
      if (res.ok) {
        const datos = await res.json();
        setStats(datos);
      }
    } catch (e) {
      console.log("Error cargando cupos invisibles", e);
    }
  };

  // Se ejecuta cada vez que el usuario entra a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarEstadisticas();
    }, []),
  );

  /**
   * Busca si una placa ya existe en la base de datos para autocompletar el formulario.
   */
  const handleBuscarPlaca = async (placaABuscar = placa) => {
    if (!placaABuscar) {
      return Alert.alert(
        "Escribe una placa",
        "Debes ingresar una placa para buscar.",
      );
    }

    const placaLimpia = placaABuscar.trim().toUpperCase();

    try {
      const respuesta = await fetch(
        `${API_URL}/registros/buscar/${placaLimpia}`,
      );
      const datos = await respuesta.json();

      if (datos.existe) {
        // Autocompleta los campos
        setPlaca(placaLimpia);
        setCedula(datos.conductor.cedula || "");
        setTipoVehiculo(datos.conductor.tipoVehiculo || "CARRO");
        setMarca(datos.conductor.marca || "");
        setModelo(datos.conductor.modelo || "");
        setNombres(datos.conductor.nombres || "");
        setApellidos(datos.conductor.apellidos || "");
        setTipoConductor(datos.conductor.tipo || "ESTUDIANTE");
        setCarrera(datos.conductor.carrera || "");
        setTrayecto(datos.conductor.trayecto || "");
        setPnf(datos.conductor.pnf || "");

        if (modoAccion === "ENTRADA" && tipoEscaneo === "NONE") {
          Alert.alert(
            "¡Vehículo Encontrado!",
            "Datos cargados automáticamente.",
          );
        }
      } else {
        if (tipoEscaneo !== "NONE") setPlaca(placaLimpia);
        Alert.alert("Vehículo Nuevo", "Esta placa no está registrada.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar para buscar la placa.");
    }
  };

  // ==========================================
  // FUNCIONES DE REGISTRO (ENTRADA / SALIDA)
  // ==========================================

  /**
   * Envía a la base de datos la solicitud de ingreso al estacionamiento.
   */
  const handleRegistrarEntrada = async () => {
    if (!placa || !cedula || !marca || !modelo || !nombres || !apellidos) {
      return Alert.alert(
        "Faltan datos",
        "Placa, Cédula, marca, modelo, nombres y apellidos son obligatorios.",
      );
    }

    // Verificación de capacidad máxima
    if (tipoVehiculo === "CARRO" && stats.carros.disponibles <= 0) {
      return Alert.alert(
        "⛔ Estacionamiento Lleno",
        "No hay cupos disponibles para CARROS.",
      );
    }
    if (tipoVehiculo === "MOTO" && stats.motos.disponibles <= 0) {
      return Alert.alert(
        "⛔ Estacionamiento Lleno",
        "No hay cupos disponibles para MOTOS.",
      );
    }

    const placaLimpia = placa.trim().toUpperCase();
    const cedulaLimpia = cedula.trim();

    try {
      const vigilanteIdReal = await AsyncStorage.getItem("userId");
      if (!vigilanteIdReal)
        return Alert.alert("Error", "No se encontró tu ID.");

      const respuesta = await fetch(`${API_URL}/registros/entrada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: placaLimpia,
          cedula: cedulaLimpia,
          tipoVehiculo,
          marca,
          modelo,
          nombres,
          apellidos,
          tipo: tipoConductor,
          trayecto: tipoConductor === "ESTUDIANTE" ? trayecto : null,
          carrera: tipoConductor === "ESTUDIANTE" ? carrera : null,
          pnf: tipoConductor === "PROFESOR" ? pnf : null,
          vigilanteId: vigilanteIdReal,
          qrCarnet,
        }),
      });

      const datos = await respuesta.json();
      if (respuesta.ok) {
        Alert.alert("¡Entrada Registrada!", `Vehículo ingresó exitosamente.`);
        limpiarFormulario();
        cargarEstadisticas();
      } else {
        Alert.alert("Atención", datos.mensaje || "Error al registrar");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  /**
   * Envía a la base de datos la solicitud de salida del estacionamiento.
   */
  const handleRegistrarSalida = async () => {
    if (!placa) return Alert.alert("Falta la placa", "Escribe la placa.");

    const placaLimpia = placa.trim().toUpperCase();

    try {
      const vigilanteIdReal = await AsyncStorage.getItem("userId");
      const respuesta = await fetch(`${API_URL}/registros/salida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: placaLimpia,
          vigilanteId: vigilanteIdReal,
        }),
      });

      const datos = await respuesta.json();
      if (respuesta.ok) {
        Alert.alert("¡Salida Registrada!", "El vehículo ha marcado su salida.");
        limpiarFormulario();
        cargarEstadisticas();
      } else {
        Alert.alert("Atención", datos.mensaje || "Error al registrar salida.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  /**
   * Limpia todos los campos de la pantalla.
   */
  const limpiarFormulario = () => {
    setPlaca("");
    setCedula("");
    setMarca("");
    setModelo("");
    setNombres("");
    setApellidos("");
    setTrayecto("");
    setCarrera("");
    setPnf("");
    setTipoVehiculo("CARRO");
    setQrCarnet("");
  };

  // ==========================================
  // FUNCIONES DE CÁMARA (QR y OCR)
  // ==========================================

  const abrirCamara = async (modo: "OCR" | "QR") => {
    if (!permisoCamara?.granted) {
      const resultado = await pedirPermisoCamara();
      if (!resultado.granted)
        return Alert.alert(
          "Permiso Denegado",
          "Se necesita acceso a la cámara.",
        );
    }
    setTipoEscaneo(modo);
  };

  /**
   * Procesa la lectura de un código QR y busca sus datos.
   */
  const handleLectorQR = async ({ data }: { data: string }) => {
    if (procesandoCamara) return;
    setProcesandoCamara(true);

    try {
      const res = await fetch(
        `${API_URL}/registros/buscar-qr/${encodeURIComponent(data)}`,
      );
      const datosBD = await res.json();

      if (datosBD.existe) {
        setPlaca(datosBD.conductor.placa || "");
        setCedula(datosBD.conductor.cedula || "");
        setTipoVehiculo(datosBD.conductor.tipoVehiculo || "CARRO");
        setMarca(datosBD.conductor.marca || "");
        setModelo(datosBD.conductor.modelo || "");
        setNombres(datosBD.conductor.nombres || "");
        setApellidos(datosBD.conductor.apellidos || "");
        setTipoConductor(datosBD.conductor.tipo || "ESTUDIANTE");
        setCarrera(datosBD.conductor.carrera || "");
        setTrayecto(datosBD.conductor.trayecto || "");
        setPnf(datosBD.conductor.pnf || "");

        setTipoEscaneo("NONE");
        Alert.alert("¡Carnet Reconocido!", "Datos del vehículo cargados.");
      } else {
        setQrCarnet(data);
        setTipoEscaneo("NONE");
        Alert.alert(
          "Carnet Nuevo",
          "QR detectado. Llena los datos del vehículo para vincularlo a este carnet.",
        );
      }
    } catch (e) {
      Alert.alert(
        "Error",
        "Problema al verificar el carnet en la base de datos.",
      );
    } finally {
      setProcesandoCamara(false);
    }
  };

  /**
   * Toma una foto de la placa y usa inteligencia artificial (OCR) para leer las letras.
   * NOTA: Esta función se conecta a una API externa (ocr.space), no a Vercel.
   */
  const capturarYLeerPlacaOCR = async () => {
    if (cameraRef.current) {
      setProcesandoCamara(true);
      try {
        const foto = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        const imagenBase64Full = `data:image/jpeg;base64,${foto.base64}`;
        setFotoCapturada(imagenBase64Full);

        let form = new FormData();
        form.append("base64Image", imagenBase64Full);
        form.append("language", "eng");
        form.append("apikey", "helloworld");
        form.append("scale", "true");
        form.append("OCREngine", "2");

        // Petición a la API externa de lectura de placas (Se deja intacto)
        const respuesta = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          body: form,
        });
        const datos = await respuesta.json();

        if (datos.IsErroredOnProcessing) {
          setProcesandoCamara(false);
          return Alert.alert("Error de la API", String(datos.ErrorMessage[0]));
        }

        if (datos.ParsedResults && datos.ParsedResults.length > 0) {
          let textoExtraido = datos.ParsedResults[0].ParsedText.toUpperCase();
          if (!textoExtraido || textoExtraido.trim() === "") {
            setProcesandoCamara(false);
            return Alert.alert("Imagen en blanco", "La IA no encontró letras.");
          }

          let lineas = textoExtraido.split("\n");
          let placaEncontrada = "";

          for (let linea of lineas) {
            let lineaLimpia = linea.replace(/[^A-Z0-9]/g, "");
            if (lineaLimpia.length === 6 || lineaLimpia.length === 7) {
              const palabrasIgnoradas = [
                "CAPITAL",
                "CARACAS",
                "BARINAS",
                "MIRANDA",
                "TACHIRA",
                "TRUJILLO",
                "REPUBLI",
                "VENEZUELA",
              ];
              if (!palabrasIgnoradas.includes(lineaLimpia)) {
                placaEncontrada = lineaLimpia.replace(/O/g, "0");
                break;
              }
            }
          }

          if (placaEncontrada) {
            setTipoEscaneo("NONE");
            handleBuscarPlaca(placaEncontrada);
          } else {
            Alert.alert(
              "No se detectó el formato",
              `El escáner vio:\n${textoExtraido}`,
            );
          }
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo conectar con el servidor OCR.");
      } finally {
        setProcesandoCamara(false);
      }
    }
  };

  // ==========================================
  // INTERFAZ GRÁFICA (UI)
  // ==========================================

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      <View className="pt-14 pb-8 px-6 bg-slate-900 rounded-b-[40px] shadow-xl z-10">
        <View className="flex-row justify-between items-center">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl font-black text-white tracking-tight">
                UPTAIET
              </Text>
              <View className="bg-yellow-400 px-2 py-0.5 ml-1 rounded-md">
                <Text className="text-slate-900 font-extrabold text-sm"></Text>
              </View>
            </View>
            <Text className="text-cyan-400 font-medium text-sm mt-1 tracking-wide">
              Control de Accesos
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.clear();
              router.replace("/");
            }}
            className="bg-slate-800 p-3 rounded-full border border-slate-700"
          >
            <Ionicons name="power" size={22} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
        <HerramientasPanel
          modoAccion={modoAccion}
          setModoAccion={setModoAccion}
          limpiarFormulario={limpiarFormulario}
        />

        <View className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 mx-5 mt-2">
          <View className="flex-row items-center mb-6 border-b border-slate-100 pb-4">
            <Ionicons
              name={modoAccion === "ENTRADA" ? "log-in" : "log-out"}
              size={24}
              color={modoAccion === "ENTRADA" ? "#0891b2" : "#dc2626"}
            />
            <Text className="text-xl font-black text-slate-800 ml-2 uppercase tracking-wide">
              {modoAccion === "ENTRADA"
                ? "Registrar Entrada"
                : "Registrar Salida"}
            </Text>
          </View>

          {qrCarnet !== "" && nombres === "" && (
            <View className="bg-cyan-50 p-4 rounded-2xl border border-cyan-200 mb-6 flex-row items-center">
              <View className="bg-cyan-100 p-2 rounded-full">
                <Ionicons name="id-card" size={24} color="#0e7490" />
              </View>
              <Text className="text-cyan-900 ml-3 font-bold flex-1 text-xs">
                Carnet detectado. Llena los datos para registrarlo.
              </Text>
              <TouchableOpacity onPress={() => setQrCarnet("")}>
                <Ionicons name="close-circle" size={24} color="#0891b2" />
              </TouchableOpacity>
            </View>
          )}

          <View className="space-y-5">
            <View>
              <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                Placa del Vehículo
              </Text>
              <View className="flex-row space-x-3">
                <TextInput
                  className="flex-1 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 text-slate-800 font-black text-lg uppercase focus:border-cyan-400 focus:bg-white"
                  placeholder="ABC-123"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  value={placa}
                  onChangeText={setPlaca}
                />
                <TouchableOpacity
                  onPress={() => handleBuscarPlaca(placa)}
                  className="bg-cyan-600 px-5 rounded-2xl justify-center items-center shadow-sm"
                >
                  <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {nombres !== "" && (
              <View className="bg-slate-900 p-5 rounded-2xl shadow-lg mt-2 flex-row items-center">
                <View className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  {tipoVehiculo === "MOTO" ? (
                    <MaterialCommunityIcons
                      name="motorbike"
                      size={32}
                      color="#2dd4bf"
                    />
                  ) : (
                    <Ionicons name="car-sport" size={32} color="#38bdf8" />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-white font-black text-lg"
                    numberOfLines={1}
                  >
                    {nombres} {apellidos}
                  </Text>
                  <Text className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                    C.I: {cedula} • {tipoConductor}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={28} color="#34d399" />
              </View>
            )}

            {modoAccion === "ENTRADA" && (
              <View className="space-y-5 mt-2">
                <View>
                  <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                    Tipo de Vehículo
                  </Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => setTipoVehiculo("CARRO")}
                      className={`flex-1 py-4 rounded-2xl border-2 flex-row justify-center items-center ${tipoVehiculo === "CARRO" ? "bg-cyan-50 border-cyan-500" : "bg-slate-50 border-slate-100"}`}
                    >
                      <Ionicons
                        name="car"
                        size={20}
                        color={tipoVehiculo === "CARRO" ? "#0891b2" : "#94a3b8"}
                      />
                      <Text
                        className={`font-black ml-2 ${tipoVehiculo === "CARRO" ? "text-cyan-700" : "text-slate-400"}`}
                      >
                        CARRO
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTipoVehiculo("MOTO")}
                      className={`flex-1 py-4 rounded-2xl border-2 flex-row justify-center items-center ${tipoVehiculo === "MOTO" ? "bg-cyan-50 border-cyan-500" : "bg-slate-50 border-slate-100"}`}
                    >
                      <MaterialCommunityIcons
                        name="motorbike"
                        size={20}
                        color={tipoVehiculo === "MOTO" ? "#0891b2" : "#94a3b8"}
                      />
                      <Text
                        className={`font-black ml-2 ${tipoVehiculo === "MOTO" ? "text-cyan-700" : "text-slate-400"}`}
                      >
                        MOTO
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                    Usuario
                  </Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className={`flex-1 py-4 rounded-2xl border-2 ${tipoConductor === "ESTUDIANTE" ? "bg-indigo-50 border-indigo-400" : "bg-slate-50 border-slate-100"}`}
                      onPress={() => setTipoConductor("ESTUDIANTE")}
                    >
                      <Text
                        className={`text-center font-black ${tipoConductor === "ESTUDIANTE" ? "text-indigo-700" : "text-slate-400"}`}
                      >
                        ESTUDIANTE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-4 rounded-2xl border-2 ${tipoConductor === "PROFESOR" ? "bg-indigo-50 border-indigo-400" : "bg-slate-50 border-slate-100"}`}
                      onPress={() => setTipoConductor("PROFESOR")}
                    >
                      <Text
                        className={`text-center font-black ${tipoConductor === "PROFESOR" ? "text-indigo-700" : "text-slate-400"}`}
                      >
                        PROFESOR
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                    Cédula
                  </Text>
                  <TextInput
                    className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                    keyboardType="numeric"
                    placeholder="Ej: 27123456"
                    value={cedula}
                    onChangeText={setCedula}
                  />
                </View>

                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                      Marca
                    </Text>
                    <TextInput
                      className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                      value={marca}
                      onChangeText={setMarca}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                      Modelo
                    </Text>
                    <TextInput
                      className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                      value={modelo}
                      onChangeText={setModelo}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                    Nombres
                  </Text>
                  <TextInput
                    className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                    value={nombres}
                    onChangeText={setNombres}
                  />
                </View>
                <View>
                  <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                    Apellidos
                  </Text>
                  <TextInput
                    className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                    value={apellidos}
                    onChangeText={setApellidos}
                  />
                </View>

                {tipoConductor === "ESTUDIANTE" ? (
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                        Carrera
                      </Text>
                      <TextInput
                        className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                        value={carrera}
                        onChangeText={setCarrera}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                        Trayecto
                      </Text>
                      <TextInput
                        className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                        value={trayecto}
                        onChangeText={setTrayecto}
                      />
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text className="text-slate-500 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">
                      PNF
                    </Text>
                    <TextInput
                      className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:border-cyan-400 focus:bg-white font-medium"
                      value={pnf}
                      onChangeText={setPnf}
                    />
                  </View>
                )}
              </View>
            )}

            {modoAccion === "SALIDA" && !nombres && (
              <View className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-200 items-center border-dashed mt-4">
                <View className="bg-white p-4 rounded-full shadow-sm mb-3">
                  <Ionicons name="scan" size={40} color="#94a3b8" />
                </View>
                <Text className="text-slate-500 text-center font-bold">
                  Escanea la Placa o Carnet{"\n"}para registrar salida
                </Text>
              </View>
            )}

            <View className="flex-row justify-between space-x-3 mt-6 pt-6 border-t border-slate-100">
              {modoAccion === "ENTRADA" ? (
                <TouchableOpacity
                  className="flex-[2] bg-emerald-500 py-4 rounded-2xl shadow-sm flex-row justify-center items-center active:bg-emerald-600"
                  onPress={handleRegistrarEntrada}
                >
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text className="text-white font-black text-sm tracking-wide ml-2 uppercase">
                    Dar Acceso
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-[2] bg-rose-500 py-4 rounded-2xl shadow-sm flex-row justify-center items-center active:bg-rose-600"
                  onPress={handleRegistrarSalida}
                >
                  <Ionicons name="exit" size={22} color="white" />
                  <Text className="text-white font-black text-sm tracking-wide ml-2 uppercase">
                    Dar Salida
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-1 bg-slate-900 py-4 rounded-2xl shadow-sm justify-center items-center active:bg-slate-800"
                onPress={() => abrirCamara("OCR")}
              >
                <Ionicons name="camera" size={22} color="#38bdf8" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-cyan-600 py-4 rounded-2xl shadow-sm justify-center items-center active:bg-cyan-700"
                onPress={() => abrirCamara("QR")}
              >
                <MaterialCommunityIcons
                  name="barcode-scan"
                  size={22}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= MODAL CÁMARA (Lector de Placas y QR) ================= */}
      <Modal visible={tipoEscaneo !== "NONE"} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            ref={cameraRef}
            barcodeScannerSettings={
              tipoEscaneo === "QR"
                ? { barcodeTypes: ["qr", "pdf417", "ean13", "code128"] }
                : undefined
            }
            onBarcodeScanned={tipoEscaneo === "QR" ? handleLectorQR : undefined}
          >
            <View className="flex-1 justify-between p-8">
              <TouchableOpacity
                onPress={() => setTipoEscaneo("NONE")}
                className="bg-white/20 self-end p-3 rounded-full mt-10 backdrop-blur-md"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <View className="items-center mb-16">
                {tipoEscaneo === "OCR" ? (
                  <>
                    <View className="border-4 border-cyan-400 w-72 h-36 rounded-2xl mb-6 justify-center items-center bg-black/30 backdrop-blur-sm">
                      <Text className="text-cyan-100 font-black tracking-widest">
                        ALINEAR PLACA AQUÍ
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={capturarYLeerPlacaOCR}
                      disabled={procesandoCamara}
                      className="bg-cyan-500 w-24 h-24 rounded-full justify-center items-center border-4 border-white shadow-xl"
                    >
                      {procesandoCamara ? (
                        <ActivityIndicator color="white" size="large" />
                      ) : (
                        <Ionicons name="camera" size={36} color="white" />
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View className="border-4 border-emerald-400 w-72 h-72 rounded-3xl mb-6 justify-center items-center bg-black/40 border-dashed backdrop-blur-sm">
                      <Ionicons
                        name="id-card"
                        size={80}
                        color="rgba(52, 211, 153, 0.5)"
                      />
                      <Text className="text-emerald-100 font-bold mt-6 text-center tracking-widest">
                        ESCANEANDO QR...
                      </Text>
                    </View>
                    {procesandoCamara && (
                      <ActivityIndicator size="large" color="#34d399" />
                    )}
                  </>
                )}
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
