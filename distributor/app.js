const MAIN_COACHING = "Maa Shitla Computer Center AND Computer Shop";
const DIRECTOR = "Director - Narendra Kushwaha (Nsk)";
const MOBILE = "9179424002";
const EMAIL = "Narendrakushwaha1674@gmail.com";
const DEFAULT_LOGIN_ID = "nskcomputers4002";
const DEFAULT_LOGIN_PASSWORD = "Nsk@424002";
let activeLoginId = localStorage.getItem("distributorLoginId") || DEFAULT_LOGIN_ID;
let activeLoginPassword = localStorage.getItem("distributorLoginPassword") || DEFAULT_LOGIN_PASSWORD;
let pendingAdminOtp = "";

if (
  state.mainCoaching === "Champion Path Coaching" ||
  state.mainCoaching === "Maa Shitla Computer Center And Computer Shop"
) {
  state.mainCoaching = MAIN_COACHING;
}

if (state.distributor === "Amit Kumar") {
  state.distributor = DIRECTOR;
}

const elements = {
  loginGate: document.querySelector("#loginGate"),
  loginForm: document.querySelector("#loginForm"),
  loginId: document.querySelector("#loginId"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  openReset: document.querySelector("#openReset"),
  resetModal: document.querySelector("#resetModal"),
  closeReset: document.querySelector("#closeReset"),
  resetForm: document.querySelector("#resetForm"),
  resetType: document.querySelector("#resetType"),
  sendOtp: document.querySelector("#sendOtp"),
  otpDemo: document.querySelector("#otpDemo"),
  resetError: document.querySelector("#resetError"),
  newLoginIdWrap: document.querySelector("#newLoginIdWrap"),
  newLoginPasswordWrap: document.querySelector("#newLoginPasswordWrap"),
  adminLogout: document.querySelector("#adminLogout"),
  brandName: document.querySelector("#brandName"),
  footerBrand: document.querySelector("#footerBrand"),
  mainCoaching: document.querySelector("#mainCoaching"),
  distributorName: document.querySelector("#distributorName"),
  saveBrand: document.querySelector("#saveBrand"),
 };

function saveState() {
  localStorage.setItem("mainCoaching", state.mainCoaching);
  localStorage.setItem("distributorName", state.distributor);
 }
function applyBrand() {
  elements.brandName.textContent = state.mainCoaching;
  elements.footerBrand.textContent = state.mainCoaching;
  elements.mainCoaching.value = state.mainCoaching;
  elements.distributorName.value = state.distributor;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}
function saveCertificateRequests(requests) {
  localStorage.setItem("certificateRequests", JSON.stringify(requests));
}

function renderCertificateRequests() {
  const requests = loadCertificateRequests();
  if (!requests.length) {
    elements.certificateRequestList.innerHTML = '<div class="empty-state">Abhi koi certificate request nahi hai.</div>';
    return;
  }
  elements.certificateRequestList.innerHTML = requests
    .map(
      (request, index) => `
        <article class="payment-request ${request.status.toLowerCase()}">
          <div>
            <strong>${escapeHtml(request.branchName)}</strong>
            <span>${escapeHtml(request.studentName)} | Roll: ${escapeHtml(request.studentRoll)}</span>
            <small>${escapeHtml(request.course)} | ${escapeHtml(request.created)} | Status: ${escapeHtml(request.status)}</small>
          </div>
          <div class="request-actions">
            <button class="tiny-btn" data-cert-approve="${index}" type="button">Verify / Approve</button>
            <button class="tiny-btn danger" data-cert-cancel="${index}" type="button">Cancel</button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.certificateRequestList.querySelectorAll("[data-cert-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadCertificateRequests();
      requests[Number(button.dataset.certApprove)].status = "Approved";
      requests[Number(button.dataset.certApprove)].synced = false;
      saveCertificateRequests(requests);
      renderCertificateRequests();
    });
  });

  elements.certificateRequestList.querySelectorAll("[data-cert-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadCertificateRequests();
      requests[Number(button.dataset.certCancel)].status = "Cancelled";
      requests[Number(button.dataset.certCancel)].synced = true;
      saveCertificateRequests(requests);
      renderCertificateRequests();
    });
  });
}

function loadPaymentRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem("paymentRequests") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function savePaymentRequests(requests) {
  localStorage.setItem("paymentRequests", JSON.stringify(requests));
}

function refundWallet(request) {
  if (request.mode !== "Wallet" || request.type !== "certificate") {
    return;
  }
  const key = `wallet_${request.branchId}`;
  const wallet = Number(localStorage.getItem(key) || "0");
  localStorage.setItem(key, String(wallet + Number(request.amount || 0)));
}

function renderPaymentRequests() {
  const requests = loadPaymentRequests();
  if (!requests.length) {
    elements.paymentAdminList.innerHTML = '<div class="empty-state">Abhi koi payment request nahi hai.</div>';
    return;
  }

  elements.paymentAdminList.innerHTML = requests
    .map(
      (request, index) => `
        <article class="payment-request ${request.status.toLowerCase()}">
          <div>
            <strong>${escapeHtml(request.branchName)}</strong>
            <span>${escapeHtml(request.type)} | ${escapeHtml(request.mode)} | Rs ${escapeHtml(request.amount)}</span>
            <small>${escapeHtml(request.studentName || "Wallet top-up")} ${request.studentRoll ? `(${escapeHtml(request.studentRoll)})` : ""}</small>
            <small>${escapeHtml(request.created)} | Status: ${escapeHtml(request.status)}</small>
          </div>
          <div class="request-actions">
            <button class="tiny-btn" data-approve="${index}" type="button">Approve</button>
            <button class="tiny-btn danger" data-cancel="${index}" type="button">Cancel / Refund</button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.paymentAdminList.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadPaymentRequests();
      requests[Number(button.dataset.approve)].status = "Approved";
      requests[Number(button.dataset.approve)].synced = false;
      savePaymentRequests(requests);
      renderPaymentRequests();
    });
  });

  elements.paymentAdminList.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      const requests = loadPaymentRequests();
      const request = requests[Number(button.dataset.cancel)];
      refundWallet(request);
      request.status = "Cancelled / Refunded";
      request.synced = true;
      savePaymentRequests(requests);
      renderPaymentRequests();
    });
  });
}
elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const loginId = elements.loginId.value.trim();
  const password = elements.loginPassword.value;

  if (loginId === activeLoginId && password === activeLoginPassword) {
    sessionStorage.setItem("maaShitlaLoggedIn", "yes");
    elements.loginGate.classList.add("hidden");
    elements.loginError.textContent = "";
    elements.loginForm.reset();
    return;
  }

  elements.loginError.textContent = "Login ID ya password galat hai.";
});

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function applyResetType() {
  const type = elements.resetType.value;
  elements.newLoginIdWrap.classList.toggle("hidden", type !== "id");
  elements.newLoginPasswordWrap.classList.toggle("hidden", type !== "password");
  document.querySelector("#newLoginId").value = "";
  document.querySelector("#newLoginPassword").value = "";
  document.querySelector("#resetOtp").value = "";
  pendingAdminOtp = "";
  elements.otpDemo.classList.add("hidden");
  elements.otpDemo.innerHTML = "";
  elements.resetError.textContent = "";
}

