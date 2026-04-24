const mode = document.body.dataset.mode;
const sampleLabelElement = document.getElementById("sampleLabel");
const sampleTotalElement = document.getElementById("sampleTotal");
const sampleTextElement = document.getElementById("sampleText");
const sampleNumberElement = document.getElementById("sampleNumber");
const typingInput = document.getElementById("typingInput");
const practiceModeSelect = document.getElementById("practiceModeSelect");
const durationSelect = document.getElementById("durationSelect");
const resetButton = document.getElementById("resetTyping");
const prevSentenceButton = document.getElementById("prevSentence");
const nextSentenceButton = document.getElementById("nextSentence");
const progressValue = document.getElementById("progressValue");
const accuracyValue = document.getElementById("accuracyValue");
const speedValue = document.getElementById("speedValue");
const previousSpeedValue = document.getElementById("previousSpeedValue");
const timerValue = document.getElementById("timerValue");
const statusValue = document.getElementById("statusValue");

const sampleSets = {
  english: [
    "Typing practice builds speed, accuracy and confidence for office work and competitive exams.",
    "NSK COMPUTER gives students a clean typing environment to improve their keyboard control every day.",
    "Consistent practice helps a learner reduce mistakes and maintain better focus during typing tests."
  ],
  hindi: [
    "\u0928\u093f\u092f\u092e\u093f\u0924 \u091f\u093e\u0907\u092a\u093f\u0902\u0917 \u0905\u092d\u094d\u092f\u093e\u0938 \u0938\u0947 \u0917\u0924\u093f \u0914\u0930 \u0936\u0941\u0926\u094d\u0927\u0924\u093e \u0926\u094b\u0928\u094b\u0902 \u092e\u0947\u0902 \u0938\u0941\u0927\u093e\u0930 \u0939\u094b\u0924\u093e \u0939\u0948\u0964",
    "\u090f\u0928\u090f\u0938\u0915\u0947 \u0915\u0902\u092a\u094d\u092f\u0942\u091f\u0930 \u091b\u093e\u0924\u094d\u0930\u094b\u0902 \u0915\u094b \u0930\u094b\u091c\u093c \u0905\u092d\u094d\u092f\u093e\u0938 \u0915\u0947 \u0932\u093f\u090f \u0938\u0930\u0932 \u0914\u0930 \u0909\u092a\u092f\u094b\u0917\u0940 \u091f\u093e\u0907\u092a\u093f\u0902\u0917 \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0926\u0947\u0924\u093e \u0939\u0948\u0964",
    "\u0917\u0932\u0924\u093f\u092f\u094b\u0902 \u0915\u094b \u0915\u092e \u0915\u0930\u0928\u0947 \u0914\u0930 \u0917\u0924\u093f \u092c\u0922\u093c\u093e\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0927\u0948\u0930\u094d\u092f \u0915\u0947 \u0938\u093e\u0925 \u0905\u092d\u094d\u092f\u093e\u0938 \u0915\u0930\u0928\u093e \u091c\u0930\u0942\u0930\u0940 \u0939\u0948\u0964"
  ]
};

let activeSample = "";
let activeIndex = 0;
let startedAt = 0;
let remainingSeconds = 60;
let timerHandle = null;
let lastCompletedSpeed = "--";
let lastMode = "";

function isAutoAdvanceSentenceMode() {
  return mode === "english" && practiceModeSelect && practiceModeSelect.value === "sentence";
}

function getModeLabel() {
  return isSentenceTestMode() ? "Test" : "Sentence";
}

function getEnglishSentenceSamples() {
  if (Array.isArray(window.englishStories) && window.englishStories.length > 0) {
    return window.englishStories;
  }

  return sampleSets.english;
}

function getHindiSentenceSamples() {
  if (Array.isArray(window.hindiStories) && window.hindiStories.length > 0) {
    return window.hindiStories;
  }

  return sampleSets.hindi;
}

function getHindiTestSamples() {
  if (Array.isArray(window.hindiTypingTests) && window.hindiTypingTests.length > 0) {
    return [...new Set(window.hindiTypingTests)];
  }

  return sampleSets.hindi;
}

