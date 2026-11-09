/**
 * Sistema Integral de Gestión Odontológica - Interactive FDI Odontogram Component
 * Implements ISO 3950 / FDI two-digit numbering system with 5-surface
 * anatomical polygons, clinical color conventions, and treatment mapping.
 */

class OdontogramComponent {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.patientId = options.patientId || 'pac-001';
    this.activeTool = 'caries'; // 'caries', 'restoration', 'planned', 'healthy', 'endo', 'crown', 'extract'
    this.selectedTooth = '36';
    this.dentitionType = 'permanent'; // 'permanent' or 'temporary'

    // Anatomical Tooth names dictionary
    this.toothNames = {
      // Quadrant 1 (Upper Right)
      '18': 'Tercer Molar Superior Derecho',
      '17': 'Segundo Molar Superior Derecho',
      '16': 'Primer Molar Superior Derecho',
      '15': 'Segundo Premolar Superior Derecho',
      '14': 'Primer Premolar Superior Derecho',
      '13': 'Canino Superior Derecho',
      '12': 'Incisivo Lateral Superior Derecho',
      '11': 'Incisivo Central Superior Derecho',
      // Quadrant 2 (Upper Left)
      '21': 'Incisivo Central Superior Izquierdo',
      '22': 'Incisivo Lateral Superior Izquierdo',
      '23': 'Canino Superior Izquierdo',
      '24': 'Primer Premolar Superior Izquierdo',
      '25': 'Segundo Premolar Superior Izquierdo',
      '26': 'Primer Molar Superior Izquierdo',
      '27': 'Segundo Molar Superior Izquierdo',
      '28': 'Tercer Molar Superior Izquierdo',
      // Quadrant 4 (Lower Right)
      '48': 'Tercer Molar Inferior Derecho',
      '47': 'Segundo Molar Inferior Derecho',
      '46': 'Primer Molar Inferior Derecho',
      '45': 'Segundo Premolar Inferior Derecho',
      '44': 'Primer Premolar Inferior Derecho',
      '43': 'Canino Inferior Derecho',
      '42': 'Incisivo Lateral Inferior Derecho',
      '41': 'Incisivo Central Inferior Derecho',
      // Quadrant 3 (Lower Left)
      '31': 'Incisivo Central Inferior Izquierdo',
      '32': 'Incisivo Lateral Inferior Izquierdo',
      '33': 'Canino Inferior Izquierdo',
      '34': 'Primer Premolar Inferior Izquierdo',
      '35': 'Segundo Premolar Inferior Izquierdo',
      '36': 'Primer Molar Inferior Izquierdo',
      '37': 'Segundo Molar Inferior Izquierdo',
      '38': 'Tercer Molar Inferior Izquierdo'
    };

