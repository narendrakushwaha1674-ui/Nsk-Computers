const MAIN_COACHING = "Maa Shitla Computer Center AND Computer Shop";
const DIRECTOR = "Director - Narendra Kushwaha (Nsk)";
const MOBILE = "9179424002";
const EMAIL = "Narendrakushwaha1674@gmail.com";
const state = {
  mainCoaching: localStorage.getItem("mainCoaching") || MAIN_COACHING,
  distributor: localStorage.getItem("distributorName") || DIRECTOR,
   institutes: JSON.parse(localStorage.getItem("institutes") || "[]"),
};
const elements = {
  loginGate: document.querySelector("#loginGate"),
  loginForm: document.querySelector("#loginForm"),
  loginId: document.querySelector("#loginId"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  adminLogout: document.querySelector("#adminLogout"),
  brandName: document.querySelector("#brandName"),
  footerBrand: document.querySelector("#footerBrand"),
  mainCoaching: document.querySelector("#mainCoaching"),
  distributorName: document.querySelector("#distributorName"),
  saveBrand: document.querySelector("#saveBrand"),
 cardGrid: document.querySelector("#cardGrid"),
  searchBox: document.querySelector("#searchBox"),
};

function saveState() {
  localStorage.setItem("mainCoaching", state.mainCoaching);
  localStorage.setItem("distributorName", state.distributor);
  localStorage.setItem("institutes", JSON.stringify(state.institutes));
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

elements.saveBrand.addEventListener("click", () => {
  state.mainCoaching = elements.mainCoaching.value.trim() || MAIN_COACHING;
  state.distributor = elements.distributorName.value.trim() || DIRECTOR;
  saveState();
  applyBrand();
  renderCards();
});
const ADMIN_LOGIN_ID = "nskcomputers4002";
const ADMIN_LOGIN_PASSWORD = "Nsk@424002";

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const loginId = elements.loginId.value.trim();
  const password = elements.loginPassword.value;

  if (loginId === ADMIN_LOGIN_ID && password === ADMIN_LOGIN_PASSWORD) {
    sessionStorage.setItem("maaShitlaLoggedIn", "yes");
    elements.loginGate.classList.add("hidden");
    elements.loginError.textContent = "";
    elements.loginForm.reset();
    return;
  }
  elements.loginError.textContent = "Login ID ya password galat hai.";
});
elements.adminLogout.addEventListener("click", () => {
  sessionStorage.removeItem("maaShitlaLoggedIn");
  elements.loginGate.classList.remove("hidden");
  elements.loginError.textContent = "Admin logout ho gaya. Dobara login karein.";
});
elements.searchBox.addEventListener("input", renderCards);
if (sessionStorage.getItem("maaShitlaLoggedIn") === "yes") {
  elements.loginGate.classList.add("hidden");
}
applyBrand();
saveState();
renderCards();
