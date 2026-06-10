const DEFAULT_ADMIN_ID = 'Nsk computers';
const DEFAULT_ADMIN_PASSWORD = 'Nsk@4002';
const ADMIN_EMAIL = 'Narendrakushwaha1674@gmail.com';
const ADMIN_MOBILE = '9179424002';
const QUIZ_MINUTES = 60;
const storeKey = 'nskQuizSiteDataV1';
const sessionKey = 'nskQuizCurrentSessionV1';

const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const defaultQuestions = Array.from({ length: 60 }, (_, i) => ({
  id: 'q' + (i + 1),
  text: 'Question ' + (i + 1) + ': Computer practice MCQ ka sahi answer select karein?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correct: i % 4
}));

let data = loadData();
let currentUser = null;
let quiz = null;
let timerHandle = null;
let forgotMode = 'student';
let forgotOtpState = null;

function loadData() {
  const raw = localStorage.getItem(storeKey);
  const fresh = {
    students: [],
    attempts: [],
    notifications: [],
    blockedContacts: [],
    activeSessions: {},
    admin: { id: DEFAULT_ADMIN_ID, password: DEFAULT_ADMIN_PASSWORD, email: ADMIN_EMAIL, mobile: ADMIN_MOBILE },
    tests: [{ id: 'test-default', title: 'Daily Test 1', subject: 'Computer MCQ', date: new Date().toLocaleDateString(), questions: defaultQuestions }]
  };
  if (!raw) {
    localStorage.setItem(storeKey, JSON.stringify(fresh));
    return fresh;
  }
  const parsed = JSON.parse(raw);
  parsed.students ||= [];
  parsed.attempts ||= [];
  parsed.notifications ||= [];
  parsed.blockedContacts ||= [];
  parsed.activeSessions ||= {};
  parsed.admin ||= fresh.admin;
  if (!parsed.tests || !parsed.tests.length) parsed.tests = fresh.tests;
  parsed.tests = parsed.tests.map((test, index) => ({
    id: test.id || uid(),
    title: test.title || 'Daily Test ' + (index + 1),
    subject: test.subject || 'Computer MCQ',
    date: test.date || new Date().toLocaleDateString(),
    questions: test.questions && test.questions.length ? test.questions : defaultQuestions
  }));
  return parsed;
}

function saveData() { localStorage.setItem(storeKey, JSON.stringify(data)); }
function saveSession(session) { localStorage.setItem(sessionKey, JSON.stringify(session)); }
function clearSession() { localStorage.removeItem(sessionKey); }

function restoreSession() {
  const raw = localStorage.getItem(sessionKey);
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    if (session.type === 'admin' && session.adminId === data.admin.id) {
      currentUser = { name: 'Admin - ' + data.admin.id };
      show('adminView');
      renderAdminDashboard();
      return true;
    }
    if (session.type === 'student') {
      const student = data.students.find((s) => s.id === session.studentId);
      if (student && !student.blocked && !data.blockedContacts.includes(student.email) && !data.blockedContacts.includes(student.mobile)) {
        currentUser = student;
        startStudent();
        return true;
      }
    }
  } catch (error) {
    clearSession();
  }
  clearSession();
  return false;
}

function show(view) {
  ['authView', 'studentView', 'adminView', 'reviewView'].forEach((id) => $(id).classList.add('hidden'));
  $(view).classList.remove('hidden');
  $('topUser').textContent = currentUser ? currentUser.name || currentUser.firstName + ' ' + currentUser.surname : '';
}

function setAuthMode(mode) {
  $('loginForm').classList.toggle('hidden', mode !== 'login');
  $('registerForm').classList.toggle('hidden', mode !== 'register');
  $('adminLoginForm').classList.toggle('hidden', mode !== 'admin');
  $('forgotForm').classList.toggle('hidden', mode !== 'forgot');
  $('loginTab').classList.toggle('active', mode === 'login');
  $('registerTab').classList.toggle('active', mode === 'register');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}

function toast(message) { alert(message); }
function otp4() { return Math.floor(1000 + Math.random() * 9000).toString(); }
function otp6() { return Math.floor(100000 + Math.random() * 900000).toString(); }

