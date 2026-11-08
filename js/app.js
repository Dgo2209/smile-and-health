/**
 * Smile and Health - Main Application Controller
 * Orchestrates navigation across clinical & administrative tabs,
 * role-based context, modal dialogs, and toast alerts.
 */

class DentalApp {
  constructor() {
    this.currentView = 'agenda';
    this.modules = {};
    this.init();
  }

  init() {
    this.initModules();
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindPrint();
    this.renderUserChip();
    window.dentalStore.subscribe('user:changed', () => {
      this.renderUserChip();
      this.navigateTo(this.currentView);
    });
    this.navigateTo(this.currentView);
  }

  // Botones "Imprimir" (data-print): evita onclick en línea para poder usar una CSP estricta
  bindPrint() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-print]')) window.print();
    });
  }

  // Usuario activo en la cabecera: sesión real (modo servidor) o selector de rol (demo local)
  renderUserChip() {
    const store = window.dentalStore;
    const u = store.currentUser;
    const host = document.querySelector('.header-actions');
    if (!host) return;

    const nameEl = document.getElementById('header-doctor-name');
    if (nameEl && u.displayName) nameEl.textContent = u.displayName;

    let chip = document.getElementById('user-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'user-chip';
      chip.className = 'user-chip';
      host.appendChild(chip);
    }

    if (store.mode === 'remote') {
      chip.innerHTML = `
        <div class="user-chip-info"><strong id="chip-name"></strong><span id="chip-role"></span></div>
        <button class="btn btn-secondary btn-sm" id="btn-sync" title="Recargar los datos desde el servidor">🔄 Sincronizar</button>
        <button class="btn btn-secondary btn-sm" id="btn-logout">Cerrar sesión</button>
      `;
      chip.querySelector('#chip-name').textContent = u.displayName;
      chip.querySelector('#chip-role').textContent = u.roleTitle;

      chip.querySelector('#btn-logout').addEventListener('click', () => window.AuthUI.logout());
      chip.querySelector('#btn-sync').addEventListener('click', async () => {
        try {
          await store.remote.queue;
          await store.loadRemoteData();
          this.navigateTo(this.currentView);
          this.showToast('Datos sincronizados con el servidor.');
        } catch (err) {
          this.showToast('⚠️ No se pudo sincronizar: ' + (err.message || 'error de red'), 6000);
        }
      });
    } else {
      chip.innerHTML = `
        <label class="user-chip-demo" for="role-switcher">Modo demo · Rol:</label>
        <select class="form-control" id="role-switcher" style="width:auto;">
          <option value="odontologo">Odontólogo</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="admin">Administrador</option>
        </select>
      `;
      const sel = chip.querySelector('#role-switcher');
      sel.value = u.role;
      sel.addEventListener('change', (e) => store.setCurrentRole(e.target.value));
    }
  }

  initModules() {
    const views = {
      agenda: document.getElementById('view-agenda'),
      pacientes: document.getElementById('view-pacientes'),
      odontograma: document.getElementById('view-odontograma'),
      evolucion: document.getElementById('view-evolucion'),
      consentimientos: document.getElementById('view-consentimientos')
    };

    if (views.agenda) this.modules.agenda = new window.AgendaComponent(views.agenda);
    if (views.pacientes) this.modules.patients = new window.PatientsComponent(views.pacientes);
    if (views.odontograma) this.modules.odontogram = new window.OdontogramComponent(views.odontograma);
    if (views.evolucion) this.modules.evolution = new window.EvolutionNotesComponent(views.evolucion);
    if (views.consentimientos) this.modules.consents = new window.ConsentsComponent(views.consentimientos);
  }

  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = tab.dataset.view;
        this.navigateTo(targetView);
      });
    });
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update active tab in header bar
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    // Update active section in DOM
    document.querySelectorAll('.module-view').forEach(viewEl => {
      viewEl.classList.remove('active');
    });

    const activeEl = document.getElementById(`view-${viewName}`);
    if (activeEl) {
      activeEl.classList.add('active');
      // Trigger component refresh if needed
      if (this.modules[viewName] && typeof this.modules[viewName].render === 'function') {
        this.modules[viewName].render();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindHeaderActions() {
    // Quick "+ Nueva Cita" button
    const btnQuickAppt = document.getElementById('btn-header-new-appt');
    if (btnQuickAppt) {
      btnQuickAppt.addEventListener('click', () => {
        this.navigateTo('agenda');
        if (this.modules.agenda) {
          this.modules.agenda.openNewAppointmentModal();
        }
      });
    }

    // Quick "+ Nuevo Paciente" button
    const btnQuickPat = document.getElementById('btn-header-new-patient');
    if (btnQuickPat) {
      btnQuickPat.addEventListener('click', () => {
        this.navigateTo('pacientes');
        if (this.modules.patients) {
          this.modules.patients.openNewPatientModal();
        }
      });
    }
  }

  showToast(message, duration = 3200) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = document.createElement('span');
    icon.textContent = '🦷';
    const text = document.createElement('span');
    text.textContent = message; // textContent: un nombre con HTML no puede inyectar código
    toast.append(icon, ' ', text);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

// Start Application upon DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  // Modo servidor: no se inicia la app hasta que haya sesión válida y datos cargados.
  if (window.dentalStore.mode === 'remote') {
    const ready = await window.AuthUI.ensureSession();
    if (!ready) return;
  }
  window.dentalApp = new DentalApp();
});
