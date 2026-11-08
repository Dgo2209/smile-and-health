/**
 * Smile and Health - Capa remota (Supabase) y control de sesión
 *
 * Solo se usa cuando js/config.js tiene SUPABASE_URL y SUPABASE_KEY.
 * Sin configuración, la app funciona en modo demo local y este archivo no hace nada.
 *
 * Diseño: cada tabla guarda el objeto completo de la app en una columna JSONB
 * ("data") más las columnas necesarias para claves, orden y seguridad.
 * Así los componentes existentes siguen funcionando sin cambios.
 */
(function () {
  const SUPABASE_LIB =
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.0/dist/umd/supabase.js';

  class RemoteService {
    constructor(cfg) {
      this.client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
      // Cola: las escrituras se ejecutan una tras otra para respetar el orden
      // (por ejemplo, el paciente se guarda antes que su primera cita).
      this.queue = Promise.resolve();
    }

    enqueue(task) {
      const run = this.queue.then(task);
      this.queue = run.catch(() => {});
      return run;
    }

    // ---------- Sesión ----------
    async signIn(email, password) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    }

    async signOut() {
      await this.client.auth.signOut();
    }

    async getSessionUser() {
      const { data } = await this.client.auth.getSession();
      return data && data.session ? data.session.user : null;
    }

    async getProfile(userId) {
      const { data, error } = await this.client
        .from('profiles')
        .select('full_name, role, license')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error(
          'Tu usuario no tiene perfil asignado. Pide al administrador que lo cree en la tabla profiles.'
        );
      }
      return data;
    }

    // ---------- Lectura ----------
    async loadAll() {
      const c = this.client;
      const [pat, apt, odo, evo, con, aud] = await Promise.all([
        c.from('patients').select('id, data').order('created_at', { ascending: true }),
        c.from('appointments').select('id, data'),
        c.from('odontograms').select('patient_id, data'),
        c.from('evolution_notes').select('id, data, integrity_hash').order('created_at', { ascending: false }),
        c.from('signed_consents').select('id, data').order('created_at', { ascending: false }),
        c.from('audit_logs').select('id, data').order('created_at', { ascending: false }).limit(200)
      ]);
      [pat, apt, odo, evo, con, aud].forEach((r) => {
        if (r.error) throw r.error;
      });
      return {
        patients: pat.data.map((r) => r.data),
        appointments: apt.data.map((r) => r.data),
        odontograms: odo.data,
        evolutionNotes: evo.data.map((r) => ({ ...r.data, integrityHash: r.integrity_hash })),
        signedConsents: con.data.map((r) => r.data),
        auditLogs: aud.data.map((r) => r.data)
      };
    }

    // ---------- Escritura ----------
    insert(table, row) {
      return this.enqueue(async () => {
        const { error } = await this.client.from(table).insert(row);
        if (error) throw error;
      });
    }

    insertReturning(table, row) {
      return this.enqueue(async () => {
        const { data, error } = await this.client.from(table).insert(row).select().single();
        if (error) throw error;
        return data;
      });
    }

    update(table, id, values) {
      return this.enqueue(async () => {
        const { error } = await this.client.from(table).update(values).eq('id', id);
        if (error) throw error;
      });
    }

    upsert(table, row, onConflict) {
      return this.enqueue(async () => {
        const { error } = await this.client.from(table).upsert(row, { onConflict });
        if (error) throw error;
      });
    }
  }

  // ---------- Pantalla de login ----------
  const $ = (id) => document.getElementById(id);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () =>
        reject(new Error('No se pudo cargar la librería de Supabase. Revisa tu conexión a internet.'));
      document.head.appendChild(s);
    });
  }

  function friendlyError(err) {
    const msg = (err && err.message) || 'Error desconocido.';
    if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/failed to fetch|network/i.test(msg)) return 'Sin conexión con el servidor. Revisa tu internet.';
    return msg;
  }

  function showError(text) {
    const box = $('login-error');
    if (!box) return;
    box.textContent = text || '';
    box.hidden = !text;
  }

  const AuthUI = {
    /** Devuelve true cuando hay una sesión válida y los datos ya están cargados. */
    async ensureSession() {
      const overlay = $('login-overlay');
      const store = window.dentalStore;
      overlay.hidden = false;

      try {
        if (!window.supabase) await loadScript(SUPABASE_LIB);
        if (!window.supabase || !window.supabase.createClient) {
          throw new Error('La librería de Supabase no se cargó correctamente.');
        }
        store.remote = new RemoteService(window.APP_CONFIG);
      } catch (err) {
        showError(friendlyError(err));
        $('login-submit').disabled = true;
        return new Promise(() => {}); // sin librería no se puede continuar
      }

      // ¿Ya había una sesión guardada en este navegador?
      try {
        const user = await store.remote.getSessionUser();
        if (user) {
          await store.startRemoteSession(user);
          overlay.hidden = true;
          return true;
        }
      } catch (err) {
        showError(friendlyError(err));
      }

      return new Promise((resolve) => {
        const form = $('login-form');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = $('login-email').value.trim();
          const password = $('login-password').value;
          if (!email || !password) {
            showError('Escribe tu correo y tu contraseña.');
            return;
          }
          const btn = $('login-submit');
          btn.disabled = true;
          btn.textContent = 'Entrando…';
          showError('');
          try {
            const user = await store.remote.signIn(email, password);
            await store.startRemoteSession(user);
            $('login-password').value = '';
            overlay.hidden = true;
            resolve(true);
          } catch (err) {
            await store.remote.signOut().catch(() => {});
            showError(friendlyError(err));
            btn.disabled = false;
            btn.textContent = 'Entrar';
          }
        });
      });
    },

    async logout() {
      try {
        await window.dentalStore.endRemoteSession();
      } finally {
        window.location.reload();
      }
    }
  };

  window.RemoteService = RemoteService;
  window.AuthUI = AuthUI;
})();
