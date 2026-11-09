/**
 * Sistema Integral de Gestión Odontológica - Reactive Central Store & Persistence Service
 * Handles state management, persistence, conflict detection and audit logging.
 *
 * Dos modos de persistencia (se decide con js/config.js):
 *  - 'local'  : demo. Datos en localStorage del navegador, sin login.
 *  - 'remote' : Supabase. Datos en PostgreSQL, login obligatorio, roles y
 *               sellado de notas impuestos por el servidor (ver supabase/schema.sql).
 */

class DentalStore {
  constructor() {
    this.STORAGE_KEY = 'Sistema Integral de Gestión Odontológica_V1';
    this.listeners = {};

    const cfg = window.APP_CONFIG || {};
    this.mode = (cfg.SUPABASE_URL && cfg.SUPABASE_KEY) ? 'remote' : 'local';
    this.remote = null;

    this.currentUser = this.mode === 'remote'
      ? { username: '', displayName: '', role: 'none', roleTitle: '', license: '' }
      : {
          username: 'dr.mendoza',
          displayName: 'Dr. Alejandro Mendoza Herrera',
          role: 'odontologo', // 'admin', 'odontologo', 'recepcionista'
          roleTitle: 'Odontólogo Titular (Céd. 8472910)',
          license: '8472910'
        };

    this.init();
  }

