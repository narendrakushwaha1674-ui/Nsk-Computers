const FALLBACK_INSTITUTES = [
  {
    institute: "Maa Shitla Digital institute",
    city: "Delhi",
    mobile: "9876543210",
    course: "All Computer Courses",
    id: "MS-MAA-1042",
    password: "MSC@7421",
    created: "30 Apr 2026",
  },
];

const CENTER_NAME = "Maa Shitla Computer Center AND Computer Shop";
const DIRECTOR_NAME = "Director - Narendra Kushwaha (Nsk)";
const CENTER_MOBILE = "9179424002";
const SITE_URL = "https://maa-shitla-computer-center.example.com/";

const elements = {
  loginScreen: document.querySelector("#branchLoginScreen"),
  dashboard: document.querySelector("#branchDashboard"),
  form: document.querySelector("#branchLoginForm"),
  userId: document.querySelector("#branchUserId"),
  password: document.querySelector("#branchPassword"),
  error: document.querySelector("#branchError"),
  logout: document.querySelector("#branchLogout"),
  topLogout: document.querySelector("#topBranchLogout"),
  menuButton: document.querySelector(".menu-btn"),
  sidebar: document.querySelector("#branchSidebar"),
  breadcrumb: document.querySelector("#breadcrumbText"),
  navLinks: document.querySelectorAll("[data-view]"),
  dashboardView: document.querySelector("#dashboardView"),
  studentsView: document.querySelector("#studentsView"),
  newStudentView: document.querySelector("#newStudentView"),
  featureView: document.querySelector("#featureView"),
  featurePanel: document.querySelector("#featurePanel"),
  newStudentBtn: document.querySelector("#newStudentBtn"),
  editStudentBtn: document.querySelector("#editStudentBtn"),
  deleteStudentBtn: document.querySelector("#deleteStudentBtn"),
  printCertificateBtn: document.querySelector("#printCertificateBtn"),
  printMarksheetBtn: document.querySelector("#printMarksheetBtn"),
  backToStudents: document.querySelector("#backToStudents"),
  studentRows: document.querySelector("#studentRows"),
  tableFooter: document.querySelector("#tableFooter"),
  studentSearch: document.querySelector("#studentSearch"),
  studentForm: document.querySelector("#studentForm"),
  studentPhoto: document.querySelector("#studentPhoto"),
  studentPreview: document.querySelector("#studentPreview"),
  cropModal: document.querySelector("#cropModal"),
  cropFrame: document.querySelector("#cropFrame"),
  modalPhotoZoom: document.querySelector("#modalPhotoZoom"),
  modalPhotoX: document.querySelector("#modalPhotoX"),
  modalPhotoY: document.querySelector("#modalPhotoY"),
  applyCrop: document.querySelector("#applyCrop"),
  cancelCrop: document.querySelector("#cancelCrop"),
  cancelCropBottom: document.querySelector("#cancelCropBottom"),
  documentModal: document.querySelector("#documentModal"),
  documentContent: document.querySelector("#documentContent"),
  documentError: document.querySelector("#documentError"),
  closeDocument: document.querySelector("#closeDocument"),
  downloadDocument: document.querySelector("#downloadDocument"),
  printDocument: document.querySelector("#printDocument"),
  paymentModal: document.querySelector("#paymentModal"),
  paymentForm: document.querySelector("#paymentForm"),
  closePayment: document.querySelector("#closePayment"),
  paymentTitle: document.querySelector("#paymentTitle"),
  paymentNote: document.querySelector("#paymentNote"),
  paymentAmount: document.querySelector("#paymentAmount"),
  paymentStatus: document.querySelector("#paymentStatus"),
  regDate: document.querySelector("#regDate"),
  studentRegNo: document.querySelector("#studentRegNo"),
  studentCenterCode: document.querySelector("#studentCenterCode"),
  studentFormTitle: document.querySelector("#studentFormTitle"),
  sideBranchName: document.querySelector("#sideBranchName"),
  welcomeBranchName: document.querySelector("#welcomeBranchName"),
  dashboardInstitute: document.querySelector("#dashboardInstitute"),
  dashboardDirector: document.querySelector("#dashboardDirector"),
  dashboardMobile: document.querySelector("#dashboardMobile"),
  dashboardCode: document.querySelector("#dashboardCode"),
  dashboardAddress: document.querySelector("#dashboardAddress"),
  totalStudents: document.querySelector("#totalStudents"),
  completedCourses: document.querySelector("#completedCourses"),
  continueStudents: document.querySelector("#continueStudents"),
  totalCourses: document.querySelector("#totalCourses"),
};

