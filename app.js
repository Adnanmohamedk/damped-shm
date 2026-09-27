/**
 * Damped Harmonic Oscillation Lab
 * Governing Differential Equation: d²x/dt² + 2β(dx/dt) + ω₀²x = 0
 * Standard Physical Balance: m(d²x/dt²) + b(dx/dt) + kx = 0
 * 
 * Regimes:
 * 1. Underdamped: β < ω₀  =>  x(t) = A · e^(-βt) · cos(ωt + φ), ω = √(ω₀² - β²)
 * 2. Critically Damped: β = ω₀  =>  x(t) = (D + Et) · e^(-βt), D = x₀, E = v₀ + βx₀
 * 3. Overdamped: β > ω₀  =>  x(t) = e^(-βt)(A₁·e^(αt) + A₂·e^(-αt)), α = √(β² - ω₀²)
 */

(() => {
  'use strict';

  // --- State Configuration ---
  const state = {
    // Equation parameters
    beta: 0.30,        // Damping constant β = b / (2m) [s⁻¹]
    get gamma() { return this.beta; },
    set gamma(val) { this.beta = val; },
    omega0: 2.00,       // Undamped natural frequency ω₀ = √(k / m) [rad/s]
    A: 4.00,            // Amplitude / initial scale [m]
    phi: 0.00,          // Initial phase angle [rad]

    // Physical parameters
    m: 1.00,            // Mass [kg]
    b: 0.60,            // Damping coefficient b = 2mγ [N·s/m]
    k: 4.00,            // Spring constant k = m·ω₀² [N/m]

    // Initial conditions derived from A and phi (or vice versa)
    x0: 4.00,           // Initial displacement x(0)
    v0: 0.00,           // Initial velocity v(0)

    // Time horizon & simulation
    tMax: 16.0,         // Max time horizon [s]
    currentTime: 0.0,   // Simulation playhead [s]
    isPlaying: true,
    playbackSpeed: 1.0,
    lastFrameTime: performance.now(),

    // View & Display toggles
    activeMode: 'underdamped', // 'underdamped' | 'critical' | 'overdamped'
    viewMode: 'timeDomain',    // 'timeDomain' | 'phaseSpace'
    showEnvelope: true,
    showRestoringForce: true,
    showDampingForce: true,
    showVelocity: false,
    compareAll: false,

    // Mouse Inspection on Graph
    isHoveringGraph: false,
    hoverT: null,
  };

  // --- DOM Elements Cache ---
  const elements = {
    // Mode Buttons
    modeUnder: document.getElementById('modeUnder'),
    modeCritical: document.getElementById('modeCritical'),
    modeOver: document.getElementById('modeOver'),
    regimeBadge: document.getElementById('dampingRegimeBadge'),
    regimeTitle: document.getElementById('regimeTitle'),
    regimeSub: document.getElementById('regimeSub'),

    // Formula displays
    deDisplay: document.getElementById('deDisplay'),
    deNumericDisplay: document.getElementById('deNumericDisplay'),
    solutionDisplay: document.getElementById('solutionDisplay'),
    solutionNumericDisplay: document.getElementById('solutionNumericDisplay'),
    explainTitle: document.getElementById('explainTitle'),
    explainBody: document.getElementById('explainBody'),
    regimeExplanation: document.getElementById('regimeExplanation'),

    // Sliders and Number Inputs
    sliderBeta: document.getElementById('sliderBeta') || document.getElementById('sliderGamma'),
    inputBeta: document.getElementById('inputBeta') || document.getElementById('inputGamma'),
    sliderGamma: document.getElementById('sliderBeta') || document.getElementById('sliderGamma'),
    inputGamma: document.getElementById('inputBeta') || document.getElementById('inputGamma'),
    sliderOmega0: document.getElementById('sliderOmega0'),
    inputOmega0: document.getElementById('inputOmega0'),
    sliderA: document.getElementById('sliderA'),
    inputA: document.getElementById('inputA'),
    sliderPhi: document.getElementById('sliderPhi'),
    inputPhi: document.getElementById('inputPhi'),

    // Physical Sliders
    sliderM: document.getElementById('sliderM'),
    inputM: document.getElementById('inputM'),
    sliderB: document.getElementById('sliderB'),
    inputB: document.getElementById('inputB'),
    sliderK: document.getElementById('sliderK'),
    inputK: document.getElementById('inputK'),

    // View Options & Toggles
    toggleEnvelope: document.getElementById('toggleEnvelope'),
    toggleRestoringForce: document.getElementById('toggleRestoringForce'),
    toggleDampingForce: document.getElementById('toggleDampingForce'),
    toggleVelocity: document.getElementById('toggleVelocity'),
    toggleCompareAll: document.getElementById('toggleCompareAll'),
    sliderTmax: document.getElementById('sliderTmax'),
    inputTmax: document.getElementById('inputTmax'),

    // Buttons
    resetParamsBtn: document.getElementById('resetParamsBtn'),
    snapToCriticalBtn: document.getElementById('snapToCriticalBtn'),
    viewTimeDomain: document.getElementById('viewTimeDomain'),
    viewPhaseSpace: document.getElementById('viewPhaseSpace'),
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

    // Simulation Controls
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    resetSimBtn: document.getElementById('resetSimBtn'),
    timeScrubber: document.getElementById('timeScrubber'),
    simCurrentTimeDisplay: document.getElementById('simCurrentTimeDisplay'),
    simMaxTimeDisplay: document.getElementById('simMaxTimeDisplay'),
    speedBtns: document.querySelectorAll('.speed-btn'),

    // Canvases
    graphCanvas: document.getElementById('graphCanvas'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    simCanvas: document.getElementById('simCanvas'),

    // Tooltip
    graphTooltip: document.getElementById('graphTooltip'),
    ttTime: document.getElementById('ttTime'),
    ttValX: document.getElementById('ttValX'),
    ttValV: document.getElementById('ttValV'),
    ttValFk: document.getElementById('ttValFk'),
    ttValFb: document.getElementById('ttValFb'),

    // Metrics Values
    valZeta: document.getElementById('valZeta'),
    descZeta: document.getElementById('descZeta'),
    valOmega: document.getElementById('valOmega'),
    descOmega: document.getElementById('descOmega'),
    valOmega0: document.getElementById('valOmega0'),
    valPeriod: document.getElementById('valPeriod'),
    valTau: document.getElementById('valTau'),
    descTau: document.getElementById('descTau'),
    valBcrit: document.getElementById('valBcrit'),

    // Legend items
    chartLegend: document.getElementById('chartLegend'),
    legDisplacement: document.getElementById('legDisplacement'),
    legEnvelope: document.getElementById('legEnvelope'),
    legRestoring: document.getElementById('legRestoring'),
    legDamping: document.getElementById('legDamping'),
    legVelocity: document.getElementById('legVelocity'),
    graphMainHeading: document.getElementById('graphMainHeading'),
  };

  const graphCtx = elements.graphCanvas.getContext('2d');
  const simCtx = elements.simCanvas.getContext('2d');

  // --- Physics Mathematical Model ---

  /**
   * Calculates displacement x, velocity v, and acceleration a at time t.
   * Supports specific beta, omega0, A, phi overrides for comparison mode.
   */
  function calculateStateAt(t, params = null) {
    const beta = params ? (params.beta !== undefined ? params.beta : (params.gamma !== undefined ? params.gamma : state.beta)) : state.beta;
    const omega0 = params ? params.omega0 : state.omega0;
    const A = params ? params.A : state.A;
    const phi = params ? params.phi : state.phi;
    const m = params ? params.m : state.m;
    const k = params ? (params.m * omega0 * omega0) : state.k;
    const b = params ? (2 * params.m * beta) : state.b;

    let x = 0;
    let v = 0;
    let envUpper = null;
    let envLower = null;

    const diff = omega0 * omega0 - beta * beta;

    if (diff > 1e-6) {
      // 1. Underdamped (beta < omega0)
      const omega = Math.sqrt(diff);
      const decay = Math.exp(-beta * t);
      const angle = omega * t + phi;
      x = A * decay * Math.cos(angle);
      // v(t) = d/dt [ A e^(-beta t) cos(omega t + phi) ]
      // v(t) = -A e^(-beta t) [ beta cos(angle) + omega sin(angle) ]
      v = -A * decay * (beta * Math.cos(angle) + omega * Math.sin(angle));
      envUpper = Math.abs(A) * decay;
      envLower = -Math.abs(A) * decay;
    } else if (Math.abs(diff) <= 1e-6) {
      // 2. Critically Damped (beta = omega0)
      // Solution: x(t) = (D + Et) · e^(-beta t)
      // Initial conditions at t=0: x(0) = A cos(phi), v(0) = -A(beta cos phi + omega0 sin phi)
      const x0 = A * Math.cos(phi);
      const v0 = -A * (beta * Math.cos(phi) + omega0 * Math.sin(phi));
      const D = x0;
      const E = v0 + beta * x0;
      const decay = Math.exp(-beta * t);
      x = (D + E * t) * decay;
      v = (E - beta * (D + E * t)) * decay;
      envUpper = null;
      envLower = null;
    } else {
      // 3. Overdamped (beta > omega0)
      // Solution in terms of A1, A2, alpha, beta, and angular frequencies (omega0):
      // alpha = sqrt(beta^2 - omega0^2)
      // x(t) = e^(-beta t) · (A1 · e^(alpha t) + A2 · e^(-alpha t))
      //      = A1 · e^((-beta + alpha)t) + A2 · e^((-beta - alpha)t)
      const alpha = Math.sqrt(beta * beta - omega0 * omega0);
      const r1 = -beta + alpha; // roots
      const r2 = -beta - alpha;
      const x0 = A * Math.cos(phi);
      const v0 = -A * (beta * Math.cos(phi) + omega0 * Math.sin(phi));
      // A1 + A2 = x0, r1 * A1 + r2 * A2 = v0
      const A1 = (v0 - r2 * x0) / (2 * alpha);
      const A2 = (r1 * x0 - v0) / (2 * alpha);

      const exp1 = Math.exp(r1 * t);
      const exp2 = Math.exp(r2 * t);
      x = A1 * exp1 + A2 * exp2;
      v = A1 * r1 * exp1 + A2 * r2 * exp2;
      envUpper = null;
      envLower = null;
    }

    // Forces
    const F_k = -k * x;           // Restoring spring force [N]
    const F_b = -b * v;           // Damping resistance force [N]
    const a = (F_k + F_b) / m;    // Acceleration [m/s²]

    return { t, x, v, a, F_k, F_b, envUpper, envLower };
  }

  // --- Parameter Synchronization ---

  function syncFromEquationParams() {
    state.beta = Math.max(0, parseFloat(elements.inputBeta.value) || 0);
    state.omega0 = Math.max(0.1, parseFloat(elements.inputOmega0.value) || 0.1);
    state.A = parseFloat(elements.inputA.value) || 1.0;
    state.phi = parseFloat(elements.inputPhi.value) || 0.0;

    // Synchronize physical parameters: b = 2mβ, k = m ω₀²
    state.b = +(2 * state.m * state.beta).toFixed(3);
    state.k = +(state.m * state.omega0 * state.omega0).toFixed(3);

    updateUIElements();
  }

  function syncFromPhysicalParams() {
    state.m = Math.max(0.1, parseFloat(elements.inputM.value) || 1.0);
    state.b = Math.max(0, parseFloat(elements.inputB.value) || 0);
    state.k = Math.max(0.1, parseFloat(elements.inputK.value) || 1.0);

    // Synchronize equation parameters: β = b / (2m), ω₀ = √(k / m)
    state.beta = +(state.b / (2 * state.m)).toFixed(3);
    state.omega0 = +(Math.sqrt(state.k / state.m)).toFixed(3);

    updateUIElements();
  }

  function detectRegime() {
    const diff = state.omega0 * state.omega0 - state.beta * state.beta;
    if (Math.abs(state.beta - state.omega0) < 0.005 || Math.abs(diff) < 0.005) return 'critical';
    if (state.beta < state.omega0) return 'underdamped';
    return 'overdamped';
  }

  function setMode(mode) {
    state.activeMode = mode;

    if (mode === 'underdamped') {
      // beta < omega0
      state.omega0 = 2.0;
      state.beta = 0.3;
      state.A = 4.0;
      state.phi = 0.0;
    } else if (mode === 'critical') {
      // beta = omega0
      state.omega0 = 2.0;
      state.beta = 2.0;
      state.A = 4.0;
      state.phi = 0.0;
    } else if (mode === 'overdamped') {
      // beta > omega0
      state.omega0 = 1.5;
      state.beta = 3.5;
      state.A = 4.0;
      state.phi = 0.0;
    }

    state.b = +(2 * state.m * state.beta).toFixed(3);
    state.k = +(state.m * state.omega0 * state.omega0).toFixed(3);

    updateUIElements();
  }

  function updateUIElements() {
    // Sliders & inputs
    elements.sliderBeta.value = state.beta;
    elements.inputBeta.value = state.beta.toFixed(2);
    elements.sliderOmega0.value = state.omega0;
    elements.inputOmega0.value = state.omega0.toFixed(2);
    elements.sliderA.value = state.A;
    elements.inputA.value = state.A.toFixed(1);
    elements.sliderPhi.value = state.phi;
    elements.inputPhi.value = state.phi.toFixed(2);

    elements.sliderM.value = state.m;
    elements.inputM.value = state.m.toFixed(1);
    elements.sliderB.value = state.b;
    elements.inputB.value = state.b.toFixed(2);
    elements.sliderK.value = state.k;
    elements.inputK.value = state.k.toFixed(1);

    elements.sliderTmax.value = state.tMax;
    elements.inputTmax.value = state.tMax;
    elements.timeScrubber.max = state.tMax;
    elements.simMaxTimeDisplay.textContent = state.tMax.toFixed(1) + ' s';

    // Compute metrics
    const zeta = state.beta / state.omega0;
    const diff = state.omega0 * state.omega0 - state.beta * state.beta;
    const bCrit = 2 * Math.sqrt(state.m * state.k);
    const tau = state.beta > 0 ? (1 / state.beta) : Infinity;

    elements.valZeta.textContent = zeta.toFixed(3);
    elements.valOmega0.innerHTML = state.omega0.toFixed(3) + ' <small>rad/s</small>';
    elements.valBcrit.innerHTML = bCrit.toFixed(3) + ' <small>N·s/m</small>';
    elements.valTau.innerHTML = (tau === Infinity ? '&infin;' : tau.toFixed(3)) + ' <small>s</small>';

    // Regime detection & Mode buttons highlighting
    const currentRegime = detectRegime();
    state.activeMode = currentRegime;
    elements.modeUnder.classList.toggle('active', currentRegime === 'underdamped');
    elements.modeCritical.classList.toggle('active', currentRegime === 'critical');
    elements.modeOver.classList.toggle('active', currentRegime === 'overdamped');

    elements.regimeBadge.className = 'formula-status-pill ' + (
      currentRegime === 'underdamped' ? 'under' : (currentRegime === 'critical' ? 'critical' : 'over')
    );

    // Update Banner Formulae
    elements.deNumericDisplay.innerHTML = `d²x/dt² + ${(2 * state.beta).toFixed(2)}·(dx/dt) + ${(state.omega0 * state.omega0).toFixed(2)}·x = 0`;

    if (currentRegime === 'underdamped') {
      const omega = Math.sqrt(diff);
      const period = (2 * Math.PI) / omega;
      elements.valOmega.innerHTML = omega.toFixed(3) + ' <small>rad/s</small>';
      elements.descOmega.textContent = '√(ω₀² - β²)';
      elements.valPeriod.innerHTML = period.toFixed(3) + ' <small>s</small>';
      elements.descZeta.textContent = 'ζ = β / ω₀ < 1 (Underdamped)';
      if (elements.descTau) elements.descTau.textContent = '1 / β (e⁻¹ decay)';

      elements.regimeTitle.textContent = 'Underdamped Regime';
      elements.regimeSub.innerHTML = `&beta; (${state.beta.toFixed(2)}) &lt; &omega;₀ (${state.omega0.toFixed(2)}) &bull; &Delta; &lt; 0`;

      elements.solutionDisplay.innerHTML = 'x(t) = A &middot; e<sup>-&beta;t</sup> &middot; cos(&omega;t + &phi;)';
      const phiStr = Math.abs(state.phi) < 0.01 ? '' : (state.phi > 0 ? ` + ${state.phi.toFixed(2)}` : ` - ${Math.abs(state.phi).toFixed(2)}`);
      elements.solutionNumericDisplay.innerHTML = `x(t) = ${state.A.toFixed(2)} &middot; e<sup>-${state.beta.toFixed(2)}t</sup> &middot; cos(${omega.toFixed(2)}t${phiStr})`;

      elements.explainTitle.textContent = 'Underdamping Dynamics (β < ω₀)';
      elements.explainBody.innerHTML = `The restoring spring force <strong>F<sub>k</sub> = -kx</strong> dominates over the viscous damping force <strong>F<sub>b</sub> = -bv</strong>. The mass overshoots equilibrium repeatedly, forming decaying oscillations at angular frequency <strong>&omega; = ${omega.toFixed(2)} rad/s</strong> bounded by the exponential envelopes <strong>&plusmn;${Math.abs(state.A).toFixed(1)}e<sup>-${state.beta.toFixed(2)}t</sup></strong>.`;
      elements.legEnvelope.style.display = 'inline-flex';
    } else if (currentRegime === 'critical') {
      elements.valOmega.innerHTML = '0.000 <small>rad/s</small>';
      elements.descOmega.textContent = 'ω = 0 (Critical boundary)';
      elements.valPeriod.innerHTML = 'N/A <small>(no cycles)</small>';
      elements.descZeta.textContent = 'ζ = β / ω₀ = 1.0 (Critical)';
      if (elements.descTau) elements.descTau.textContent = '1 / β (e⁻¹ decay)';

      elements.regimeTitle.textContent = 'Critically Damped';
      elements.regimeSub.innerHTML = `&beta; (${state.beta.toFixed(2)}) = &omega;₀ (${state.omega0.toFixed(2)}) &bull; &Delta; = 0`;

      elements.solutionDisplay.innerHTML = 'x(t) = (D + Et) &middot; e<sup>-&beta;t</sup>';
      const x0 = state.A * Math.cos(state.phi);
      const v0 = -state.A * (state.beta * Math.cos(state.phi) + state.omega0 * Math.sin(state.phi));
      const D = x0;
      const E = v0 + state.beta * x0;
      const eSign = E >= 0 ? `+ ${E.toFixed(2)}` : `- ${Math.abs(E).toFixed(2)}`;
      elements.solutionNumericDisplay.innerHTML = `x(t) = (${D.toFixed(2)} ${eSign}t) &middot; e<sup>-${state.beta.toFixed(2)}t</sup> &nbsp;<small style="opacity:0.85;">(D = ${D.toFixed(2)}, E = ${E.toFixed(2)})</small>`;

      elements.explainTitle.textContent = 'Critical Damping Dynamics (β = ω₀)';
      elements.explainBody.innerHTML = `At this exact threshold, the damping resistance is tuned to neutralize kinetic energy without inducing even a single oscillation. The system achieves the <strong>fastest possible return to equilibrium (x = 0)</strong> without overshooting with solution <strong>x(t) = (D + Et)e<sup>-&beta;t</sup></strong>. Widely engineered into vehicle shock absorbers and sensitive galvanometers.`;
      elements.legEnvelope.style.display = 'none';
    } else {
      // Overdamped
      const alpha = Math.sqrt(-diff); // alpha = sqrt(beta^2 - omega0^2)
      const r1 = -state.beta + alpha;
      const r2 = -state.beta - alpha;
      const x0 = state.A * Math.cos(state.phi);
      const v0 = -state.A * (state.beta * Math.cos(state.phi) + state.omega0 * Math.sin(state.phi));
      const A1 = (v0 - r2 * x0) / (2 * alpha);
      const A2 = (r1 * x0 - v0) / (2 * alpha);

      elements.valOmega.innerHTML = `${alpha.toFixed(3)} <small>(&alpha; rad/s)</small>`;
      elements.descOmega.textContent = `α = √(β² - ω₀²) = ${alpha.toFixed(2)} rad/s (roots: ${r1.toFixed(2)}, ${r2.toFixed(2)})`;
      elements.valPeriod.innerHTML = 'N/A <small>(exponential)</small>';
      elements.descZeta.textContent = 'ζ = β / ω₀ > 1 (Overdamped)';
      if (elements.descTau) elements.descTau.textContent = '1 / β (e⁻¹ decay)';

      elements.regimeTitle.textContent = 'Overdamped Regime';
      elements.regimeSub.innerHTML = `&beta; (${state.beta.toFixed(2)}) &gt; &omega;₀ (${state.omega0.toFixed(2)}) &bull; &Delta; &gt; 0`;

      elements.solutionDisplay.innerHTML = 'x(t) = e<sup>-&beta;t</sup>(A₁&middot;e<sup>&alpha;t</sup> + A₂&middot;e<sup>-&alpha;t</sup>) &nbsp;<span style="font-size:0.85em;opacity:0.9;">[&alpha; = &radic;(&beta;² - &omega;₀²)]</span>';
      const a2Sign = A2 >= 0 ? `+ ${A2.toFixed(2)}` : `- ${Math.abs(A2).toFixed(2)}`;
      elements.solutionNumericDisplay.innerHTML = `x(t) = e<sup>-${state.beta.toFixed(2)}t</sup> (${A1.toFixed(2)}&middot;e<sup>${alpha.toFixed(2)}t</sup> ${a2Sign}&middot;e<sup>-${alpha.toFixed(2)}t</sup>) &nbsp;<small style="opacity:0.85;">(A₁ = ${A1.toFixed(2)}, A₂ = ${A2.toFixed(2)}, &alpha; = ${alpha.toFixed(2)} rad/s)</small>`;

      elements.explainTitle.textContent = 'Overdamping Dynamics (β > ω₀)';
      elements.explainBody.innerHTML = `The viscous damping force <strong>F<sub>b</sub> = -bv</strong> is very strong compared to the restoring spring force <strong>F<sub>k</sub> = -kx</strong>. In terms of damping constant <strong>&beta;</strong> and natural angular frequency <strong>&omega;₀</strong>, the rate parameter is <strong>&alpha; = &radic;(&beta;² - &omega;₀²) = ${alpha.toFixed(2)} rad/s</strong>. The general solution is <strong>x(t) = e<sup>-&beta;t</sup>(A₁e<sup>&alpha;t</sup> + A₂e<sup>-&alpha;t</sup>)</strong> with roots <strong>r₁, r₂ = -&beta; &plusmn; &alpha;</strong>. The mass creeps sluggishly back towards equilibrium without oscillating.`;
      elements.legEnvelope.style.display = 'none';
    }

    // Toggle legend displays
    elements.legRestoring.style.display = state.showRestoringForce ? 'inline-flex' : 'none';
    elements.legDamping.style.display = state.showDampingForce ? 'inline-flex' : 'none';
    elements.legVelocity.style.display = state.showVelocity ? 'inline-flex' : 'none';
  }

  // --- Canvas Resizing for High-DPI ---

  function setupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
  }

  // --- Graph Rendering Engine ---

  function renderGraph() {
    setupCanvas(elements.graphCanvas, graphCtx);
    const rect = elements.graphCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    graphCtx.clearRect(0, 0, width, height);

    if (state.viewMode === 'phaseSpace') {
      renderPhasePortrait(width, height);
    } else {
      renderTimeDomainGraph(width, height);
    }
  }

  function renderTimeDomainGraph(width, height) {
    const isSmallMobile = width < 380;
    const isMobile = width < 500;
    const padLeft = isSmallMobile ? 38 : (isMobile ? 46 : 55);
    const padRight = isSmallMobile ? 12 : (isMobile ? 18 : 30);
    const padTop = isMobile ? 20 : 25;
    const padBottom = isMobile ? 30 : 35;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Determine Y-axis limits dynamically based on A and forces
    let maxVal = Math.max(Math.abs(state.A) * 1.15, 2.0);
    if (state.showRestoringForce || state.showDampingForce) {
      // Estimate force scale
      const maxF = Math.max(Math.abs(state.k * state.A), 1.0);
      // Let's normalize forces or provide dual visual scaling so they don't drown the displacement curve
    }
    const yMax = maxVal;
    const yMin = -maxVal;
    const tMax = state.tMax;

    // Coordinate Transforms
    const toPxX = (t) => padLeft + (t / tMax) * plotWidth;
    const toPxY = (y) => padTop + ((yMax - y) / (yMax - yMin)) * plotHeight;
    const zeroY = toPxY(0);

    // 1. Grid Background
    graphCtx.save();
    graphCtx.strokeStyle = '#1a2436';
    graphCtx.lineWidth = 1;

    // Time Vertical Gridlines & Labels
    const numTimeSteps = Math.min(width < 450 ? 5 : 10, Math.floor(tMax / 2));
    const dtGrid = tMax / numTimeSteps;
    graphCtx.font = '11px ui-monospace, SFMono-Regular, monospace';
    graphCtx.fillStyle = '#64748b';
    graphCtx.textAlign = 'center';

    for (let i = 0; i <= numTimeSteps; i++) {
      const t = i * dtGrid;
      const xPx = toPxX(t);
      graphCtx.beginPath();
      graphCtx.moveTo(xPx, padTop);
      graphCtx.lineTo(xPx, height - padBottom);
      graphCtx.stroke();
      graphCtx.fillText(t.toFixed(0) + 's', xPx, height - padBottom + 18);
    }

    // Horizontal Gridlines & Labels
    const yTicks = 6;
    graphCtx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const val = yMin + (i / yTicks) * (yMax - yMin);
      const yPx = toPxY(val);
      graphCtx.beginPath();
      graphCtx.moveTo(padLeft, yPx);
      graphCtx.lineTo(width - padRight, yPx);
      graphCtx.stroke();
      graphCtx.fillText(val.toFixed(1), padLeft - 8, yPx + 4);
    }

    // Zero Equilibrium Line (Thicker)
    graphCtx.strokeStyle = '#334155';
    graphCtx.lineWidth = 1.5;
    graphCtx.beginPath();
    graphCtx.moveTo(padLeft, zeroY);
    graphCtx.lineTo(width - padRight, zeroY);
    graphCtx.stroke();

    // Axis Labels
    graphCtx.fillStyle = '#94a3b8';
    graphCtx.font = '11px sans-serif';
    graphCtx.textAlign = 'center';
    graphCtx.fillText('Time t (seconds)', padLeft + plotWidth / 2, height - 8);

    graphCtx.save();
    graphCtx.translate(14, padTop + plotHeight / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.fillText('Displacement x (m) / Forces (N)', 0, 0);
    graphCtx.restore();

    // 2. Multi-Mode Comparison Overlay (if enabled)
    if (state.compareAll) {
      drawComparisonCurves(toPxX, toPxY, tMax);
    }

    // 3. Optional: Envelope Curves (for underdamped mode)
    if (state.showEnvelope && detectRegime() === 'underdamped' && !state.compareAll) {
      drawEnvelope(toPxX, toPxY, tMax);
    }

    // 4. Force Curves: Restoring Force F_k and Damping Force F_b
    if (!state.compareAll) {
      if (state.showRestoringForce) {
        drawForceCurve(toPxX, toPxY, tMax, 'F_k', '#10b981', [4, 3]);
      }
      if (state.showDampingForce) {
        drawForceCurve(toPxX, toPxY, tMax, 'F_b', '#f59e0b', [6, 4]);
      }
      if (state.showVelocity) {
        drawVelocityCurve(toPxX, toPxY, tMax);
      }
    }

    // 5. Main Displacement Curve x(t)
    drawMainDisplacementCurve(toPxX, toPxY, tMax);

    // 6. Current Time Playhead Indicator & Mass Tracer Dot
    drawTracerDot(toPxX, toPxY, zeroY, padTop, height - padBottom);

    // 7. Mouse Hover Crosshair & Tooltip Readout
    if (state.isHoveringGraph && state.hoverT !== null) {
      drawHoverCrosshair(toPxX, toPxY, padTop, height - padBottom, padLeft, width - padRight);
    }

    graphCtx.restore();
  }

  function drawMainDisplacementCurve(toPxX, toPxY, tMax) {
    graphCtx.save();
    const currentRegime = detectRegime();
    let strokeColor = '#38bdf8';
    if (currentRegime === 'critical') strokeColor = '#f59e0b';
    if (currentRegime === 'overdamped') strokeColor = '#ec4899';

    graphCtx.strokeStyle = strokeColor;
    graphCtx.lineWidth = 2.8;
    graphCtx.lineJoin = 'round';
    graphCtx.lineCap = 'round';
    graphCtx.shadowColor = strokeColor;
    graphCtx.shadowBlur = 8;

    const samples = Math.max(400, Math.floor(tMax * 50));
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t);
      const px = toPxX(t);
      const py = toPxY(pt.x);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();
  }

  function drawEnvelope(toPxX, toPxY, tMax) {
    graphCtx.save();
    graphCtx.strokeStyle = '#c084fc';
    graphCtx.lineWidth = 1.6;
    graphCtx.setLineDash([5, 4]);
    graphCtx.shadowColor = 'rgba(192, 132, 252, 0.4)';
    graphCtx.shadowBlur = 4;

    const samples = 200;
    // Upper envelope
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t);
      const px = toPxX(t);
      const py = toPxY(pt.envUpper);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();

    // Lower envelope
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t);
      const px = toPxX(t);
      const py = toPxY(pt.envLower);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();
  }

  function drawForceCurve(toPxX, toPxY, tMax, forceKey, color, dash) {
    graphCtx.save();
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 1.6;
    graphCtx.setLineDash(dash);

    // Forces can be larger, let's scale so they fit alongside displacement visually
    // Scale factor: if k is 4, F_k at x=4 is -16. We divide by spring constant or a scaling reference.
    const forceVisualScale = 1.0; 

    const samples = 300;
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t);
      const val = (forceKey === 'F_k' ? pt.F_k : pt.F_b) * forceVisualScale;
      const px = toPxX(t);
      const py = toPxY(val);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();
  }

  function drawVelocityCurve(toPxX, toPxY, tMax) {
    graphCtx.save();
    graphCtx.strokeStyle = '#06b6d4';
    graphCtx.lineWidth = 1.5;
    graphCtx.setLineDash([3, 3]);

    const samples = 300;
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t);
      const px = toPxX(t);
      const py = toPxY(pt.v);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();
  }

  function drawComparisonCurves(toPxX, toPxY, tMax) {
    const samples = 400;

    // 1. Underdamped curve (blue)
    const pUnder = { beta: 0.25 * state.omega0, omega0: state.omega0, A: state.A, phi: state.phi, m: state.m };
    graphCtx.save();
    graphCtx.strokeStyle = '#38bdf8';
    graphCtx.lineWidth = 2.2;
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t, pUnder);
      const px = toPxX(t);
      const py = toPxY(pt.x);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();

    // 2. Critical Damping curve (amber)
    const pCrit = { beta: state.omega0, omega0: state.omega0, A: state.A, phi: state.phi, m: state.m };
    graphCtx.save();
    graphCtx.strokeStyle = '#f59e0b';
    graphCtx.lineWidth = 2.4;
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t, pCrit);
      const px = toPxX(t);
      const py = toPxY(pt.x);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();

    // 3. Overdamped curve (magenta)
    const pOver = { beta: 2.5 * state.omega0, omega0: state.omega0, A: state.A, phi: state.phi, m: state.m };
    graphCtx.save();
    graphCtx.strokeStyle = '#ec4899';
    graphCtx.lineWidth = 2.2;
    graphCtx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const pt = calculateStateAt(t, pOver);
      const px = toPxX(t);
      const py = toPxY(pt.x);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();
    graphCtx.restore();

    // Badge Overlay in canvas - positioned responsively
    const badgeW = Math.min(180, width - 60);
    const badgeH = 68;
    const badgeX = Math.max(padLeft + 10, Math.min(toPxX(tMax * 0.55), width - badgeW - 15));
    graphCtx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    graphCtx.fillRect(badgeX, 35, badgeW, badgeH);
    graphCtx.strokeStyle = '#28374f';
    graphCtx.strokeRect(badgeX, 35, badgeW, badgeH);
    graphCtx.font = width < 450 ? '10px sans-serif' : '11px sans-serif';
    graphCtx.fillStyle = '#38bdf8';
    graphCtx.fillText('— Underdamped (β = 0.25ω₀)', badgeX + 10, 54);
    graphCtx.fillStyle = '#f59e0b';
    graphCtx.fillText('— Critically Damped (β = ω₀)', badgeX + 10, 72);
    graphCtx.fillStyle = '#ec4899';
    graphCtx.fillText('— Overdamped (β = 2.5ω₀)', badgeX + 10, 90);
  }

  function drawTracerDot(toPxX, toPxY, zeroY, padTop, bottomY) {
    const t = state.currentTime;
    if (t > state.tMax) return;
    const pt = calculateStateAt(t);
    const px = toPxX(t);
    const py = toPxY(pt.x);

    graphCtx.save();

    // Vertical line through current time
    graphCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    graphCtx.lineWidth = 1.2;
    graphCtx.setLineDash([4, 4]);
    graphCtx.beginPath();
    graphCtx.moveTo(px, padTop);
    graphCtx.lineTo(px, bottomY);
    graphCtx.stroke();

    // Glowing tracer point on curve
    graphCtx.shadowColor = '#38bdf8';
    graphCtx.shadowBlur = 12;
    graphCtx.fillStyle = '#ffffff';
    graphCtx.beginPath();
    graphCtx.arc(px, py, 6, 0, 2 * Math.PI);
    graphCtx.fill();

    graphCtx.strokeStyle = '#38bdf8';
    graphCtx.lineWidth = 2.5;
    graphCtx.beginPath();
    graphCtx.arc(px, py, 6, 0, 2 * Math.PI);
    graphCtx.stroke();

    graphCtx.restore();
  }

  function drawHoverCrosshair(toPxX, toPxY, padTop, bottomY, padLeft, rightX) {
    const t = state.hoverT;
    const pt = calculateStateAt(t);
    const px = toPxX(t);
    const py = toPxY(pt.x);

    graphCtx.save();
    graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    graphCtx.lineWidth = 1;
    graphCtx.setLineDash([2, 2]);

    // Vertical line
    graphCtx.beginPath();
    graphCtx.moveTo(px, padTop);
    graphCtx.lineTo(px, bottomY);
    graphCtx.stroke();

    // Horizontal line
    graphCtx.beginPath();
    graphCtx.moveTo(padLeft, py);
    graphCtx.lineTo(rightX, py);
    graphCtx.stroke();

    // Crosshair target circle
    graphCtx.fillStyle = '#fbbf24';
    graphCtx.beginPath();
    graphCtx.arc(px, py, 4, 0, 2 * Math.PI);
    graphCtx.fill();

    graphCtx.restore();
  }

  // --- Phase Space Rendering Engine (v vs x) ---

  function renderPhasePortrait(width, height) {
    const pad = 45;
    const plotWidth = width - pad * 2;
    const plotHeight = height - pad * 2;

    const maxDisp = Math.max(Math.abs(state.A) * 1.2, 2.0);
    const maxVel = Math.max(state.omega0 * Math.abs(state.A) * 1.2, 2.0);

    const toPxX = (x) => pad + ((x + maxDisp) / (2 * maxDisp)) * plotWidth;
    const toPxY = (v) => pad + ((maxVel - v) / (2 * maxVel)) * plotHeight;

    const centerX = toPxX(0);
    const centerY = toPxY(0);

    // Grid & Axes
    graphCtx.save();
    graphCtx.strokeStyle = '#1e293b';
    graphCtx.lineWidth = 1;

    // Cross Axes
    graphCtx.beginPath();
    graphCtx.moveTo(pad, centerY);
    graphCtx.lineTo(width - pad, centerY);
    graphCtx.moveTo(centerX, pad);
    graphCtx.lineTo(centerX, height - pad);
    graphCtx.stroke();

    // Axis Labels
    graphCtx.fillStyle = '#94a3b8';
    graphCtx.font = '11px sans-serif';
    graphCtx.textAlign = 'center';
    graphCtx.fillText('Displacement x (m)', width / 2, height - 12);

    graphCtx.save();
    graphCtx.translate(14, height / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.fillText('Velocity v = dx/dt (m/s)', 0, 0);
    graphCtx.restore();

    // Phase Trajectory Curve
    const currentRegime = detectRegime();
    let trajColor = '#38bdf8';
    if (currentRegime === 'critical') trajColor = '#f59e0b';
    if (currentRegime === 'overdamped') trajColor = '#ec4899';

    graphCtx.strokeStyle = trajColor;
    graphCtx.lineWidth = 2.2;
    graphCtx.beginPath();

    const samples = 600;
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * state.tMax;
      const pt = calculateStateAt(t);
      const px = toPxX(pt.x);
      const py = toPxY(pt.v);
      if (i === 0) graphCtx.moveTo(px, py);
      else graphCtx.lineTo(px, py);
    }
    graphCtx.stroke();

    // Direction arrows along the trajectory
    drawPhaseArrow(toPxX, toPxY, state.tMax * 0.15, trajColor);
    drawPhaseArrow(toPxX, toPxY, state.tMax * 0.35, trajColor);

    // Current State Dot
    const currentPt = calculateStateAt(state.currentTime);
    const curPx = toPxX(currentPt.x);
    const curPy = toPxY(currentPt.v);

    graphCtx.fillStyle = '#ffffff';
    graphCtx.shadowColor = trajColor;
    graphCtx.shadowBlur = 10;
    graphCtx.beginPath();
    graphCtx.arc(curPx, curPy, 6, 0, 2 * Math.PI);
    graphCtx.fill();

    graphCtx.restore();
  }

  function drawPhaseArrow(toPxX, toPxY, t, color) {
    const p1 = calculateStateAt(t);
    const p2 = calculateStateAt(t + 0.05);
    const x1 = toPxX(p1.x), y1 = toPxY(p1.v);
    const x2 = toPxX(p2.x), y2 = toPxY(p2.v);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    graphCtx.save();
    graphCtx.fillStyle = color;
    graphCtx.translate(x1, y1);
    graphCtx.rotate(angle);
    graphCtx.beginPath();
    graphCtx.moveTo(0, 0);
    graphCtx.lineTo(-8, -4);
    graphCtx.lineTo(-8, 4);
    graphCtx.closePath();
    graphCtx.fill();
    graphCtx.restore();
  }

  // --- Physical Simulation Canvas (Spring - Mass - Dashpot) ---

  function renderSimulation() {
    setupCanvas(elements.simCanvas, simCtx);
    const rect = elements.simCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    simCtx.clearRect(0, 0, width, height);

    const pt = calculateStateAt(state.currentTime);
    const x = pt.x;
    const v = pt.v;
    const F_k = pt.F_k;
    const F_b = pt.F_b;

    const wallX = 35;
    const centerY = height / 2;
    const eqX = width * 0.55; // Equilibrium position of mass center
    const maxDeflectionPx = width * 0.28;
    const scalePxPerMeter = maxDeflectionPx / Math.max(Math.abs(state.A), 1.0);

    const massX = eqX + x * scalePxPerMeter;
    const massW = 60;
    const massH = 50;

    simCtx.save();

    // 1. Draw Fixed Wall with Hatching
    simCtx.fillStyle = '#1e293b';
    simCtx.fillRect(0, 0, wallX, height);
    simCtx.strokeStyle = '#475569';
    simCtx.lineWidth = 2;
    simCtx.beginPath();
    simCtx.moveTo(wallX, 0);
    simCtx.lineTo(wallX, height);
    simCtx.stroke();

    // Wall hatch lines
    simCtx.strokeStyle = '#334155';
    simCtx.lineWidth = 1;
    for (let y = 10; y < height; y += 15) {
      simCtx.beginPath();
      simCtx.moveTo(0, y + 10);
      simCtx.lineTo(wallX, y - 5);
      simCtx.stroke();
    }

    // 2. Equilibrium reference line (x = 0)
    simCtx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    simCtx.lineWidth = 1;
    simCtx.setLineDash([4, 4]);
    simCtx.beginPath();
    simCtx.moveTo(eqX, 10);
    simCtx.lineTo(eqX, height - 10);
    simCtx.stroke();
    simCtx.setLineDash([]);

    simCtx.font = '10px monospace';
    simCtx.fillStyle = '#64748b';
    simCtx.textAlign = 'center';
    simCtx.fillText('x = 0 (Equilibrium)', eqX, height - 8);

    // 3. Coiled Spring (Restoring Force Apparatus) - Upper Half
    const springY = centerY - 14;
    const springStart = wallX;
    const springEnd = massX - massW / 2;
    drawCoiledSpring(springStart, springY, springEnd, springY, 14, 16);

    // 4. Viscous Dashpot (Damping Damper / Cylinder) - Lower Half
    const damperY = centerY + 16;
    drawDashpot(wallX, damperY, massX - massW / 2, damperY);

    // 5. Ground track / roller guide
    simCtx.strokeStyle = '#1e293b';
    simCtx.lineWidth = 1.5;
    simCtx.beginPath();
    simCtx.moveTo(wallX, centerY + massH / 2 + 6);
    simCtx.lineTo(width - 10, centerY + massH / 2 + 6);
    simCtx.stroke();

    // 6. Mass Block
    const massLeft = massX - massW / 2;
    const massTop = centerY - massH / 2;

    // Mass Shadow
    simCtx.fillStyle = 'rgba(0,0,0,0.4)';
    simCtx.fillRect(massLeft + 3, massTop + 3, massW, massH);

    // Mass Body
    const massGrad = simCtx.createLinearGradient(massLeft, massTop, massLeft + massW, massTop + massH);
    massGrad.addColorStop(0, '#1e3a8a');
    massGrad.addColorStop(1, '#0f172a');
    simCtx.fillStyle = massGrad;
    simCtx.fillRect(massLeft, massTop, massW, massH);

    simCtx.strokeStyle = '#3b82f6';
    simCtx.lineWidth = 1.5;
    simCtx.strokeRect(massLeft, massTop, massW, massH);

    // Mass Label
    simCtx.fillStyle = '#ffffff';
    simCtx.font = 'bold 12px sans-serif';
    simCtx.textAlign = 'center';
    simCtx.fillText(`m = ${state.m}kg`, massX, centerY - 2);
    simCtx.font = '10px monospace';
    simCtx.fillStyle = '#93c5fd';
    simCtx.fillText(`x = ${x.toFixed(2)}m`, massX, centerY + 14);

    // Rollers beneath mass
    simCtx.fillStyle = '#64748b';
    simCtx.beginPath();
    simCtx.arc(massLeft + 12, centerY + massH / 2 + 3, 3, 0, Math.PI * 2);
    simCtx.arc(massLeft + massW - 12, centerY + massH / 2 + 3, 3, 0, Math.PI * 2);
    simCtx.fill();

    // 7. Force & Velocity Vector Arrows on Mass
    const arrowY = centerY - massH / 2 - 14;

    // Velocity Vector (Cyan)
    if (Math.abs(v) > 0.05) {
      const vArrowLen = Math.max(-50, Math.min(50, v * 12));
      drawArrow(massX, arrowY, massX + vArrowLen, arrowY, '#06b6d4', 'v');
    }

    // Restoring Force Vector F_k (Green)
    if (Math.abs(F_k) > 0.1) {
      const fkArrowLen = Math.max(-60, Math.min(60, F_k * 4));
      drawArrow(massX, arrowY - 14, massX + fkArrowLen, arrowY - 14, '#10b981', 'F_k');
    }

    // Damping Force Vector F_b (Amber)
    if (Math.abs(F_b) > 0.1) {
      const fbArrowLen = Math.max(-60, Math.min(60, F_b * 4));
      drawArrow(massX, arrowY - 28, massX + fbArrowLen, arrowY - 28, '#f59e0b', 'F_b');
    }

    simCtx.restore();
  }

  function drawCoiledSpring(x1, y1, x2, y2, coils, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 10) return;

    const leadIn = 16;
    const activeLen = Math.max(20, dist - 2 * leadIn);

    simCtx.save();
    simCtx.strokeStyle = '#10b981';
    simCtx.lineWidth = 2.2;
    simCtx.beginPath();

    // Lead-in wire
    simCtx.moveTo(x1, y1);
    simCtx.lineTo(x1 + leadIn, y1);

    // Coils
    const step = activeLen / (coils * 2);
    let curX = x1 + leadIn;
    for (let i = 0; i < coils * 2; i++) {
      curX += step;
      const curY = y1 + (i % 2 === 0 ? -radius : radius);
      simCtx.lineTo(curX, curY);
    }

    // Lead-out wire
    simCtx.lineTo(x2, y2);
    simCtx.stroke();
    simCtx.restore();
  }

  function drawDashpot(x1, y1, x2, y2) {
    const totalDist = x2 - x1;
    const cylLen = Math.min(75, totalDist * 0.55);

    simCtx.save();

    // 1. Cylinder Chamber Body fixed to wall
    simCtx.strokeStyle = '#64748b';
    simCtx.lineWidth = 2;
    simCtx.fillStyle = 'rgba(245, 158, 11, 0.15)'; // viscous fluid

    const cylTop = y1 - 9;
    const cylH = 18;
    // Fluid inside
    simCtx.fillRect(x1 + 10, cylTop, cylLen, cylH);
    // Cylinder Walls (U-shape)
    simCtx.beginPath();
    simCtx.moveTo(x1 + 10 + cylLen, cylTop);
    simCtx.lineTo(x1 + 10, cylTop);
    simCtx.lineTo(x1 + 10, cylTop + cylH);
    simCtx.lineTo(x1 + 10 + cylLen, cylTop + cylH);
    simCtx.stroke();

    // Mount to wall
    simCtx.beginPath();
    simCtx.moveTo(x1, y1);
    simCtx.lineTo(x1 + 10, y1);
    simCtx.stroke();

    // 2. Piston rod & plate attached to mass
    const pistonX = Math.max(x1 + 15, Math.min(x1 + 10 + cylLen - 5, x1 + 10 + cylLen * 0.5 + (x2 - (x1 + 120)) * 0.4));
    simCtx.strokeStyle = '#f59e0b';
    simCtx.lineWidth = 2.5;

    // Piston Plate
    simCtx.beginPath();
    simCtx.moveTo(pistonX, cylTop + 2);
    simCtx.lineTo(pistonX, cylTop + cylH - 2);
    simCtx.stroke();

    // Piston Rod to mass
    simCtx.lineWidth = 2;
    simCtx.beginPath();
    simCtx.moveTo(pistonX, y1);
    simCtx.lineTo(x2, y2);
    simCtx.stroke();

    simCtx.restore();
  }

  function drawArrow(fromX, fromY, toX, toY, color, label) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const headLen = 6;

    simCtx.save();
    simCtx.strokeStyle = color;
    simCtx.fillStyle = color;
    simCtx.lineWidth = 2;

    simCtx.beginPath();
    simCtx.moveTo(fromX, fromY);
    simCtx.lineTo(toX, toY);
    simCtx.stroke();

    simCtx.beginPath();
    simCtx.moveTo(toX, toY);
    simCtx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    simCtx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    simCtx.closePath();
    simCtx.fill();

    // Label
    simCtx.font = 'bold 9px monospace';
    simCtx.fillText(label, toX + (dx >= 0 ? 5 : -14), toY + 3);

    simCtx.restore();
  }

  // --- Animation Loop ---

  function animationLoop(timestamp) {
    const dt = (timestamp - state.lastFrameTime) / 1000;
    state.lastFrameTime = timestamp;

    if (state.isPlaying) {
      state.currentTime += dt * state.playbackSpeed;
      if (state.currentTime > state.tMax) {
        state.currentTime = 0; // Loop seamlessly
      }
      elements.timeScrubber.value = state.currentTime;
      elements.simCurrentTimeDisplay.textContent = state.currentTime.toFixed(2) + ' s';
    }

    renderGraph();
    renderSimulation();

    requestAnimationFrame(animationLoop);
  }

  // --- Graph Interaction & Tooltip ---

  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  function handleGraphMouseMove(e) {
    const coords = getEventCoords(e);
    const rect = elements.graphCanvas.getBoundingClientRect();
    const mouseX = coords.clientX - rect.left;
    const mouseY = coords.clientY - rect.top;

    const isSmallMobile = rect.width < 380;
    const isMobile = rect.width < 500;
    const padLeft = isSmallMobile ? 38 : (isMobile ? 46 : 55);
    const padRight = isSmallMobile ? 12 : (isMobile ? 18 : 30);
    const plotWidth = rect.width - padLeft - padRight;

    if (mouseX >= padLeft && mouseX <= rect.width - padRight) {
      state.isHoveringGraph = true;
      const frac = (mouseX - padLeft) / plotWidth;
      const t = frac * state.tMax;
      state.hoverT = Math.max(0, Math.min(state.tMax, t));

      const pt = calculateStateAt(state.hoverT);

      elements.ttTime.textContent = `t = ${pt.t.toFixed(2)} s`;
      elements.ttValX.textContent = `${pt.x.toFixed(2)} m`;
      elements.ttValV.textContent = `${pt.v.toFixed(2)} m/s`;
      elements.ttValFk.textContent = `${pt.F_k.toFixed(2)} N`;
      elements.ttValFb.textContent = `${pt.F_b.toFixed(2)} N`;

      elements.graphTooltip.style.display = 'block';
      elements.graphTooltip.style.left = `${mouseX}px`;
      elements.graphTooltip.style.top = `${mouseY}px`;

      // Flip tooltip horizontally if close to the right edge to prevent overflow
      if (mouseX > rect.width - 150) {
        elements.graphTooltip.style.transform = 'translate(-105%, -50%)';
      } else {
        elements.graphTooltip.style.transform = 'translate(12px, -50%)';
      }
    } else {
      handleGraphMouseLeave();
    }
  }

  function handleGraphMouseLeave() {
    state.isHoveringGraph = false;
    state.hoverT = null;
    elements.graphTooltip.style.display = 'none';
  }

  function handleGraphClick(e) {
    if (state.hoverT !== null) {
      state.currentTime = state.hoverT;
      elements.timeScrubber.value = state.currentTime;
      elements.simCurrentTimeDisplay.textContent = state.currentTime.toFixed(2) + ' s';
    }
  }

  // --- Export PNG & CSV ---

  function exportGraphPng() {
    // Create an offscreen canvas to export with full dark background
    const offscreen = document.createElement('canvas');
    const dpr = 2; // High-res export
    const rect = elements.graphCanvas.getBoundingClientRect();
    offscreen.width = rect.width * dpr;
    offscreen.height = rect.height * dpr;
    const octx = offscreen.getContext('2d');
    octx.scale(dpr, dpr);

    // Fill background
    octx.fillStyle = '#090d16';
    octx.fillRect(0, 0, rect.width, rect.height);

    // Draw current canvas
    octx.drawImage(elements.graphCanvas, 0, 0, rect.width, rect.height);

    // Add Title watermark
    octx.fillStyle = '#94a3b8';
    octx.font = '12px monospace';
    octx.fillText(`Damped Harmonic Oscillation (${state.activeMode.toUpperCase()}) | beta=${state.beta}, omega0=${state.omega0}`, 20, 20);

    const link = document.createElement('a');
    link.download = `damped_oscillation_${state.activeMode}_graph.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }

  function exportCsvData() {
    const rows = [
      ['Time (s)', 'Displacement x (m)', 'Velocity v (m/s)', 'Acceleration a (m/s2)', 'Restoring Force F_k (N)', 'Damping Force F_b (N)']
    ];
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * state.tMax;
      const pt = calculateStateAt(t);
      rows.push([
        pt.t.toFixed(4),
        pt.x.toFixed(5),
        pt.v.toFixed(5),
        pt.a.toFixed(5),
        pt.F_k.toFixed(5),
        pt.F_b.toFixed(5)
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `damped_oscillation_${state.activeMode}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Event Listeners Setup ---

  function setupEventListeners() {
    // Mode switcher buttons
    elements.modeUnder.addEventListener('click', () => setMode('underdamped'));
    elements.modeCritical.addEventListener('click', () => setMode('critical'));
    elements.modeOver.addEventListener('click', () => setMode('overdamped'));

    // Snap beta to critical button
    elements.snapToCriticalBtn.addEventListener('click', () => {
      state.beta = state.omega0;
      state.b = +(2 * state.m * state.beta).toFixed(3);
      updateUIElements();
    });

    // Reset button
    elements.resetParamsBtn.addEventListener('click', () => {
      setMode(state.activeMode);
    });

    // Equation Parameters Sliders & Inputs
    elements.sliderBeta.addEventListener('input', (e) => {
      elements.inputBeta.value = e.target.value;
      syncFromEquationParams();
    });
    elements.inputBeta.addEventListener('change', (e) => {
      elements.sliderBeta.value = e.target.value;
      syncFromEquationParams();
    });

    elements.sliderOmega0.addEventListener('input', (e) => {
      elements.inputOmega0.value = e.target.value;
      syncFromEquationParams();
    });
    elements.inputOmega0.addEventListener('change', (e) => {
      elements.sliderOmega0.value = e.target.value;
      syncFromEquationParams();
    });

    elements.sliderA.addEventListener('input', (e) => {
      elements.inputA.value = e.target.value;
      syncFromEquationParams();
    });
    elements.inputA.addEventListener('change', (e) => {
      elements.sliderA.value = e.target.value;
      syncFromEquationParams();
    });

    elements.sliderPhi.addEventListener('input', (e) => {
      elements.inputPhi.value = e.target.value;
      syncFromEquationParams();
    });
    elements.inputPhi.addEventListener('change', (e) => {
      elements.sliderPhi.value = e.target.value;
      syncFromEquationParams();
    });

    // Physical Parameters Sliders & Inputs
    elements.sliderM.addEventListener('input', (e) => {
      elements.inputM.value = e.target.value;
      syncFromPhysicalParams();
    });
    elements.inputM.addEventListener('change', (e) => {
      elements.sliderM.value = e.target.value;
      syncFromPhysicalParams();
    });

    elements.sliderB.addEventListener('input', (e) => {
      elements.inputB.value = e.target.value;
      syncFromPhysicalParams();
    });
    elements.inputB.addEventListener('change', (e) => {
      elements.sliderB.value = e.target.value;
      syncFromPhysicalParams();
    });

    elements.sliderK.addEventListener('input', (e) => {
      elements.inputK.value = e.target.value;
      syncFromPhysicalParams();
    });
    elements.inputK.addEventListener('change', (e) => {
      elements.sliderK.value = e.target.value;
      syncFromPhysicalParams();
    });

    // Time horizon
    elements.sliderTmax.addEventListener('input', (e) => {
      state.tMax = parseFloat(e.target.value);
      elements.inputTmax.value = state.tMax;
      updateUIElements();
    });
    elements.inputTmax.addEventListener('change', (e) => {
      state.tMax = parseFloat(e.target.value);
      elements.sliderTmax.value = state.tMax;
      updateUIElements();
    });

    // View Options
    elements.toggleEnvelope.addEventListener('change', (e) => {
      state.showEnvelope = e.target.checked;
    });
    elements.toggleRestoringForce.addEventListener('change', (e) => {
      state.showRestoringForce = e.target.checked;
      elements.legRestoring.style.display = state.showRestoringForce ? 'inline-flex' : 'none';
    });
    elements.toggleDampingForce.addEventListener('change', (e) => {
      state.showDampingForce = e.target.checked;
      elements.legDamping.style.display = state.showDampingForce ? 'inline-flex' : 'none';
    });
    elements.toggleVelocity.addEventListener('change', (e) => {
      state.showVelocity = e.target.checked;
      elements.legVelocity.style.display = state.showVelocity ? 'inline-flex' : 'none';
    });
    elements.toggleCompareAll.addEventListener('change', (e) => {
      state.compareAll = e.target.checked;
    });

    // View Mode Tabs (Time Domain vs Phase Space)
    elements.viewTimeDomain.addEventListener('click', () => {
      state.viewMode = 'timeDomain';
      elements.viewTimeDomain.classList.add('active');
      elements.viewPhaseSpace.classList.remove('active');
      elements.graphMainHeading.textContent = 'Oscillation Waveform & Force Dynamics';
    });
    elements.viewPhaseSpace.addEventListener('click', () => {
      state.viewMode = 'phaseSpace';
      elements.viewPhaseSpace.classList.add('active');
      elements.viewTimeDomain.classList.remove('active');
      elements.graphMainHeading.textContent = 'Phase Space Trajectory Portrait (Velocity vs. Displacement)';
    });

    // Simulation Controls
    elements.playPauseBtn.addEventListener('click', () => {
      state.isPlaying = !state.isPlaying;
      elements.playIcon.style.display = state.isPlaying ? 'none' : 'block';
      elements.pauseIcon.style.display = state.isPlaying ? 'block' : 'none';
    });

    elements.resetSimBtn.addEventListener('click', () => {
      state.currentTime = 0;
      elements.timeScrubber.value = 0;
      elements.simCurrentTimeDisplay.textContent = '0.00 s';
    });

    elements.timeScrubber.addEventListener('input', (e) => {
      state.currentTime = parseFloat(e.target.value);
      elements.simCurrentTimeDisplay.textContent = state.currentTime.toFixed(2) + ' s';
    });

    elements.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.playbackSpeed = parseFloat(btn.dataset.speed);
      });
    });

    // Tooltip & Crosshairs (Mouse & Touch for phones/tablets)
    elements.canvasWrapper.addEventListener('mousemove', handleGraphMouseMove);
    elements.canvasWrapper.addEventListener('mouseleave', handleGraphMouseLeave);
    elements.canvasWrapper.addEventListener('click', handleGraphClick);

    elements.canvasWrapper.addEventListener('touchstart', (e) => {
      handleGraphMouseMove(e);
    }, { passive: true });

    elements.canvasWrapper.addEventListener('touchmove', (e) => {
      handleGraphMouseMove(e);
    }, { passive: true });

    elements.canvasWrapper.addEventListener('touchend', () => {
      if (state.hoverT !== null) {
        state.currentTime = state.hoverT;
        elements.timeScrubber.value = state.currentTime;
        elements.simCurrentTimeDisplay.textContent = state.currentTime.toFixed(2) + ' s';
      }
      setTimeout(handleGraphMouseLeave, 2500);
    });

    // Export Buttons
    elements.exportPngBtn.addEventListener('click', exportGraphPng);
    elements.exportCsvBtn.addEventListener('click', exportCsvData);

    // Window Resize
    window.addEventListener('resize', () => {
      renderGraph();
      renderSimulation();
    });
  }

  // --- Initialize Application ---
  function init() {
    setupEventListeners();
    setMode('underdamped');
    elements.playIcon.style.display = 'none';
    elements.pauseIcon.style.display = 'block';

    requestAnimationFrame(animationLoop);
  }

  // Boot on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
