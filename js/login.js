(function () {
  var roles = {
    client: {
      title: 'Client Login',
      sub: 'Log in to send documents, check your spending and read alerts from your CPA.',
      label: 'Email address',
      placeholder: 'you@company.com',
      button: 'Log in to my portal',
      note: 'On the DCM & Co. team? Use the Staff tab.'
    },
    staff: {
      title: 'Staff Login',
      sub: 'Log in to check client risk, review alerts and manage client files.',
      label: 'Staff email',
      placeholder: 'name@dcmco.com',
      button: 'Log in to the staff portal',
      note: 'Are you a client? Use the Client tab.'
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var tabs = document.querySelectorAll('.role-switch button');
  var form = $('loginForm'), idInput = $('identifier'), pwInput = $('password');
  var status = $('status');
  var current = 'client';
  var mode = 'login';

  var signupForm = $('signupForm'), suName = $('suName'), suEmail = $('suEmail'),
      suPw = $('suPw'), suPw2 = $('suPw2'), suStatus = $('suStatus'), signupBtn = $('signupBtn');
  var roleSwitch = document.querySelector('.role-switch');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var ACCOUNTS_KEY = 'dcm_accounts';

  var signupCopy = {
    title: 'Create your client account',
    sub: 'Set up portal access in about a minute. You can upload documents as soon as you are in.',
    side: 'Create your account to upload receipts, track spending and read alerts from your CPA.'
  };

  function setRole(role, updateUrl) {
    if (!roles[role]) role = 'client';
    current = role;
    var r = roles[role];
    $('title').textContent = r.title;
    $('subtitle').textContent = r.sub;
    $('idLabel').textContent = r.label;
    idInput.placeholder = r.placeholder;
    $('submitBtn').textContent = r.button;
    $('note').textContent = r.note;
    document.title = r.title + ' | DCM & Co.';
    tabs.forEach(function (t) {
      var on = t.dataset.role === role;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
    hideStatus();
    if (updateUrl && window.history && history.replaceState) {
      history.replaceState(null, '', '?role=' + role);
    }
  }

  function paint(box, type, msg) { box.className = 'status show ' + type; box.textContent = msg; }
  function clearBox(box) { box.className = 'status'; box.textContent = ''; }
  function showStatus(type, msg) { paint(status, type, msg); }
  function hideStatus() { clearBox(status); }

  function setInvalid(fieldId, bad) {
    $(fieldId).classList.toggle('invalid', bad);
    $(fieldId).querySelector('.input-wrap').classList.toggle('invalid', bad);
  }

  function checkEmail() {
    var v = idInput.value.trim(), ok = EMAIL_RE.test(v);
    $('idError').textContent = !v ? 'Enter your email so we know who\u2019s logging in.' : 'That email doesn\u2019t look right. Try something like name@company.com.';
    setInvalid('idField', !ok);
    return ok;
  }
  function checkPw() { var ok = pwInput.value.length > 0; setInvalid('pwField', !ok); return ok; }
  idInput.addEventListener('blur', function (e) { if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('button')) return; if (idInput.value.trim()) checkEmail(); });

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { setRole(t.dataset.role, true); });
  });

  var EYE_OPEN = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
  var EYE_SHUT = '<path d="M17.9 17.9A10.9 10.9 0 0112 19C5 19 1 12 1 12a18.5 18.5 0 015.1-5.9M9.9 4.2A10.5 10.5 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M14.1 14.1a3 3 0 11-4.2-4.2"/><path d="M1 1l22 22"/>';
  Array.prototype.forEach.call(document.querySelectorAll('.toggle-pw'), function (btn) {
    var input = $(btn.dataset.pw);
    if (!input) return;
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('svg').innerHTML = show ? EYE_SHUT : EYE_OPEN;
    });
  });

  $('forgot').addEventListener('click', function (e) {
    e.preventDefault();
    showStatus('info', 'Password reset isn\u2019t available yet. Ask your administrator to reset it for you.');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideStatus();

    var emailOk = checkEmail(), pwOk = checkPw();
    if (!emailOk) { idInput.focus(); return; }
    if (!pwOk) { pwInput.focus(); return; }

    // TODO: replace with a real server check (e.g. fetch('/api/login', { ... })).
    // For now any valid email + password signs the user in (front-end demo only).
    if (current === 'client') {
      try {
        sessionStorage.setItem('dcm_session', JSON.stringify({ role: 'client', email: idInput.value.trim() }));
      } catch (err) {}
      $('submitBtn').disabled = true;
      showStatus('info', 'Taking you to your portal...');
      window.location.href = 'clientside.html';
    } else {
      try {
        sessionStorage.setItem('dcm_session', JSON.stringify({ role: 'staff', email: idInput.value.trim() }));
      } catch (err) {}
      $('submitBtn').disabled = true;
      showStatus('info', 'Taking you to your portal...');
      window.location.href = 'staffside.html';
    }
  });

  idInput.addEventListener('input', function () { if ($('idField').classList.contains('invalid')) checkEmail(); });
  pwInput.addEventListener('input', function () { if (pwInput.value) setInvalid('pwField', false); });

  /* ---------- Create a client account ---------- */
  function accounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch (err) { return {}; }
  }
  function saveAccounts(list) {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); } catch (err) {}
  }

  function setMode(next) {
    mode = next === 'signup' ? 'signup' : 'login';
    var up = mode === 'signup';
    form.hidden = up;
    signupForm.hidden = !up;
    roleSwitch.hidden = up;
    $('note').hidden = up;
    $('title').textContent = up ? signupCopy.title : roles[current].title;
    $('subtitle').textContent = up ? signupCopy.sub : roles[current].sub;
    $('sideSub').textContent = up ? signupCopy.side : 'Welcome back. Your documents, spending and alerts are waiting.';
    document.title = (up ? signupCopy.title : roles[current].title) + ' | DCM & Co.';
    hideStatus();
    clearBox(suStatus);
    $('title').focus();
  }

  function suCheckName() {
    var v = suName.value.trim(), ok = v.length >= 2;
    $('suNameError').textContent = !v ? 'Enter your full name.' : 'That looks too short. Enter your full name.';
    setInvalid('suNameField', !ok);
    return ok;
  }
  function suCheckEmail() {
    var v = suEmail.value.trim(), ok = EMAIL_RE.test(v);
    $('suEmailError').textContent = !v ? 'Enter your email.' : 'That email doesn\u2019t look right. Try name@company.com.';
    setInvalid('suEmailField', !ok);
    return ok;
  }
  function suCheckPw() {
    var ok = suPw.value.length >= 8;
    $('suPwError').textContent = suPw.value ? 'Use at least 8 characters.' : 'Choose a password.';
    setInvalid('suPwField', !ok);
    return ok;
  }
  function suCheckPw2() {
    var ok = suPw2.value.length > 0 && suPw2.value === suPw.value;
    $('suPw2Error').textContent = suPw2.value ? 'Your passwords don\u2019t match.' : 'Re-enter your password.';
    setInvalid('suPw2Field', !ok);
    return ok;
  }

  $('toSignup').addEventListener('click', function (e) { e.preventDefault(); setMode('signup'); });
  $('toLogin').addEventListener('click', function (e) {
    e.preventDefault();
    setRole(current, true);
    setMode('login');
  });

  suName.addEventListener('input', function () { if ($('suNameField').classList.contains('invalid')) suCheckName(); });
  suEmail.addEventListener('input', function () { if ($('suEmailField').classList.contains('invalid')) suCheckEmail(); });
  suPw.addEventListener('input', function () {
    if ($('suPwField').classList.contains('invalid')) suCheckPw();
    if ($('suPw2Field').classList.contains('invalid')) suCheckPw2();
  });
  suPw2.addEventListener('input', function () { if ($('suPw2Field').classList.contains('invalid')) suCheckPw2(); });

  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearBox(suStatus);

    var nameOk = suCheckName(), emailOk = suCheckEmail(), pwOk = suCheckPw(), pw2Ok = suCheckPw2();
    if (!nameOk) { suName.focus(); return; }
    if (!emailOk) { suEmail.focus(); return; }
    if (!pwOk) { suPw.focus(); return; }
    if (!pw2Ok) { suPw2.focus(); return; }

    var name = suName.value.trim(), email = suEmail.value.trim();
    var list = accounts();
    if (list[email.toLowerCase()]) {
      $('suEmailError').textContent = 'An account already exists for this email. Log in instead.';
      setInvalid('suEmailField', true);
      suEmail.focus();
      return;
    }

    // TODO: send this to a real server (POST /api/signup) and verify the email.
    // This is a front-end demo: no password is stored in the browser.
    list[email.toLowerCase()] = { name: name, email: email, createdAt: new Date().toISOString() };
    saveAccounts(list);

    try {
      localStorage.setItem('dcm_name', name);
      localStorage.setItem('dcm_email', email);
      sessionStorage.setItem('dcm_session', JSON.stringify({ role: 'client', email: email, name: name }));
    } catch (err) {}

    signupBtn.disabled = true;
    paint(suStatus, 'info', 'Account created. Taking you to your portal...');
    window.location.href = 'clientside.html';
  });

  var query = new URLSearchParams(window.location.search);
  setRole(query.get('role') === 'staff' ? 'staff' : 'client', false);
  if (query.get('mode') === 'signup') setMode('signup');
})();
