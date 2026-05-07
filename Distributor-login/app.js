const MAIN_COACHING = "Maa Shitla Computer Center AND Computer Shop";
const DIRECTOR = "Director - Narendra Kushwaha (Nsk)";
const MOBILE = "9179424002";
const EMAIL = "Narendrakushwaha1674@gmail.com";
const DEFAULT_LOGIN_ID = "Nsk computers";
const DEFAULT_LOGIN_PASSWORD = "Nsk@4002";
let activeLoginId = localStorage.getItem("distributorLoginId") || DEFAULT_LOGIN_ID;
let activeLoginPassword = localStorage.getItem("distributorLoginPassword") || DEFAULT_LOGIN_PASSWORD;
let pendingAdminOtp = "";

const seedInstitutes = [
  {
    institute: "Maa Shitla Digital institute",
    city: "Delhi",
    mobile: "9876543210",
    course: "All Computer Courses",
    id: "MS-MAA-1042",
    password: "MSC@7421",
    created: "30 Apr 2026",
  },
  {
    institute: "Gupta Computer Academy",
    city: "Rewa",
    mobile: "9123456780",
    course: "DCA",
    id: "MS-GUPTA-2381",
    password: "GCA@5284",
    created: "30 Apr 2026",
  },
];

const state = {
  mainCoaching: localStorage.getItem("mainCoaching") || MAIN_COACHING,
  distributor: localStorage.getItem("distributorName") || DIRECTOR,
  institutes: JSON.parse(localStorage.getItem("institutes") || "null") || seedInstitutes,
};

if (
  state.mainCoaching === "Champion Path Coaching" ||
  state.mainCoaching === "Maa Shitla Computer Center And Computer Shop"
) {
  state.mainCoaching = MAIN_COACHING;
}

if (state.distributor === "Amit Kumar") {
  state.distributor = DIRECTOR;
}

state.institutes = state.institutes.map((item) => ({
  ...item,
  institute: item.institute === "Sharma Digital Institute" ? "Maa Shitla Digital institute" : item.institute,
  course: item.course === "All Courses" ? "All Computer Courses" : item.course,
  id:
    item.id === "MS-SHARMA-1042"
      ? "MS-MAA-1042"
      : item.id && item.id.startsWith("CP-")
        ? item.id.replace("CP-", "MS-")
        : item.id,
  password: item.password === "SPC@7421" ? "MSC@7421" : item.password,
}));

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
  form: document.querySelector("#credentialForm"),
  cardGrid: document.querySelector("#cardGrid"),
  searchBox: document.querySelector("#searchBox"),
};

function saveState() {
  localStorage.setItem("mainCoaching", state.mainCoaching);
  localStorage.setItem("distributorName", state.distributor);
  localStorage.setItem("institutes", JSON.stringify(state.institutes));
}

function cleanCode(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.slice(0, 6))
    .join("-");
}

function makePassword(institute) {
  const prefix = institute
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  return `${prefix}@${Math.floor(1000 + Math.random() * 9000)}`;
}

function makeCredential(institute) {
  const code = cleanCode(institute) || "INST";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `MS-${code}-${number}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function applyBrand() {
  elements.brandName.textContent = state.mainCoaching;
  elements.footerBrand.textContent = state.mainCoaching;
  elements.mainCoaching.value = state.mainCoaching;
  elements.distributorName.value = state.distributor;
}

function credentialText(item) {
  return `${state.mainCoaching}
Institute: ${item.institute}
City: ${item.city}
Mobile: ${item.mobile || "Not provided"}
Course: ${item.course}
ID: ${item.id}
Password: ${item.password}
${state.distributor}
Mobile: ${MOBILE}
Email: ${EMAIL}`;
}

async function copyCredential(index) {
  const item = state.institutes[index];
  const text = credentialText(item);
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  const button = document.querySelector(`[data-copy="${index}"]`);
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = "Copy";
  }, 1200);
}

function printCard(index) {
  document.querySelectorAll(".id-card").forEach((card) => card.classList.remove("print-target"));
  const card = document.querySelector(`[data-card="${index}"]`);
  card.classList.add("print-target");
  window.print();
}

function deleteCard(index) {
  state.institutes.splice(index, 1);
  saveState();
  renderCards();
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

function renderCards() {
  const query = elements.searchBox.value.trim().toLowerCase();
  const filtered = state.institutes
    .map((item, index) => ({ ...item, index }))
    .filter((item) => `${item.institute} ${item.city} ${item.id}`.toLowerCase().includes(query));

  elements.cardGrid.innerHTML = filtered
    .map(
      (item) => `
        <article class="id-card" data-card="${item.index}">
          <div class="card-head">
            <strong>${escapeHtml(state.mainCoaching)}</strong>
            <small>Authorized institute login</small>
          </div>
          <div class="card-body">
            <h3>${escapeHtml(item.institute)}</h3>
            <p>${escapeHtml(item.city)} • ${escapeHtml(item.created)}</p>
            <div class="meta-line"><span>ID</span><strong>${escapeHtml(item.id)}</strong></div>
            <div class="meta-line"><span>Password</span><strong>${escapeHtml(item.password)}</strong></div>
            <div class="meta-line"><span>Course</span><strong>${escapeHtml(item.course)}</strong></div>
            <div class="meta-line"><span>Director</span><strong>${escapeHtml(state.distributor)}</strong></div>
            <div class="meta-line"><span>Contact</span><strong>${MOBILE}</strong></div>
            <div class="meta-line"><span>Email</span><strong>${EMAIL}</strong></div>
          </div>
          <div class="card-actions">
            <button class="tiny-btn" type="button" data-copy="${item.index}">Copy</button>
            <button class="tiny-btn" type="button" data-print="${item.index}">Print</button>
            <button class="tiny-btn danger" type="button" data-delete="${item.index}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.cardGrid.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyCredential(Number(button.dataset.copy)));
  });
  elements.cardGrid.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => printCard(Number(button.dataset.print)));
  });
  elements.cardGrid.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteCard(Number(button.dataset.delete)));
  });
}

function loadCertificateRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem("certificateRequests") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
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

elements.saveBrand.addEventListener("click", () => {
  state.mainCoaching = elements.mainCoaching.value.trim() || MAIN_COACHING;
  state.distributor = elements.distributorName.value.trim() || DIRECTOR;
  saveState();
  applyBrand();
  renderCards();
});

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

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const institute = document.querySelector("#instituteName").value.trim();
  const city = document.querySelector("#cityName").value.trim();
  const mobile = document.querySelector("#mobileNo").value.trim();
  const course = document.querySelector("#courseAccess").value;

  state.institutes.unshift({
    institute,
    city,
    mobile,
    course,
    id: makeCredential(institute),
    password: makePassword(institute),
    created: todayLabel(),
  });

  saveState();
  renderCards();
  elements.form.reset();
  document.querySelector("#institutes").scrollIntoView({ behavior: "smooth" });
});

elements.searchBox.addEventListener("input", renderCards);

if (sessionStorage.getItem("maaShitlaLoggedIn") === "yes") {
  elements.loginGate.classList.add("hidden");
}

applyBrand();
saveState();
renderCards();
