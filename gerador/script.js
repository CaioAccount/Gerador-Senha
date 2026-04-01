const slider = document.getElementById("slider");
const valor = document.getElementById("valor");

const lower = document.getElementById("lower");
const upper = document.getElementById("upper");
const number = document.getElementById("number");
const symbol = document.getElementById("symbol");

const passwordInput = document.getElementById("password");
const generateBtn = document.getElementById("generate");
const copyBtn = document.getElementById("copy");

const bar = document.getElementById("bar");
const feedback = document.getElementById("feedback");

valor.innerText = slider.value;

slider.oninput = () => {
  valor.innerText = slider.value;
};

function getCharset(){
  let charset = "";

  if(lower.checked) charset += "abcdefghijklmnopqrstuvwxyz";
  if(upper.checked) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if(number.checked) charset += "0123456789";
  if(symbol.checked) charset += "!@#$%&*";

  return charset;
}

function getRandomInt(max){
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

function generatePassword(){
  const charset = getCharset();
  if(charset.length === 0){
    feedback.innerText = "Selecione pelo menos uma opção!";
    return;
  }

  let pass = "";
  for(let i = 0; i < slider.value; i++){
    pass += charset.charAt(getRandomInt(charset.length));
  }

  passwordInput.value = pass;
  evaluateStrength(pass);
}

function evaluateStrength(pass){
  let strength = 0;

  if(pass.length > 8) strength++;
  if(/[A-Z]/.test(pass)) strength++;
  if(/[0-9]/.test(pass)) strength++;
  if(/[^A-Za-z0-9]/.test(pass)) strength++;

  let width = strength * 25;

  bar.style.width = width + "%";

  if(strength <= 1){
    bar.style.background = "red";
    feedback.innerText = "Senha fraca";
  } else if(strength <= 3){
    bar.style.background = "orange";
    feedback.innerText = "Senha média";
  } else {
    bar.style.background = "lime";
    feedback.innerText = "Senha forte 🔥";
  }
}

function copyPassword(){
  navigator.clipboard.writeText(passwordInput.value);
  feedback.innerText = "Senha copiada!";
}

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);