const inquiryForm = document.getElementById("inquiryForm");
const formMessage = document.getElementById("formMessage");
const languageSelect = document.getElementById("languageSelect");
const exerciseSelect = document.getElementById("exerciseSelect");
const sampleText = document.getElementById("sampleText");
const typingInput = document.getElementById("typingInput");
const progressValue = document.getElementById("progressValue");
const accuracyValue = document.getElementById("accuracyValue");
const speedValue = document.getElementById("speedValue");
const charValue = document.getElementById("charValue");
const typingStatus = document.getElementById("typingStatus");
const resetTyping = document.getElementById("resetTyping");

const typingSamples = {
  english: {
    basic: "NSK COMPUTER provides a simple and practical typing tutor for daily English typing practice.",
    exam: "Regular typing practice improves speed, reduces mistakes and helps students prepare for office and exam work."
  },
  hindi: {
    basic: "\u090f\u0928\u090f\u0938\u0915\u0947 \u0915\u0902\u092a\u094d\u092f\u0942\u091f\u0930 \u0939\u093f\u0902\u0926\u0940 \u091f\u093e\u0907\u092a\u093f\u0902\u0917 \u0905\u092d\u094d\u092f\u093e\u0938 \u0915\u0947 \u0932\u093f\u090f \u090f\u0915 \u0938\u0930\u0932 \u0914\u0930 \u0909\u092a\u092f\u094b\u0917\u0940 \u092a\u094d\u0930\u0923\u093e\u0932\u0940 \u0926\u0947\u0924\u093e \u0939\u0948\u0964",
    exam: "\u0928\u093f\u092f\u092e\u093f\u0924 \u091f\u093e\u0907\u092a\u093f\u0902\u0917 \u0905\u092d\u094d\u092f\u093e\u0938 \u0938\u0947 \u0917\u0924\u093f \u092c\u0922\u093c\u0924\u0940 \u0939\u0948, \u0917\u0932\u0924\u093f\u092f\u093e\u0901 \u0915\u092e \u0939\u094b\u0924\u0940 \u0939\u0948\u0902 \u0914\u0930 \u092a\u0930\u0940\u0915\u094d\u0937\u093e \u0915\u0940 \u0924\u0948\u092f\u093e\u0930\u0940 \u092e\u091c\u092c\u0942\u0924 \u0939\u094b\u0924\u0940 \u0939\u0948\u0964"
  }
};

let typingStartedAt = 0;

if (inquiryForm && formMessage) {
  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(inquiryForm);
    const name = formData.get("name");
    const service = formData.get("service");

    formMessage.textContent = `${name}, aapki inquiry "${service}" ke liye receive ho gayi hai.`;
    inquiryForm.reset();
  });
}

function getActiveSample() {
  return typingSamples[languageSelect.value][exerciseSelect.value];
}

function resetStats() {
  progressValue.textContent = "0%";
  accuracyValue.textContent = "100%";
  speedValue.textContent = "0 CPM";
  charValue.textContent = `0 / ${getActiveSample().length}`;
}

function loadTypingSample() {
  if (!languageSelect || !exerciseSelect || !sampleText || !typingInput || !typingStatus) {
    return;
  }

  sampleText.textContent = getActiveSample();
  typingInput.value = "";
  typingStartedAt = 0;
  resetStats();

  if (languageSelect.value === "hindi") {
    typingStatus.textContent = "Hindi practice loaded. Indic ya Hindi keyboard se type kijiye.";
    return;
  }

  typingStatus.textContent = "English practice loaded. Paragraph ko dekhkar type kijiye.";
}

function updateTypingStats() {
  const targetText = getActiveSample();
  const typedText = typingInput.value;

  if (!typingStartedAt && typedText.length > 0) {
    typingStartedAt = Date.now();
  }

  let matchedCharacters = 0;
  for (let index = 0; index < typedText.length; index += 1) {
    if (typedText[index] === targetText[index]) {
      matchedCharacters += 1;
    }
  }

  const progress = targetText.length ? Math.min((typedText.length / targetText.length) * 100, 100) : 0;
  const accuracy = typedText.length ? (matchedCharacters / typedText.length) * 100 : 100;
  const elapsedMinutes = typingStartedAt ? (Date.now() - typingStartedAt) / 60000 : 0;
  const speed = elapsedMinutes > 0 ? Math.round(typedText.length / elapsedMinutes) : 0;

  progressValue.textContent = `${Math.round(progress)}%`;
  accuracyValue.textContent = `${Math.round(accuracy)}%`;
  speedValue.textContent = `${speed} CPM`;
  charValue.textContent = `${typedText.length} / ${targetText.length}`;

  if (typedText.length === 0) {
    typingStatus.textContent = "Typing shuru karte hi live feedback yahan aayega.";
    return;
  }

  if (typedText === targetText) {
    typingStatus.textContent = "Excellent. Aapne pura practice text complete kar liya.";
    return;
  }

  if (accuracy >= 90) {
    typingStatus.textContent = "Typing achchi chal rahi hai. Accuracy maintain rakhiye.";
    return;
  }

  typingStatus.textContent = "Kuch letters mismatch hain. Sample line ko dekhkar pace control kijiye.";
}

if (
  languageSelect &&
  exerciseSelect &&
  sampleText &&
  typingInput &&
  progressValue &&
  accuracyValue &&
  speedValue &&
  charValue &&
  typingStatus &&
  resetTyping
) {
  loadTypingSample();
  languageSelect.addEventListener("change", loadTypingSample);
  exerciseSelect.addEventListener("change", loadTypingSample);
  typingInput.addEventListener("input", updateTypingStats);
  resetTyping.addEventListener("click", loadTypingSample);
}