$('loginTab').onclick = () => setAuthMode('login');
$('registerTab').onclick = () => setAuthMode('register');
$('openAdminLogin').onclick = () => setAuthMode('admin');
$('backStudentLogin').onclick = () => setAuthMode('login');
$('forgotStudent').onclick = () => openForgot('student');
$('forgotAdmin').onclick = () => openForgot('admin');
$('backFromForgot').onclick = () => setAuthMode(forgotMode === 'admin' ? 'admin' : 'login');

function openForgot(mode) {
  forgotMode = mode;
  forgotOtpState = null;
  $('forgotTitle').textContent = mode === 'admin' ? 'Admin Forget ID or Password' : 'Student Forget ID or Password';
  $('forgotForm').reset();
  setAuthMode('forgot');
}

$('registerForm').onsubmit = (event) => {
  event.preventDefault();
  const student = {
    id: uid(),
    firstName: $('firstName').value.trim(),
    surname: $('surname').value.trim(),
    email: $('email').value.trim().toLowerCase(),
    mobile: $('mobile').value.trim(),
    otpChoice: $('otpChoice').value,
    studentId: $('studentId').value.trim(),
    password: $('studentPassword').value,
    blocked: false,
    createdAt: new Date().toLocaleString(),
    loginCount: 0
  };
  const duplicate = data.students.some((s) => s.studentId.toLowerCase() === student.studentId.toLowerCase() || s.email === student.email || s.mobile === student.mobile);
  const blocked = data.blockedContacts.includes(student.email) || data.blockedContacts.includes(student.mobile);
  if (duplicate) return toast('Ye ID, email ya mobile pehle se registered hai.');
  if (blocked) return toast('Ye email/mobile admin dwara blocked hai.');
  const otp = otp6();
  if (prompt('OTP aapke mobile number ' + student.mobile + ' par bheja gaya hai. Demo OTP: ' + otp) !== otp) return toast('wrong otp');
  data.students.push(student);
  data.notifications.unshift({ id: uid(), type: 'New student account', text: student.firstName + ' ' + student.surname + ' ne account banaya.', at: new Date().toLocaleString() });
  saveData();
  event.target.reset();
  setAuthMode('login');
  toast('Account ban gaya. Ab login karein.');
};

$('loginForm').onsubmit = (event) => {
  event.preventDefault();
  const login = $('loginId').value.trim().toLowerCase();
  const password = $('loginPassword').value;
  const student = data.students.find((s) => [s.studentId.toLowerCase(), s.email, s.mobile].includes(login) && s.password === password);
  if (!student) return toast('Login details galat hain.');
  if (student.blocked || data.blockedContacts.includes(student.email) || data.blockedContacts.includes(student.mobile)) return toast('Aapka account blocked hai.');
  if (data.activeSessions[student.id]) {
    const otp = otp6();
    if (prompt('Ye ID already login hai. Demo OTP ' + otp + ' enter karein:') !== otp) return toast('OTP galat hai.');
  }
  student.loginCount += 1;
  data.activeSessions[student.id] = uid();
  data.notifications.unshift({ id: uid(), type: 'Student login', text: student.firstName + ' ' + student.surname + ' login hua.', at: new Date().toLocaleString() });
  saveData();
  saveSession({ type: 'student', studentId: student.id, sessionId: data.activeSessions[student.id] });
  currentUser = student;
  startStudent();
};

$('adminLoginForm').onsubmit = (event) => {
  event.preventDefault();
  if ($('adminId').value === data.admin.id && $('adminPassword').value === data.admin.password) {
    currentUser = { name: 'Admin - ' + data.admin.id };
    saveSession({ type: 'admin', adminId: data.admin.id });
    show('adminView');
    renderAdminDashboard();
  } else {
    toast('Admin ID ya password galat hai.');
  }
};

