/**
 * Sistema Integral de Gestión Odontológica - Digital Signature Canvas Component
 * Provides touch and mouse drawing for digital patient consent
 * and doctor authorization under NOM-004-SSA3-2012.
 */

class SignaturePadComponent {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.isDrawing = false;
    this.hasDrawn = false;
    this.strokeColor = options.strokeColor || '#0f172a';
    this.lineWidth = options.lineWidth || 2.2;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    // Set internal resolution matching display
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 480) * dpr;
    this.canvas.height = (rect.height || 180) * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.lineWidth = this.lineWidth;

    // Draw baseline guide
    this.drawBaseline();
  }

  drawBaseline() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 480;
    const h = rect.height || 180;
    this.ctx.save();
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.setLineDash([4, 4]);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(30, h - 35);
    this.ctx.lineTo(w - 30, h - 35);
    this.ctx.stroke();
    this.ctx.restore();
  }

  getPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  bindEvents() {
    const start = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      this.hasDrawn = true;
      const pos = this.getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    };

    const end = (e) => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.ctx.closePath();
      }
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    // Touch events for mobile/tablet in dental chair
    this.canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width || 480, rect.height || 180);
    this.hasDrawn = false;
    this.drawBaseline();
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}

window.SignaturePadComponent = SignaturePadComponent;
