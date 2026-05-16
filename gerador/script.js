// --- Elements ---
const slider       = document.getElementById("slider");
const valor        = document.getElementById("valor");
const lower        = document.getElementById("lower");
const upper        = document.getElementById("upper");
const number       = document.getElementById("number");
const symbol       = document.getElementById("symbol");
const noambig      = document.getElementById("noambig");
const passwordInput= document.getElementById("password");
const generateBtn  = document.getElementById("generate");
const copyBtn      = document.getElementById("copy");
const toggleVisBtn = document.getElementById("toggle-vis");
const bar          = document.getElementById("bar");
const feedback     = document.getElementById("feedback");
const crackTime    = document.getElementById("crack-time");
const warningBox   = document.getElementById("warning-box");
const warningMsg   = document.getElementById("warning-msg");
const genCount     = document.getElementById("gen-count");
const historySection = document.getElementById("history-section");
const historyList  = document.getElementById("history-list");
const clearHistory = document.getElementById("clear-history");
const iconEye      = toggleVisBtn.querySelector(".icon-eye");
const iconEyeOff   = toggleVisBtn.querySelector(".icon-eye-off");
const iconCopy     = copyBtn.querySelector(".icon-copy");
const iconCheck    = copyBtn.querySelector(".icon-check");

// --- Charsets ---
const CHARSETS = {
  lower:  { full: "abcdefghijklmnopqrstuvwxyz", safe: "abcdefghjkmnpqrstuvwxyz" },
  upper:  { full: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", safe: "ABCDEFGHJKMNPQRSTUVWXYZ" },
  number: { full: "0123456789",                 safe: "23456789" },
  symbol: { full: "!@#$%&*()-_=+[]{}?",         safe: "!@#$%&*()-_=+[]{}?" },
};

const STRENGTH_LEVELS = [
  { label: "Muito fraca", color: "#f87171", pct: 10 },
  { label: "Fraca",       color: "#fb923c", pct: 30 },
  { label: "Média",       color: "#facc15", pct: 55 },
  { label: "Forte",       color: "#4ade80", pct: 80 },
  { label: "Excelente",   color: "#22d3ee", pct: 100 },
];

let count = 0;
let history = [];
let passwordVisible = false;
let copyTimeout = null;

// --- Init ---
valor.textContent = slider.value;
slider.addEventListener("input", () => { valor.textContent = slider.value; });

// --- Crypto random ---
function randomInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

// --- Build charset ---
function buildCharset() {
  const ambig = noambig.checked;
  const key = ambig ? "safe" : "full";
  let charset = "";
  if (lower.checked)  charset += CHARSETS.lower[key];
  if (upper.checked)  charset += CHARSETS.upper[key];
  if (number.checked) charset += CHARSETS.number[key];
  if (symbol.checked) charset += CHARSETS.symbol[key];
  return charset;
}

// --- Validate options ---
function validateOptions() {
  const warnings = [];
  const checked = [lower, upper, number, symbol].filter(c => c.checked).length;
  const len = parseInt(slider.value);

  if (checked === 0) {
    warnings.push("Selecione pelo menos um tipo de caractere.");
  }
  if (len < 8) {
    warnings.push("Senhas com menos de 8 caracteres são vulneráveis.");
  }
  if (checked === 1 && lower.checked && len < 12) {
    warnings.push("Só letras minúsculas com comprimento curto é muito fraco.");
  }

  if (warnings.length > 0) {
    warningMsg.textContent = warnings[0];
    warningBox.style.display = "flex";
    return false;
  } else {
    warningBox.style.display = "none";
    return true;
  }
}

// --- Guarantee at least one char per type ---
function buildWithGuarantee(charset, len) {
  const ambig = noambig.checked;
  const key = ambig ? "safe" : "full";
  const required = [];

  if (lower.checked)  required.push(CHARSETS.lower[key]);
  if (upper.checked)  required.push(CHARSETS.upper[key]);
  if (number.checked) required.push(CHARSETS.number[key]);
  if (symbol.checked) required.push(CHARSETS.symbol[key]);

  // Pick one from each required charset
  const guaranteed = required.map(cs => cs[randomInt(cs.length)]);

  // Fill the rest
  const remaining = len - guaranteed.length;
  const filler = Array.from({ length: remaining }, () => charset[randomInt(charset.length)]);

  // Combine and shuffle
  const all = [...guaranteed, ...filler];
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join("");
}

// --- Scramble animation ---
function scrambleAnimate(finalPass, callback) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const steps = 6;
  const delay = 40;
  let step = 0;

  function tick() {
    if (step >= steps) {
      passwordInput.value = finalPass;
      if (callback) callback();
      return;
    }
    // Show the final characters progressively (left to right as steps increase)
    const reveal = Math.floor((step / steps) * finalPass.length);
    const scrambled = finalPass.split("").map((ch, i) => {
      if (i < reveal) return ch;
      return charset[randomInt(charset.length)];
    }).join("");

    passwordInput.value = scrambled;
    step++;
    setTimeout(tick, delay);
  }

  tick();
}