$('sendForgotOtp').onclick = () => {
  const idValue = $('forgotId').value.trim();
  const contact = $('forgotContact').value.trim().toLowerCase();
  const channel = $('forgotOtpChannel').value;
  const target = forgotMode === 'admin'
    ? (data.admin.id === idValue && [data.admin.email.toLowerCase(), data.admin.mobile].includes(contact) ? { id: 'admin', email: data.admin.email, mobile: data.admin.mobile } : null)
    : data.students.find((s) => s.studentId.toLowerCase() === idValue.toLowerCase() && [s.email, s.mobile].includes(contact));
  if (!target) return toast('ID aur registered email/mobile match nahi hua.');
  const expected = channel === 'email' ? target.email.toLowerCase() : target.mobile;
  if (contact !== expected) return toast(channel === 'email' ? 'Registered email galat hai.' : 'Registered mobile galat hai.');
  const otp = otp4();
  forgotOtpState = { mode: forgotMode, targetId: target.id, otp };
  toast('4 digit OTP ' + expected + ' par bheja gaya. Demo OTP: ' + otp);
};

$('forgotForm').onsubmit = (event) => {
  event.preventDefault();
  if (!forgotOtpState) return toast('Pehle OTP send karein.');
  if ($('forgotOtp').value.trim() !== forgotOtpState.otp) return toast('wrong otp');
  const newId = $('newForgotId').value.trim();
  const newPassword = $('newForgotPassword').value;
  if (!newId || !newPassword) return toast('New ID aur New Password dono dalein.');
  if (forgotOtpState.mode === 'admin') {
    data.admin.id = newId;
    data.admin.password = newPassword;
    saveData();
    toast('Admin ID/password change ho gaya.');
    return setAuthMode('admin');
  }
  const student = data.students.find((s) => s.id === forgotOtpState.targetId);
  if (!student) return toast('Student account nahi mila.');
  if (data.students.some((s) => s.id !== student.id && s.studentId.toLowerCase() === newId.toLowerCase())) return toast('Ye new ID kisi aur account me hai.');
  student.studentId = newId;
  student.password = newPassword;
  saveData();
  toast('Student ID/password change ho gaya. Ab login karein.');
  setAuthMode('login');
};

function startStudent() {
  show('studentView');
  $('quizPanel').classList.remove('hidden');
  $('resultPanel').classList.add('hidden');
  $('historyPanel').classList.add('hidden');
  $('navQuiz').classList.add('active');
  $('navHistory').classList.remove('active');
  renderAvailableTests();
}

function renderAvailableTests() {
  clearInterval(timerHandle);
  quiz = null;
  $('timer').textContent = '60:00';
  $('questionNav').innerHTML = '';
  $('questionBox').innerHTML = '';
  $('submitQuiz').disabled = true;
  $('prevQuestion').disabled = true;
  $('nextQuestion').disabled = true;
  $('testList').innerHTML = '<div class="section-title"><h3>Available Tests</h3></div><div class="review-list">' +
    data.tests.map((test) => '<div class="review-item"><b>' + escapeHtml(test.subject) + '</b><p class="hint">' + escapeHtml(test.title) + ' | Date: ' + escapeHtml(test.date) + ' | ' + test.questions.length + ' questions</p><button type="button" onclick="initQuiz(\'' + test.id + '\')">Start Test</button></div>').join('') +
    '</div>';
}

function initQuiz(testId) {
  const test = data.tests.find((t) => t.id === testId);
  if (!test) return toast('Test nahi mila.');
  clearInterval(timerHandle);
  quiz = { test, index: 0, answers: Array(test.questions.length).fill(null), remaining: QUIZ_MINUTES * 60, startedAt: new Date().toLocaleString() };
  $('testList').innerHTML = '<div class="metric"><b>' + escapeHtml(test.subject) + '</b><span>' + escapeHtml(test.title) + ' | ' + escapeHtml(test.date) + '</span></div>';
  $('submitQuiz').disabled = false;
  renderQuestionNav();
  renderQuestion();
  tick();
  timerHandle = setInterval(() => {
    quiz.remaining -= 1;
    tick();
    if (quiz.remaining <= 0) submitQuiz(true);
  }, 1000);
}

function tick() {
  const m = String(Math.max(0, Math.floor(quiz.remaining / 60))).padStart(2, '0');
  const s = String(Math.max(0, quiz.remaining % 60)).padStart(2, '0');
  $('timer').textContent = m + ':' + s;
}

function renderQuestionNav() {
  $('questionNav').innerHTML = quiz.test.questions.map((q, i) => '<button type="button" class="qdot ' + (quiz.answers[i] !== null ? 'done ' : '') + (quiz.index === i ? 'current' : '') + '" onclick="goQuestion(' + i + ')">' + (i + 1) + '</button>').join('');
}

