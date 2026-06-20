import { Ionicons } from "@expo/vector-icons";
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

  //  AQUÍ ESTÁ TU ENLACE REAL DE PRODUCCIÓN
  const URL_MEMBRETE =
    "https://sistemaestacionamiento.vercel.app/plantilla.jpg";

  const generarHTML = () => {
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
          
          /* ESTILOS DEL NUEVO MEMBRETE */
          .banner-institucional { 
            width: 100%; 
            height: auto; 
            object-fit: contain; 
            padding: 20px 40px 0 40px; 
            box-sizing: border-box;
          }
          
          .contenedor { padding: 20px 40px 40px 40px; }
          
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
        
        <img src="${URL_MEMBRETE}" class="banner-institucional" alt="Membrete Oficial" />
        
        <div class="contenedor">
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
      // 1. Generamos el PDF temporal usando el HTML (ya tiene la URL inyectada)
      const html = generarHTML();
      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      // 2. CAMBIO DE NOMBRE PERSONALIZADO:
      const tipoLimpio = tipoReporte
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");

      const nombreArchivo = `reporte_uptaiet_${tipoLimpio}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${nombreArchivo}`;

      // 3. Renombramos el archivo moviéndolo a la nueva ruta
      await FileSystem.moveAsync({
        from: pdfUri,
        to: targetUri,
      });

      // 4. Compartimos el archivo con el nombre ya corregido
      await Sharing.shareAsync(targetUri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir Reporte Oficial",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error PDF:", error);
      Alert.alert(
        "Error",
        "Hubo un problema al generar el PDF. Revisa la consola para más detalles.",
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
