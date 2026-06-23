(function () {
  const ADMIN_ID = "Nsk computers";
  const ADMIN_PASSWORD = "Nsk@4002";
  const STORAGE_KEY = "computerByNskSirDataV2";
  const SESSION_KEY = "computerByNskSirSession";
  const DEVICE_KEY = "computerByNskSirDevice";
  const app = document.getElementById("app");

  let state = loadState();
  let session = loadSession();
  let route = location.hash.replace("#", "") || "admin-login";
  let adminTab = "dashboard";
  let studentTab = "tests";
  let running = null;
  let timerHandle = null;

  function makeId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function deviceName() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = "Device-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id + " / " + navigator.platform;
  }

  function defaultQuestions() {
    return Array.from({ length: 100 }, function (_, i) {
      return {
        id: makeId("q"),
        text: i === 0 ? "निम्नलिखित में से कौन सा घटक (Component) कंप्यूटर की चौथी पीढ़ी (4th Generation) को तीसरी पीढ़ी से मुख्य रूप से अलग करता है?" : "Computer MCQ Question " + (i + 1),
        a: i === 0 ? "Integrated Circuits (ICs) का उपयोग" : "Option A",
        b: i === 0 ? "Microprocessors और VLSI/ULSI का उपयोग" : "Option B",
        c: i === 0 ? "Vacuum Tubes का पूर्णतः प्रतिस्थापन" : "Option C",
        d: i === 0 ? "Magnetic Core Memory का आगमन" : "Option D",
        correct: i === 0 ? "B" : ["A", "B", "C", "D"][i % 4]
      };
    });
  }

  function defaultState() {
    return {
      students: [],
      tests: [{
        id: makeId("test"),
        subject: "Computerr MCQ",
        name: "Daily Test 1",
        date: "6/9/2026",
        attempts: 1,
        questions: defaultQuestions()
      }],
      submissions: [],
      notifications: [],
      help: []
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.students && saved.tests) { saved.students = saved.students.filter(function (s) { return s.userId && s.userId !== "Nskkushwaha"; }); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); return saved; }
    } catch (e) {}
    const fresh = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function saveSession(value) {
    session = value;
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function nowText() {
    return new Date().toLocaleString();
  }

  function gradeFromScore(score, total) {
    const pct = total ? (score / total) * 100 : 0;
    if (pct > 80) return { text: "Pass-A+", cls: "success-text" };
    if (pct > 60) return { text: "Pass-A", cls: "success-text" };
    if (pct > 50) return { text: "Pass-B", cls: "success-text" };
    if (pct > 40) return { text: "Pass-C", cls: "success-text" };
    if (pct > 33) return { text: "Pass-D", cls: "success-text" };
    if (pct >= 28) return { text: "Pass-By Grade", cls: "danger-text" };
    return { text: "Fail", cls: "danger-text" };
  }

  function header(label) {
    return '<header class="topbar"><div class="brand">COMPUTER MCQ BY NSK SIR</div>' + (label ? '<div class="admin-note">' + label + '</div>' : '') + '</header>';
  }

  function adminNav() {
    const items = [["dashboard", "Dashboard"], ["students", "Student Accounts"], ["tests", "Test Names"], ["questions", "Questions"], ["generate", "ID/Password Generate"], ["logout", "Logout"]];
    return '<aside class="sidebar">' + items.map(function (x) {
      return '<button class="nav-btn ' + (adminTab === x[0] ? 'active' : '') + '" data-admin-tab="' + x[0] + '">' + x[1] + '</button>';
    }).join("") + '</aside>';
  }

  function studentNav() {
    const items = [["tests", "Test Names"], ["results", "My Results"], ["logout", "Logout"]];
    return '<aside class="sidebar">' + items.map(function (x) {
      return '<button class="nav-btn ' + (studentTab === x[0] ? 'active' : '') + '" data-student-tab="' + x[0] + '">' + x[1] + '</button>';
    }).join("") + '</aside>';
  }

  function render() {
    clearInterval(timerHandle);
    timerHandle = null;
    if (route === "student-login") return renderStudentLogin();
    if (session && session.role === "admin") return renderAdmin();
    if (session && session.role === "student") return renderStudent();
    renderAdminLogin();
  }

  function renderAdminLogin() {
    app.innerHTML = header("") + '<main class="login-shell"><div class="landing-wrap"><section class="hero-panel"><h1>COMPUTER MCQ BY NSK SIR</h1><p>Daily 100 MCQ paper practice, 60 minute timer, instant result PDF, secure student login and admin control in one professional website.</p><div class="hero-stats"><div class="hero-stat"><b>100</b><span>Daily Questions</span></div><div class="hero-stat"><b>60m</b><span>Paper Timer</span></div><div class="hero-stat"><b>PDF</b><span>Result PDF</span></div></div></section><section class="login-card"><div class="brand" style="font-size:34px;margin-bottom:22px;">COMPUTER MCQ BY NSK SIR</div><h1>Admin Login</h1><label class="field">Admin ID<input id="adminId" autocomplete="username"></label><label class="field">Password<input id="adminPass" type="password" autocomplete="current-password"></label><div class="error" id="loginError"></div><button class="primary wide" id="adminLoginBtn">Login</button><a class="link-button" id="studentLoginLink">Student ID Login</a></section></div></main>';
    document.getElementById("adminLoginBtn").onclick = adminLogin;
    document.getElementById("studentLoginLink").onclick = function () {
      window.open(location.href.split("#")[0] + "#student-login", "_blank");
    };
  }

  function adminLogin() {
    const id = document.getElementById("adminId").value.trim();
    const pass = document.getElementById("adminPass").value;
    if (id === ADMIN_ID && pass === ADMIN_PASSWORD) {
      saveSession({ role: "admin", device: deviceName(), startedAt: nowText() });
      adminTab = "dashboard";
      render();
    } else {
      document.getElementById("loginError").textContent = "Admin ID ya password galat hai.";
    }
  }

  function renderStudentLogin() {
    app.innerHTML = '<main class="login-shell"><section class="login-card"><div class="brand" style="font-size:34px;margin-bottom:22px;">COMPUTER MCQ BY NSK SIR</div><h1>Student Login</h1><label class="field">User ID<input id="studentId" autocomplete="username"></label><label class="field">Password<input id="studentPass" type="password" autocomplete="current-password"></label><div class="error" id="studentError"></div><button class="primary wide" id="studentLoginBtn">Login</button><a class="link-button" id="adminBackLink">Admin Login</a></section></main>';
    document.getElementById("studentLoginBtn").onclick = studentLogin;
    document.getElementById("adminBackLink").onclick = function () {
      route = "admin-login";
      location.hash = "";
      render();
    };
  }

  function studentLogin() {
    const userId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("studentPass").value;
   const student = state.students.find(function (s) {
  return s.userId === userId && s.password === password;
});

const csv = await response.text();

console.log(csv);
    const err = document.getElementById("studentError");
    if (!student) return err.textContent = "Student ID ya password galat hai.";
    if (student.blocked) return err.textContent = "Ye account blocked hai.";
    if (student.activeSession) return err.textContent = "Ye ID kisi dusri jagah login hai. Admin se logout karwayein.";
    const sid = makeId("session");
    student.activeSession = { id: sid, device: deviceName(), loginAt: nowText() };
    student.lastLoginAt = student.activeSession.loginAt;
    student.loginCount += 1;
    state.notifications.unshift({ id: makeId("note"), title: "Student login", text: student.name + " login hua.", time: nowText() });
    saveState();
    saveSession({ role: "student", studentId: student.id, sessionId: sid, device: deviceName() });
    studentTab = "tests";
    route = "student";
    location.hash = "student";
    render();
  }

  function renderAdmin() {
    app.innerHTML = header("Admin - Nsk computers") + '<main class="layout wide-layout">' + adminNav() + '<section class="panel" id="adminContent"></section></main>';
    document.querySelectorAll("[data-admin-tab]").forEach(function (btn) {
      btn.onclick = function () {
        const tab = btn.dataset.adminTab;
        if (tab === "logout") return logout();
        adminTab = tab;
        renderAdmin();
      };
    });
    if (adminTab === "students") adminStudents();
    else if (adminTab === "tests") adminTests();
    else if (adminTab === "questions") adminQuestions();
    else if (adminTab === "generate") adminGenerateId();
    else adminDashboard();
  }

  function adminDashboard() {
    const blocked = state.students.filter(function (s) { return s.blocked; }).length;
    document.getElementById("adminContent").innerHTML =
      '<h1>Admin Dashboard</h1><div class="cards"><div class="stat"><b>' + state.students.length + '</b><span>Total Students</span></div><div class="stat"><b>' + state.tests.length + '</b><span>Total Tests</span></div><div class="stat"><b>' + blocked + '</b><span>Blocked Accounts</span></div></div>' +
      '<div class="row-between"><h2>Notifications</h2><button class="danger" id="clearNotes">Clear All</button></div>' +
      '<div>' + (state.notifications.length ? state.notifications.map(function (n) { return '<div class="notice"><div><b>' + esc(n.title) + '</b><br>' + esc(n.text) + '<br><span class="muted">' + esc(n.time) + '</span></div><button class="danger mini-btn" data-del-note="' + n.id + '">Delete</button></div>'; }).join("") : '<p class="muted">Abhi koi notification nahi hai.</p>') + '</div>' +
      '<h2>Submitted Tests</h2>' + (state.submissions.length ? adminReviewResults() : '<p class="muted">Abhi koi test submit nahi hua.</p>') +
      '<h2>Help Requests</h2>' + (state.help.length ? state.help.map(function (h) { return '<div class="notice"><div><b>' + esc(h.student) + '</b> - ' + esc(h.test) + '<br>' + esc(h.text) + '<br><span class="muted">' + esc(h.time) + '</span></div><button class="danger mini-btn" data-del-help="' + h.id + '">Delete</button></div>'; }).join("") : '<p class="muted">Abhi koi help request nahi hai.</p>');
    document.getElementById("clearNotes").onclick = function () { state.notifications = []; saveState(); adminDashboard(); };
    document.querySelectorAll("[data-del-note]").forEach(function (b) { b.onclick = function () { state.notifications = state.notifications.filter(function (n) { return n.id !== b.dataset.delNote; }); saveState(); adminDashboard(); }; });
    document.querySelectorAll("[data-del-help]").forEach(function (b) { b.onclick = function () { state.help = state.help.filter(function (h) { return h.id !== b.dataset.delHelp; }); saveState(); adminDashboard(); }; });
    document.querySelectorAll("[data-pass]").forEach(function (b) { b.onclick = function () { const s = submissionById(b.dataset.pass); s.resultReleased = true; s.manualResult = ""; saveState(); adminDashboard(); }; });
    document.querySelectorAll("[data-fail]").forEach(function (b) { b.onclick = function () { const s = submissionById(b.dataset.fail); s.resultReleased = true; s.manualResult = "Fail"; saveState(); adminDashboard(); }; });
    document.querySelectorAll("[data-view]").forEach(function (b) { b.onclick = function () { showSubmission(b.dataset.view); }; });
  }

  function adminReviewResults() {
    return state.submissions.map(function (s) {
      const student = studentById(s.studentId);
      const test = testById(s.testId);
      const grade = gradeFromScore(s.score, s.total);
      return '<div class="notice"><div><b>' + esc(student ? student.name : "Student") + '</b> - ' + esc(test ? test.name : "Test") + '<br>' + s.score + '/' + s.total + ' | Login: ' + esc(student ? student.lastLoginAt : "-") + ' | Submit: ' + esc(s.submittedAt) + '<br><span class="' + (s.resultReleased ? grade.cls : "pending-text") + '">' + (s.resultReleased ? (s.manualResult || grade.text) : "Pending") + '</span> <span class="pdf-badge">Result PDF</span></div><div><button class="primary mini-btn" data-pass="' + s.id + '">Release Result</button> <button class="danger mini-btn" data-fail="' + s.id + '">Fail</button> <button class="ghost mini-btn" data-view="' + s.id + '">View</button></div></div>';
    }).join("");
  }

  function adminStudents() {
    const rows = state.students.map(function (s) {
      const results = state.submissions.filter(function (x) { return x.studentId === s.id; }).map(function (x) { const t = testById(x.testId); return (t ? t.subject : "Test") + " (" + x.score + "/" + x.total + ")"; }).join("<br>") || "-";
      return '<tr><td>' + esc(s.name) + '<br><span class="muted">' + esc(s.userId) + '</span></td><td>' + esc(s.email) + '<br>' + esc(s.mobile) + '</td><td><b>ID:</b><br>' + esc(s.userId) + '<br><b>Password:</b><br>' + esc(s.password) + '</td><td>' + s.loginCount + '<br><span class="muted">' + esc(s.lastLoginAt || "-") + '</span></td><td>' + state.submissions.filter(function (x) { return x.studentId === s.id; }).length + '</td><td>' + results + '</td><td>' + (s.blocked ? "Blocked" : "Active") + '<br><span class="muted">' + esc(s.activeSession ? s.activeSession.device : "Not logged in") + '</span></td><td><button class="' + (s.blocked ? "primary" : "danger") + ' mini-btn" data-block="' + s.id + '">' + (s.blocked ? "Unblock" : "Block") + '</button> ' + (s.activeSession ? '<button class="ghost mini-btn" data-force="' + s.id + '">Logout</button>' : '') + '</td></tr>';
    }).join("");
    document.getElementById("adminContent").innerHTML = '<div class="row-between"><h1>Student Accounts</h1><button class="primary" id="addStudent">Add Student</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Email / Mobile</th><th>ID / Password</th><th>Login</th><th>Total Tests</th><th>Test Results</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    document.getElementById("addStudent").onclick = showStudentModal;
    document.querySelectorAll("[data-block]").forEach(function (b) { b.onclick = function () { const s = studentById(b.dataset.block); s.blocked = !s.blocked; if (s.blocked) s.activeSession = null; saveState(); adminStudents(); }; });
    document.querySelectorAll("[data-force]").forEach(function (b) { b.onclick = function () { studentById(b.dataset.force).activeSession = null; saveState(); adminStudents(); }; });
  }

  function showStudentModal() {
    openModal('<h2>Add Student Account</h2><p class="muted">Yahan student ki ID aur password sirf admin banayega. Student wahi ID/password use karke login karega.</p><div class="form-grid"><label class="field">Student Name<input id="newName"></label><label class="field">Email<input id="newEmail"></label><label class="field">Mobile<input id="newMobile"></label><label class="field">User ID<input id="newUserId" placeholder="Generate karein ya apni ID likhein"></label><label class="field">Password<input id="newPassword" placeholder="Generate karein ya apna password likhein"></label><div class="span-2"><button class="ghost mini-btn" id="generateUserId">Generate ID</button> <button class="ghost mini-btn" id="generatePassword">Generate Password</button></div></div><button class="primary" id="saveStudent">Save Student</button>');
    document.getElementById("generateUserId").onclick = function () { document.getElementById("newUserId").value = "NSK" + Math.floor(100000 + Math.random() * 900000); };
    document.getElementById("generatePassword").onclick = function () { document.getElementById("newPassword").value = Math.random().toString(36).slice(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000); };
    document.getElementById("saveStudent").onclick = function () {
      if (!val("newUserId") || !val("newPassword")) { alert("Student ID aur password zaroor dalein ya Generate ID/Password dabayein."); return; }
      state.students.push({ id: makeId("student"), name: val("newName") || "New Student", email: val("newEmail"), mobile: val("newMobile"), userId: val("newUserId"), password: val("newPassword"), blocked: false, loginCount: 0, activeSession: null, lastLoginAt: "" });
      closeModal();
      saveState();
      adminStudents();
    };
  }


  function makeStudentLoginId(name, city) {
    const namePart = String(name || "NSK").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5) || "NSK";
    const cityPart = String(city || "MAA").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3) || "MAA";
    return "MS-" + cityPart + "-" + namePart + "-" + Math.floor(1000 + Math.random() * 9000);
  }

  function makeStudentPassword() {
    return "NSK@" + Math.floor(1000 + Math.random() * 9000);
  }

  function adminGenerateId() {
    document.getElementById("adminContent").innerHTML = '<div class="id-page"><h1>ID/password generate karein</h1><div class="form-grid"><label class="field">Student Name<input id="genName" placeholder="Example: Rahul Kumar"></label><label class="field">Course<select id="genCourse"><option>All Computer Courses</option><option>Basic Computer</option><option>DCA</option><option>ADCA</option><option>CPCT</option><option>Tally</option></select></label><label class="field">City<input id="genCity" placeholder="Example: Indergarh"></label><label class="field">Mobile Number<input id="genMobile" placeholder="Example: 9876543210"></label><label class="field span-2">Gmail ID<input id="genEmail" placeholder="Example: student@gmail.com"></label></div><button class="primary" id="generateStudentCard">ID generate karein</button><div id="generatedCardArea"></div></div>';
    document.getElementById("generateStudentCard").onclick = function () {
      const name = val("genName");
      const course = val("genCourse") || "All Computer Courses";
      const city = val("genCity") || "Indergarh";
      const mobile = val("genMobile");
      const email = val("genEmail");
      if (!name || !mobile || !email) { alert("Student Name, Mobile Number aur Gmail ID zaroor dalein."); return; }
      const loginId = makeStudentLoginId(name, city);
      const password = makeStudentPassword();
      const student = { id: makeId("student"), name: name, email: email, mobile: mobile, city: city, course: course, userId: loginId, password: password, blocked: false, loginCount: 0, activeSession: null, lastLoginAt: "" };
      state.students.push(student);
      saveState();
      document.getElementById("generatedCardArea").innerHTML = generatedIdCard(student);
      document.getElementById("copyGenerated").onclick = function () { copyGeneratedText(student); };
      document.getElementById("printGenerated").onclick = function () { window.print(); };
      document.getElementById("deleteGenerated").onclick = function () { state.students = state.students.filter(function (s) { return s.id !== student.id; }); saveState(); document.getElementById("generatedCardArea").innerHTML = ""; };
    };
  }

  function generatedIdCard(student) {
    return '<section class="id-card"><div class="id-card-head"><h2>COMPUTER MCQ BY NSK SIR</h2><p>Authorized institute login</p></div><div class="id-card-body"><h3>' + esc(student.name) + '</h3><p class="muted">' + esc(student.city || "Indergarh") + ' - ' + new Date().toLocaleDateString() + '</p><div class="id-row"><span>ID</span><b>' + esc(student.userId) + '</b></div><div class="id-row"><span>Password</span><b>' + esc(student.password) + '</b></div><div class="id-row"><span>Course</span><b>' + esc(student.course || "All Computer Courses") + '</b></div><div class="id-row"><span>Director</span><b>Director - Nsk Kushwaha (NSK)</b></div><div class="id-row"><span>Contact</span><b>9179424002</b></div><div class="id-row"><span>Email</span><b>Narendrakushwaha1674@gmail.com</b></div><div class="id-actions"><button class="ghost" id="copyGenerated">Copy</button><button class="ghost" id="printGenerated">Print</button><button class="ghost danger-text" id="deleteGenerated">Delete</button></div></div></section>';
  }

  function copyGeneratedText(student) {
    const text = 'COMPUTER MCQ BY NSK SIR\nStudent: ' + student.name + '\nID: ' + student.userId + '\nPassword: ' + student.password + '\nCourse: ' + student.course + '\nDirector: Nsk Kushwaha (NSK)\nContact: 9179424002\nEmail: Narendrakushwaha1674@gmail.com';
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    alert("ID/password copy ho gaya.");
  }

  function adminTests() {
    const rows = state.tests.map(function (t) { return '<tr><td>' + esc(t.subject) + '</td><td>' + esc(t.name) + '</td><td>' + esc(t.date) + '</td><td>' + t.questions.length + '</td><td>' + t.attempts + '</td><td><button class="primary mini-btn" data-edit-test="' + t.id + '">Edit MCQ</button> <button class="danger mini-btn" data-delete-test="' + t.id + '">Delete Test</button></td></tr>'; }).join("");
    document.getElementById("adminContent").innerHTML = '<div class="row-between"><h1>Test Names</h1><button class="primary" id="addTest">Add New Test</button></div><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Test Name</th><th>Date</th><th>Questions</th><th>Attempts</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    document.getElementById("addTest").onclick = function () { addNewTest(true); };
    document.querySelectorAll("[data-edit-test]").forEach(function (b) { b.onclick = function () { adminTab = "questions"; renderAdmin(); editTest(b.dataset.editTest); }; });
    document.querySelectorAll("[data-delete-test]").forEach(function (b) { b.onclick = function () { state.tests = state.tests.filter(function (t) { return t.id !== b.dataset.deleteTest; }); saveState(); adminTests(); }; });
  }

  function adminQuestions() {
    document.getElementById("adminContent").innerHTML = '<div class="row-between"><h1>Daily Tests</h1><div><button class="ghost" id="addNewTest">Add New Test</button> <button class="primary" id="saveAllTests">Save All Tests</button></div></div><p class="muted">Yahan admin alag-alag date ke tests upload kar sakta hai. Purane test me galti ho to edit karke Save All Tests karein.</p><div id="editorArea"></div>';
    document.getElementById("addNewTest").onclick = function () { addNewTest(false); };
    document.getElementById("saveAllTests").onclick = function () { collectEditors(); saveState(); alert("All tests saved."); adminQuestions(); };
    editTest(state.tests[0] && state.tests[0].id);
  }

  function editTest(testId) {
    const test = testById(testId) || state.tests[0];
    if (!test) return;
    document.getElementById("editorArea").innerHTML = '<div class="mcq-editor" data-editor-test="' + test.id + '"><label class="field span-2">Subject Headline<input id="subject-' + test.id + '" value="' + attr(test.subject) + '"></label><div class="form-grid"><label class="field">Test Name<input id="name-' + test.id + '" value="' + attr(test.name) + '"></label><label class="field">Test Date<input id="date-' + test.id + '" value="' + attr(test.date) + '"></label></div><h2>' + esc(test.name) + '</h2><button class="ghost mini-btn" data-clear-all="' + test.id + '">Clear All MCQ</button><div id="questions-' + test.id + '">' + test.questions.map(function (q, i) { return editorQuestion(q, i); }).join("") + '</div></div>';
    document.querySelector("[data-clear-all]").onclick = function () { test.questions = defaultQuestions().map(function (q) { q.text = ""; q.a = ""; q.b = ""; q.c = ""; q.d = ""; q.correct = "A"; return q; }); saveState(); editTest(test.id); };
    document.querySelectorAll("[data-clear-q]").forEach(function (b) { b.onclick = function () { const q = test.questions[Number(b.dataset.clearQ)]; q.text = q.a = q.b = q.c = q.d = ""; q.correct = "A"; saveState(); editTest(test.id); }; });
    document.querySelectorAll("[data-delete-q]").forEach(function (b) { b.onclick = function () { test.questions.splice(Number(b.dataset.deleteQ), 1); saveState(); editTest(test.id); }; });
  }

  function editorQuestion(q, i) {
    return '<div class="mcq-editor"><b>Question ' + (i + 1) + '</b><label class="field">Question<textarea data-q="' + i + '" data-k="text">' + esc(q.text) + '</textarea></label><div class="form-grid"><label class="field">Option A<input data-q="' + i + '" data-k="a" value="' + attr(q.a) + '"></label><label class="field">Option B<input data-q="' + i + '" data-k="b" value="' + attr(q.b) + '"></label><label class="field">Option C<input data-q="' + i + '" data-k="c" value="' + attr(q.c) + '"></label><label class="field">Option D<input data-q="' + i + '" data-k="d" value="' + attr(q.d) + '"></label></div><label class="field">Correct Option<select data-q="' + i + '" data-k="correct">' + ["A", "B", "C", "D"].map(function (x) { return '<option ' + (q.correct === x ? "selected" : "") + '>' + x + '</option>'; }).join("") + '</select></label><div class="row-between"><button class="ghost mini-btn" data-clear-q="' + i + '">Clear This MCQ</button><button class="danger mini-btn" data-delete-q="' + i + '">Delete This MCQ</button></div></div>';
  }

  function collectEditors() {
    const box = document.querySelector("[data-editor-test]");
    if (!box) return;
    const test = testById(box.dataset.editorTest);
    test.subject = val("subject-" + test.id);
    test.name = val("name-" + test.id);
    test.date = val("date-" + test.id);
    box.querySelectorAll("[data-q]").forEach(function (el) {
      const q = test.questions[Number(el.dataset.q)];
      if (q) q[el.dataset.k] = el.value;
    });
  }

  function addNewTest(goTestsTab) {
    collectEditors();
    const test = { id: makeId("test"), subject: "Computer MCQ", name: "Daily Test " + (state.tests.length + 1), date: new Date().toLocaleDateString(), attempts: 1, questions: defaultQuestions() };
    state.tests.push(test);
    saveState();
    if (goTestsTab) adminTests();
    else editTest(test.id);
  }

  function renderStudent() {
    const student = studentById(session.studentId);
    if (!student || !student.activeSession || student.activeSession.id !== session.sessionId || student.blocked) {
      saveSession(null);
      route = "student-login";
      return renderStudentLogin();
    }
    app.innerHTML = header("") + '<main class="layout">' + studentNav() + '<section class="panel" id="studentContent"></section></main>';
    document.querySelectorAll("[data-student-tab]").forEach(function (btn) {
      btn.onclick = function () {
        if (btn.dataset.studentTab === "logout") return logout();
        studentTab = btn.dataset.studentTab;
        renderStudent();
      };
    });
    if (studentTab === "results") studentResults();
    else studentTests();
  }

  function studentTests() {
    document.getElementById("studentContent").innerHTML = '<div class="row-between"><div><h1>100 mcq Test Nsk Sir</h1><p class="muted">60 minute timer | Result PDF available</p></div><div class="timer">60:00</div></div>' + state.tests.map(function (t) { return '<div class="test-card"><b>' + esc(t.subject) + '</b><p class="muted">' + esc(t.name) + ' | Date: ' + esc(t.date) + ' | ' + '100 MCQ | 60 minute | Result PDF | Is test ko dobara bhi attempt kar sakte hain.</p><button class="primary" data-start="' + t.id + '">Start Test</button></div>'; }).join("") + '<div class="pager"><button class="light" disabled>Previous</button><div><button class="light" disabled>Next</button> <button class="primary" disabled>Submit</button></div></div>';
    document.querySelectorAll("[data-start]").forEach(function (b) { b.onclick = function () { startTest(b.dataset.start); }; });
  }

  function startTest(testId) {
    running = { testId: testId, index: 0, answers: {}, startedAt: nowText(), endsAt: Date.now() + 60 * 60 * 1000 };
    renderRunningTest();
  }

  function renderRunningTest() {
    const test = testById(running.testId);
    const q = test.questions[running.index];
    document.getElementById("studentContent").innerHTML = '<div class="row-between"><div><h1>' + esc(test.name) + '</h1><p class="muted">' + esc(test.subject) + ' | Question ' + (running.index + 1) + ' of ' + test.questions.length + '</p></div><div class="timer" id="timer">60:00</div></div><div class="question-box"><div class="question-title">' + (running.index + 1) + '. ' + esc(q.text) + '</div><div class="options">' + ["A", "B", "C", "D"].map(function (k) { return '<label class="option ' + (running.answers[q.id] === k ? "selected" : "") + '"><input type="radio" name="answer" value="' + k + '" ' + (running.answers[q.id] === k ? "checked" : "") + '> <b>' + k + '.</b> ' + esc(q[k.toLowerCase()]) + '</label>'; }).join("") + '</div></div><label class="field" style="margin-top:16px;">Help / Wrong Question Report<textarea id="helpText" placeholder="Agar question galat hai to yahan likh kar bhejein"></textarea></label><button class="ghost" id="sendHelp">Send Help</button><div class="pager"><button class="light" id="prevQ" ' + (running.index === 0 ? "disabled" : "") + '>Previous</button><div><button class="light" id="nextQ" ' + (running.index === test.questions.length - 1 ? "disabled" : "") + '>Next</button> <button class="primary" id="submitTest">Submit</button></div></div>';
    document.querySelectorAll("input[name=answer]").forEach(function (r) { r.onchange = function () { running.answers[q.id] = r.value; renderRunningTest(); }; });
    document.getElementById("prevQ").onclick = function () { running.index--; renderRunningTest(); };
    document.getElementById("nextQ").onclick = function () { running.index++; renderRunningTest(); };
    document.getElementById("submitTest").onclick = submitRunningTest;
    document.getElementById("sendHelp").onclick = function () {
      const text = val("helpText");
      if (!text) return;
      const student = studentById(session.studentId);
      state.help.unshift({ id: makeId("help"), student: student.name, test: test.name, text: text, time: nowText() });
      saveState();
      alert("Help request admin ko bhej di gayi hai.");
    };
    tickTimer();
    timerHandle = setInterval(tickTimer, 1000);
  }

  function tickTimer() {
    if (!running) return;
    const left = Math.max(0, running.endsAt - Date.now());
    const min = String(Math.floor(left / 60000)).padStart(2, "0");
    const sec = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    const el = document.getElementById("timer");
    if (el) el.textContent = min + ":" + sec;
    if (left <= 0) submitRunningTest();
  }

  function submitRunningTest() {
    const test = testById(running.testId);
    let score = 0;
    const detail = test.questions.map(function (q) {
      const given = running.answers[q.id] || "";
      const correct = given === q.correct;
      if (correct) score++;
      return { qid: q.id, given: given, correct: correct };
    });
    state.submissions.unshift({ id: makeId("sub"), studentId: session.studentId, testId: test.id, score: score, total: test.questions.length, detail: detail, startedAt: running.startedAt, submittedAt: nowText(), resultReleased: false, manualResult: "" });
    state.notifications.unshift({ id: makeId("note"), title: "Test submitted", text: studentById(session.studentId).name + " ne " + test.name + " jama kiya.", time: nowText() });
    saveState();
    running = null;
    studentTab = "results";
    renderStudent();
  }

  function studentResults() {
    const rows = state.submissions.filter(function (s) { return s.studentId === session.studentId; }).map(function (s) {
      const grade = s.resultReleased ? gradeFromScore(s.score, s.total) : { text: "Pending", cls: "pending-text" };
      return '<tr><td>' + esc(testById(s.testId) ? testById(s.testId).subject : "Test") + '</td><td>' + esc(s.submittedAt) + '</td><td>' + s.score + '/' + s.total + '</td><td><span class="' + grade.cls + '">' + (s.manualResult || grade.text) + '</span><br><span class="pdf-badge">Result PDF</span></td><td><button class="primary mini-btn" data-view="' + s.id + '">View</button></td></tr>';
    }).join("");
    document.getElementById("studentContent").innerHTML = '<h1>My Results</h1><div class="table-wrap"><table><thead><tr><th>Test</th><th>Date</th><th>Number</th><th>Result</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    document.querySelectorAll("[data-view]").forEach(function (b) { b.onclick = function () { showSubmission(b.dataset.view); }; });
  }

  function showSubmission(id) {
    const sub = submissionById(id);
    const test = testById(sub.testId);
    openModal('<div class="row-between"><h2>' + esc(test.name) + ' - ' + sub.score + '/' + sub.total + '</h2><button class="ghost" id="closeModal">Close</button></div>' + test.questions.map(function (q, i) {
      const d = sub.detail.find(function (x) { return x.qid === q.id; }) || {};
      return '<div class="question-box ' + (d.correct ? "answer-correct" : "answer-wrong") + '"><div class="question-title"><span class="answer-mark ' + (d.correct ? "mark-ok" : "mark-bad") + '">' + (d.correct ? "✓" : "×") + '</span>' + (i + 1) + '. ' + esc(q.text) + '</div><p><b>Your Answer:</b> ' + esc(d.given || "Blank") + '</p><p><b>Correct Answer:</b> ' + esc(q.correct) + ' - ' + esc(q[q.correct.toLowerCase()]) + '</p></div>';
    }).join(""));
    document.getElementById("closeModal").onclick = closeModal;
  }

  function logout() {
    if (session && session.role === "student") {
      const s = studentById(session.studentId);
      if (s && s.activeSession && s.activeSession.id === session.sessionId) s.activeSession = null;
      saveState();
    }
    saveSession(null);
    route = "admin-login";
    location.hash = "";
    render();
  }

  function testById(id) { return state.tests.find(function (t) { return t.id === id; }); }
  function studentById(id) { return state.students.find(function (s) { return s.id === id; }); }
  function submissionById(id) { return state.submissions.find(function (s) { return s.id === id; }); }
  function val(id) { return (document.getElementById(id) && document.getElementById(id).value.trim()) || ""; }
  function esc(text) { return String(text || "").replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]; }); }
  function attr(text) { return esc(text).replace(/"/g, "&quot;"); }

  function openModal(html) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modal";
    modal.innerHTML = '<div class="modal-card">' + html + '</div>';
    document.body.appendChild(modal);
    modal.onclick = function (e) { if (e.target === modal) closeModal(); };
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.remove();
  }

  window.onhashchange = function () {
    route = location.hash.replace("#", "") || "admin-login";
    render();
  };

  render();
})();