function goQuestion(i) {
  quiz.index = i;
  renderQuestionNav();
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.test.questions[quiz.index];
  $('questionBox').innerHTML = '<p class="question-text">' + (quiz.index + 1) + '. ' + escapeHtml(q.text) + '</p><div class="options">' +
    q.options.map((option, i) => '<label class="option"><input type="radio" name="answer" ' + (quiz.answers[quiz.index] === i ? 'checked' : '') + ' onchange="answerQuestion(' + i + ')"><span>' + escapeHtml(option) + '</span></label>').join('') +
    '</div>';
  $('prevQuestion').disabled = quiz.index === 0;
  $('nextQuestion').disabled = quiz.index === quiz.test.questions.length - 1;
}

function answerQuestion(optionIndex) {
  quiz.answers[quiz.index] = optionIndex;
  renderQuestionNav();
}

$('prevQuestion').onclick = () => goQuestion(Math.max(0, quiz.index - 1));
$('nextQuestion').onclick = () => goQuestion(Math.min(quiz.test.questions.length - 1, quiz.index + 1));
$('submitQuiz').onclick = () => submitQuiz(false);

function submitQuiz(auto) {
  if (!quiz) return;
  if (!auto && !confirm('Paper submit karna hai?')) return;
  clearInterval(timerHandle);
  const correct = quiz.test.questions.reduce((sum, q, i) => sum + (quiz.answers[i] === q.correct ? 1 : 0), 0);
  const attempt = {
    id: uid(),
    studentId: currentUser.id,
    studentName: currentUser.firstName + ' ' + currentUser.surname,
    testId: quiz.test.id,
    testTitle: quiz.test.title,
    testSubject: quiz.test.subject,
    questionsSnapshot: quiz.test.questions,
    answers: quiz.answers,
    correct,
    total: quiz.test.questions.length,
    startedAt: quiz.startedAt,
    submittedAt: new Date().toLocaleString()
  };
  data.attempts.unshift(attempt);
  saveData();
  renderResult(attempt);
}

function renderResult(attempt) {
  $('quizPanel').classList.add('hidden');
  $('historyPanel').classList.add('hidden');
  $('resultPanel').classList.remove('hidden');
  $('resultPanel').innerHTML = '<div class="section-title"><h2>Result</h2></div><div class="result-grid"><div class="metric"><b>' + attempt.correct + '</b><span>Correct</span></div><div class="metric"><b>' + (attempt.total - attempt.correct) + '</b><span>Wrong / Unanswered</span></div><div class="metric"><b>' + attempt.correct + '/' + attempt.total + '</b><span>Total Number</span></div></div><div class="actions"><button type="button" onclick="openReview(\'' + attempt.id + '\')">Check All MCQ</button><button class="secondary" type="button" onclick="initQuiz(\'' + attempt.testId + '\'); $(\'quizPanel\').classList.remove(\'hidden\'); $(\'resultPanel\').classList.add(\'hidden\')">Start Again</button></div>';
}

function openReview(attemptId) { window.open(location.href.split('#')[0] + '#review=' + attemptId, '_blank'); }

function renderReview(attemptId) {
  const attempt = data.attempts.find((a) => a.id === attemptId);
  show('reviewView');
  if (!attempt) return $('reviewView').innerHTML = '<div class="empty">Result nahi mila.</div>';
  const questions = attempt.questionsSnapshot || [];
  $('reviewView').innerHTML = '<div class="section-title"><div><h2>Compute Mcq By NSK SIR - Answer Review</h2><p class="hint">' + escapeHtml(attempt.testSubject) + ' | ' + escapeHtml(attempt.testTitle) + ' | ' + escapeHtml(attempt.studentName) + '</p></div><button class="no-print" onclick="window.print()">Download PDF</button></div><div class="result-grid"><div class="metric"><b>' + attempt.correct + '</b><span>Correct</span></div><div class="metric"><b>' + (attempt.total - attempt.correct) + '</b><span>Wrong</span></div><div class="metric"><b>' + attempt.correct + '/' + attempt.total + '</b><span>Total Number</span></div></div><div class="review-list">' +
    questions.map((q, qi) => '<div class="review-item"><b>' + (qi + 1) + '. ' + escapeHtml(q.text) + '</b><div class="review-options">' + q.options.map((opt, oi) => reviewOption(q, attempt.answers[qi], opt, oi)).join('') + '</div></div>').join('') +
    '</div><div class="metric"><b>' + attempt.correct + '/' + attempt.total + '</b><span>Pure Number</span></div>';
}