    this.render();
    this.bindGlobalEvents();
  }

  setPatient(patientId) {
    this.patientId = patientId;
    this.render();
  }

  bindGlobalEvents() {
    window.dentalStore.subscribe('odontogram:updated', ({ patientId }) => {
      if (patientId === this.patientId) {
        this.updateView();
      }
    });
    window.dentalStore.subscribe('user:changed', () => {
      this.render();
    });
  }

  render() {
    const patient = window.dentalStore.getPatientById(this.patientId) || { fullName: 'Paciente no seleccionado' };
    const canEdit = window.dentalStore.canUserPerform('edit_odontogram');

    this.container.innerHTML = `
      <div class="odontogram-container">
        <!-- Odontogram Header -->
        <div class="view-header" style="margin-bottom: 1rem;">
          <div class="view-title-group">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-600);"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              Odontograma Clínico Digital (FDI / ISO 3950)
            </h2>
            <p>Paciente activo: <strong style="color: var(--slate-900);">${patient.fullName}</strong> (${patient.recordNumber || 'EXP-001'})</p>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--slate-600);">Dentición:</label>
            <select id="dentition-select" class="form-control" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.82rem;">
              <option value="permanent" ${this.dentitionType === 'permanent' ? 'selected' : ''}>Permanente (Adulto)</option>
              <option value="temporary" ${this.dentitionType === 'temporary' ? 'selected' : ''}>Temporal / Decidua (Infantil)</option>
            </select>
          </div>
        </div>

        ${!canEdit ? `
          <div class="card" style="background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.84rem;">
              <span style="font-size: 1.3rem;">🔒</span>
              <span><strong>Modo Consulta (Rol: ${window.dentalStore.currentUser.displayName}):</strong> El odontograma clínico se encuentra en modo solo lectura para este perfil. Cambie al rol de Odontólogo en la parte superior para registrar o modificar patologías y tratamientos.</span>
            </div>
            <span class="badge badge-warning" style="white-space: nowrap;">Solo Lectura</span>
          </div>
        ` : ''}

        <!-- Clinical Tool Palette -->
        <div class="odontogram-toolbar" style="${!canEdit ? 'opacity: 0.55; pointer-events: none;' : ''}">
          <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500);">Herramienta Activa:</span>
          <div class="tool-selector-group">
            <button class="tool-btn ${this.activeTool === 'caries' ? 'active' : ''}" data-tool="caries">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-caries);"></span>
              Caries (Rojo)
            </button>
            <button class="tool-btn ${this.activeTool === 'restoration' ? 'active' : ''}" data-tool="restoration">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-restored);"></span>
              Obturación / Resina (Azul)
            </button>
            <button class="tool-btn ${this.activeTool === 'planned' ? 'active' : ''}" data-tool="planned">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-planned);"></span>
              Planificado (Verde)
            </button>
            <button class="tool-btn ${this.activeTool === 'healthy' ? 'active' : ''}" data-tool="healthy">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ffffff; border: 1px solid var(--slate-400);"></span>
              Sano / Limpiar
            </button>
            <button class="tool-btn ${this.activeTool === 'endo' ? 'active' : ''}" data-tool="endo">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-endo);"></span>
              Endodoncia
            </button>
            <button class="tool-btn ${this.activeTool === 'crown' ? 'active' : ''}" data-tool="crown">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-crown);"></span>
              Corona / Prótesis
            </button>
            <button class="tool-btn ${this.activeTool === 'extract' ? 'active' : ''}" data-tool="extract">
              <span style="font-weight: 900; color: var(--color-extracted);">✕</span>
              Extracción / Ausente
            </button>
          </div>
        </div>

        <!-- Upper Dental Arch -->
        <div class="arch-wrapper">
          <div class="arch-title">Arcada Superior (Maxilar)</div>
          <div class="teeth-row" id="upper-arch-row">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Lower Dental Arch -->
        <div class="arch-wrapper">
          <div class="arch-title">Arcada Inferior (Mandibular)</div>
          <div class="teeth-row" id="lower-arch-row">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Selected Tooth Diagnostics Panel -->
        <div class="card" style="background: var(--slate-50); border: 1px solid var(--slate-300); margin-top: 1.5rem;" id="tooth-details-panel">
          <!-- Populated by renderToothDetails -->
        </div>
      </div>
    `;

    this.renderTeethRows();
    this.renderToothDetails();
    this.attachDomEvents();
  }

  renderTeethRows() {
    const odontoData = window.dentalStore.getPatientOdontogram(this.patientId);

    // FDI Quadrants
    const q1 = ['18', '17', '16', '15', '14', '13', '12', '11'];
    const q2 = ['21', '22', '23', '24', '25', '26', '27', '28'];
    const q4 = ['48', '47', '46', '45', '44', '43', '42', '41'];
    const q3 = ['31', '32', '33', '34', '35', '36', '37', '38'];

    const upperHtml = `
      ${q1.map(num => this.createToothCardHtml(num, odontoData[num])).join('')}
      <div class="quadrant-divider" title="Línea Media Dental"></div>
      ${q2.map(num => this.createToothCardHtml(num, odontoData[num])).join('')}
    `;

    const lowerHtml = `
      ${q4.map(num => this.createToothCardHtml(num, odontoData[num])).join('')}
      <div class="quadrant-divider" title="Línea Media Dental"></div>
      ${q3.map(num => this.createToothCardHtml(num, odontoData[num])).join('')}
    `;

    const upperRow = this.container.querySelector('#upper-arch-row');
    const lowerRow = this.container.querySelector('#lower-arch-row');
    if (upperRow) upperRow.innerHTML = upperHtml;
    if (lowerRow) lowerRow.innerHTML = lowerHtml;
  }

  createToothCardHtml(toothNum, toothState = {}) {
    const isSelected = this.selectedTooth === toothNum;
    const hasCrown = toothState.crown;
    const hasEndo = toothState.endo;
    const isExtracted = toothState.extracted;

    const faces = toothState.faces || {};
    const topState = faces.vestibular || 'healthy';
    const bottomState = faces.lingual || faces.palatal || 'healthy';
    const leftState = faces.mesial || 'healthy';
    const rightState = faces.distal || 'healthy';
    const centerState = faces.occlusal || 'healthy';

    let extraClasses = [];
    if (isSelected) extraClasses.push('selected');
    if (hasCrown) extraClasses.push('has-crown');
    if (hasEndo) extraClasses.push('has-endo');
    if (isExtracted) extraClasses.push('has-extraction');

    return `
      <div class="tooth-card ${extraClasses.join(' ')}" data-tooth="${toothNum}">
        <span class="tooth-number">${toothNum}</span>
        <svg class="tooth-svg" viewBox="0 0 100 100">
          <!-- Top Surface (Trapezoid) -->
          <polygon class="tooth-face state-${topState}" data-face="vestibular" points="10,10 90,10 70,30 30,30" />
          <!-- Bottom Surface (Trapezoid) -->
          <polygon class="tooth-face state-${bottomState}" data-face="lingual" points="30,70 70,70 90,90 10,90" />
          <!-- Left Surface (Trapezoid) -->
          <polygon class="tooth-face state-${leftState}" data-face="mesial" points="10,10 30,30 30,70 10,90" />
          <!-- Right Surface (Trapezoid) -->
          <polygon class="tooth-face state-${rightState}" data-face="distal" points="70,30 90,10 90,90 70,70" />
          <!-- Center Surface (Occlusal / Incisal) -->
          <polygon class="tooth-face state-${centerState}" data-face="occlusal" points="30,30 70,30 70,70 30,70" />
        </svg>
      </div>
    `;
  }

  renderToothDetails() {
    const panel = this.container.querySelector('#tooth-details-panel');
    if (!panel) return;

    const canEdit = window.dentalStore.canUserPerform('edit_odontogram');
    const odontoData = window.dentalStore.getPatientOdontogram(this.patientId);
    const tooth = odontoData[this.selectedTooth] || {
      faces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', vestibular: 'healthy', lingual: 'healthy' },
      crown: false,
      endo: false,
      extracted: false,
      notes: ''
    };

    const toothName = this.toothNames[this.selectedTooth] || `Pieza ${this.selectedTooth}`;

    panel.innerHTML = `
      <div class="card-header" style="margin-bottom: 0.75rem;">
        <div>
          <h3 style="font-size: 1.1rem; color: var(--slate-900); font-weight: 800;">
            🦷 Detalle Clínico: Pieza ${this.selectedTooth} - ${toothName}
          </h3>
          <span style="font-size: 0.8rem; color: var(--slate-500);">${canEdit ? 'Haz clic sobre las caras del diagrama para cambiar su diagnóstico con la herramienta activa.' : 'Modo consulta habilitado (Solo lectura).'}</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-quick-budget">
            ➕ Agregar a Presupuesto
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Condiciones Especiales:</label>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.35rem;">
            <label style="font-size: 0.84rem; display: flex; align-items: center; gap: 0.5rem; ${canEdit ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.7;'}">
              <input type="checkbox" id="chk-endo" ${tooth.endo ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
              Tratamiento de Conductos (Endodoncia)
            </label>
            <label style="font-size: 0.84rem; display: flex; align-items: center; gap: 0.5rem; ${canEdit ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.7;'}">
              <input type="checkbox" id="chk-crown" ${tooth.crown ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
              Corona / Incrustación Protésica
            </label>
            <label style="font-size: 0.84rem; display: flex; align-items: center; gap: 0.5rem; ${canEdit ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.7;'}">
              <input type="checkbox" id="chk-extract" ${tooth.extracted ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
              Pieza Ausente / Extracción Realizada
            </label>
          </div>
        </div>

        <div style="grid-column: span 2;">
          <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">Notas Clínicas y Diagnóstico de la Pieza:</label>
          <textarea id="tooth-notes-input" class="form-control" rows="2" placeholder="Ejem: Caries grado 2 en fosa distal, sugerida resina estética 3M..." ${!canEdit ? 'disabled' : ''}>${tooth.notes || ''}</textarea>
          ${canEdit ? `
            <button class="btn btn-primary btn-sm" id="btn-save-tooth-notes" style="margin-top: 0.5rem;">Guardar Nota de la Pieza</button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--slate-400); display: block; margin-top: 0.4rem;">🔒 Edición bloqueada para el perfil activo.</span>
          `}
        </div>
      </div>
    `;

    // Bind checkbox triggers
    const chkEndo = panel.querySelector('#chk-endo');
    const chkCrown = panel.querySelector('#chk-crown');
    const chkExtract = panel.querySelector('#chk-extract');
    const btnSaveNotes = panel.querySelector('#btn-save-tooth-notes');
    const btnQuickBudget = panel.querySelector('#btn-quick-budget');

    if (chkEndo) {
      chkEndo.addEventListener('change', (e) => {
        window.dentalStore.updateToothSpecialCondition(this.patientId, this.selectedTooth, 'endo', e.target.checked);
      });
    }

    if (chkCrown) {
      chkCrown.addEventListener('change', (e) => {
        window.dentalStore.updateToothSpecialCondition(this.patientId, this.selectedTooth, 'crown', e.target.checked);
      });
    }

    if (chkExtract) {
      chkExtract.addEventListener('change', (e) => {
        window.dentalStore.updateToothSpecialCondition(this.patientId, this.selectedTooth, 'extracted', e.target.checked);
      });
    }

    if (btnSaveNotes) {
      btnSaveNotes.addEventListener('click', () => {
        const notes = panel.querySelector('#tooth-notes-input').value;
        window.dentalStore.updateToothSpecialCondition(this.patientId, this.selectedTooth, 'notes', notes);
        window.dentalApp.showToast(`Nota guardada para la pieza ${this.selectedTooth}`);
      });
    }

    if (btnQuickBudget) {
      btnQuickBudget.addEventListener('click', () => {
        window.dentalApp.navigateTo('presupuestos');
        window.dentalApp.modules.billing.openNewBudgetForTooth(this.selectedTooth, toothName);
      });
    }
  }

  attachDomEvents() {
    // Tool buttons
    const toolBtns = this.container.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.tool;
      });
    });

    // Tooth cards selection & surface clicks
    this.container.addEventListener('click', (e) => {
      const faceEl = e.target.closest('.tooth-face');
      const toothCard = e.target.closest('.tooth-card');

      if (toothCard) {
        const toothNum = toothCard.dataset.tooth;
        if (this.selectedTooth !== toothNum) {
          this.selectedTooth = toothNum;
          this.renderTeethRows();
          this.renderToothDetails();
        }
      }

      if (faceEl && toothCard) {
        const faceName = faceEl.dataset.face;
        const toothNum = toothCard.dataset.tooth;
        this.handleFaceClick(toothNum, faceName);
      }
    });
  }

  handleFaceClick(toothNum, faceName) {
    if (!window.dentalStore.canUserPerform('edit_odontogram')) {
      window.dentalApp.showToast('Acceso restringido: Solo el Odontólogo puede modificar el diagnóstico de piezas en el odontograma.');
      return;
    }

    if (this.activeTool === 'endo') {
      const current = window.dentalStore.getPatientOdontogram(this.patientId)[toothNum]?.endo;
      window.dentalStore.updateToothSpecialCondition(this.patientId, toothNum, 'endo', !current);
      return;
    }
    if (this.activeTool === 'crown') {
      const current = window.dentalStore.getPatientOdontogram(this.patientId)[toothNum]?.crown;
      window.dentalStore.updateToothSpecialCondition(this.patientId, toothNum, 'crown', !current);
      return;
    }
    if (this.activeTool === 'extract') {
      const current = window.dentalStore.getPatientOdontogram(this.patientId)[toothNum]?.extracted;
      window.dentalStore.updateToothSpecialCondition(this.patientId, toothNum, 'extracted', !current);
      return;
    }

    // Normal surface diagnosis
    window.dentalStore.updateToothFaceState(this.patientId, toothNum, faceName, this.activeTool);
  }

  updateView() {
    this.renderTeethRows();
    this.renderToothDetails();
  }
}

window.OdontogramComponent = OdontogramComponent;
