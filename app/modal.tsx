import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

/**
 * ModalScreen
 * * Esta es una pantalla de tipo Modal (una ventana que aparece flotando
 * sobre la pantalla anterior en lugar de reemplazarla por completo).
 * Es un archivo netamente visual y no requiere conexión a la base de datos (API).
 */
export default function ModalScreen() {
  return (
    // ThemedView es un contenedor que se adapta al modo claro/oscuro
    <ThemedView style={styles.container}>
      {/* Título principal del modal */}
      <ThemedText type="title">This is a modal</ThemedText>

      {/* Link de Expo Router: 
        href="/" -> Te lleva a la ruta principal (Home)
        dismissTo -> Cierra el modal actual de forma animada 
      */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

// ==========================================
// HOJA DE ESTILOS (DISEÑO)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa todo el espacio disponible
    alignItems: "center", // Centra el contenido horizontalmente
    justifyContent: "center", // Centra el contenido verticalmente
    padding: 20, // Margen interno
  },
  link: {
    marginTop: 15, // Separación con el título de arriba
    paddingVertical: 15, // Área táctil más grande para el enlace
  },
});