function getEnglishTestSamples() {
  if (Array.isArray(window.englishTypingTests) && window.englishTypingTests.length > 0) {
    return [...new Set(window.englishTypingTests)];
  }

  return [];
}

function getSamples() {
  if (mode === "english") {
    if (practiceModeSelect && practiceModeSelect.value === "sentence") {
      return getEnglishSentenceSamples();
    }

    return getEnglishTestSamples();
  }

  if (mode === "hindi") {
    if (practiceModeSelect && practiceModeSelect.value === "sentence") {
      return getHindiSentenceSamples();
    }

    return getHindiTestSamples();
  }

  return sampleSets[mode] || sampleSets.english;
}

function isSentenceTestMode() {
  if (!practiceModeSelect) {
    return true;
  }

  return practiceModeSelect.value === "sentence-test";
}

function getActiveDurationSeconds() {
  if (isSentenceTestMode()) {
    return durationSelect ? Number(durationSelect.value) : 60;
  }

  return 300;
}

function pickSample(index = activeIndex) {
  const samples = getSamples();
  if (samples.length === 0) {
    activeIndex = 0;
    activeSample = "";
    return;
  }
  activeIndex = (index + samples.length) % samples.length;
  activeSample = samples[activeIndex];
}

function renderSample() {
  const typedText = typingInput.value;
  const samples = getSamples();
  if (sampleTotalElement) {
    sampleTotalElement.textContent = `Total ${getModeLabel()}s: ${samples.length}`;
  }
  if (sampleLabelElement) {
    sampleLabelElement.textContent = activeSample ? "Typing Paragraph" : "Typing Test";
  }
  if (sampleNumberElement) {
    sampleNumberElement.textContent = activeSample ? `${getModeLabel()} ${activeIndex + 1}` : "No test added";
  }
  if (!activeSample) {
    sampleTextElement.textContent = "Typing Test abhi khali hai. Aap jo alag test denge, main usse yahan add kar dunga.";
    return;
  }
  const fragments = activeSample.split("").map((character, index) => {
    let className = "";

    if (index < typedText.length) {
      className = typedText[index] === character ? "correct" : "incorrect";
    } else if (index === typedText.length) {
      className = "current";
    }

    const safeCharacter = character === " " ? "&nbsp;" : character;
    return `<span class="${className}">${safeCharacter}</span>`;
  });

  sampleTextElement.innerHTML = fragments.join("");
}