function reviewOption(q, selected, opt, oi) {
  const isCorrect = oi === q.correct;
  const isWrongSelected = selected === oi && !isCorrect;
  const mark = isCorrect ? '<span class="mark-ok">&#10003;</span>' : isWrongSelected ? '<span class="mark-bad">&#10007;</span>' : '<span></span>';
  const cls = isCorrect ? 'correct' : selected === oi ? 'selected' : '';
  return '<div class="review-option ' + cls + '">' + mark + '<span>' + escapeHtml(opt) + (selected === oi ? ' <b>(Your answer)</b>' : '') + '</span></div>';
}

$('navQuiz').onclick = () => startStudent();
$('navHistory').onclick = () => {
  $('navQuiz').classList.remove('active');
  $('navHistory').classList.add('active');
  $('quizPanel').classList.add('hidden');
  $('resultPanel').classList.add('hidden');
  $('historyPanel').classList.remove('hidden');
  const rows = data.attempts.filter((a) => a.studentId === currentUser.id);
  $('historyPanel').innerHTML = '<div class="section-title"><h2>My Results</h2></div>' + (rows.length ? '<table><thead><tr><th>Test</th><th>Date</th><th>Number</th><th>Action</th></tr></thead><tbody>' + rows.map((a) => '<tr><td>' + escapeHtml(a.testSubject || a.testTitle) + '</td><td>' + a.submittedAt + '</td><td>' + a.correct + '/' + a.total + '</td><td><button class="small" onclick="openReview(\'' + a.id + '\')">View</button></td></tr>').join('') + '</tbody></table>' : '<div class="empty">Abhi koi test submit nahi hua.</div>');
};

function renderAdminDashboard() {
  $('adminDashboard').innerHTML = '<div class="section-title"><h2>Admin Dashboard</h2></div><div class="admin-grid"><div class="metric"><b>' + data.students.length + '</b><span>Total Students</span></div><div class="metric"><b>' + data.tests.length + '</b><span>Total Tests</span></div><div class="metric"><b>' + data.attempts.length + '</b><span>Total Attempts</span></div></div><div class="section-title"><h3>Notifications</h3>' + (data.notifications.length ? '<button class="small danger" onclick="clearNotifications()">Clear All</button>' : '') + '</div>' + (data.notifications.length ? '<table><tbody>' + data.notifications.map((n) => '<tr><td><b>' + escapeHtml(n.type) + '</b><br>' + escapeHtml(n.text) + '<br><span class="hint">' + n.at + '</span></td><td><button class="small danger" onclick="deleteNotification(\'' + n.id + '\')">Delete</button></td></tr>').join('') + '</tbody></table>' : '<div class="empty">No notifications.</div>');
}

function renderAdminStudents() {
  const rows = data.students.map((s) => {
    const attempts = data.attempts.filter((a) => a.studentId === s.id);
    return '<tr><td>' + escapeHtml(s.firstName + ' ' + s.surname) + '<br><span class="hint">' + escapeHtml(s.studentId) + '</span></td><td>' + escapeHtml(s.email) + '<br>' + escapeHtml(s.mobile) + '</td><td><b>ID:</b> ' + escapeHtml(s.studentId) + '<br><b>Password:</b> ' + escapeHtml(s.password) + '</td><td>' + s.loginCount + '</td><td>' + attempts.length + '</td><td>' + (s.blocked ? '<span class="blocked">Blocked</span>' : 'Active') + '</td><td>' + (s.blocked ? '<button class="small" onclick="toggleBlock(\'' + s.id + '\', false)">Remove Block</button>' : '<button class="small danger" onclick="toggleBlock(\'' + s.id + '\', true)">Block</button>') + '</td></tr>';
  }).join('');
  $('adminStudents').innerHTML = '<div class="section-title"><h2>Student Accounts</h2></div>' + (data.students.length ? '<table><thead><tr><th>Student</th><th>Email / Mobile</th><th>ID / Password</th><th>Login</th><th>Tests</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No student accounts yet.</div>');
}

