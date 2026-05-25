const tempoRange = document.querySelector("#tempoRange");
const tempoValue = document.querySelector("#tempoValue");
const tempoDown = document.querySelector("#tempoDown");
const tempoUp = document.querySelector("#tempoUp");
const minutesRange = document.querySelector("#minutesRange");
const minutesValue = document.querySelector("#minutesValue");
const minuteDown = document.querySelector("#minuteDown");
const minuteUp = document.querySelector("#minuteUp");
const timeRemaining = document.querySelector("#timeRemaining");
const timerStatus = document.querySelector("#timerStatus");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const stopButton = document.querySelector("#stopButton");
const gestureZone = document.querySelector("#gestureZone");
const handsFreeButton = document.querySelector("#handsFreeButton");
const voiceButton = document.querySelector("#voiceButton");
const voiceStatus = document.querySelector("#voiceStatus");

const MIN_TEMPO = 160;
const MAX_TEMPO = 200;
const MINUTES_MAX = 60;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let audioContext;
let beatTimer = null;
let countdownTimer = null;
let recognition = null;
let isRunning = false;
let isPaused = false;
let isListening = false;
let isHandsFreeMode = false;
let shouldKeepListening = false;
let remainingSeconds = Number(minutesRange.value) * 60;
let beatIndex = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTempo() {
  return Number(tempoRange.value);
}

function getSelectedSound() {
  return document.querySelector("input[name='sound']:checked").value;
}

function updateTempo(nextTempo) {
  const tempo = clamp(Math.round(nextTempo), MIN_TEMPO, MAX_TEMPO);
  tempoRange.value = tempo;
  tempoValue.value = tempo;

  if (isRunning) {
    scheduleBeat();
  }
}

function updateMinutes(nextMinutes) {
  const minutes = clamp(Math.round(nextMinutes), 0, MINUTES_MAX);
  minutesRange.value = minutes;
  minutesValue.value = `${minutes} 分鐘`;

  if (!isRunning) {
    remainingSeconds = minutes * 60;
    timeRemaining.textContent = formatTime(remainingSeconds);
  }
}

function setControls() {
  startButton.disabled = isRunning && !isPaused;
  pauseButton.disabled = !isRunning || isPaused;
  stopButton.disabled = !isRunning && remainingSeconds === Number(minutesRange.value) * 60;
}

function setStatus(text) {
  timerStatus.textContent = text;
}

