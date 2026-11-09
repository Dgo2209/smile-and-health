/**
 * Smile and Health - Digital Informed Consents Component
 * Implements legal patient authorization documents with touch/mouse signature
 * and exportable formal certificates for dental procedures.
 */

class ConsentsComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.patientId = 'pac-001';
    this.selectedTemplateKey = 'endodoncia';
    this.signaturePad = null;

    this.render();
    this.bindEvents();
  }

  setPatient(patientId) {
    this.patientId = patientId;
    this.render();
  }

  getAge(birthDate) {
    if (!birthDate) return 'N/D';
    const b = new Date(birthDate);
    if (isNaN(b)) return 'N/D';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age + ' años';
  }

  bindEvents() {
    window.dentalStore.subscribe('consents:updated', () => {
      this.render();
    });
  }

  render() {
    const patient = window.dentalStore.getPatientById(this.patientId) || { fullName: 'Paciente no seleccionado', recordNumber: 'EXP-000' };
    const patients = window.dentalStore.getPatients();
    const templates = window.dentalStore.data.consentTemplates || {};
    const currentTemplate = templates[this.selectedTemplateKey] || { title: 'Consentimiento Odontológico', body: '' };
    const signedHistory = window.dentalStore.getSignedConsents(this.patientId);

    this.container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-600);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Consentimientos Informados y Firma Digital
          </h2>
          <p>Emisión, lectura, firma táctil/electrónica y custodia legal de autorizaciones quirúrgicas y clínicas.</p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <select class="form-control" id="select-consent-patient" style="width: auto; font-weight: 600;">
            ${patients.map(p => `
              <option value="${p.id}" ${p.id === this.patientId ? 'selected' : ''}>
                ${p.fullName} (${p.recordNumber})
              </option>
            `).join('')}
          </select>
          <button class="btn btn-secondary" data-print title="Imprimir documento o guardar como PDF oficial">
            📄 Descargar / Imprimir PDF
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 1.5rem;">
        <!-- Left: Formal Consent Document Container -->
        <div class="consent-doc-container" id="printable-consent-area">
          <div class="doc-watermark-header">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="text-align: left;">
                <h2 style="font-size: 1.4rem; color: var(--primary-800); font-weight: 900; letter-spacing: -0.02em;">
                  🦷 Smile and Health
                </h2>
                <div style="font-size: 0.75rem; color: var(--slate-500);">Clínica Odontológica Especializada | Céd. Sanitaria SSA: 09-015-CDMX</div>
              </div>
              <div style="text-align: right; font-size: 0.78rem; color: var(--slate-600);">
                <div><strong>Expediente:</strong> ${patient.recordNumber}</div>
                <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>

            <!-- Template Selector -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--slate-600);">Tipo de Procedimiento:</span>
              <select class="form-control" id="select-consent-type" style="width: auto; font-weight: 700; font-size: 0.85rem;">
                <option value="endodoncia" ${this.selectedTemplateKey === 'endodoncia' ? 'selected' : ''}>Tratamiento de Conductos (Endodoncia)</option>
                <option value="cirugia" ${this.selectedTemplateKey === 'cirugia' ? 'selected' : ''}>Cirugía Bucal y Exodoncia de Molares</option>
                <option value="protesis" ${this.selectedTemplateKey === 'protesis' ? 'selected' : ''}>Prótesis Fija y Coronas de Zirconia</option>
              </select>
            </div>
          </div>

          <!-- Document Subject & Legal Body -->
          <div style="margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--slate-900); text-align: center; margin-bottom: 0.5rem;">
              ${currentTemplate.title}
            </h3>
            <div style="font-size: 0.82rem; background: var(--slate-50); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--slate-200); margin-bottom: 1rem;">
              <strong>Paciente:</strong> ${patient.fullName} | <strong>Edad:</strong> ${this.getAge(patient.birthDate)} | <strong>Alergias:</strong> ${patient.allergies?.join(', ') || 'Ninguna'}
            </div>
          </div>

          <div class="legal-text-body" style="white-space: pre-line;">
            ${currentTemplate.body}
          </div>

          <!-- Digital Signature Canvas Section -->
          <div style="margin-top: 1.75rem; border-top: 1px solid var(--slate-200); padding-top: 1.25rem;">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--slate-800); text-align: center; margin-bottom: 0.75rem;">
              Firma del Paciente o Representante Legal
            </h4>
            <div class="signature-pad-wrapper">
              <canvas id="patient-signature-canvas" class="signature-canvas" width="480" height="160"></canvas>
              <div class="sig-instructions">
                Traza tu firma aquí con el dedo o puntero del ratón para autorizar el procedimiento.
              </div>
              <div style="margin-top: 0.75rem; display: flex; justify-content: center; gap: 0.75rem;">
                <button class="btn btn-secondary btn-sm" id="btn-clear-signature">
                  🗑️ Limpiar Firma
                </button>
                <button class="btn btn-primary btn-sm" id="btn-save-consent">
                  💾 Guardar y Custodiar Consentimiento
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Custody History & Actions -->
        <div>
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📜 Consentimientos Firmados</h3>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${signedHistory.length === 0 ? `
                <p style="font-size: 0.84rem; color: var(--slate-500); text-align: center; padding: 1.5rem 0;">
                  No hay documentos archivados aún para este paciente.
                </p>
              ` : signedHistory.map(item => `
                <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <strong style="font-size: 0.85rem; color: var(--slate-900); text-transform: capitalize;">
                      ${item.treatmentType} (${item.tooth || 'General'})
                    </strong>
                    <span class="badge badge-success" style="font-size: 0.68rem;">Firmado</span>
                  </div>
                  <div style="font-size: 0.76rem; color: var(--slate-500); margin-bottom: 0.5rem;">
                    📅 ${item.date} | ${item.doctorName}
                  </div>
                  <button class="btn btn-secondary btn-sm" style="width: 100%;" data-print>
                    🖨️ Imprimir / Exportar PDF
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="background: var(--info-bg); border-color: var(--info-border);">
            <h4 style="font-size: 0.85rem; font-weight: 800; color: var(--info-text); margin-bottom: 0.35rem;">
              ℹ️ Validez Jurídica
            </h4>
            <p style="font-size: 0.8rem; color: var(--slate-600); line-height: 1.4;">
              Conforme a la Ley General de Salud y la NOM-004-SSA3-2012, todo procedimiento quirúrgico, anestésico o invasivo requiere consentimiento informado previo debidamente suscrito por el paciente.
            </p>
          </div>
        </div>
      </div>
    `;

    this.initSignaturePad();
    this.attachEvents();
  }

  initSignaturePad() {
    const canvas = this.container.querySelector('#patient-signature-canvas');
    if (canvas && window.SignaturePadComponent) {
      this.signaturePad = new window.SignaturePadComponent(canvas);
    }
  }

  attachEvents() {
    const patSelect = this.container.querySelector('#select-consent-patient');
    if (patSelect) {
      patSelect.addEventListener('change', (e) => {
        this.setPatient(e.target.value);
      });
    }

    const typeSelect = this.container.querySelector('#select-consent-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.selectedTemplateKey = e.target.value;
        this.render();
      });
    }

    const btnClear = this.container.querySelector('#btn-clear-signature');
    if (btnClear && this.signaturePad) {
      btnClear.addEventListener('click', () => {
        this.signaturePad.clear();
      });
    }

    const btnSave = this.container.querySelector('#btn-save-consent');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (!this.signaturePad || this.signaturePad.isEmpty()) {
          alert('Por favor dibuja la firma del paciente en el recuadro antes de guardar.');
          return;
        }

        const sigDataUrl = this.signaturePad.toDataURL();
        const patient = window.dentalStore.getPatientById(this.patientId);

        window.dentalStore.saveSignedConsent({
          patientId: this.patientId,
          patientName: patient.fullName,
          treatmentType: this.selectedTemplateKey,
          tooth: 'Pieza Dental Correspondiente',
          signatureImg: sigDataUrl
        });

        window.dentalApp.showToast('Consentimiento informado firmado y archivado en el expediente.');
        this.render();
      });
    }
  }
}

window.ConsentsComponent = ConsentsComponent;