elements.openReset.addEventListener("click", () => {
  elements.resetModal.classList.remove("hidden");
  applyResetType();
});

elements.closeReset.addEventListener("click", () => {
  elements.resetModal.classList.add("hidden");
});

elements.resetType.addEventListener("change", applyResetType);

elements.sendOtp.addEventListener("click", () => {
  pendingAdminOtp = makeOtp();
  elements.otpDemo.classList.remove("hidden");
  elements.otpDemo.innerHTML = `
    <strong>Demo OTP sent to Gmail and Mobile</strong>
    <span>Gmail: ${EMAIL}</span>
    <span>Mobile: ${MOBILE}</span>
    <span>Same OTP: ${pendingAdminOtp}</span>
    <small>Real Gmail/SMS OTP ke liye backend gateway chahiye.</small>
  `;
});

elements.resetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const resetOtp = document.querySelector("#resetOtp").value.trim();
  const newLoginId = document.querySelector("#newLoginId").value.trim();
  const newPassword = document.querySelector("#newLoginPassword").value;
  const type = elements.resetType.value;

  if (!pendingAdminOtp || resetOtp !== pendingAdminOtp) {
    elements.resetError.textContent = "OTP galat hai. Reset karne ke liye fresh OTP verify karein.";
    return;
  }

  if (type === "id" && !newLoginId) {
    elements.resetError.textContent = "New admin ID bharna zaruri hai.";
    return;
  }

  if (type === "password" && !newPassword) {
    elements.resetError.textContent = "New admin password bharna zaruri hai.";
    return;
  }

  if (type === "id") {
    activeLoginId = newLoginId;
  } else {
    activeLoginPassword = newPassword;
  }

  localStorage.setItem("distributorLoginId", activeLoginId);
  localStorage.setItem("distributorLoginPassword", activeLoginPassword);
  pendingAdminOtp = "";
  elements.resetError.textContent = type === "id" ? "Admin ID reset ho gaya. Ab nayi ID se login karein." : "Admin password reset ho gaya. Ab naye password se login karein.";
  setTimeout(() => {
    elements.resetModal.classList.add("hidden");
    elements.resetForm.reset();
    applyResetType();
  }, 1200);
});

elements.adminLogout.addEventListener("click", () => {
  sessionStorage.removeItem("maaShitlaLoggedIn");
  elements.loginGate.classList.remove("hidden");
  elements.loginError.textContent = "Admin logout ho gaya. Dobara login karein.";
});
if (sessionStorage.getItem("maaShitlaLoggedIn") === "yes") {
  elements.loginGate.classList.add("hidden");
}