function setVoiceStatus(text) {
  voiceStatus.textContent = text;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function tone(frequency, start, duration, gain, type = "sine") {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playHighBeat(sound, now) {
  if (sound === "glassWood") {
    tone(1840, now, 0.07, 0.082, "sine");
    tone(2760, now, 0.044, 0.032, "sine");
  }

  if (sound === "metalDrum") {
    tone(1280, now, 0.125, 0.092, "sine");
    tone(1920, now, 0.085, 0.032, "triangle");
    tone(2560, now, 0.055, 0.018, "sine");
  }

  if (sound === "bronzeWood") {
    tone(1180, now, 0.13, 0.09, "sine");
    tone(1770, now, 0.09, 0.03, "triangle");
  }

  if (sound === "ceramicDrum") {
    tone(1040, now, 0.085, 0.095, "triangle");
    tone(1560, now + 0.012, 0.052, 0.03, "sine");
  }
}

function playLowBeat(sound, now) {
  if (sound === "glassWood" || sound === "bronzeWood") {
    tone(520, now, 0.05, 0.115, "triangle");
    tone(260, now, 0.032, 0.035, "square");
  }

  if (sound === "metalDrum" || sound === "ceramicDrum") {
    tone(180, now, 0.065, 0.12, "sine");
    tone(90, now, 0.04, 0.045, "triangle");
  }
}

function playBeat() {
  ensureAudio();
  const now = audioContext.currentTime;
  const sound = getSelectedSound();
  const isFirstBeat = beatIndex % 2 === 0;

  if (isFirstBeat) {
    playHighBeat(sound, now);
  } else {
    playLowBeat(sound, now);
  }

  gestureZone.classList.remove("is-beating");
  requestAnimationFrame(() => gestureZone.classList.add("is-beating"));
  beatIndex += 1;
}

function scheduleBeat() {
  clearInterval(beatTimer);

  if (!isRunning || isPaused) {
    return;
  }

  const intervalMs = 60000 / getTempo();
  beatTimer = setInterval(playBeat, intervalMs);
}

function startCountdown() {
  clearInterval(countdownTimer);

  if (remainingSeconds === 0 && Number(minutesRange.value) > 0) {
    remainingSeconds = Number(minutesRange.value) * 60;
  }

  countdownTimer = setInterval(() => {
    if (Number(minutesRange.value) === 0) {
      return;
    }

    remainingSeconds = Math.max(0, remainingSeconds - 1);
    timeRemaining.textContent = formatTime(remainingSeconds);

    if (remainingSeconds === 0) {
      stop(false);
      setStatus("計時完成");
    }
  }, 1000);
}

function start() {
  ensureAudio();
  isRunning = true;
  isPaused = false;
  setStatus(Number(minutesRange.value) === 0 ? "持續播放" : "節拍進行中");
  playBeat();
  scheduleBeat();
  startCountdown();
  setControls();
}

function pause() {
  isPaused = true;
  clearInterval(beatTimer);
  clearInterval(countdownTimer);
  setStatus("已暫停");
  setControls();
}

function stop(shouldReset = true) {
  isRunning = false;
  isPaused = false;
  clearInterval(beatTimer);
  clearInterval(countdownTimer);

  if (shouldReset) {
    remainingSeconds = Number(minutesRange.value) * 60;
  }

  timeRemaining.textContent = formatTime(remainingSeconds);
  setStatus("已停止");
  beatIndex = 0;
  setControls();
}

function applyVoiceCommand(transcript) {
  const command = transcript.replace(/\s/g, "");

  if (command.includes("快一點") || command.includes("快一点") || command.includes("再快")) {
    updateTempo(getTempo() + 10);
    setVoiceStatus(`已調快到 ${getTempo()} 步 / 分鐘`);
    return;
  }

  if (command.includes("慢一點") || command.includes("慢一点") || command.includes("再慢")) {
    updateTempo(getTempo() - 10);
    setVoiceStatus(`已調慢到 ${getTempo()} 步 / 分鐘`);
    return;
  }

  setVoiceStatus(`聽到「${transcript}」，請說快一點或慢一點`);
}

function setupVoiceControl() {
  if (!SpeechRecognition) {
    handsFreeButton.disabled = true;
    voiceButton.disabled = true;
    setVoiceStatus("此瀏覽器不支援語音調整");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-TW";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.addEventListener("result", (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    applyVoiceCommand(transcript);
  });

  recognition.addEventListener("start", () => {
    isListening = true;
    voiceButton.setAttribute("aria-pressed", "true");
    voiceButton.textContent = "停止語音";
    handsFreeButton.textContent = isHandsFreeMode ? "免持模式中" : "免持模式";
    setVoiceStatus(isHandsFreeMode ? "免持模式已開啟：請說快一點或慢一點" : "正在聽：說快一點或慢一點");
  });

  recognition.addEventListener("end", () => {
    isListening = false;

    if (shouldKeepListening && isHandsFreeMode) {
      setVoiceStatus("免持模式持續監聽中：請說快一點或慢一點");
      window.setTimeout(() => {
        try {
          recognition.start();
        } catch (error) {
          setVoiceStatus("語音辨識暫時中斷，請再按一次免持模式");
        }
      }, 350);
      return;
    }

    isHandsFreeMode = false;
    voiceButton.setAttribute("aria-pressed", "false");
    voiceButton.textContent = "語音調整";
    handsFreeButton.textContent = "免持模式";
  });

  recognition.addEventListener("error", (event) => {
    isHandsFreeMode = false;
    shouldKeepListening = false;
    handsFreeButton.textContent = "免持模式";
    setVoiceStatus(event.error === "not-allowed" ? "麥克風權限未開啟" : "語音辨識暫時無法使用");
  });
}

tempoRange.addEventListener("input", (event) => updateTempo(event.target.value));
tempoDown.addEventListener("click", () => updateTempo(getTempo() - 10));
tempoUp.addEventListener("click", () => updateTempo(getTempo() + 10));
minutesRange.addEventListener("input", (event) => updateMinutes(event.target.value));
minuteDown.addEventListener("click", () => updateMinutes(Number(minutesRange.value) - 5));
minuteUp.addEventListener("click", () => updateMinutes(Number(minutesRange.value) + 5));
startButton.addEventListener("click", start);
pauseButton.addEventListener("click", pause);
stopButton.addEventListener("click", stop);
handsFreeButton.addEventListener("click", () => {
  if (!recognition) {
    return;
  }

  ensureAudio();
  isHandsFreeMode = true;
  shouldKeepListening = true;
  setVoiceStatus("正在開啟免持模式，請允許麥克風");

  if (isListening) {
    setVoiceStatus("免持模式已開啟：請說快一點或慢一點");
    return;
  }

  recognition.start();
});

voiceButton.addEventListener("click", () => {
  if (!recognition) {
    return;
  }

  if (isListening) {
    shouldKeepListening = false;
    recognition.stop();
    setVoiceStatus("語音調整已停止");
    return;
  }

  isHandsFreeMode = false;
  shouldKeepListening = false;
  recognition.start();
});

document.querySelectorAll("input[name='sound']").forEach((option) => {
  option.addEventListener("change", () => {
    ensureAudio();
    playBeat();
  });
});

updateTempo(tempoRange.value);
updateMinutes(minutesRange.value);
timeRemaining.textContent = formatTime(remainingSeconds);
setControls();
setupVoiceControl();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      setVoiceStatus("離線模式暫時無法啟用");
    });
  });
}
