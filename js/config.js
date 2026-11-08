/**
 * Smile and Health - Configuración
 *
 * MODO DEMO LOCAL (por defecto): deja ambos valores vacíos. Los datos se guardan
 * solo en el navegador (localStorage) y no hay inicio de sesión.
 *
 * MODO SERVIDOR (Supabase): pega aquí la URL del proyecto y su clave PUBLISHABLE
 * (Supabase → Settings → API Keys → "Publishable key", empieza con sb_publishable_...).
 * También funciona la clave "anon" (legacy) si tu proyecto todavía la muestra.
 * Estas claves están pensadas para ser públicas; la seguridad real la dan el login y las
 * políticas RLS de supabase/schema.sql.
 *
 * NUNCA pegues aquí la clave "secret" (sb_secret_...) ni la "service_role": esas dan
 * acceso total a la base de datos y se saltan toda la seguridad.
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://dbmbdrvqzfqpbiagefvv.supabase.co',       // Ej. 'https://dbmbdrvqzfqpbiagefvv.supabase.co'
  SUPABASE_KEY: 'sb_publishable_LSQVMCWb0o9ZT8i_lQQJxw_dFNCVlCX'        // Ej. 'sb_publishable_LSQVMCWb0o9ZT8i_lQQJxw_dFNCVlCX'
};