  init() {
    if (this.mode === 'remote') {
      // Sin datos hasta iniciar sesión; nada clínico se guarda en el navegador.
      this.data = this.emptyData();
      return;
    }
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading LocalStorage, falling back to seed data:', e);
        this.data = JSON.parse(JSON.stringify(window.DENTAL_DATA));
        this.save();
      }
    } else {
      this.data = JSON.parse(JSON.stringify(window.DENTAL_DATA));
      this.save();
    }
  }

  save() {
    if (this.mode === 'remote') return; // en modo servidor no se guardan datos clínicos en el navegador
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving state to LocalStorage:', e);
    }
  }

  // Event Subscription System
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in subscriber for ${event}:`, err);
        }
      });
    }
  }

  // Audit Logging (NOM-004-SSA3-2012 compliance)
  logAudit(action, entity) {
    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: this.currentUser.username,
      role: this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1),
      action,
      entity
    };
    if (!this.data.auditLogs) this.data.auditLogs = [];
    this.data.auditLogs.unshift(logEntry);
    this._remoteInsert('audit_logs', { id: logEntry.id, data: logEntry });
    this.save();
    this.emit('audit:logged', logEntry);
  }

  // User and Role Management
  setCurrentRole(role) {
    if (this.mode === 'remote') return; // en modo servidor el rol viene del perfil, no se puede cambiar aquí
    this.currentUser.role = role;
    if (role === 'odontologo') {
      this.currentUser.username = 'dr.mendoza';
      this.currentUser.displayName = 'Dr. Alejandro Mendoza Herrera';
      this.currentUser.roleTitle = 'Odontólogo Titular (Céd. 8472910)';
    } else if (role === 'recepcionista') {
      this.currentUser.username = 'patricia.m';
      this.currentUser.displayName = 'Lic. Patricia Morales';
      this.currentUser.roleTitle = 'Recepción y Caja';
    } else {
      this.currentUser.username = 'admin';
      this.currentUser.displayName = 'Administrador General';
      this.currentUser.roleTitle = 'Administrador de Sistema';
    }
    this.logAudit(`Cambio de perfil activo a '${role}' (${this.currentUser.displayName})`, 'Seguridad / Roles');
    this.emit('user:changed', this.currentUser);
  }

  // ---------- Modo servidor (Supabase) ----------
  roleTitleFor(role, license) {
    if (role === 'odontologo') return `Odontólogo Titular${license ? ' (Céd. ' + license + ')' : ''}`;
    if (role === 'recepcionista') return 'Recepción y Caja';
    return 'Administrador de Sistema';
  }

  emptyData() {
    const seed = window.DENTAL_DATA || {};
    const clone = (v) => JSON.parse(JSON.stringify(v || null));
    return {
      // Catálogos estáticos de la app (no son datos de pacientes)
      clinic: clone(seed.clinic),
      doctors: clone(seed.doctors) || [],
      treatmentsCatalog: clone(seed.treatmentsCatalog) || [],
      consentTemplates: clone(seed.consentTemplates) || {},
      // Datos que vienen del servidor
      patients: [],
      appointments: [],
      initialOdontogram: {},
      evolutionNotes: [],
      signedConsents: [],
      auditLogs: []
    };
  }

  newId(prefix) {
    if (this.mode !== 'remote') return prefix + '-' + Date.now();
    const rnd = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    return `${prefix}-${rnd}`;
  }

  async startRemoteSession(authUser) {
    const profile = await this.remote.getProfile(authUser.id);
    this.currentUser = {
      username: authUser.email,
      displayName: profile.full_name || authUser.email,
      role: profile.role,
      license: profile.license || '',
      roleTitle: this.roleTitleFor(profile.role, profile.license)
    };
    await this.loadRemoteData();
    this.logAudit('Sesión iniciada en el sistema', 'Autenticación');
    this.emit('user:changed', this.currentUser);
  }

  async loadRemoteData() {
    const r = await this.remote.loadAll();
    const d = this.emptyData();
    d.patients = r.patients;
    d.appointments = r.appointments;
    d.evolutionNotes = r.evolutionNotes;
    d.signedConsents = r.signedConsents;
    d.auditLogs = r.auditLogs;
    r.odontograms.forEach((o) => { d.initialOdontogram[o.patient_id] = o.data; });
    this.data = d;
    this.emitAllUpdates();
  }

  async endRemoteSession() {
    if (this.remote) {
      this.logAudit('Cierre de sesión', 'Autenticación');
      await this.remote.queue;      // espera a que terminen las escrituras pendientes
      await this.remote.signOut();
    }
    this.data = this.emptyData();
    this.currentUser = { username: '', displayName: '', role: 'none', roleTitle: '', license: '' };
  }

  _syncError(err, extra = '') {
    console.error('Error de sincronización con el servidor:', err);
    const detail = (err && err.message) ? err.message : 'error de red';
    if (window.dentalApp) {
      window.dentalApp.showToast(`⚠️ ${extra} No se pudo guardar en el servidor (${detail}). Pulsa 🔄 Sincronizar.`.replace('  ', ' '), 7000);
    }
  }

  _remoteInsert(table, row) {
    if (this.mode !== 'remote' || !this.remote) return;
    this.remote.insert(table, row).catch((e) => this._syncError(e));
  }

  _remoteUpdate(table, id, values) {
    if (this.mode !== 'remote' || !this.remote) return;
    this.remote.update(table, id, values).catch((e) => this._syncError(e));
  }

  _remoteSaveOdontogram(patientId, odonto) {
    if (this.mode !== 'remote' || !this.remote) return;
    this.remote
      .upsert('odontograms', { patient_id: patientId, data: odonto }, 'patient_id')
      .catch((e) => this._syncError(e));
  }

  // Role & Permission Verification (UACM Architecture & NOM-004 Compliance)
  canUserPerform(permission) {
    const role = this.currentUser.role;
    if (role === 'admin') return true;

    const permissionsByRole = {
      odontologo: [
        'view_agenda', 'create_appointment', 'edit_appointment',
        'view_patients', 'create_patient', 'edit_patient',
        'view_odontogram', 'edit_odontogram',
        'view_evolution', 'create_evolution_note',
        'view_consents', 'sign_consent',
        'view_billing', 'create_budget', 'record_payment',
        'view_inventory', 'adjust_inventory',
        'view_reports'
      ],
      recepcionista: [
        'view_agenda', 'create_appointment', 'edit_appointment',
        'view_patients', 'create_patient', 'edit_patient',
        'view_odontogram', // READ-ONLY: no edit_odontogram
        'view_evolution',  // READ-ONLY: no create_evolution_note
        'view_consents', 'sign_consent',
        'view_billing', 'record_payment', // can record payments and view budgets
        'view_inventory',
        'view_reports'
      ]
    };

    const allowed = permissionsByRole[role] || [];
    return allowed.includes(permission);
  }

  // Patient Operations
  getPatients() {
    return this.data.patients || [];
  }

  getPatientById(id) {
    return this.getPatients().find(p => p.id === id);
  }

  nextRecordNumber() {
    const nums = (this.data.patients || [])
      .map((p) => parseInt(String(p.recordNumber || '').split('-').pop(), 10))
      .filter((n) => !isNaN(n));
    const next = Math.max(83, ...nums) + 1;
    return `EXP-${new Date().getFullYear()}-${String(next).padStart(3, '0')}`;
  }

  addPatient(patientData) {
    const id = this.mode === 'remote'
      ? this.newId('pac')
      : 'pac-' + String(this.data.patients.length + 1).padStart(3, '0');
    const recordNumber = this.nextRecordNumber();
    const newPatient = {
      id,
      recordNumber,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'Activo',
      allergies: patientData.allergies || [],
      medicalConditions: patientData.medicalConditions || [],
      currentMedications: patientData.currentMedications || [],
      ...patientData
    };

    this.data.patients.push(newPatient);
    this._remoteInsert('patients', { id: newPatient.id, data: newPatient });
    this.logAudit(`Alta de nuevo paciente: ${newPatient.fullName} (${recordNumber})`, 'Pacientes');
    this.save();
    this.emit('patients:updated', this.data.patients);
    return newPatient;
  }

  // Appointments Operations
  getAppointments(dateFilter = null) {
    let list = this.data.appointments || [];
    if (dateFilter) {
      list = list.filter(a => a.date === dateFilter);
    }
    // Sort by time
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }

  addAppointment(apptData) {
    // Collision detection check
    const collision = this.checkCollision(apptData.date, apptData.time, apptData.durationMin, apptData.doctorId, apptData.chair);
    if (collision) {
      throw new Error(`Existe una colisión de horario con la cita de ${collision.patientName} a las ${collision.time} en ${collision.chair}.`);
    }

    const newAppt = {
      id: this.newId('apt'),
      reminderSent: false,
      status: 'programada',
      ...apptData
    };

    this.data.appointments.push(newAppt);
    this._remoteInsert('appointments', { id: newAppt.id, patient_id: newAppt.patientId, data: newAppt });
    this.logAudit(`Cita agendada para ${newAppt.patientName} el ${newAppt.date} a las ${newAppt.time}`, 'Agenda');
    this.save();
    this.emit('appointments:updated', this.data.appointments);
    return newAppt;
  }

  updateAppointmentStatus(apptId, newStatus) {
    const appt = this.data.appointments.find(a => a.id === apptId);
    if (appt) {
      const oldStatus = appt.status;
      appt.status = newStatus;
      this._remoteUpdate('appointments', appt.id, { data: appt });
      this.logAudit(`Cambio de estado cita ${appt.patientName}: de '${oldStatus}' a '${newStatus}'`, 'Agenda');
      this.save();
      this.emit('appointments:updated', this.data.appointments);
    }
  }

  checkCollision(date, time, durationMin = 45, doctorId = null, chair = null) {
    const startMins = this.timeToMinutes(time);
    const endMins = startMins + parseInt(durationMin, 10);

    return (this.data.appointments || []).find(a => {
      if (a.date !== date || a.status === 'cancelada') return false;
      // If same chair or same doctor
      const sameResource = (chair && a.chair === chair) || (doctorId && a.doctorId === doctorId);
      if (!sameResource) return false;

      const aStart = this.timeToMinutes(a.time);
      const aEnd = aStart + (a.durationMin || 45);

      // Overlap condition
      return Math.max(startMins, aStart) < Math.min(endMins, aEnd);
    });
  }

  timeToMinutes(t) {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  }

  generateWhatsAppReminderLink(appt) {
    const phoneClean = (appt.phone || '').replace(/\D/g, '');
    const dateFormatted = appt.date.split('-').reverse().join('/');
    const msg = `Hola *${appt.patientName}*, te recordamos tu cita en *Sistema Integral de Gestión Odontológica*:\n\n📅 Fecha: *${dateFormatted}*\n⏰ Hora: *${appt.time} hrs*\n🩺 Tratamiento: *${appt.treatment}*\n👨‍⚕️ Atiende: *${appt.doctorName}* (${appt.chair})\n📍 Dirección: Av. Insurgentes Sur 1450, Col. Actipan, Benito Juárez, CDMX.\n\nPor favor responde este mensaje confirmando tu asistencia. ¡Te esperamos!`;
    return `https://wa.me/52${phoneClean}?text=${encodeURIComponent(msg)}`;
  }

  // Odontogram Operations (FDI / ISO 3950)
  getPatientOdontogram(patientId) {
    if (!this.data.initialOdontogram) this.data.initialOdontogram = {};
    if (!this.data.initialOdontogram[patientId]) {
      this.data.initialOdontogram[patientId] = {};
    }
    return this.data.initialOdontogram[patientId];
  }

  updateToothFaceState(patientId, toothNumber, faceName, state) {
    const odonto = this.getPatientOdontogram(patientId);
    if (!odonto[toothNumber]) {
      odonto[toothNumber] = {
        faces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', vestibular: 'healthy', lingual: 'healthy' },
        crown: false,
        endo: false,
        extracted: false,
        notes: ''
      };
    }
    if (!odonto[toothNumber].faces) {
      odonto[toothNumber].faces = {};
    }

    odonto[toothNumber].faces[faceName] = state;
    this._remoteSaveOdontogram(patientId, odonto);
    this.logAudit(`Odontograma: Pieza ${toothNumber} cara ${faceName} marcada como '${state}'`, 'Expediente Clínico');
    this.save();
    this.emit('odontogram:updated', { patientId, toothNumber, odonto: odonto[toothNumber] });
  }

  updateToothSpecialCondition(patientId, toothNumber, conditionType, value) {
    const odonto = this.getPatientOdontogram(patientId);
    if (!odonto[toothNumber]) {
      odonto[toothNumber] = {
        faces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', vestibular: 'healthy', lingual: 'healthy' },
        crown: false,
        endo: false,
        extracted: false,
        notes: ''
      };
    }
    odonto[toothNumber][conditionType] = value;
    this._remoteSaveOdontogram(patientId, odonto);
    this.logAudit(`Odontograma: Pieza ${toothNumber} condición especial '${conditionType}' = ${value}`, 'Expediente Clínico');
    this.save();
    this.emit('odontogram:updated', { patientId, toothNumber, odonto: odonto[toothNumber] });
  }

  // Evolution Notes Operations (NOM-004-SSA3-2012)
  getEvolutionNotes(patientId) {
    return (this.data.evolutionNotes || []).filter(n => n.patientId === patientId);
  }

  addEvolutionNote(noteData) {
    const remote = this.mode === 'remote';
    // Modo local: hash simulado (demo). Modo servidor: el hash real lo calcula PostgreSQL al sellar.
    const hash = remote
      ? 'Sellando en el servidor…'
      : 'SHA256-NOM004-' + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
    const newNote = {
      id: this.newId('evo'),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      doctorName: this.currentUser.displayName,
      doctorLicense: this.currentUser.license || '8472910',
      isSignedAndLocked: true,
      integrityHash: hash,
      signatureDate: new Date().toISOString(),
      ...noteData
    };

    if (!this.data.evolutionNotes) this.data.evolutionNotes = [];
    this.data.evolutionNotes.unshift(newNote);
    this.logAudit(
      remote
        ? `Nueva Nota de Evolución enviada para sellado (${newNote.id})`
        : `Nueva Nota de Evolución sellada e inmutable (Hash: ${hash})`,
      'Expediente Clínico (NOM-004)'
    );
    this.save();
    this.emit('evolution:updated', this.data.evolutionNotes);
    if (remote) this._sealRemoteNote(newNote);
    return newNote;
  }

  // El servidor fija autor, cédula, fecha y hash; después la nota ya no puede modificarse.
  _sealRemoteNote(note) {
    const { integrityHash, ...clean } = note;
    this.remote
      .insertReturning('evolution_notes', { id: note.id, patient_id: note.patientId, data: clean })
      .then((row) => {
        const i = this.data.evolutionNotes.findIndex((n) => n.id === note.id);
        if (i >= 0) this.data.evolutionNotes[i] = { ...row.data, integrityHash: row.integrity_hash };
        this.logAudit(`Nota ${note.id} sellada por el servidor (Hash: ${row.integrity_hash})`, 'Expediente Clínico (NOM-004)');
        this.emit('evolution:updated', this.data.evolutionNotes);
      })
      .catch((err) => {
        this.data.evolutionNotes = this.data.evolutionNotes.filter((n) => n.id !== note.id);
        this.emit('evolution:updated', this.data.evolutionNotes);
        this._syncError(err, 'La nota NO se guardó.');
      });
  }

  // Informed Consents & Digital Signatures
  getSignedConsents(patientId) {
    return (this.data.signedConsents || []).filter(c => c.patientId === patientId);
  }

  saveSignedConsent(consentData) {
    const newConsent = {
      id: this.newId('con'),
      date: new Date().toISOString().split('T')[0],
      doctorName: this.currentUser.displayName,
      hasSignature: true,
      signatureDate: new Date().toISOString(),
      status: 'Firmado y Custodiado',
      ...consentData
    };

    if (!this.data.signedConsents) this.data.signedConsents = [];
    this.data.signedConsents.unshift(newConsent);
    this._remoteInsert('signed_consents', { id: newConsent.id, patient_id: newConsent.patientId, data: newConsent });
    this.logAudit(`Consentimiento informado firmado digitalmente para ${newConsent.treatmentType} (Pieza: ${newConsent.tooth || 'General'})`, 'Consentimientos');
    this.save();
    this.emit('consents:updated', this.data.signedConsents);
    return newConsent;
  }

  // Audit Logs Getter
  getAuditLogs() {
    return this.data.auditLogs || [];
  }

  // Database Export, Import and Demo Data Reset (UACM Architecture & Data Layer)
  exportDatabase() {
    this.logAudit('Exportación de respaldo general de la base de datos (JSON)', 'Seguridad y Respaldo');
    return JSON.stringify(this.data, null, 2);
  }

  importDatabase(jsonString) {
    if (this.mode === 'remote') {
      return { success: false, error: 'La importación está deshabilitada en modo servidor.' };
    }
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!parsed.patients || !parsed.appointments) {
        throw new Error('Estructura de respaldo no válida. Faltan colecciones de pacientes o citas.');
      }
      this.data = parsed;
      this.save();
      this.logAudit('Restauración exitosa de base de datos desde archivo externo', 'Seguridad y Respaldo');
      this.emitAllUpdates();
      return { success: true };
    } catch (err) {
      console.error('Error importing database:', err);
      return { success: false, error: err.message };
    }
  }

  resetToDefaultDemoData() {
    if (this.mode === 'remote') return; // nunca se borra la base real desde el navegador
    this.data = JSON.parse(JSON.stringify(window.DENTAL_DATA));
    this.save();
    this.logAudit('Restablecimiento completo a datos de demostración iniciales (UACM)', 'Sistema');
    this.emitAllUpdates();
  }

  emitAllUpdates() {
    this.emit('patients:updated', this.data.patients || []);
    this.emit('appointments:updated', this.data.appointments || []);
    this.emit('evolution:updated', this.data.evolutionNotes || []);
    this.emit('consents:updated', this.data.signedConsents || []);
    this.emit('audit:logged', {});
  }
}

// Global Store Instance
window.dentalStore = new DentalStore();
