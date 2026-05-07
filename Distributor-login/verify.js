const CENTER_MOBILE = "9179424002";
const FALLBACK_CENTER = "Maa Shitla Computer Center AND Computer Shop";

const form = document.querySelector("#verifyForm");
const rollInput = document.querySelector("#verifyRoll");
const dobInput = document.querySelector("#verifyDob");
const typeInput = document.querySelector("#verifyType");
const errorBox = document.querySelector("#verifyError");
const result = document.querySelector("#verifyResult");

function loadInstitutes() {
  try {
    const saved = JSON.parse(localStorage.getItem("institutes") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function allStudents() {
  const students = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith("students_")) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(saved)) {
          students.push(...saved.map((student) => ({ ...student, branchId: key.replace("students_", "") })));
        }
      } catch {
        // Ignore damaged local entries.
      }
    }
  }
  return students;
}

function branchForStudent(student) {
  return loadInstitutes().find((branch) => branch.id === student.branchId) || {
    institute: FALLBACK_CENTER,
  };
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
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

function studentPhotoHtml(student) {
  if (!student.photo) {
    return '<div class="doc-photo empty">Photo</div>';
  }
  return `<img class="doc-photo" src="${student.photo}" alt="Student photo" style="object-fit:cover;object-position:${student.photoX || 50}% ${student.photoY || 50}%" />`;
}

function verificationUrl(student, type) {
  const url = new URL(window.location.href);
  url.searchParams.set("roll", student.roll);
  url.searchParams.set("type", type);
  return url.href;
}

function qrImage(student, type) {
  const link = verificationUrl(student, type);
  const data = encodeURIComponent(link);
  return `<img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${data}" alt="QR code" /><a class="qr-link" href="${link}" target="_blank" rel="noopener">Verify Online</a>`;
}

function certificateHtml(student) {
  const branch = branchForStudent(student);
  const certNo = student.certNo || "1182";
  const percentage = student.grade || `${percentageForRoll(student.roll)}%`;
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
        <div class="doc-line"><span>REGISTRATION NO. : <b>${escapeHtml(certNo)}</b></span><span>ROLL NO. : <b>${escapeHtml(student.roll)}</b></span></div>
        <p class="certificate-text">
          This is to Certify that mr/mrs/smt : <b>${escapeHtml(student.name)}</b><br />
          S/o, W/o, D/o : <b>${escapeHtml(student.father)}</b>, D.O.B : <b>${formatDate(student.dob)}</b><br />
          has successfully completed the course of : <b>${escapeHtml(student.course)}</b><br />
          At: <b>${escapeHtml(branch.institute)}</b> of Duration : <b>6 MONTHS</b>,<br />
          and has secured : <b>"${escapeHtml(percentage)}"</b>, Issued Date : <b>${formatDate(new Date())}</b>
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
  const branch = branchForStudent(student);
  const targetPercentage = Number(student.grade ? String(student.grade).replace("%", "") : percentageForRoll(student.roll));
  const total = Math.round(targetPercentage * 4);
  const marks = marksForPercentage(targetPercentage);
  const grade = student.grade || `${(total / 4).toFixed(1)}%`;
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
        <div class="doc-line"><span>REGISTRATION NO. : <b>${escapeHtml(student.certNo || "1182")}</b></span><span>ROLL NO. : <b>${escapeHtml(student.roll)}</b></span></div>
        <div class="marks-info">
          <b>STUDENT NAME: ${escapeHtml(student.name)}</b>
          <b>S/O,W/O,D/O: ${escapeHtml(student.father)}</b>
          <b>COURSE NAME: ${escapeHtml(student.course)}</b>
          <b>COURSE DURATION: 6 MONTHS</b>
          <b>CENTER NAME: ${escapeHtml(branch.institute)}</b>
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
        <p class="grade-line">PERCENTAGE/GRADE: <b>${escapeHtml(grade)}</b></p>
        <div class="doc-footer"><div class="qr-box">${qrImage(student, "marksheet")}</div><div><img class="seal-signature small" src="seal-signature.png" alt="Seal and signature" /><b>Authorised Signatory</b></div></div>
      </div>
    </article>
  `;
}

function verify() {
  const roll = rollInput.value.trim().toLowerCase();
  const dob = dobInput.value;
  const student = allStudents().find((item) => String(item.roll || "").toLowerCase() === roll && item.dob === dob);
  if (!student) {
    errorBox.textContent = "Is Roll Number aur DOB ka document nahi mila.";
    result.classList.add("hidden");
    result.innerHTML = "";
    return;
  }
  if (!student.certificateApproved) {
    errorBox.textContent = "Ye certificate abhi admin se approve nahi hua hai.";
    result.classList.add("hidden");
    result.innerHTML = "";
    return;
  }
  errorBox.textContent = "";
  result.innerHTML = typeInput.value === "marksheet" ? marksheetHtml(student) : certificateHtml(student);
  result.classList.remove("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  verify();
});

const params = new URLSearchParams(location.search);
if (params.get("roll")) {
  rollInput.value = params.get("roll");
}
if (params.get("type")) {
  typeInput.value = params.get("type");
}
