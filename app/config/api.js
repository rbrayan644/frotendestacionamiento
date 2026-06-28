// ==========================================
// CONFIGURACIÓN GLOBAL DEL SERVIDOR
// ==========================================

// 🟢 CAMBIA ESTO:
// Pon 'true' para hacer pruebas en tu laptop (Local).
// Pon 'false' para conectar con el servidor en la nube (Vercel / Producción).
const CONFIG_LOCAL = true;

// Escribe aquí la IP de tu PC (la que viste con ipconfig)
const IP_LOCAL = "192.168.123.37";
const PUERTO = "3000";

export const API_URL = CONFIG_LOCAL
  ? `http://${IP_LOCAL}:${PUERTO}/api`
  : "https://sistemaestacionamiento.vercel.app/api";
