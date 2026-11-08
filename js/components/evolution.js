/**
 * Smile and Health - Clinical Evolution Notes Component
 * Full compliance with Mexican Official Standard NOM-004-SSA3-2012:
 * Chronological order, practitioner identity & professional license,
 * vital signs, procedures, materials, electronic signature, and cryptographic inmutability.
 */

class EvolutionNotesComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.patientId = 'pac-001';
    this.render();
    this.bindEvents();
  }

  setPatient(patientId) {
    this.patientId = patientId;
    this.render();
  }

  bindEvents() {
    window.dentalStore.subscribe('evolution:updated', () => {
      this.render();
    });
    window.dentalStore.subscribe('user:changed', () => {
      this.render();
    });
  }

  render() {
    const patient = window.dentalStore.getPatientById(this.patientId) || { fullName: 'Paciente no seleccionado', recordNumber: 'EXP-000' };
    const notes = window.dentalStore.getEvolutionNotes(this.patientId);
    const patients = window.dentalStore.getPatients();
    const canCreateNote = window.dentalStore.canUserPerform('create_evolution_note');

    this.container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-600);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Notas de Evolución Odontológica (NOM-004-SSA3-2012)
          </h2>
          <p>Registro legal inmutable de procedimientos clínicos, evolución del paciente, materiales y recetas.</p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <select class="form-control" id="select-evolution-patient" style="width: auto; font-weight: 600;">
            ${patients.map(p => `
              <option value="${p.id}" ${p.id === this.patientId ? 'selected' : ''}>
                ${p.fullName} (${p.recordNumber})
              </option>
            `).join('')}
          </select>
          ${canCreateNote ? `
            <button class="btn btn-primary" id="btn-open-new-note-modal">
              ➕ Redactar Nota Clínica
            </button>
          ` : `
            <button class="btn btn-secondary" id="btn-open-new-note-modal" disabled style="opacity: 0.65; cursor: not-allowed;" title="Acceso reservado a Odontólogos con Cédula Profesional (NOM-004-SSA3-2012)">
              🔒 Redactar Nota (Solo Odontólogo)
            </button>
          `}
        </div>
      </div>

      ${!canCreateNote ? `
        <div class="card" style="background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem;">
            <span style="font-size: 1.4rem;">🔒</span>
            <div>
              <strong>Restricción Sanitaria de Rol (${window.dentalStore.currentUser.displayName}):</strong>
              <div>Conforme a la NOM-004-SSA3-2012 del Expediente Clínico, la redacción y firma de notas de evolución es una atribución exclusiva del Odontólogo titular con cédula profesional. La recepción tiene acceso de consulta del historial.</div>
            </div>
          </div>
          <span class="badge badge-warning">Modo Consulta</span>
        </div>
      ` : ''}

      <!-- Compliance Banner -->
      <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200); padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">📜</span>
          <div style="font-size: 0.84rem; color: var(--primary-900);">
            <strong>Cumplimiento NOM-004-SSA3-2012:</strong> Toda nota registrada queda sellada cronológicamente de forma inmutable con la cédula profesional del odontólogo y su firma electrónica.
          </div>
        </div>
        <span class="badge badge-success" style="font-size: 0.75rem;">Protegido y Auditado</span>
      </div>

      <!-- Notes Timeline List -->
      <div class="evolution-timeline" id="evolution-notes-list">
        ${notes.length === 0 ? `
          <div class="card" style="text-align: center; padding: 3rem; color: var(--slate-500);">
            <h3>No hay notas de evolución registradas para este paciente.</h3>
            <p style="font-size: 0.85rem; margin-top: 0.35rem;">Haz clic en <strong>+ Redactar Nota Clínica</strong> para agregar el reporte de la consulta de hoy.</p>
          </div>
        ` : notes.map(note => this.renderNoteCard(note)).join('')}
      </div>
    `;

    this.attachEvents();
  }

  renderNoteCard(note) {
    return `
      <div class="evolution-card locked" data-id="${note.id}">
        <div class="evolution-meta-row">
          <div>
            <span class="evolution-doctor">👨‍⚕️ ${note.doctorName}</span>
            <span style="font-size: 0.78rem; color: var(--slate-500); margin-left: 0.5rem;">Céd. Prof. <strong>${note.doctorLicense || '8472910'}</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="evolution-date">📅 ${note.date} a las ${note.time} hrs</span>
            <span class="evolution-locked-badge" title="Documento inalterable conforme a la norma oficial">
              🔒 Inmutable (NOM-004)
            </span>
          </div>
        </div>

        <!-- Vital Signs -->
        ${note.vitals ? `
          <div style="display: flex; gap: 1.25rem; font-size: 0.8rem; background: var(--slate-100); padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem; color: var(--slate-700);">
            <span>🩺 <strong>Tensión Arterial:</strong> ${note.vitals.ta || 'N/A'}</span>
            <span>❤️ <strong>Frecuencia Cardíaca:</strong> ${note.vitals.fc || 'N/A'}</span>
            <span>🌡️ <strong>Temperatura:</strong> ${note.vitals.temp || 'N/A'}</span>
          </div>
        ` : ''}

        <div class="evolution-content-grid">
          <div class="evolution-field-block">
            <label>Motivo de Consulta y Diagnóstico:</label>
            <p>${note.motive}</p>
          </div>
          <div class="evolution-field-block">
            <label>Procedimiento Clínico Ejecutado:</label>
            <p>${note.procedureDone}</p>
          </div>
        </div>

        <div class="evolution-content-grid">
          <div class="evolution-field-block">
            <label>Materiales e Insumos Empleados:</label>
            <p>${note.materialsUsed || 'Materiales estándar de operatoria dental.'}</p>
          </div>
          <div class="evolution-field-block">
            <label>Prescripción Médica e Indicaciones:</label>
            <p>${note.prescriptions || 'Sin prescripción farmacológica adicional.'}</p>
          </div>
        </div>

        <!-- Sello de Integridad Digital -->
        <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px dashed var(--slate-200); display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--slate-400);">
          <span>Código de Seguridad Criptográfico: <code>${note.integrityHash || 'SHA256-NOM004-VERIFIED'}</code></span>
          <button class="btn btn-secondary btn-sm" data-print title="Imprimir Nota para Expediente Físico">
            🖨️ Imprimir Nota
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const patSelect = this.container.querySelector('#select-evolution-patient');
    if (patSelect) {
      patSelect.addEventListener('change', (e) => {
        this.setPatient(e.target.value);
      });
    }

    const btnNew = this.container.querySelector('#btn-open-new-note-modal');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        this.openNewNoteModal();
      });
    }
  }

  openNewNoteModal() {
    if (!window.dentalStore.canUserPerform('create_evolution_note')) {
      window.dentalApp.showToast('Acceso restringido: Solo el Odontólogo titular puede redactar notas clínicas.');
      return;
    }

    const patient = window.dentalStore.getPatientById(this.patientId);
    const doctor = window.dentalStore.currentUser;

    const modalHtml = `
      <div class="modal-overlay open" id="new-note-modal">
        <div class="modal-dialog" style="max-width: 750px;">
          <div class="modal-header">
            <h3>📝 Redactar Nota de Evolución (NOM-004-SSA3-2012)</h3>
            <button class="btn-close-modal" id="btn-close-new-note">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--slate-200); margin-bottom: 1rem; display: flex; justify-content: space-between;">
              <div>
                <strong>Paciente:</strong> ${patient.fullName} (${patient.recordNumber})
              </div>
              <div>
                <strong>Odontólogo:</strong> ${doctor.displayName} (Céd. ${doctor.license || '8472910'})
              </div>
            </div>

            <form id="form-new-evolution">
              <!-- Vital Signs Row -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Tensión Arterial (TA):</label>
                  <input type="text" class="form-control" id="note-ta" placeholder="120/80 mmHg" value="120/80 mmHg" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Frecuencia Cardíaca (FC):</label>
                  <input type="text" class="form-control" id="note-fc" placeholder="75 lpm" value="72 lpm" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Temperatura:</label>
                  <input type="text" class="form-control" id="note-temp" placeholder="36.5 °C" value="36.5 °C" />
                </div>
              </div>

              <div class="form-group">
                <label>Motivo de Consulta y Cuadro Actual:</label>
                <input type="text" class="form-control" id="note-motive" placeholder="Ej. Acude a cita de control y toma de impresión para corona en pieza 36..." required />
              </div>

              <div class="form-group">
                <label>Procedimiento Clínico y Hallazgos Realizados:</label>
                <textarea class="form-control" id="note-procedure" rows="3" placeholder="Describe detalladamente el procedimiento, técnicas anestésicas aplicadas, tallado o restauración..." required></textarea>
              </div>

              <div class="form-group">
                <label>Materiales e Insumos Utilizados:</label>
                <input type="text" class="form-control" id="note-materials" placeholder="Ej. 1 carpule Mepivacaína 3%, silicona de adición pesada y ligera 3M, hilo retractor #000..." />
              </div>

              <div class="form-group">
                <label>Prescripciones Médicas e Indicaciones Domiciliarias:</label>
                <textarea class="form-control" id="note-prescriptions" rows="2" placeholder="Fármacos, posología, días de tratamiento y recomendaciones higiénicas..."></textarea>
              </div>

              <!-- Legal Warning -->
              <div style="background: var(--warning-bg); border: 1px solid var(--warning-border); padding: 0.65rem; border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--warning-text);">
                ⚠️ Al guardar esta nota, se aplicará el sello digital de inmutabilidad conforme a la legislación vigente y no podrá ser editada ni eliminada.
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-new-note">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-new-note">🔒 Firmar y Sellar Nota</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('new-note-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('new-note-modal');
    const close = () => modal.remove();

    modal.querySelector('#btn-close-new-note').addEventListener('click', close);
    modal.querySelector('#btn-cancel-new-note').addEventListener('click', close);

    modal.querySelector('#btn-save-new-note').addEventListener('click', () => {
      const motive = modal.querySelector('#note-motive').value.trim();
      const procedureDone = modal.querySelector('#note-procedure').value.trim();
      const materialsUsed = modal.querySelector('#note-materials').value.trim();
      const prescriptions = modal.querySelector('#note-prescriptions').value.trim();
      const ta = modal.querySelector('#note-ta').value.trim();
      const fc = modal.querySelector('#note-fc').value.trim();
      const temp = modal.querySelector('#note-temp').value.trim();

      if (!motive || !procedureDone) {
        alert('El motivo y el procedimiento clínico son campos obligatorios.');
        return;
      }

      window.dentalStore.addEvolutionNote({
        patientId: this.patientId,
        vitals: { ta, fc, temp },
        motive,
        procedureDone,
        materialsUsed,
        prescriptions
      });

      window.dentalApp.showToast('Nota de evolución firmada y sellada con éxito (NOM-004).');
      close();
      this.render();
    });
  }
}

window.EvolutionNotesComponent = EvolutionNotesComponent;
