import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
// Cambiamos la importación aquí para evitar el error de deprecación
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";

interface Props {
  datos: any[];
  nombreUsuario: string;
  tipoReporte: string;
}

export default function GeneradorPDF({
  datos,
  nombreUsuario,
  tipoReporte,
}: Props) {
  const [generando, setGenerando] = useState(false);

  const generarHTML = (logoBase64: string) => {
    const filasTabla = datos
      .map((item, index) => {
        const placa = item.accion || "N/A";
        const detalle = item.usuario || "Sin detalle";
        const estado = item.estado || "COMPLETADO";
        const fechaRaw = item.horaEntrada || item.fecha || item.createdAt;
        const fecha = fechaRaw ? new Date(fechaRaw).toLocaleString() : "N/A";

        return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${placa}</strong></td>
          <td>${detalle}</td>
          <td><span class="badge ${estado === "SALIO" || estado === "INCIDENCIA" ? "badge-alert" : ""}">${estado}</span></td>
          <td>${fecha}</td>
        </tr>
      `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; padding: 0; margin: 0; }
          .contenedor { padding: 40px; }
          .cinta-bandera { display: flex; height: 6px; width: 100%; }
          .cinta-amarilla { flex: 1; background-color: #facc15; }
          .cinta-azul { flex: 1; background-color: #0284c7; }
          .cinta-roja { flex: 1; background-color: #e11d48; }
          .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 2px solid #f1f5f9; margin-bottom: 30px; }
          .header-izq { flex: 2; }
          .gov-title-small { font-size: 10px; color: #64748b; text-transform: uppercase; margin: 0; }
          .gov-title-main { font-size: 13px; color: #0f172a; font-weight: 900; line-height: 1.2; margin: 4px 0 0 0; }
          .uni-name { color: #0369a1; font-size: 11px; margin-top: 2px; font-weight: 700; }
          .header-der { flex: 1; text-align: right; }
          .logo-instituto { height: 75px; width: auto; object-fit: contain; }
          .titulo-contenedor { text-align: center; margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
          .titulo { color: #0f172a; font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitulo { font-size: 12px; color: #64748b; margin: 5px 0 0 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 20px; }
          th { background-color: #0f172a; color: #ffffff; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .badge { background-color: #e0f2fe; color: #0369a1; padding: 3px 6px; border-radius: 4px; font-weight: bold; }
          .badge-alert { background-color: #fee2e2; color: #b91c1c; }
          .firma-box { margin-top: 60px; width: 220px; border-top: 1px solid #1e293b; text-align: center; padding-top: 8px; margin-left: auto; margin-right: auto; }
        </style>
      </head>
      <body>
        <div class="cinta-bandera">
          <div class="cinta-amarilla"></div>
          <div class="cinta-azul"></div>
          <div class="cinta-roja"></div>
        </div>
        <div class="contenedor">
          <div class="header">
            <div class="header-izq">
              <p class="gov-title-small">República Bolivariana de Venezuela</p>
              <p class="gov-title-main">Ministerio del Poder Popular para la<br>Educación Universitaria</p>
              <p class="uni-name">U.P.T. Agroindustrial del Estado Táchira</p>
            </div>
            <div class="header-der">
              <img src="data:image/png;base64,${logoBase64}" class="logo-instituto" alt="logo" />
            </div>
          </div>
          <div class="titulo-contenedor">
            <p class="titulo">${tipoReporte}</p>
            <p class="subtitulo">Responsable: <strong>${nombreUsuario}</strong></p>
            <p class="subtitulo">Fecha de emisión: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Referencia</th>
                <th>Detalle</th>
                <th>Estado</th>
                <th>Fecha / Hora</th>
              </tr>
            </thead>
            <tbody>
              ${filasTabla}
            </tbody>
          </table>
          <div class="firma-box">
            <strong>${nombreUsuario.toUpperCase()}</strong><br>
            Sello y Firma
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const crearYCompartirPDF = async () => {
    if (datos.length === 0)
      return Alert.alert("Error", "No hay datos para generar el reporte.");
    setGenerando(true);

    try {
      // 1. Cargar el asset correctamente
      const asset = Asset.fromModule(require("../assets/logo.png"));
      await asset.downloadAsync();

      // Buscamos la ruta local generada por Expo
      const uri = asset.localUri || asset.uri;

      if (!uri) {
        throw new Error("No se pudo localizar la ruta del logo.");
      }

      // 2. Leer a Base64 usando la API de legado para mantener compatibilidad
      const logoBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // 3. Generar y compartir PDF
      const html = generarHTML(logoBase64);
      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir Reporte Oficial",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error PDF:", error);
      Alert.alert(
        "Error",
        "Hubo un problema al generar el PDF. Verifica que el archivo existe en 'app/assets/logo.png'.",
      );
    } finally {
      setGenerando(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={crearYCompartirPDF}
      disabled={generando}
      className="bg-slate-900 flex-row items-center justify-center px-5 py-4 rounded-2xl shadow-lg active:bg-slate-800"
    >
      {generando ? (
        <ActivityIndicator color="#38bdf8" />
      ) : (
        <>
          <Ionicons name="document-text" size={20} color="#38bdf8" />
          <Text className="text-white font-black ml-3 uppercase text-xs tracking-widest">
            Generar Reporte Oficial
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