function resetStats() {
  progressValue.textContent = "0%";
  accuracyValue.textContent = "100%";
  speedValue.textContent = "0 WPM";
  if (previousSpeedValue) {
    previousSpeedValue.textContent = lastCompletedSpeed;
  }
  timerValue.textContent = `${remainingSeconds}s`;
  if (!activeSample) {
    statusValue.textContent = "Typing Test abhi blank hai. Aap naya test bhejoge toh main use add kar dunga.";
    return;
  }
  statusValue.textContent = isSentenceTestMode()
    ? "Typing Test loaded. Typing start kijiye. Result live update hoga."
    : "Sentence mode loaded. Is mode me time 5 minute fixed hai.";
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startTimer() {
  stopTimer();
  timerHandle = setInterval(() => {
    remainingSeconds -= 1;
    timerValue.textContent = `${remainingSeconds}s`;

    if (remainingSeconds <= 0) {
      stopTimer();
      typingInput.disabled = true;
      statusValue.textContent = "Time complete. Reset karke dobara practice kijiye.";
    }
  }, 1000);
}

function loadPractice() {
  const currentMode = practiceModeSelect ? practiceModeSelect.value : "";
  if (lastMode !== currentMode) {
    activeIndex = 0;
    lastMode = currentMode;
  }
  stopTimer();
  remainingSeconds = getActiveDurationSeconds();
  if (durationSelect) {
    durationSelect.disabled = !isSentenceTestMode();
    if (!isSentenceTestMode()) {
      durationSelect.value = "300";
    }
  }
  typingInput.disabled = false;
  typingInput.value = "";
  startedAt = 0;
  pickSample(activeIndex);
  if (!activeSample) {
    typingInput.disabled = true;
  }
  renderSample();
  resetStats();
}

function moveToNextSentenceAfterComplete(completedSpeed) {
  if (previousSpeedValue) {
    previousSpeedValue.textContent = `${completedSpeed} WPM`;
  }
  lastCompletedSpeed = `${completedSpeed} WPM`;
  pickSample(activeIndex + 1);
  loadPractice();
  statusValue.textContent = "Sentence complete ho gaya. Next sentence automatically load ho gaya hai.";
  typingInput.focus();
}

function changeSentence(step) {
  if (!activeSample) {
    statusValue.textContent = "Typing Test ke liye abhi koi content add nahi hai.";
    return;
  }
  pickSample(activeIndex + step);
  loadPractice();
  statusValue.textContent =
    step > 0
      ? "Next sentence load ho gaya hai. Ab nayi line type kijiye."
      : "Previous sentence load ho gaya hai. Ab is line par practice kijiye.";
}

function updateStats() {
  if (!activeSample) {
    return;
  }
  const typedText = typingInput.value;

  if (!startedAt && typedText.length > 0) {
    startedAt = Date.now();
    startTimer();
  }

  let correctCharacters = 0;
  for (let index = 0; index < typedText.length; index += 1) {
    if (typedText[index] === activeSample[index]) {
      correctCharacters += 1;
    }
  }

  const progress = activeSample.length ? Math.min((typedText.length / activeSample.length) * 100, 100) : 0;
  const accuracy = typedText.length ? (correctCharacters / typedText.length) * 100 : 100;
  const elapsedMinutes = startedAt ? (Date.now() - startedAt) / 60000 : 0;
  const wordsTyped = typedText.trim().length ? typedText.trim().split(/\s+/).length : 0;
  const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;

  progressValue.textContent = `${Math.round(progress)}%`;
  accuracyValue.textContent = `${Math.round(accuracy)}%`;
  speedValue.textContent = `${wpm} WPM`;

  if (typedText.length === 0) {
    statusValue.textContent = isSentenceTestMode()
      ? "Typing Test loaded. Typing start kijiye. Result live update hoga."
      : "Sentence mode loaded. Is mode me time 5 minute fixed hai.";
  } else if (typedText === activeSample) {
    stopTimer();
    if (isAutoAdvanceSentenceMode()) {
      moveToNextSentenceAfterComplete(wpm);
      return;
    }
    typingInput.disabled = true;
    if (previousSpeedValue) {
      previousSpeedValue.textContent = `${wpm} WPM`;
    }
    lastCompletedSpeed = `${wpm} WPM`;
    statusValue.textContent = isSentenceTestMode()
      ? "Typing Test complete. Reset ya next sentence se dobara practice kijiye."
      : "Sentence complete. Next Sentence se agla story paragraph khol sakte hain.";
  } else if (accuracy >= 90) {
    statusValue.textContent = "Typing achchi chal rahi hai. Accuracy maintain rakhiye.";
  } else {
    statusValue.textContent = "Kuch letters galat ho rahe hain. Screen par highlight dekhkar sudhar kijiye.";
  }

  renderSample();
}

if (
  sampleTextElement &&
  typingInput &&
  durationSelect &&
  resetButton &&
  prevSentenceButton &&
  nextSentenceButton &&
  progressValue &&
  accuracyValue &&
  speedValue &&
  previousSpeedValue &&
  timerValue &&
  statusValue
) {
  loadPractice();
  typingInput.addEventListener("input", updateStats);
  durationSelect.addEventListener("change", loadPractice);
  resetButton.addEventListener("click", loadPractice);
  prevSentenceButton.addEventListener("click", () => changeSentence(-1));
  nextSentenceButton.addEventListener("click", () => changeSentence(1));
  if (practiceModeSelect) {
    practiceModeSelect.addEventListener("change", loadPractice);
  }
}
