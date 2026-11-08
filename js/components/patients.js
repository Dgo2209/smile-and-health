/**
 * Smile and Health - Patients Directory & Medical Profiles Component
 * Manages patient files, search filters, allergy alerts, emergency contacts,
 * and quick routing to clinical modules (odontogram, notes, consents, billing).
 */

class PatientsComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.searchTerm = '';
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    window.dentalStore.subscribe('patients:updated', () => {
      this.render();
    });
  }

  render() {
    const patients = window.dentalStore.getPatients();
    const filtered = patients.filter(p => {
      const q = this.searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.recordNumber.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    });

    this.container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-600);"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Directorio de Pacientes y Expedientes Clínicos
          </h2>
          <p>Consulta historias clínicas, antecedentes de salud, alergias y contactos de emergencia.</p>
        </div>
        <div>
          <button class="btn btn-primary" id="btn-open-new-patient">
            ➕ Nuevo Paciente
          </button>
        </div>
      </div>

      <!-- Search and Filter Bar -->
      <div class="card" style="padding: 0.85rem 1.25rem; margin-bottom: 1.25rem;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <span style="font-size: 1.2rem;">🔍</span>
          <input 
            type="text" 
            class="form-control" 
            id="search-patients-input" 
            placeholder="Buscar paciente por nombre, teléfono, correo o número de expediente (ej. Gómez, 55-3294, EXP-2026)..." 
            value="${this.searchTerm}" 
          />
        </div>
      </div>

      <!-- Patient Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem;" id="patients-list-grid">
        ${filtered.length === 0 ? `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--slate-500);">
            <h3>No se encontraron pacientes que coincidan con la búsqueda.</h3>
          </div>
        ` : filtered.map(patient => this.renderPatientCard(patient)).join('')}
      </div>
    `;

    this.attachEvents();
  }

  renderPatientCard(patient) {
    const hasAllergies = patient.allergies && patient.allergies.length > 0;
    const allergiesStr = hasAllergies ? patient.allergies.join(', ') : 'Ninguna';

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="badge badge-primary" style="font-weight: 800; font-size: 0.72rem;">${patient.recordNumber}</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--slate-900); margin-top: 0.35rem;">
                ${patient.fullName}
              </h3>
            </div>
            <span class="badge badge-success">${patient.status || 'Activo'}</span>
          </div>

          <div style="font-size: 0.84rem; color: var(--slate-600); display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem;">
            <div>📞 <strong>Tel:</strong> ${patient.phone}</div>
            <div>✉️ <strong>Email:</strong> ${patient.email || 'No registrado'}</div>
            <div>🎂 <strong>Nacimiento:</strong> ${patient.birthDate} (Tipo de sangre: ${patient.bloodType || 'S/D'})</div>
            <div>📍 <strong>Domicilio:</strong> ${patient.address || 'No registrado'}</div>
          </div>

          <!-- Medical Alerts -->
          <div style="margin-bottom: 1rem;">
            ${hasAllergies ? `
              <div class="badge badge-alert-allergy" style="display: flex; width: 100%; justify-content: center; padding: 0.4rem; font-size: 0.78rem;">
                ⚠️ ALERGIAS: ${allergiesStr}
              </div>
            ` : `
              <div class="badge badge-slate" style="display: block; width: 100%; text-align: center; padding: 0.3rem; font-size: 0.75rem;">
                Sin alergias conocidas
              </div>
            `}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="border-top: 1px solid var(--slate-100); padding-top: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <button class="btn btn-secondary btn-sm btn-action-odonto" data-id="${patient.id}" title="Abrir Odontograma FDI">
            🦷 Odontograma
          </button>
          <button class="btn btn-secondary btn-sm btn-action-notes" data-id="${patient.id}" title="Ver Notas de Evolución">
            📝 Notas
          </button>
          <button class="btn btn-secondary btn-sm btn-action-consents" data-id="${patient.id}" title="Consentimientos">
            ✍️ Consentimiento
          </button>
          <button class="btn btn-primary btn-sm btn-action-detail" data-id="${patient.id}" title="Ficha Completa">
            📂 Ver Ficha
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const searchInput = this.container.querySelector('#search-patients-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        const grid = this.container.querySelector('#patients-list-grid');
        const patients = window.dentalStore.getPatients();
        const filtered = patients.filter(p => {
          const q = this.searchTerm.toLowerCase();
          return (
            p.fullName.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q) ||
            p.recordNumber.toLowerCase().includes(q) ||
            (p.email && p.email.toLowerCase().includes(q))
          );
        });
        grid.innerHTML = filtered.length === 0 ? `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--slate-500);">
            <h3>No se encontraron pacientes que coincidan con la búsqueda.</h3>
          </div>
        ` : filtered.map(patient => this.renderPatientCard(patient)).join('');
        this.attachCardActions();
      });
    }

    const btnNew = this.container.querySelector('#btn-open-new-patient');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        this.openNewPatientModal();
      });
    }

    this.attachCardActions();
  }

  attachCardActions() {
    this.container.querySelectorAll('.btn-action-odonto').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.id;
        window.dentalApp.navigateTo('odontograma');
        window.dentalApp.modules.odontogram.setPatient(pid);
      });
    });

    this.container.querySelectorAll('.btn-action-notes').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.id;
        window.dentalApp.navigateTo('evolucion');
        window.dentalApp.modules.evolution.setPatient(pid);
      });
    });

    this.container.querySelectorAll('.btn-action-consents').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.id;
        window.dentalApp.navigateTo('consentimientos');
        window.dentalApp.modules.consents.setPatient(pid);
      });
    });

    this.container.querySelectorAll('.btn-action-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.id;
        this.openPatientDetail(pid);
      });
    });
  }

  openPatientDetail(patientId) {
    const p = window.dentalStore.getPatientById(patientId);
    if (!p) return;

    const modalHtml = `
      <div class="modal-overlay open" id="patient-detail-modal">
        <div class="modal-dialog" style="max-width: 650px;">
          <div class="modal-header">
            <h3>👤 Expediente Clínico: ${p.fullName}</h3>
            <button class="btn-close-modal" id="btn-close-detail">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--slate-200);">
              <div>
                <span class="badge badge-primary">${p.recordNumber}</span>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">Fecha de Registro: ${p.registrationDate}</div>
              </div>
              <span class="badge badge-success">${p.status}</span>
            </div>

            <div class="form-row-2">
              <div>
                <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Teléfono Móvil:</label>
                <p style="font-size: 0.9rem; font-weight: 600;">${p.phone}</p>
              </div>
              <div>
                <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Correo Electrónico:</label>
                <p style="font-size: 0.9rem;">${p.email || 'No registrado'}</p>
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 0.75rem;">
              <div>
                <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Fecha de Nacimiento y Género:</label>
                <p style="font-size: 0.9rem;">${p.birthDate} (${p.gender || 'Femenino'})</p>
              </div>
              <div>
                <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Grupo Sanguíneo:</label>
                <p style="font-size: 0.9rem; font-weight: 700;">${p.bloodType || 'O+'}</p>
              </div>
            </div>

            <div style="margin-top: 0.75rem;">
              <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Domicilio Particular:</label>
              <p style="font-size: 0.9rem;">${p.address || 'No registrado'}</p>
            </div>

            <div style="margin-top: 0.75rem;">
              <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Contacto de Emergencia:</label>
              <p style="font-size: 0.9rem; color: var(--slate-700);">${p.emergencyContact || 'No registrado'}</p>
            </div>

            <div style="margin-top: 1rem; background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius: var(--radius-md); padding: 0.75rem;">
              <strong style="color: var(--danger-text); font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                ⚠️ Alergias y Contraindicaciones Clínicas:
              </strong>
              <p style="color: var(--danger-text); font-size: 0.88rem; font-weight: 700; margin-top: 0.25rem;">
                ${p.allergies && p.allergies.length > 0 ? p.allergies.join(', ') : 'Ninguna declarada'}
              </p>
            </div>

            <div style="margin-top: 1rem;">
              <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Observaciones Generales de Manejo Clínico:</label>
              <p style="font-size: 0.88rem; background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--slate-200);">
                ${p.notes || 'Sin observaciones registradas.'}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-close-detail-footer">Cerrar</button>
            <button class="btn btn-primary" id="btn-detail-go-odonto">Ir a Odontograma</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('patient-detail-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('patient-detail-modal');
    const close = () => modal.remove();

    modal.querySelector('#btn-close-detail').addEventListener('click', close);
    modal.querySelector('#btn-close-detail-footer').addEventListener('click', close);
    modal.querySelector('#btn-detail-go-odonto').addEventListener('click', () => {
      close();
      window.dentalApp.navigateTo('odontograma');
      window.dentalApp.modules.odontogram.setPatient(patientId);
    });
  }

  openNewPatientModal() {
    const modalHtml = `
      <div class="modal-overlay open" id="new-patient-modal">
        <div class="modal-dialog" style="max-width: 650px;">
          <div class="modal-header">
            <h3>👤 Registro de Nuevo Paciente</h3>
            <button class="btn-close-modal" id="btn-close-new-patient">&times;</button>
          </div>
          <div class="modal-body">
            <form id="form-new-patient">
              <div class="form-group">
                <label>Nombre Completo (con apellidos):</label>
                <input type="text" class="form-control" id="new-pat-name" placeholder="Ej. Roberto Garza Treviño" required />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Teléfono Celular (WhatsApp):</label>
                  <input type="tel" class="form-control" id="new-pat-phone" placeholder="Ej. 55-1234-5678" required />
                </div>
                <div class="form-group">
                  <label>Correo Electrónico:</label>
                  <input type="email" class="form-control" id="new-pat-email" placeholder="paciente@correo.com" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Fecha de Nacimiento:</label>
                  <input type="date" class="form-control" id="new-pat-dob" value="1995-01-01" required />
                </div>
                <div class="form-group">
                  <label>Grupo Sanguíneo:</label>
                  <select class="form-control" id="new-pat-blood">
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Alergias a Medicamentos o Sustancias (Separadas por comas):</label>
                <input type="text" class="form-control" id="new-pat-allergies" placeholder="Ej. Penicilina, Látex, Sulfitos, Ninguna" />
              </div>

              <div class="form-group">
                <label>Domicilio:</label>
                <input type="text" class="form-control" id="new-pat-address" placeholder="Calle, número, colonia y alcaldía" />
              </div>

              <div class="form-group">
                <label>Contacto de Emergencia:</label>
                <input type="text" class="form-control" id="new-pat-emergency" placeholder="Nombre de familiar y teléfono" />
              </div>

              <div class="form-group">
                <label>Observaciones Clínicas Iniciales:</label>
                <textarea class="form-control" id="new-pat-notes" rows="2" placeholder="Motivo principal de consulta, miedos, condiciones de salud..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-new-pat">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-new-pat">Guardar Expediente</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('new-patient-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('new-patient-modal');
    const close = () => modal.remove();

    modal.querySelector('#btn-close-new-patient').addEventListener('click', close);
    modal.querySelector('#btn-cancel-new-pat').addEventListener('click', close);

    modal.querySelector('#btn-save-new-pat').addEventListener('click', () => {
      const fullName = modal.querySelector('#new-pat-name').value.trim();
      const phone = modal.querySelector('#new-pat-phone').value.trim();
      const email = modal.querySelector('#new-pat-email').value.trim();
      const birthDate = modal.querySelector('#new-pat-dob').value;
      const bloodType = modal.querySelector('#new-pat-blood').value;
      const allergiesRaw = modal.querySelector('#new-pat-allergies').value;
      const address = modal.querySelector('#new-pat-address').value.trim();
      const emergencyContact = modal.querySelector('#new-pat-emergency').value.trim();
      const notes = modal.querySelector('#new-pat-notes').value.trim();

      if (!fullName || !phone) {
        alert('Nombre completo y teléfono son campos obligatorios.');
        return;
      }

      const allergies = allergiesRaw
        ? allergiesRaw.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'ninguna')
        : [];

      const p = window.dentalStore.addPatient({
        fullName,
        phone,
        email,
        birthDate,
        bloodType,
        allergies,
        address,
        emergencyContact,
        notes
      });

      window.dentalApp.showToast(`Paciente ${fullName} registrado con expediente ${p.recordNumber}`);
      close();
    });
  }
}

window.PatientsComponent = PatientsComponent;
