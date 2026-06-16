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
const tempoFineDown = document.querySelector("#tempoFineDown");
const tempoFineUp = document.querySelector("#tempoFineUp");

const MIN_TEMPO = 160;
const MAX_TEMPO = 200;
const MINUTES_MAX = 120;
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

function playBeatSound(sound, now, accented) {
  if (sound === "woodBlock") {
    tone(accented ? 1040 : 820, now, accented ? 0.052 : 0.04, accented ? 0.13 : 0.072, "triangle");
    tone(accented ? 520 : 410, now, 0.026, accented ? 0.04 : 0.018, "square");
  }

  if (sound === "bronzeBell") {
    tone(accented ? 1280 : 1040, now, accented ? 0.13 : 0.08, accented ? 0.095 : 0.052, "sine");
    tone(accented ? 1920 : 1560, now, accented ? 0.09 : 0.055, accented ? 0.032 : 0.018, "triangle");
    tone(accented ? 2560 : 2080, now, accented ? 0.055 : 0.035, accented ? 0.016 : 0.009, "sine");
  }

  if (sound === "glassChime") {
    tone(accented ? 1840 : 1480, now, accented ? 0.085 : 0.055, accented ? 0.078 : 0.042, "sine");
    tone(accented ? 2760 : 2220, now, accented ? 0.05 : 0.035, accented ? 0.03 : 0.014, "sine");
  }

  if (sound === "ceramicXylophone") {
    tone(accented ? 1040 : 780, now, accented ? 0.088 : 0.062, accented ? 0.102 : 0.058, "triangle");
    tone(accented ? 1560 : 1170, now + 0.012, accented ? 0.054 : 0.04, accented ? 0.032 : 0.016, "sine");
  }
}

function playFinishChime() {
  ensureAudio();
  const now = audioContext.currentTime;

  [0, 0.32, 0.64].forEach((offset) => {
    tone(2480, now + offset, 0.42, 0.22, "sine");
    tone(3720, now + offset, 0.36, 0.11, "triangle");
    tone(4960, now + offset, 0.28, 0.045, "sine");
  });
}

function playBeat() {
  ensureAudio();
  const now = audioContext.currentTime;
  const sound = getSelectedSound();
  const accented = beatIndex % 2 === 0;

  playBeatSound(sound, now, accented);

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
      playFinishChime();
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

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    setVoiceStatus("麥克風權限未開啟，請到瀏覽器權限允許麥克風");
    return false;
  }
}

function startRecognition() {
  if (!recognition) {
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    if (isListening) {
      setVoiceStatus(isHandsFreeMode ? "免持模式已開啟：請說快一點或慢一點" : "正在聽：說快一點或慢一點");
      return;
    }

    setVoiceStatus("語音辨識啟動失敗，請重新整理後再試");
  }
}

function setupVoiceControl() {
  if (!SpeechRecognition) {
    handsFreeButton.disabled = true;
    voiceButton.disabled = true;
    setVoiceStatus("此瀏覽器不支援語音調整，建議用 Android Chrome");
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
        startRecognition();
      }, 350);
      return;
    }

    isHandsFreeMode = false;
    voiceButton.setAttribute("aria-pressed", "false");
    voiceButton.textContent = "語音調整";
    handsFreeButton.textContent = "免持模式";
  });

  recognition.addEventListener("error", (event) => {
    if ((event.error === "no-speech" || event.error === "network") && shouldKeepListening && isHandsFreeMode) {
      setVoiceStatus("免持模式仍在，請再說快一點或慢一點");
      return;
    }

    isHandsFreeMode = false;
    shouldKeepListening = false;
    handsFreeButton.textContent = "免持模式";
    voiceButton.setAttribute("aria-pressed", "false");
    voiceButton.textContent = "語音調整";

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setVoiceStatus("麥克風或語音辨識權限未開啟");
      return;
    }

    if (event.error === "audio-capture") {
      setVoiceStatus("找不到可用麥克風，請檢查手機權限");
      return;
    }

    setVoiceStatus("語音辨識暫時無法使用，請稍後再試");
  });
}

tempoRange.addEventListener("input", (event) => updateTempo(event.target.value));
tempoDown.addEventListener("click", () => updateTempo(getTempo() - 10));
tempoUp.addEventListener("click", () => updateTempo(getTempo() + 10));
tempoFineDown.addEventListener("click", () => updateTempo(getTempo() - 1));
tempoFineUp.addEventListener("click", () => updateTempo(getTempo() + 1));
document.querySelectorAll("[data-tempo-preset]").forEach((button) => {
  button.addEventListener("click", () => updateTempo(Number(button.dataset.tempoPreset)));
});
minutesRange.addEventListener("input", (event) => updateMinutes(event.target.value));
minuteDown.addEventListener("click", () => updateMinutes(Number(minutesRange.value) - 5));
minuteUp.addEventListener("click", () => updateMinutes(Number(minutesRange.value) + 5));
startButton.addEventListener("click", start);
pauseButton.addEventListener("click", pause);
stopButton.addEventListener("click", stop);
handsFreeButton.addEventListener("click", async () => {
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

  const hasMicrophoneAccess = await requestMicrophoneAccess();

  if (!hasMicrophoneAccess) {
    isHandsFreeMode = false;
    shouldKeepListening = false;
    handsFreeButton.textContent = "免持模式";
    return;
  }

  startRecognition();
});

voiceButton.addEventListener("click", async () => {
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
  const hasMicrophoneAccess = await requestMicrophoneAccess();

  if (!hasMicrophoneAccess) {
    return;
  }

  startRecognition();
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
    let isRefreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (isRefreshing) {
        return;
      }

      isRefreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("./sw.js").then((registration) => {
      registration.update();
    }).catch(() => {
      setVoiceStatus("離線模式暫時無法啟用");
    });
  });
}