function renderAdminTests() {
  $('adminTests').innerHTML = '<div class="section-title"><h2>Test Names</h2><button onclick="addNewTest(); renderAdminTests()">Add New Test</button></div>' + (data.tests.length ? '<table><thead><tr><th>Subject</th><th>Test Name</th><th>Date</th><th>Questions</th><th>Action</th></tr></thead><tbody>' + data.tests.map((test) => '<tr><td>' + escapeHtml(test.subject) + '</td><td>' + escapeHtml(test.title) + '</td><td>' + escapeHtml(test.date) + '</td><td>' + test.questions.length + '</td><td><button class="small" onclick="openQuestionEditorForTest(\'' + test.id + '\')">Edit MCQ</button> <button class="small danger" onclick="deleteTest(\'' + test.id + '\')">Delete Test</button></td></tr>').join('') + '</tbody></table>' : '<div class="empty">Abhi koi test nahi hai.</div>');
}

function renderQuestionEditor() {
  $('adminQuestions').innerHTML = '<div class="section-title"><h2>Daily Tests</h2><div><button class="secondary" onclick="addNewTest()">Add New Test</button> <button onclick="saveQuestionEditor()">Save All Tests</button></div></div><div class="review-list">' +
    data.tests.map((test, ti) => '<div class="review-item"><div class="form-grid"><label class="full">Subject Headline<input id="testSubject' + ti + '" value="' + escapeHtml(test.subject) + '"></label><label>Test Name<input id="testTitle' + ti + '" value="' + escapeHtml(test.title) + '"></label><label>Test Date<input id="testDate' + ti + '" value="' + escapeHtml(test.date) + '"></label></div><div class="actions"><button class="secondary small" onclick="clearAllMcq(\'' + test.id + '\')">Clear All MCQ</button></div>' +
      test.questions.map((q, i) => '<div class="review-item"><label>Question ' + (i + 1) + '<textarea id="qt' + ti + '_' + i + '" rows="2">' + escapeHtml(q.text) + '</textarea></label><div class="form-grid">' + q.options.map((opt, oi) => '<label>Option ' + String.fromCharCode(65 + oi) + '<input id="qo' + ti + '_' + i + '_' + oi + '" value="' + escapeHtml(opt) + '"></label>').join('') + '<label class="full">Correct Option<select id="qc' + ti + '_' + i + '"><option value="0" ' + (q.correct === 0 ? 'selected' : '') + '>A</option><option value="1" ' + (q.correct === 1 ? 'selected' : '') + '>B</option><option value="2" ' + (q.correct === 2 ? 'selected' : '') + '>C</option><option value="3" ' + (q.correct === 3 ? 'selected' : '') + '>D</option></select></label></div><div class="actions"><button class="secondary small" onclick="clearMcq(\'' + test.id + '\',' + i + ')">Clear This MCQ</button><button class="danger small" onclick="deleteMcq(\'' + test.id + '\',' + i + ')">Delete This MCQ</button></div></div>').join('') +
    '</div>').join('') + '</div>';
}

function blankQuestion(index) { return { id: uid(), text: 'Question ' + (index + 1) + ':', options: ['', '', '', ''], correct: 0 }; }
function addNewTest() { data.tests.unshift({ id: uid(), title: 'Daily Test ' + (data.tests.length + 1), subject: 'Computer MCQ', date: new Date().toLocaleDateString(), questions: Array.from({ length: 60 }, (_, i) => blankQuestion(i)) }); saveData(); renderQuestionEditor(); }
function clearMcq(testId, index) { const test = data.tests.find((t) => t.id === testId); if (!test) return; test.questions[index] = blankQuestion(index); saveData(); renderQuestionEditor(); }
function deleteMcq(testId, index) { const test = data.tests.find((t) => t.id === testId); if (!test) return; test.questions.splice(index, 1); while (test.questions.length < 60) test.questions.push(blankQuestion(test.questions.length)); saveData(); renderQuestionEditor(); }
function clearAllMcq(testId) { const test = data.tests.find((t) => t.id === testId); if (!test) return; test.questions = Array.from({ length: 60 }, (_, i) => blankQuestion(i)); saveData(); renderQuestionEditor(); }