// --- Crack time estimate ---
function estimateCrackTime(pass) {
  const charset = buildCharset();
  const pool = charset.length;
  const len = pass.length;

  // Guesses per second for an offline attack
  const guessesPerSec = 1e10;
  const combinations = Math.pow(pool, len);
  const seconds = combinations / guessesPerSec / 2; // average

  if (seconds < 1)         return "< 1 segundo";
  if (seconds < 60)        return `~${Math.round(seconds)}s`;
  if (seconds < 3600)      return `~${Math.round(seconds/60)}min`;
  if (seconds < 86400)     return `~${Math.round(seconds/3600)}h`;
  if (seconds < 2592000)   return `~${Math.round(seconds/86400)} dias`;
  if (seconds < 31536000)  return `~${Math.round(seconds/2592000)} meses`;
  if (seconds < 1e9)       return `~${Math.round(seconds/31536000)} anos`;
  if (seconds < 1e12)      return `~${(seconds/31536000).toExponential(1)} anos`;
  return "tempo astronômico";
}

// --- Strength evaluation ---
function evaluateStrength(pass) {
  if (!pass) return;

  let score = 0;
  if (pass.length >= 8)  score++;
  if (pass.length >= 12) score++;
  if (pass.length >= 16) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  // Map score (0–6) to level index (0–4)
  const idx = Math.min(Math.floor(score / 1.3), 4);
  const level = STRENGTH_LEVELS[idx];

  bar.style.width = level.pct + "%";
  bar.style.background = level.color;
  feedback.textContent = level.label;
  feedback.style.color = level.color;

  crackTime.textContent = "quebra: " + estimateCrackTime(pass);
}

// --- Add to history ---
function addToHistory(pass) {
  history.unshift(pass);
  if (history.length > 8) history.pop();
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historySection.style.display = "none";
    return;
  }
  historySection.style.display = "block";
  historyList.innerHTML = "";
  history.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="hist-pass" title="${p}">${p}</span>
      <button class="hist-reuse" data-idx="${i}">usar</button>
    `;
    historyList.appendChild(li);
  });
}

historyList.addEventListener("click", (e) => {
  const btn = e.target.closest(".hist-reuse");
  if (!btn) return;
  const pass = history[parseInt(btn.dataset.idx)];
  passwordInput.value = pass;
  evaluateStrength(pass);
});

clearHistory.addEventListener("click", () => {
  history = [];
  renderHistory();
});

// --- Generate ---
function generatePassword() {
  const charset = buildCharset();
  if (charset.length === 0) {
    warningMsg.textContent = "Selecione pelo menos um tipo de caractere.";
    warningBox.style.display = "flex";
    return;
  }

  validateOptions();

  const len = parseInt(slider.value);
  const pass = buildWithGuarantee(charset, len);

  // Hide while scrambling if password is visible
  const type = passwordInput.type;
  passwordInput.type = "text";

  scrambleAnimate(pass, () => {
    passwordInput.type = type;
    evaluateStrength(pass);
    addToHistory(pass);
    count++;
    genCount.textContent = count;
  });
}

// --- Toggle visibility ---
toggleVisBtn.addEventListener("click", () => {
  passwordVisible = !passwordVisible;
  passwordInput.type = passwordVisible ? "text" : "password";
  iconEye.style.display    = passwordVisible ? "none"  : "block";
  iconEyeOff.style.display = passwordVisible ? "block" : "none";
});

// --- Copy ---
function copyPassword() {
  const pass = passwordInput.value;
  if (!pass || pass === "") return;

  navigator.clipboard.writeText(pass).then(() => {
    copyBtn.classList.add("copied");
    iconCopy.style.display  = "none";
    iconCheck.style.display = "block";

    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyBtn.classList.remove("copied");
      iconCopy.style.display  = "block";
      iconCheck.style.display = "none";
    }, 2000);
  });
}

copyBtn.addEventListener("click", copyPassword);
generateBtn.addEventListener("click", generatePassword);

// --- Keyboard shortcuts ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    generatePassword();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "c" && document.activeElement !== passwordInput) {
    e.preventDefault();
    copyPassword();
  }
});