let currentBranch = null;
let currentPhoto = "";
let pendingPhoto = "";
let editingRoll = "";
let pendingPayment = null;

function loadInstitutes() {
  try {
    const saved = JSON.parse(localStorage.getItem("institutes") || "null");
    return Array.isArray(saved) && saved.length ? saved : FALLBACK_INSTITUTES;
  } catch {
    return FALLBACK_INSTITUTES;
  }
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findBranch(userId, password) {
  const normalizedUser = normalize(userId);
  return loadInstitutes().find((item) => {
    const allowedIds = [item.id, item.mobile, item.institute].map(normalize);
    return allowedIds.includes(normalizedUser) && String(item.password || "") === password;
  });
}

function courseCount(course) {
  if (!course || course === "All Computer Courses") {
    return 7;
  }
  return String(course)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length || 1;
}

function branchMetrics(branch) {
  const students = loadStudents(branch.id);
  const totalStudents = Number(branch.totalStudents || branch.students || 0);
  const completedCourses = Number(branch.completedCourses || branch.completeCourses || 0);
  const continueStudents = Number(branch.continueStudents || branch.runningStudents || 0);
  const completedCount = students.filter((student) => student.status === "Complete").length;
  const continueCount = students.filter((student) => student.status !== "Complete").length;
  return {
    totalStudents: students.length || totalStudents,
    completedCourses: students.length ? completedCount : completedCourses,
    continueStudents: students.length ? continueCount : continueStudents,
    totalCourses: courseCount(branch.course),
  };
}

function studentKey(branchId) {
  return `students_${branchId}`;
}

function loadStudents(branchId) {
  try {
    const saved = JSON.parse(localStorage.getItem(studentKey(branchId)) || "[]");
    if (!Array.isArray(saved)) {
      return [];
    }
    return saved.map((student, index) => {
      const numericRoll = String(student.roll || "").replace(/\D/g, "");
      return {
        ...student,
        roll: numericRoll || String(2409010001 + index),
      };
    });
  } catch {
    return [];
  }
}

function saveStudents(branchId, students) {
  localStorage.setItem(studentKey(branchId), JSON.stringify(students));
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

function branchWallet() {
  return Number(localStorage.getItem(`wallet_${currentBranch.id}`) || "0");
}

function setBranchWallet(amount) {
  localStorage.setItem(`wallet_${currentBranch.id}`, String(Math.max(0, amount)));
}

function setView(view) {
  elements.dashboardView.classList.toggle("hidden", view !== "dashboard");
  elements.studentsView.classList.toggle("hidden", view !== "students");
  elements.newStudentView.classList.toggle("hidden", view !== "newStudent");
  elements.featureView.classList.toggle("hidden", !["wallet", "payment", "analytics", "automation", "security", "templates"].includes(view));
  elements.breadcrumb.textContent =
    view === "dashboard" ? "Home" : view === "students" ? "Home / Students" : view === "newStudent" ? "Home / Students / New" : `Home / ${view}`;
  elements.navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  if (view === "students" && currentBranch) {
    renderStudents();
  }
  if (["wallet", "payment", "analytics", "automation", "security", "templates"].includes(view)) {
    renderFeature(view);
  }
}

function renderFeature(view) {
  const students = currentBranch ? loadStudents(currentBranch.id) : [];
  const certificates = students.filter((student) => student.certNo).length;
  const wallet = Number(localStorage.getItem(`wallet_${currentBranch.id}`) || "1000");
  const content = {
    wallet: `
      <h2>Wallet System</h2>
      <p>Distributor wallet se certificate banate samay balance auto cut hoga.</p>
      <div class="feature-metric"><strong>Rs ${wallet}</strong><span>Available Balance</span></div>
      <button class="primary-btn" type="button" id="addWalletBtn">Add To Wallet</button>
      <ul><li>Certificate charge: Rs 10</li><li>Balance low hone par warning milegi</li><li>Business automation ready</li></ul>
    `,
    payment: `
      <h2>Payment System</h2>
      <p>Income ke liye registration fee, per certificate charge aur subscription plans rakh sakte hain.</p>
      <div class="price-grid"><div><b>Institute Registration Fee</b><span>One time</span></div><div><b>Rs 10</b><span>Per Certificate</span></div><div><b>Basic / Pro / Premium</b><span>Monthly Plans</span></div></div>
    `,
    analytics: `
      <h2>Analytics</h2>
      <p>Institute apni growth dekh sakega.</p>
      <div class="price-grid"><div><b>${students.length}</b><span>Students</span></div><div><b>${certificates}</b><span>Certificates</span></div><div><b>${new Date().toLocaleString("en-IN", { month: "long" })}</b><span>Monthly Growth</span></div></div>
    `,
    automation: `
      <h2>WhatsApp & Email Automation</h2>
      <p>Certificate banne ke baad automatic message/email/PDF sending ke liye backend gateway connect hoga.</p>
      <ul><li>WhatsApp message</li><li>Email</li><li>PDF send</li><li>Student notification</li></ul>
    `,
    security: `
      <h2>Security Features</h2>
      <ul><li>QR verification system</li><li>OTP login/reset flow</li><li>Login attempt limit ready</li><li>IP tracking backend-ready</li><li>Data backup plan</li><li>Password encryption backend-ready</li></ul>
    `,
    templates: `
      <h2>Custom Certificate Templates</h2>
      <p>Institute apni branding aur template choose kar sakta hai.</p>
      <ul><li>Clean UI</li><li>Mobile friendly design</li><li>Proper logo placement</li><li>Dark/light compatible documents</li><li>Hindi + English support</li></ul>
    `,
  };
  elements.featurePanel.innerHTML = content[view] || "";
  const addWalletBtn = document.querySelector("#addWalletBtn");
  if (addWalletBtn) {
    addWalletBtn.addEventListener("click", () => {
      openPayment("wallet", null, 1000);
    });
  }
}

function renderStudents() {
  const students = loadStudents(currentBranch.id);
  const query = normalize(elements.studentSearch.value);
  const filtered = students.filter((student) =>
    `${student.roll} ${student.course} ${student.name} ${student.father} ${student.address} ${student.mobile}`.toLowerCase().includes(query),
  );

  if (!filtered.length) {
    elements.studentRows.innerHTML = '<tr><td colspan="10">No data available in table</td></tr>';
    elements.tableFooter.textContent = "Showing 0 to 0 of 0 entries";
    return;
  }

  elements.studentRows.innerHTML = filtered
    .map(
      (student) => `
        <tr>
          <td><input class="student-select" type="radio" name="selectedStudent" value="${escapeHtml(student.roll)}" /></td>
          <td>${escapeHtml(student.roll)}</td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.father)}</td>
          <td>${escapeHtml(student.address)}</td>
          <td>${escapeHtml(student.mobile)}</td>
          <td>${escapeHtml(student.dob || "-")}</td>
          <td>${escapeHtml(student.certNo || "-")}</td>
          <td>${escapeHtml(student.grade || "-")}</td>
        </tr>
      `,
    )
    .join("");
  elements.tableFooter.textContent = `Showing 1 to ${filtered.length} of ${filtered.length} entries`;
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

function nextRoll(students) {
  const existingNumbers = students
    .map((student) => Number(String(student.roll || "").replace(/\D/g, "")))
    .filter((number) => Number.isFinite(number));
  const nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 2409010001;
  return String(nextNumber);
}

function todayInputValue() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function prepareStudentForm() {
  const students = loadStudents(currentBranch.id);
  editingRoll = "";
  elements.studentFormTitle.textContent = "Add New Student Here";
  elements.studentForm.reset();
  elements.regDate.value = todayInputValue();
  elements.studentRegNo.value = nextRoll(students);
  elements.studentCenterCode.innerHTML = `<option>${currentBranch.institute}</option>`;
  currentPhoto = "";
  updatePhotoPreview();
}

function selectedStudentRoll() {
  const selected = document.querySelector('input[name="selectedStudent"]:checked');
  return selected ? selected.value : "";
}

function openStudentForEdit() {
  const roll = selectedStudentRoll();
  if (!roll) {
    alert("Pehle kisi student ko select karein.");
    return;
  }

  const student = loadStudents(currentBranch.id).find((item) => item.roll === roll);
  if (!student) {
    return;
  }

  editingRoll = roll;
  elements.studentFormTitle.textContent = "Edit Student Information";
  elements.studentCenterCode.innerHTML = `<option>${currentBranch.institute}</option>`;
  elements.studentRegNo.value = student.roll;
  document.querySelector("#regDate").value = student.regDate || todayInputValue();
  document.querySelector("#studentName").value = student.name || "";
  document.querySelector("#fatherName").value = student.father || "";
  document.querySelector("#studentMobile").value = student.mobile || "";
  document.querySelector("#studentEmail").value = student.email || "";
  document.querySelector("#studentDob").value = student.dob || "";
  document.querySelector("#studentCourse").value = student.course || "";
  document.querySelector("#studentGender").value = student.gender || "";
  document.querySelector("#studentReligion").value = student.religion || "";
  document.querySelector("#studentStatus").value = student.status || "Continue";
  document.querySelector("#studentAddress").value = student.address || "";
  document.querySelector("#sendSms").checked = Boolean(student.sendSms);
  currentPhoto = student.photo || "";
  elements.modalPhotoZoom.value = student.photoZoom || 100;
  elements.modalPhotoX.value = student.photoX || 50;
  elements.modalPhotoY.value = student.photoY || 50;
  updatePhotoPreview();
  setView("newStudent");
}

function deleteSelectedStudent() {
  const roll = selectedStudentRoll();
  if (!roll) {
    alert("Pehle kisi student ko select karein.");
    return;
  }

  const students = loadStudents(currentBranch.id).filter((student) => student.roll !== roll);
  saveStudents(currentBranch.id, students);
  renderStudents();
  showDashboard(currentBranch);
  setView("students");
}

function selectedStudent() {
  const roll = selectedStudentRoll();
  if (!roll) {
    alert("Pehle kisi student ko select karein.");
    return null;
  }
  return loadStudents(currentBranch.id).find((student) => student.roll === roll) || null;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function percentageForRoll(roll) {
  const text = String(roll || "");
  const sum = text.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return (85 + (sum % 70) / 10).toFixed(1);
}

function marksForPercentage(percentage) {
  let remaining = Math.round(Number(percentage) * 4) - 340;
  const values = [85, 85, 85, 85];
  for (let index = 0; index < values.length; index += 1) {
    const add = Math.min(7, Math.max(0, remaining));
    values[index] += add;
    remaining -= add;
  }
  return {
    written: values[0],
    practical: values[1],
    project: values[2],
    viva: values[3],
  };
}

function saveStudentUpdate(student) {
  const students = loadStudents(currentBranch.id);
  const index = students.findIndex((item) => item.roll === student.roll);
  if (index >= 0) {
    students[index] = student;
    saveStudents(currentBranch.id, students);
  }
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

function syncApprovedCertificates() {
  if (!currentBranch) return;
  const requests = loadCertificateRequests();
  const students = loadStudents(currentBranch.id);
  let changed = false;
  requests.forEach((request) => {
    if (request.branchId === currentBranch.id && request.status === "Approved" && !request.synced) {
      const student = students.find((item) => item.roll === request.studentRoll);
      if (student) {
        student.certificateApproved = true;
        student.certificateOnline = true;
        changed = true;
      }
      request.synced = true;
    }
  });
  if (changed) saveStudents(currentBranch.id, students);
  saveCertificateRequests(requests);
}

function studentPhotoHtml(student) {
  if (!student.photo) {
    return '<div class="doc-photo empty">Photo</div>';
  }
  return `<img class="doc-photo" src="${student.photo}" alt="Student photo" style="object-fit:cover;object-position:${student.photoX || 50}% ${student.photoY || 50}%" />`;
}

function verificationUrl(student, type) {
  const base = window.location.href.replace(/branch-login\.html.*$/, "verify.html");
  const url = new URL(base);
  url.searchParams.set("roll", student.roll);
  url.searchParams.set("type", type);
  return url.href;
}

function qrImage(student, type) {
  const data = encodeURIComponent(verificationUrl(student, type));
  const link = verificationUrl(student, type);
  return `<img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${data}" alt="QR code" /><a class="qr-link" href="${link}" target="_blank" rel="noopener">Verify Online</a>`;
}

function certificateHtml(student) {
  const certNo = student.certNo || Math.floor(1100 + Math.random() * 9000);
  const percentage = student.grade || `${percentageForRoll(student.roll)}%`;
  student.certNo = certNo;
  student.grade = percentage;
  saveStudentUpdate(student);
  return `
    <article class="certificate-doc print-document">
      <div class="doc-ribbon top"></div>
      <div class="doc-ribbon bottom"></div>
      <div class="doc-inner">
        <p class="iso-text">An ISO 9001:2015 Certified Institute</p>
        <header class="doc-brand">
          <div class="qr-box">${qrImage(student, "certificate")}</div>
          <div>
            <h1>Maa Shitla Computer</h1>
            <strong>Center AND Computer Shop</strong>
            <p>Learning For New Skills</p>
            <small>Director - Narendra Kushwaha (Nsk) | Mob. ${CENTER_MOBILE}</small>
          </div>
          <div class="cp-logo">MS</div>
        </header>
        <div class="doc-title">CERTIFICATE/DIPLOMA</div>
        <div class="doc-line"><span>REGISTRATION NO. : <b>${certNo}</b></span><span>ROLL NO. : <b>${student.roll}</b></span></div>
        <p class="certificate-text">
          This is to Certify that mr/mrs/smt : <b>${escapeHtml(student.name)}</b><br />
          S/o, W/o, D/o : <b>${escapeHtml(student.father)}</b>, D.O.B : <b>${formatDate(student.dob)}</b><br />
          has successfully completed the course of : <b>${escapeHtml(student.course)}</b><br />
          At: <b>${escapeHtml(currentBranch.institute)}</b> of Duration : <b>6 MONTHS</b>,<br />
          and has secured : <b>"${percentage}"</b>, Issued Date : <b>${formatDate(new Date())}</b>
        </p>
        <div class="doc-seal">ISO</div>
        ${studentPhotoHtml(student)}
        <img class="seal-signature" src="seal-signature.png" alt="Seal and signature" />
        <div class="signature-line">Authorised Signatory</div>
      </div>
    </article>
  `;
}

function marksheetHtml(student) {
  const targetPercentage = Number(student.grade ? String(student.grade).replace("%", "") : percentageForRoll(student.roll));
  const total = Math.round(targetPercentage * 4);
  const marks = marksForPercentage(targetPercentage);
  const grade = `${(total / 4).toFixed(1)}%`;
  student.grade = student.grade || grade;
  saveStudentUpdate(student);
  return `
    <article class="marksheet-doc print-document">
      <div class="doc-ribbon top"></div>
      <div class="doc-ribbon bottom"></div>
      <div class="doc-inner">
        <p class="iso-text">An ISO 9001:2015 Certified Institute</p>
        <header class="doc-brand compact">
          <div>
            <h1>Maa Shitla Computer</h1>
            <strong>Center AND Computer Shop</strong>
            <p>Learning For New Skills</p>
          </div>
          <div class="cp-logo">MS</div>
        </header>
        <div class="marksheet-photo-row">
          ${studentPhotoHtml(student)}
        </div>
        <div class="doc-title">Marksheet/Grade Card</div>
        <div class="doc-line"><span>REGISTRATION NO. : <b>${student.certNo || "1182"}</b></span><span>ROLL NO. : <b>${student.roll}</b></span></div>
        <div class="marks-info">
          <b>STUDENT NAME: ${escapeHtml(student.name)}</b>
          <b>S/O,W/O,D/O: ${escapeHtml(student.father)}</b>
          <b>COURSE NAME: ${escapeHtml(student.course)}</b>
          <b>COURSE DURATION: 6 MONTHS</b>
          <b>CENTER NAME: ${escapeHtml(currentBranch.institute)}</b>
        </div>
        <h3>Module Covered</h3>
        <p class="module-text">DCA: Fundamental, MS-DOS, Windows 10, MS-Word, MS-Excel, Internet, Networking, Multimedia, HTML, System Maintenance.</p>
        <h3>Performance As Per Examinations</h3>
        <table class="marks-table">
          <tr><th>EXAMINATION</th><th>TOTAL MARKS</th><th>MARKS OBTAINED</th></tr>
          <tr><td>WRITTEN</td><td>100</td><td>${marks.written}</td></tr>
          <tr><td>PRACTICAL</td><td>100</td><td>${marks.practical}</td></tr>
          <tr><td>PROJECT</td><td>100</td><td>${marks.project}</td></tr>
          <tr><td>VIVA</td><td>100</td><td>${marks.viva}</td></tr>
          <tr><td>TOTAL</td><td>400</td><td>${total}</td></tr>
        </table>
        <p class="grade-line">PERCENTAGE/GRADE: <b>${student.grade}</b></p>
        <div class="doc-footer"><div class="qr-box">${qrImage(student, "marksheet")}</div><div><img class="seal-signature small" src="seal-signature.png" alt="Seal and signature" /><b>Authorised Signatory</b></div></div>
      </div>
    </article>
  `;
}

function openDocument(type) {
  const student = selectedStudent();
  if (!student) {
    return;
  }
  syncApprovedCertificates();
  const freshStudent = loadStudents(currentBranch.id).find((item) => item.roll === student.roll) || student;
  if (!freshStudent.certificateApproved) {
    createCertificateRequest(freshStudent);
    return;
  }
  try {
    elements.documentError.classList.add("hidden");
    elements.documentError.textContent = "";
    elements.documentContent.innerHTML = type === "certificate" ? certificateHtml(freshStudent) : marksheetHtml(freshStudent);
    elements.documentModal.classList.remove("hidden");
    renderStudents();
  } catch (error) {
    elements.documentModal.classList.remove("hidden");
    elements.documentContent.innerHTML = "";
    elements.documentError.classList.remove("hidden");
    elements.documentError.textContent = `Document generate nahi ho paya: ${error.message}`;
  }
}

function createCertificateRequest(student) {
  const requests = loadCertificateRequests();
  const existing = requests.find((request) => request.studentRoll === student.roll && request.status === "Pending");
  if (!existing) {
    requests.unshift({
      id: `CERT-${Date.now()}`,
      branchId: currentBranch.id,
      branchName: currentBranch.institute,
      studentRoll: student.roll,
      studentName: student.name,
      course: student.course,
      status: "Pending",
      synced: false,
      created: new Date().toLocaleString("en-IN"),
    });
    saveCertificateRequests(requests);
  }
  elements.documentContent.innerHTML = "";
  elements.documentError.classList.remove("hidden");
  elements.documentError.textContent = "Certificate request admin panel par bhej di gayi hai. Admin approve karega tab certificate/marksheet generate hoga.";
  elements.documentModal.classList.remove("hidden");
}

function openPayment(type, student, amount) {
  pendingPayment = { type, studentRoll: student?.roll || "", amount };
  elements.paymentTitle.textContent = type === "wallet" ? "Add Money To Wallet" : "Certificate Payment";
  elements.paymentNote.textContent =
    type === "wallet"
      ? "Wallet top-up request distributor panel par approval ke liye jayegi."
      : "Certificate payment request distributor panel par approval ke liye jayegi. Approve hone ke baad certificate generate hoga.";
  elements.paymentAmount.value = amount;
  elements.paymentAmount.readOnly = type === "certificate";
  elements.paymentStatus.textContent = "";
  elements.paymentModal.classList.remove("hidden");
}

function createPaymentRequest(mode, amount) {
  const requests = loadPaymentRequests();
  const student = pendingPayment.studentRoll
    ? loadStudents(currentBranch.id).find((item) => item.roll === pendingPayment.studentRoll)
    : null;

  if (mode === "Wallet" && pendingPayment.type === "certificate" && branchWallet() < amount) {
    elements.paymentStatus.textContent = "Wallet balance kam hai. Pehle wallet me paise add karein.";
    return;
  }

  if (mode === "Wallet" && pendingPayment.type === "certificate") {
    setBranchWallet(branchWallet() - amount);
  }

  requests.unshift({
    id: `PAY-${Date.now()}`,
    type: pendingPayment.type,
    amount,
    mode,
    status: "Pending",
    branchId: currentBranch.id,
    branchName: currentBranch.institute,
    studentRoll: pendingPayment.studentRoll,
    studentName: student?.name || "",
    created: new Date().toLocaleString("en-IN"),
  });
  savePaymentRequests(requests);
  elements.paymentStatus.textContent = "Payment request distributor approval ke liye bhej di gayi hai.";
}

function updatePhotoPreview() {
  if (!currentPhoto) {
    elements.studentPreview.textContent = "Photo Preview";
    elements.studentPreview.style.backgroundImage = "";
    elements.studentPreview.style.backgroundSize = "";
    elements.studentPreview.style.backgroundPosition = "";
    return;
  }

  elements.studentPreview.textContent = "";
  elements.studentPreview.style.backgroundImage = `url(${currentPhoto})`;
  elements.studentPreview.style.backgroundSize = `${elements.modalPhotoZoom.value}%`;
  elements.studentPreview.style.backgroundPosition = `${elements.modalPhotoX.value}% ${elements.modalPhotoY.value}%`;
}

function updateCropFrame() {
  if (!pendingPhoto) {
    return;
  }

  elements.cropFrame.style.backgroundImage = `url(${pendingPhoto})`;
  elements.cropFrame.style.backgroundSize = `${elements.modalPhotoZoom.value}%`;
  elements.cropFrame.style.backgroundPosition = `${elements.modalPhotoX.value}% ${elements.modalPhotoY.value}%`;
}

function openCropModal(photo) {
  pendingPhoto = photo;
  elements.modalPhotoZoom.value = 100;
  elements.modalPhotoX.value = 50;
  elements.modalPhotoY.value = 50;
  elements.cropModal.classList.remove("hidden");
  updateCropFrame();
}

function closeCropModal() {
  pendingPhoto = "";
  elements.cropModal.classList.add("hidden");
  elements.studentPhoto.value = "";
}

function showDashboard(branch) {
  currentBranch = branch;
  syncApprovedCertificates();
  syncApprovedPayments();
  const metrics = branchMetrics(branch);
  sessionStorage.setItem("activeBranch", JSON.stringify(branch));
  elements.loginScreen.classList.add("hidden");
  elements.dashboard.classList.remove("hidden");
  elements.sideBranchName.textContent = branch.institute;
  elements.welcomeBranchName.textContent = branch.institute;
  elements.dashboardInstitute.textContent = branch.institute;
  elements.dashboardDirector.textContent = DIRECTOR_NAME;
  elements.dashboardMobile.textContent = `Mob. - ${branch.mobile || CENTER_MOBILE}`;
  elements.dashboardCode.textContent = `Center Code - ${branch.id}`;
  elements.dashboardAddress.textContent = `${CENTER_NAME} | ${branch.city || "Branch"}`;
  elements.totalStudents.textContent = metrics.totalStudents;
  elements.completedCourses.textContent = metrics.completedCourses;
  elements.continueStudents.textContent = metrics.continueStudents;
  elements.totalCourses.textContent = metrics.totalCourses;
  setView("dashboard");
}

function syncApprovedPayments() {
  if (!currentBranch) {
    return;
  }
  const requests = loadPaymentRequests();
  const approved = requests.filter((request) => request.branchId === currentBranch.id && request.status === "Approved" && !request.synced);
  if (!approved.length) {
    return;
  }

  const students = loadStudents(currentBranch.id);
  approved.forEach((request) => {
    if (request.type === "wallet") {
      setBranchWallet(branchWallet() + Number(request.amount || 0));
    }
    if (request.type === "certificate") {
      const student = students.find((item) => item.roll === request.studentRoll);
      if (student) {
        student.certificateApproved = true;
      }
    }
    request.synced = true;
  });
  saveStudents(currentBranch.id, students);
  savePaymentRequests(requests);
}

function on(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

on(elements.form, "submit", (event) => {
  event.preventDefault();
  const branch = findBranch(elements.userId.value, elements.password.value);

  if (!branch) {
    elements.error.textContent = "Mobile/Branch ID ya password galat hai.";
    return;
  }

  elements.error.textContent = "";
  showDashboard(branch);
});

function logoutBranch() {
  sessionStorage.removeItem("activeBranch");
  elements.dashboard.classList.add("hidden");
  elements.loginScreen.classList.remove("hidden");
  elements.form.reset();
  elements.error.textContent = "Aap logout ho gaye hain. Dobara login karein.";
}

on(elements.logout, "click", logoutBranch);
on(elements.topLogout, "click", logoutBranch);
on(elements.menuButton, "click", () => {
  elements.dashboard.classList.toggle("sidebar-collapsed");
});

elements.navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setView(link.dataset.view);
  });
});

on(elements.newStudentBtn, "click", () => setView("newStudent"));
on(elements.newStudentBtn, "click", prepareStudentForm);
on(elements.editStudentBtn, "click", openStudentForEdit);
on(elements.deleteStudentBtn, "click", deleteSelectedStudent);
on(elements.printCertificateBtn, "click", () => openDocument("certificate"));
on(elements.printMarksheetBtn, "click", () => openDocument("marksheet"));
on(elements.backToStudents, "click", () => setView("students"));
on(elements.studentSearch, "input", renderStudents);

on(elements.studentPhoto, "change", () => {
  const file = elements.studentPhoto.files[0];
  if (!file) {
    currentPhoto = "";
    updatePhotoPreview();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    openCropModal(reader.result);
  });
  reader.readAsDataURL(file);
});

[elements.modalPhotoZoom, elements.modalPhotoX, elements.modalPhotoY].forEach((control) => {
  on(control, "input", updateCropFrame);
});

on(elements.applyCrop, "click", () => {
  currentPhoto = pendingPhoto;
  elements.cropModal.classList.add("hidden");
  pendingPhoto = "";
  updatePhotoPreview();
});

on(elements.cancelCrop, "click", closeCropModal);
on(elements.cancelCropBottom, "click", closeCropModal);
on(elements.closeDocument, "click", () => elements.documentModal.classList.add("hidden"));
on(elements.printDocument, "click", () => window.print());
on(elements.downloadDocument, "click", () => window.print());
on(elements.closePayment, "click", () => elements.paymentModal.classList.add("hidden"));
on(elements.paymentForm, "submit", (event) => {
  event.preventDefault();
  const mode = document.querySelector('input[name="paymentMode"]:checked')?.value || "Wallet";
  createPaymentRequest(mode, Number(elements.paymentAmount.value || 0));
});

on(elements.studentForm, "submit", (event) => {
  event.preventDefault();
  const students = loadStudents(currentBranch.id);
  const studentData = {
    roll: editingRoll || elements.studentRegNo.value || nextRoll(students),
    regDate: document.querySelector("#regDate").value,
    name: document.querySelector("#studentName").value.trim(),
    father: document.querySelector("#fatherName").value.trim(),
    mobile: document.querySelector("#studentMobile").value.trim(),
    email: document.querySelector("#studentEmail").value.trim(),
    dob: document.querySelector("#studentDob").value,
    course: document.querySelector("#studentCourse").value,
    gender: document.querySelector("#studentGender").value,
    religion: document.querySelector("#studentReligion").value,
    status: document.querySelector("#studentStatus").value,
    address: document.querySelector("#studentAddress").value.trim(),
    sendSms: document.querySelector("#sendSms").checked,
    photo: currentPhoto,
    photoZoom: elements.modalPhotoZoom.value,
    photoX: elements.modalPhotoX.value,
    photoY: elements.modalPhotoY.value,
    certNo: editingRoll ? students.find((student) => student.roll === editingRoll)?.certNo || "" : "",
    grade: editingRoll ? students.find((student) => student.roll === editingRoll)?.grade || "" : "",
  };

  if (editingRoll) {
    const index = students.findIndex((student) => student.roll === editingRoll);
    students[index] = studentData;
  } else {
    students.push(studentData);
  }

  saveStudents(currentBranch.id, students);
  editingRoll = "";
  elements.studentForm.reset();
  currentPhoto = "";
  updatePhotoPreview();
  const metrics = branchMetrics(currentBranch);
  elements.totalStudents.textContent = metrics.totalStudents;
  elements.completedCourses.textContent = metrics.completedCourses;
  elements.continueStudents.textContent = metrics.continueStudents;
  elements.totalCourses.textContent = metrics.totalCourses;
  setView("students");
});

const activeBranch = sessionStorage.getItem("activeBranch");
if (activeBranch) {
  try {
    showDashboard(JSON.parse(activeBranch));
    setView("dashboard");
  } catch {
    sessionStorage.removeItem("activeBranch");
    elements.dashboard.classList.add("hidden");
    elements.loginScreen.classList.remove("hidden");
  }
}
