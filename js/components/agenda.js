/**
 * Smile and Health - Agenda & Appointment Management Component
 * Implements the exact UI prototype from pages 7 & 8 of the UACM document:
 * Date navigation, status filter pills, appointment cards with allergy alerts,
 * WhatsApp reminder integration, and collision-free appointment scheduler.
 */

class AgendaComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentDate = '2026-09-21';
    this.activeFilter = 'todas'; // 'todas', 'en-espera', 'en-atencion', 'confirmada', 'programada', 'completada', 'cancelada'

    this.render();
    this.bindEvents();
  }

  bindEvents() {
    window.dentalStore.subscribe('appointments:updated', () => {
      this.render();
    });
  }

  setDate(dateStr) {
    this.currentDate = dateStr;
    this.render();
  }

  render() {
    const allAppointments = window.dentalStore.getAppointments(this.currentDate);

    // Filter appointments
    let filtered = allAppointments;
    if (this.activeFilter !== 'todas') {
      filtered = allAppointments.filter(a => a.status === this.activeFilter);
    }

    const [year, month, day] = this.currentDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    this.container.innerHTML = `
      <!-- Agenda Top Control Bar -->
      <div class="agenda-top-bar">
        <div class="date-navigator">
          <button class="btn btn-secondary btn-sm" id="btn-prev-day" title="Día anterior">
            ◀
          </button>
          <div class="date-display-box">
            📅 <span id="current-date-text">${formattedDate}</span>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-next-day" title="Día siguiente">
            ▶
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-today">
            Hoy
          </button>
        </div>

        <!-- Top Right Action Buttons -->
        <div style="display: flex; gap: 0.65rem;">
          <button class="btn btn-secondary" id="btn-mass-whatsapp" title="Enviar recordatorios automáticos por WhatsApp">
            📲 Recordatorios (WhatsApp / SMS)
          </button>
          <button class="btn btn-primary" id="btn-open-new-appt-modal">
            ➕ Agendar Cita
          </button>
        </div>
      </div>

      <!-- Status Filter Tabs (Pills) -->
      <div class="status-filter-nav">
        <button class="filter-pill ${this.activeFilter === 'todas' ? 'active' : ''}" data-status="todas">Todas las Citas</button>
        <button class="filter-pill ${this.activeFilter === 'en-espera' ? 'active' : ''}" data-status="en-espera">En Sala de Espera</button>
        <button class="filter-pill ${this.activeFilter === 'en-atencion' ? 'active' : ''}" data-status="en-atencion">En Atención</button>
        <button class="filter-pill ${this.activeFilter === 'confirmada' ? 'active' : ''}" data-status="confirmada">Confirmadas</button>
        <button class="filter-pill ${this.activeFilter === 'programada' ? 'active' : ''}" data-status="programada">Programadas</button>
        <button class="filter-pill ${this.activeFilter === 'completada' ? 'active' : ''}" data-status="completada">Completadas</button>
        <button class="filter-pill ${this.activeFilter === 'cancelada' ? 'active' : ''}" data-status="cancelada">Canceladas</button>
      </div>

      <!-- Appointments List (Cards) -->
      <div class="appointments-grid" id="appointments-cards-container">
        ${filtered.length === 0 ? `
          <div class="card" style="text-align: center; padding: 3rem; color: var(--slate-500);">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
            <h3>No hay citas registradas para este filtro o fecha.</h3>
            <p style="font-size: 0.85rem; margin-top: 0.25rem;">Haz clic en <strong>+ Agendar Cita</strong> para programar una nueva consulta.</p>
          </div>
        ` : filtered.map(appt => this.renderAppointmentCard(appt)).join('')}
      </div>
    `;

    this.attachEvents();
  }

  renderAppointmentCard(appt) {
    const hasAllergies = appt.allergies && appt.allergies.length > 0;
    const allergiesText = hasAllergies ? appt.allergies.join(', ') : 'Ninguna declarada';

    // Status label map
    const statusLabels = {
      'en-espera': { label: '⏳ En Sala de Espera', class: 'badge-warning' },
      'en-atencion': { label: `🦷 En Atención (${appt.chair || 'Sillón 1'})`, class: 'badge-primary' },
      'confirmada': { label: '👍 Confirmada', class: 'badge-info' },
      'programada': { label: '📌 Programada', class: 'badge-slate' },
      'completada': { label: '✅ Completada', class: 'badge-success' },
      'cancelada': { label: '❌ Cancelada', class: 'badge-danger' }
    };

    const statusObj = statusLabels[appt.status] || { label: appt.status, class: 'badge-slate' };

    return `
      <div class="appointment-card status-${appt.status}" data-id="${appt.id}">
        <!-- Left Time Badge -->
        <div class="appt-time-column">
          <span class="appt-time">${appt.time}</span>
          <span class="appt-duration">${appt.durationMin || 60}m</span>
        </div>

        <!-- Middle Details -->
        <div class="appt-details-column">
          <div class="appt-patient-row">
            <span class="appt-patient-name">👤 ${appt.patientName}</span>
            <span class="appt-patient-phone">📞 ${appt.phone || 'S/T'}</span>
            
            ${hasAllergies ? `
              <span class="badge badge-alert-allergy" title="Advertencia Médica Crítica">
                ⚠️ Alergias: ${allergiesText}
              </span>
            ` : ''}

            <span class="badge ${statusObj.class}">${statusObj.label}</span>
          </div>

          <div class="appt-procedure-text">
            <strong>Tratamiento:</strong> ${appt.treatment}
          </div>

          ${appt.notes ? `
            <div style="font-size: 0.8rem; color: var(--slate-500); font-style: italic;">
              💬 Nota: ${appt.notes}
            </div>
          ` : ''}
        </div>

        <!-- Right Action Controls -->
        <div class="appt-actions-column">
          <!-- WhatsApp reminder trigger -->
          <button class="btn btn-secondary btn-sm btn-whatsapp-direct" data-id="${appt.id}" title="Enviar recordatorio de cita a WhatsApp">
            💬 WhatsApp
          </button>

          <!-- Shortcuts -->
          <button class="btn btn-secondary btn-sm btn-goto-evolution" data-patient-id="${appt.patientId}" title="Crear Nota de Evolución (NOM-004)">
            📝 Evolución
          </button>
          <button class="btn btn-secondary btn-sm btn-goto-patient" data-patient-id="${appt.patientId}" title="Ver Expediente Completo">
            📂 Expediente
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // Navigation arrows
    const btnPrev = this.container.querySelector('#btn-prev-day');
    const btnNext = this.container.querySelector('#btn-next-day');
    const btnToday = this.container.querySelector('#btn-today');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() - 1);
        this.setDate(d.toISOString().split('T')[0]);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() + 1);
        this.setDate(d.toISOString().split('T')[0]);
      });
    }

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        this.setDate('2026-09-21'); // Demo anchor date
      });
    }

    // Filter pills
    const pills = this.container.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.dataset.status;
        this.render();
      });
    });

    // New Appointment Modal
    const btnNewAppt = this.container.querySelector('#btn-open-new-appt-modal');
    if (btnNewAppt) {
      btnNewAppt.addEventListener('click', () => {
        this.openNewAppointmentModal();
      });
    }

    // WhatsApp Direct Reminders
    this.container.querySelectorAll('.btn-whatsapp-direct').forEach(btn => {
      btn.addEventListener('click', () => {
        const apptId = btn.dataset.id;
        const appt = window.dentalStore.getAppointments().find(a => a.id === apptId);
        if (appt) {
          const url = window.dentalStore.generateWhatsAppReminderLink(appt);
          window.open(url, '_blank');
          window.dentalApp.showToast(`Enlace de WhatsApp generado para ${appt.patientName}`);
        }
      });
    });

    // Shortcuts to Evolution and Patient Directory
    this.container.querySelectorAll('.btn-goto-evolution').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.patientId;
        window.dentalApp.navigateTo('evolucion');
        window.dentalApp.modules.evolution.setPatient(pid);
      });
    });

    this.container.querySelectorAll('.btn-goto-patient').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.patientId;
        window.dentalApp.navigateTo('pacientes');
        window.dentalApp.modules.patients.openPatientDetail(pid);
      });
    });

    // Mass WhatsApp Reminder trigger
    const btnMass = this.container.querySelector('#btn-mass-whatsapp');
    if (btnMass) {
      btnMass.addEventListener('click', () => {
        const appts = window.dentalStore.getAppointments(this.currentDate);
        if (appts.length === 0) {
          alert('No hay citas en la fecha seleccionada.');
          return;
        }
        const confirmSend = confirm(`¿Deseas generar los recordatorios automáticos de WhatsApp para las ${appts.length} citas del día?`);
        if (confirmSend) {
          window.dentalApp.showToast(`Se han programado ${appts.length} recordatorios automáticos.`);
          window.dentalStore.logAudit(`Envío masivo de recordatorios de citas para la fecha ${this.currentDate}`, 'Notificaciones / WhatsApp');
        }
      });
    }
  }

  openNewAppointmentModal() {
    const patients = window.dentalStore.getPatients();
    const doctors = window.dentalStore.data.doctors || [];
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));

    const modalHtml = `
      <div class="modal-overlay open" id="new-appt-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🗓️ Agendar Nueva Cita</h3>
            <button type="button" class="btn-close-modal" id="btn-close-new-appt">&times;</button>
          </div>
          <div class="modal-body">
            <form id="form-new-appointment">
              <div class="form-group">
                <label for="modal-appt-search">Buscar paciente existente:</label>
                <input type="search" class="form-control" id="modal-appt-search"
                  placeholder="Escribe nombre, teléfono o expediente..." autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="modal-appt-patient">Seleccionar paciente:</label>
                <select class="form-control" id="modal-appt-patient">
                  <option value="">-- Selecciona un paciente --</option>
                  ${patients.map(p => `<option value="${esc(p.id)}">${esc(p.fullName)} (${esc(p.phone || 'Sin teléfono')}) · ${esc(p.recordNumber || '')}</option>`).join('')}
                </select>
                <small id="modal-appt-patient-count" style="color:var(--slate-500)">${patients.length} paciente(s) registrado(s)</small>
              </div>

              <div style="display:flex;align-items:center;gap:.75rem;margin:.75rem 0">
                <span style="height:1px;background:var(--slate-200);flex:1"></span>
                <span style="font-size:.8rem;color:var(--slate-500)">O registra uno nuevo</span>
                <span style="height:1px;background:var(--slate-200);flex:1"></span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-toggle-inline-patient">＋ Nuevo paciente</button>
              <section id="inline-new-patient" hidden style="margin-top:1rem;padding:1rem;border:1px solid var(--slate-200);border-radius:10px">
                <div class="form-group">
                  <label for="inline-patient-name">Nombre completo *</label>
                  <input type="text" class="form-control" id="inline-patient-name" maxlength="160" placeholder="Nombre y apellidos" />
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="inline-patient-phone">Teléfono *</label>
                    <input type="tel" class="form-control" id="inline-patient-phone" maxlength="25" placeholder="55 1234 5678" />
                  </div>
                  <div class="form-group">
                    <label for="inline-patient-email">Correo electrónico</label>
                    <input type="email" class="form-control" id="inline-patient-email" maxlength="160" placeholder="correo@ejemplo.com" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="inline-patient-birth">Fecha de nacimiento</label>
                  <input type="date" class="form-control" id="inline-patient-birth" />
                </div>
                <button type="button" class="btn btn-primary btn-sm" id="btn-create-inline-patient">Guardar y seleccionar paciente</button>
                <small style="display:block;margin-top:.5rem;color:var(--slate-500)">El paciente se registrará en el directorio y quedará seleccionado para esta cita.</small>
              </section>

              <div class="form-row-2" style="margin-top:1rem">
                <div class="form-group">
                  <label for="modal-appt-date">Fecha:</label>
                  <input type="date" class="form-control" id="modal-appt-date" value="${esc(this.currentDate)}" required />
                </div>
                <div class="form-group">
                  <label for="modal-appt-time">Hora:</label>
                  <input type="time" class="form-control" id="modal-appt-time" value="10:00" required />
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label for="modal-appt-duration">Duración estimada:</label>
                  <select class="form-control" id="modal-appt-duration">
                    <option value="30">30 minutos</option><option value="45">45 minutos</option>
                    <option value="60" selected>1 hora (60 min)</option>
                    <option value="90">1 hora y media (90 min)</option><option value="120">2 horas (120 min)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="modal-appt-doctor">Odontólogo y sillón:</label>
                  <select class="form-control" id="modal-appt-doctor" ${doctors.length ? '' : 'disabled'}>
                    ${doctors.map(d => `<option value="${esc(d.id)}" data-chair="${esc(d.chair)}">${esc(d.name)} (${esc(d.chair)})</option>`).join('')}
                  </select>
                  ${doctors.length ? '' : '<small style="color:var(--slate-500)">No hay odontólogos configurados.</small>'}
                </div>
              </div>
              <div class="form-group">
                <label for="modal-appt-treatment">Tratamiento o motivo de consulta:</label>
                <input type="text" class="form-control" id="modal-appt-treatment" placeholder="Ej. Profilaxis dental" required />
              </div>
              <div class="form-group">
                <label for="modal-appt-status">Estado inicial:</label>
                <select class="form-control" id="modal-appt-status">
                  <option value="programada" selected>Programada</option>
                  <option value="confirmada">Confirmada</option><option value="en-espera">En sala de espera</option>
                </select>
              </div>
              <div class="form-group">
                <label for="modal-appt-notes">Notas internas o advertencias clínicas:</label>
                <textarea class="form-control" id="modal-appt-notes" rows="2" placeholder="Alergias, indicaciones... "></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-appt">Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-new-appt">Guardar cita</button>
          </div>
        </div>
      </div>`;

    const existing = document.getElementById('new-appt-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('new-appt-modal');
    const $ = (selector) => modal.querySelector(selector);
    const close = () => modal.remove();
    $('#btn-close-new-appt').addEventListener('click', close);
    $('#btn-cancel-appt').addEventListener('click', close);

    // Búsqueda local sobre pacientes ya cargados; no altera los registros.
    $('#modal-appt-search').addEventListener('input', (event) => {
      const query = event.target.value.trim().toLocaleLowerCase('es');
      const select = $('#modal-appt-patient');
      const selected = select.value;
      const matches = patients.filter(p =>
        [p.fullName, p.phone, p.recordNumber].some(v => String(v || '').toLocaleLowerCase('es').includes(query))
      );
      select.innerHTML = '<option value="">-- Selecciona un paciente --</option>' +
        matches.map(p => `<option value="${esc(p.id)}">${esc(p.fullName)} (${esc(p.phone || 'Sin teléfono')}) · ${esc(p.recordNumber || '')}</option>`).join('');
      if (matches.some(p => p.id === selected)) select.value = selected;
      $('#modal-appt-patient-count').textContent = `${matches.length} coincidencia(s) de ${patients.length}`;
    });

    $('#btn-toggle-inline-patient').addEventListener('click', () => {
      const section = $('#inline-new-patient');
      section.hidden = !section.hidden;
      $('#btn-toggle-inline-patient').textContent = section.hidden ? '＋ Nuevo paciente' : '− Ocultar registro';
      if (!section.hidden) $('#inline-patient-name').focus();
    });

    $('#btn-create-inline-patient').addEventListener('click', () => {
      const fullName = $('#inline-patient-name').value.trim().replace(/\s+/g, ' ');
      const phone = $('#inline-patient-phone').value.trim();
      const email = $('#inline-patient-email').value.trim();
      const birthDate = $('#inline-patient-birth').value;
      if (fullName.length < 3) return alert('Escribe el nombre completo del paciente.');
      if (!phone) return alert('El teléfono es obligatorio para registrar al paciente.');
      if (email && !$('#inline-patient-email').checkValidity()) return alert('Escribe un correo electrónico válido.');

      // Evita duplicados evidentes por nombre y teléfono.
      const duplicate = window.dentalStore.getPatients().find(p =>
        String(p.fullName || '').trim().toLocaleLowerCase('es') === fullName.toLocaleLowerCase('es') &&
        String(p.phone || '').replace(/\D/g, '') === phone.replace(/\D/g, '')
      );
      if (duplicate) {
        $('#modal-appt-patient').innerHTML = '<option value="">-- Selecciona un paciente --</option>' +
          window.dentalStore.getPatients().map(p => `<option value="${esc(p.id)}">${esc(p.fullName)} (${esc(p.phone || 'Sin teléfono')})</option>`).join('');
        $('#modal-appt-patient').value = duplicate.id;
        $('#inline-new-patient').hidden = true;
        $('#btn-toggle-inline-patient').textContent = '＋ Nuevo paciente';
        window.dentalApp.showToast('El paciente ya estaba registrado; se seleccionó el existente.');
        return;
      }

      try {
        const patient = window.dentalStore.addPatient({
          fullName, phone, email, birthDate,
          allergies: [], medicalConditions: [], currentMedications: [],
          address: '', bloodType: '', emergencyContact: '',
          notes: 'Registro creado desde el formulario de agenda.'
        });
        const updatedPatients = window.dentalStore.getPatients();
        $('#modal-appt-patient').innerHTML = '<option value="">-- Selecciona un paciente --</option>' +
          updatedPatients.map(p => `<option value="${esc(p.id)}">${esc(p.fullName)} (${esc(p.phone || 'Sin teléfono')}) · ${esc(p.recordNumber || '')}</option>`).join('');
        $('#modal-appt-patient').value = patient.id;
        $('#modal-appt-search').value = '';
        $('#modal-appt-patient-count').textContent = `${updatedPatients.length} paciente(s) registrado(s)`;
        $('#inline-new-patient').hidden = true;
        $('#btn-toggle-inline-patient').textContent = '＋ Nuevo paciente';
        window.dentalApp.showToast(`Paciente ${patient.fullName} registrado y seleccionado.`);
      } catch (err) {
        alert(`No se pudo registrar el paciente: ${err.message}`);
      }
    });

    $('#btn-save-new-appt').addEventListener('click', () => {
      const patientId = $('#modal-appt-patient').value;
      const patient = patientId ? window.dentalStore.getPatientById(patientId) : null;
      const date = $('#modal-appt-date').value;
      const time = $('#modal-appt-time').value;
      const durationMin = parseInt($('#modal-appt-duration').value, 10);
      const doctorSelect = $('#modal-appt-doctor');
      const doctorId = doctorSelect.value || null;
      const doctorOption = doctorSelect.options[doctorSelect.selectedIndex];
      const doctorName = doctorOption ? doctorOption.text.split('(')[0].trim() : 'Sin asignar';
      const chair = (doctorOption && doctorOption.dataset.chair) || 'Sillón 1';
      const treatment = $('#modal-appt-treatment').value.trim();
      const status = $('#modal-appt-status').value;
      const notes = $('#modal-appt-notes').value.trim();

      if (!patient) return alert('Busca y selecciona un paciente o registra uno nuevo.');
      if (!date || !time) return alert('Selecciona fecha y hora de la cita.');
      if (!treatment) return alert('Indica el tratamiento o motivo de consulta.');

      try {
        window.dentalStore.addAppointment({
          patientId: patient.id,
          patientName: patient.fullName,
          phone: patient.phone || '',
          allergies: patient.allergies || [],
          doctorId, doctorName, chair, date, time, durationMin, treatment, status, notes
        });
        window.dentalApp.showToast(`Cita agendada exitosamente para ${patient.fullName}`);
        close();
        this.setDate(date);
      } catch (err) {
        alert(`Advertencia de Agenda: ${err.message}`);
      }
    });
  }
}

window.AgendaComponent = AgendaComponent;