function saveQuestionEditor() {
  data.tests = data.tests.map((test, ti) => ({
    id: test.id,
    title: $('testTitle' + ti).value.trim() || test.title,
    subject: $('testSubject' + ti).value.trim() || test.subject,
    date: $('testDate' + ti).value.trim() || test.date,
    questions: test.questions.map((q, i) => ({ id: q.id, text: $('qt' + ti + '_' + i).value.trim(), options: [0, 1, 2, 3].map((oi) => $('qo' + ti + '_' + i + '_' + oi).value.trim()), correct: Number($('qc' + ti + '_' + i).value) }))
  }));
  saveData();
  toast('Tests save ho gaye.');
}

function deleteTest(testId) { const test = data.tests.find((t) => t.id === testId); if (!test) return; if (!confirm('"' + test.title + '" test delete karna hai?')) return; data.tests = data.tests.filter((t) => t.id !== testId); saveData(); renderAdminTests(); }
function openQuestionEditorForTest(testId) { $('adminQuestionNav').click(); setTimeout(() => { const index = data.tests.findIndex((t) => t.id === testId); const input = $('testSubject' + index); if (input) input.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 0); }
function deleteNotification(id) { data.notifications = data.notifications.filter((n) => n.id !== id); saveData(); renderAdminDashboard(); }
function clearNotifications() { data.notifications = []; saveData(); renderAdminDashboard(); }
function toggleBlock(id, block) { const student = data.students.find((s) => s.id === id); if (!student) return; student.blocked = block; if (block) data.blockedContacts = Array.from(new Set([...data.blockedContacts, student.email, student.mobile])); else data.blockedContacts = data.blockedContacts.filter((c) => c !== student.email && c !== student.mobile); saveData(); renderAdminStudents(); }

function setAdminPanel(panel) {
  ['adminDashboard', 'adminStudents', 'adminTests', 'adminQuestions'].forEach((id) => $(id).classList.add('hidden'));
  ['adminDashNav', 'adminStudentsNav', 'adminTestsNav', 'adminQuestionNav'].forEach((id) => $(id).classList.remove('active'));
  if (panel === 'dash') { $('adminDashboard').classList.remove('hidden'); $('adminDashNav').classList.add('active'); renderAdminDashboard(); }
  if (panel === 'students') { $('adminStudents').classList.remove('hidden'); $('adminStudentsNav').classList.add('active'); renderAdminStudents(); }
  if (panel === 'tests') { $('adminTests').classList.remove('hidden'); $('adminTestsNav').classList.add('active'); renderAdminTests(); }
  if (panel === 'questions') { $('adminQuestions').classList.remove('hidden'); $('adminQuestionNav').classList.add('active'); renderQuestionEditor(); }
}

$('adminDashNav').onclick = () => setAdminPanel('dash');
$('adminStudentsNav').onclick = () => setAdminPanel('students');
$('adminTestsNav').onclick = () => setAdminPanel('tests');
$('adminQuestionNav').onclick = () => setAdminPanel('questions');

$('logoutStudent').onclick = () => { clearInterval(timerHandle); if (currentUser) delete data.activeSessions[currentUser.id]; saveData(); clearSession(); currentUser = null; show('authView'); setAuthMode('login'); };
$('logoutAdmin').onclick = () => { currentUser = null; clearSession(); show('authView'); setAuthMode('login'); };

window.goQuestion = goQuestion;
window.answerQuestion = answerQuestion;
window.initQuiz = initQuiz;
window.openReview = openReview;
window.addNewTest = addNewTest;
window.saveQuestionEditor = saveQuestionEditor;
window.clearMcq = clearMcq;
window.deleteMcq = deleteMcq;
window.clearAllMcq = clearAllMcq;
window.deleteTest = deleteTest;
window.openQuestionEditorForTest = openQuestionEditorForTest;
window.deleteNotification = deleteNotification;
window.clearNotifications = clearNotifications;
window.toggleBlock = toggleBlock;
window.renderAdminTests = renderAdminTests;

const reviewMatch = location.hash.match(/^#review=(.+)$/);
if (reviewMatch) renderReview(reviewMatch[1]);
else if (!restoreSession()) show('authView');
