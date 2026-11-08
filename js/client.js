(function () {
  var $ = DCM.$, $$ = DCM.$$, esc = DCM.esc, peso = DCM.peso, plural = DCM.plural, nowStamp = DCM.nowStamp, isoToday = DCM.isoToday;

  /* ---------- Storage helpers ---------- */
  var session = DCM.session();
  /* each client account keeps its own data, so staff can see exactly what each client sent */
  var SCOPED = { dcm_tx: 1, dcm_uploads: 1, dcm_msgs: 1, dcm_findings: 1, dcm_prefs: 1, dcm_ai: 1 };
  function acct() { return session && session.email ? String(session.email).trim().toLowerCase() : ''; }
  function skey(k) { return SCOPED[k] && acct() ? k + '::' + acct() : k; }
  var store = DCM.createStore(skey);
  /* files go to a shared browser database so the staff portal can open them */
  function sharedDB() {
    return new Promise(function (res, rej) {
      try {
        var r = indexedDB.open('dcm_shared_uploads', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('blobs'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
  }
  function putShared(id, blob) {
    return sharedDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put(blob, id);
        tx.oncomplete = function () { res(true); };
        tx.onerror = function () { rej(tx.error); };
      });
    }).catch(function () { return false; });
  }

  /* ---------- Sample data ---------- */
  var SEED_TX = [
    { id: 's1', vendor: 'ABC Office Supplies', note: 'Office Equipment',  date: 'Oct 15, 2026', cat: 'Operational', amt: 12500, status: 'Cleared', source: 'sample' },
    { id: 's2', vendor: 'Meralco',             note: 'Electricity',       date: 'Oct 12, 2026', cat: 'Utilities',   amt: 8200,  status: 'Cleared', source: 'sample' },
    { id: 's3', vendor: 'XYZ Trading',         note: 'Consulting Services', date: 'Oct 10, 2026', cat: 'Misc/Other', amt: 50000, status: 'Cleared', source: 'sample' },
    { id: 's4', vendor: 'Globe Business',      note: 'Internet & Mobile', date: 'Oct 8, 2026',  cat: 'Utilities',   amt: 3450,  status: 'Cleared', source: 'sample' },
    { id: 's5', vendor: 'National Bookstore',  note: 'Stationery',        date: 'Oct 5, 2026',  cat: 'Operational', amt: 2980,  status: 'Cleared', source: 'sample' }
  ];
  var MONTHS = [
    { m: 'Jul', v: 82000 }, { m: 'Aug', v: 91000 }, { m: 'Sep', v: 76000 }, { m: 'Oct', v: 100000 }
  ];
  /* ---------- Live transaction list (saved in this browser) ---------- */
  var TX = (function () {
    var saved = store.get('dcm_tx', null);
    return Array.isArray(saved) ? saved : SEED_TX.slice();
  })();
  function saveTx() { store.set('dcm_tx', TX); }
  var CATS = ['Operational', 'Utilities', 'Misc/Other'];
  var CAT_COLOR = { 'Operational': 'cyan', 'Utilities': 'warn', 'Misc/Other': 'danger' };

  function today() { return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function fmtSize(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtISO(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return today();
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d.getTime())) return today();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function pct(part, whole) { return whole > 0 ? Math.round(part / whole * 100) : 0; }
  function catTotals() {
    var map = {};
    CATS.forEach(function (c) { map[c] = 0; });
    TX.forEach(function (t) { map[t.cat] = (map[t.cat] || 0) + (Number(t.amt) || 0); });
    return map;
  }
  function totalSpend() { return TX.reduce(function (s, t) { return s + (Number(t.amt) || 0); }, 0); }

  /* ---------- Toast ---------- */
  var toast = DCM.createToast($('#toast'), 3200);

  /* ---------- User name / avatar ---------- */
  function defaultName() {
    var base = session && session.email ? session.email.split('@')[0] : 'Client';
    var words = base.split(/[._\-+]+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
    return words.length ? words.join(' ') : 'Client';
  }
  function displayName() { return store.get('dcm_name', '') || defaultName(); }
  function updateUser() {
    var name = displayName();
    $('#userName').textContent = 'Welcome, ' + name;
    $('#userAvatar').textContent = name.split(' ').slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'C';
  }

  /* ---------- Transactions ---------- */
  function rowHTML(t) {
    var mine = t.source !== 'sample';
    return '<tr class="filterable" data-cat="' + esc(t.cat) + '">' +
      '<td><div class="vendor-name">' + esc(t.vendor) + (t.source === 'scan' ? ' <span class="tag-scan">Scanned</span>' : '') + '</div>' +
      '<div class="vendor-category">' + esc(t.note) + '</div></td>' +
      '<td>' + esc(t.date) + '</td><td>' + esc(t.cat) + '</td>' +
      '<td class="amount">' + peso(t.amt) + '</td>' +
      '<td>' + (mine ? '<button type="button" class="icon-btn row-del" data-txdel="' + esc(t.id) + '" aria-label="Delete the ' + esc(t.vendor) + ' transaction" title="Delete this transaction"><svg class="ico"><use href="#i-x"/></svg></button>' : '') + '</td></tr>';
  }
  function renderTx() {
    $('#txRecent').innerHTML = TX.slice(0, 3).map(rowHTML).join('');
    $('#txFull').innerHTML = TX.map(rowHTML).join('');
    $('#txEmpty').textContent = TX.length ? 'Nothing fits these filters. Try loosening them.' : 'No transactions yet. Add one above and it will show up here.';
    $('#statCount').textContent = TX.length;
    $('#statCountSub').textContent = TX.length ? 'Added to your tracker' : 'Nothing recorded yet';
  }
  function renderSpending() {
    var map = catTotals(), total = totalSpend();
    var used = CATS.filter(function (c) { return map[c] > 0; }).length;
    var top = CATS.slice().sort(function (a, b) { return map[b] - map[a]; })[0];

    $('#statTotal').textContent = peso(total);
    $('#statTotalSub').textContent = total ? 'Across ' + used + ' ' + (used === 1 ? 'category' : 'categories') : 'Nothing recorded yet';
    $('#statLargest').textContent = map[top] > 0 ? top : '—';
    $('#statLargestSub').textContent = map[top] > 0 ? peso(map[top]) + ' · ' + pct(map[top], total) + '%' : 'Add a transaction to see this';

    $('#catBars').innerHTML = CATS.map(function (c) {
      return '<div class="bar-row"><div class="bar-top"><span>' + esc(c) + '</span><span><b>' + peso(map[c]) + '</b> · ' + pct(map[c], total) + '%</span></div>' +
        '<div class="bar"><i class="' + CAT_COLOR[c] + '" style="width:' + pct(map[c], total) + '%"></i></div></div>';
    }).join('');

    // the current month and the dashboard donut follow the live list
    MONTHS[MONTHS.length - 1].v = total;
    renderChart();

    var a = pct(map['Operational'], total), b = pct(map['Utilities'], total);
    var donut = $('#spendDonut');
    donut.style.background = total
      ? 'conic-gradient(var(--cyan) 0 ' + a + '%, var(--warn) ' + a + '% ' + (a + b) + '%, var(--danger) ' + (a + b) + '% 100%)'
      : 'conic-gradient(var(--line) 0 100%)';
    donut.setAttribute('aria-label', 'Spending split: ' + a + '% operational, ' + b + '% utilities, ' + Math.max(0, 100 - a - b) + '% miscellaneous');
    $('#donutTotal').textContent = total >= 1000 ? '₱' + (total / 1000).toFixed(total >= 10000 ? 0 : 1) + 'k' : peso(total);
    $('#spendLegend').innerHTML = CATS.map(function (c) {
      return '<div class="legend-row"><span class="name"><span class="dot ' + CAT_COLOR[c] + '"></span>' + esc(c) + '</span>' +
        '<span><span class="amt">' + peso(map[c]) + '</span><span class="pct">' + pct(map[c], total) + '%</span></span></div>';
    }).join('');
  }
  function renderAll() { renderTx(); renderSpending(); applyFilter(); }
  function renderChart() {
    var max = Math.max.apply(null, MONTHS.map(function (x) { return x.v; })) || 1;
    $('#monthChart').innerHTML = MONTHS.map(function (x, i) {
      return '<div class="col' + (i === MONTHS.length - 1 ? ' cur' : '') + '">' +
        '<span class="v">₱' + Math.round(x.v / 1000) + 'k</span>' +
        '<div class="b" style="height:' + Math.round(x.v / max * 150) + 'px"></div>' +
        '<span class="m">' + x.m + '</span></div>';
    }).join('');
  }

  /* ---------- Reports (real CSV downloads) ---------- */
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
  }
  function download(filename, rows) {
    var blob = new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  var REPORTS = {
    transactions: function () {
      return ['dcm-transactions-oct-2026.csv',
        [['Vendor', 'Description', 'Invoice Date', 'Category', 'Amount (PHP)']].concat(
          TX.map(function (t) { return [t.vendor, t.note, t.date, t.cat, t.amt.toFixed(2)]; }))];
    },
    spending: function () {
      var map = catTotals(), total = totalSpend();
      return ['dcm-spending-summary-oct-2026.csv',
        [['Category', 'Amount (PHP)', 'Share']].concat(
          CATS.map(function (c) { return [c, map[c].toFixed(2), pct(map[c], total) + '%']; }),
          [['Total', total.toFixed(2), '100%']])];
    },
    fraud: function () {
      var rows = [['Type', 'Document', 'Checked', 'Amount (PHP)', 'Authenticity', 'Status', 'What your CPA found']];
      getFindings().filter(isFlagged).forEach(function (f) {
        rows.push([f.kind === 'statement' ? 'Financial statement' : 'Document', f.title, f.checkedAt || '', f.amount ? Number(f.amount).toFixed(2) : '', f.score + '%',
          f.status === 'resolved' ? 'Resolved' : 'Open',
          (f.signals || []).map(function (s) { return s.label + (s.variance ? ' (' + s.variance + '% variance)' : '') + ': ' + s.detail; }).join(' | ')]);
      });
      return ['dcm-fraud-anomaly-report-oct-2026.csv', rows];
    }
  };

  /* ---------- Upload ---------- */
  var queue = [];
  var MAX_SIZE = 10 * 1048576;
  var OK_EXT = /\.(pdf|jpe?g|png)$/i;
  var dz = $('#dropzone'), fileInput = $('#fileInput');

  function addFiles(fileList) {
    var problems = [];
    Array.prototype.forEach.call(fileList, function (f) {
      if (!OK_EXT.test(f.name)) { problems.push('\u201c' + f.name + '\u201d isn\u2019t a PDF, JPG or PNG.'); return; }
      if (f.size > MAX_SIZE) { problems.push('\u201c' + f.name + '\u201d is over the 10 MB limit.'); return; }
      var dup = queue.some(function (q) { return q.name === f.name && q.size === f.size; });
      if (!dup) queue.push({ name: f.name, size: f.size, file: f });
    });
    showUploadErrors(problems);
    renderQueue();
  }
  function showUploadErrors(list) {
    var el = $('#uploadErr');
    if (!list.length) { el.hidden = true; el.innerHTML = ''; dz.classList.remove('invalid'); return; }
    el.innerHTML = '<strong>' + (list.length === 1 ? 'We couldn\u2019t add 1 file:' : 'We couldn\u2019t add ' + list.length + ' files:') + '</strong><ul>' + list.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>';
    el.hidden = false; dz.classList.add('invalid');
  }
  function renderQueue() {
    $('#queue').innerHTML = queue.map(function (f, i) {
      return '<div class="file"><svg class="ico"><use href="#i-file"/></svg><span class="name">' + esc(f.name) + '</span>' +
        '<span class="size">' + fmtSize(f.size) + '</span>' +
        '<button type="button" class="icon-btn" data-remove="' + i + '" aria-label="Remove ' + esc(f.name) + '"><svg class="ico"><use href="#i-x"/></svg></button></div>';
    }).join('');
    $('#submitFiles').disabled = $('#clearFiles').disabled = !queue.length;
  }
  function renderUploads() {
    var rows = store.get('dcm_uploads', []);
    $('#uploadsBody').innerHTML = rows.map(function (r) {
      var f = r.id ? findingFor(r.id) : null, badge;
      if (!f) badge = '<span class="badge pending">Waiting for your CPA</span>';
      else if (!isFlagged(f)) badge = '<span class="badge verified">Checked, all clear</span>';
      else if (f.status === 'resolved') badge = '<span class="badge verified">Resolved</span>';
      else badge = '<a href="#fraud" class="badge flagged">Flagged. See why</a>';
      return '<tr class="filterable"><td><div class="vendor-name">' + esc(r.name) + '</div></td><td>' + esc(r.type) + '</td><td>' + esc(r.size) +
        '</td><td>' + esc(r.date) + '</td><td>' + badge + '</td></tr>';
    }).join('');
    $('#uploadsEmpty').hidden = rows.length > 0;
  }

  dz.addEventListener('click', function () { fileInput.click(); });
  dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); });
  });
  dz.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  $('#clearFiles').addEventListener('click', function () { queue = []; renderQueue(); });
  $('#submitFiles').addEventListener('click', function () {
    if (!queue.length) return;
    var type = $('#docType').value, date = today(), btn = this, items = queue.slice();
    btn.disabled = true;
    Promise.all(items.map(function (f) {
      var id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      return putShared(id, f.file).then(function (saved) {
        return { row: { id: id, name: f.name, type: type, size: fmtSize(f.size), bytes: f.size, date: date, ts: Date.now() }, saved: saved };
      });
    })).then(function (res) {
      var rows = store.get('dcm_uploads', []);
      res.slice().reverse().forEach(function (r) { rows.unshift(r.row); });
      store.set('dcm_uploads', rows);
      queue = [];
      renderQueue(); renderUploads(); renderFraud(); applyFilter();
      var lost = res.some(function (r) { return !r.saved; });
      toast(lost
        ? 'Sent, but your browser couldn\u2019t keep a copy of the file. Your CPA may ask you to send it again.'
        : 'Sent. Your CPA team will check ' + (items.length > 1 ? 'these ' + items.length + ' documents' : 'your document') + ' and tell you here if anything looks off.', lost ? 'error' : '');
    });
  });

  /* ---------- Add transaction (manual form + receipt OCR) ---------- */
  var txForm = $('#txForm'), txVendor = $('#txVendor'), txAmount = $('#txAmount'),
      txDate = $('#txDate'), txCat = $('#txCat'), txNote = $('#txNote');

  function fieldError(input, msg) {
    var f = input.closest('.field');
    if (!f) return;
    var el = f.querySelector('.field-error');
    if (msg) {
      if (!el) { el = document.createElement('div'); el.className = 'field-error'; el.setAttribute('role', 'alert'); f.appendChild(el); }
      el.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      f.classList.add('invalid');
    } else {
      if (el) el.remove();
      input.removeAttribute('aria-invalid');
      f.classList.remove('invalid');
    }
  }

  function addTx(data) {
    var t = {
      id: 'tx' + Date.now() + Math.random().toString(36).slice(2, 6),
      vendor: data.vendor,
      note: data.note || '',
      date: data.date,
      cat: data.cat,
      amt: Math.round(data.amt * 100) / 100,
      status: 'Cleared',
      source: data.source || 'manual'
    };
    TX.unshift(t);
    saveTx();
    renderAll();
    return t;
  }

  function resetTxForm() {
    txForm.reset();
    txDate.value = isoToday();
    [txVendor, txAmount, txDate].forEach(function (i) { fieldError(i, ''); });
  }

  function setTab(scan) {
    $('#tabManual').setAttribute('aria-selected', scan ? 'false' : 'true');
    $('#tabScan').setAttribute('aria-selected', scan ? 'true' : 'false');
    $('#panelManual').hidden = !!scan;
    $('#panelScan').hidden = !scan;
  }

  txForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    if (!txVendor.value.trim()) { fieldError(txVendor, 'Enter the vendor or store name.'); ok = false; } else fieldError(txVendor, '');
    var amt = parseFloat(String(txAmount.value).replace(/,/g, ''));
    if (!txAmount.value.trim() || isNaN(amt) || amt <= 0) { fieldError(txAmount, 'Enter an amount greater than zero.'); ok = false; } else fieldError(txAmount, '');
    if (!txDate.value) { fieldError(txDate, 'Pick the invoice date.'); ok = false; } else fieldError(txDate, '');
    if (!ok) { var bad = txForm.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    var t = addTx({ vendor: txVendor.value.trim(), note: txNote.value.trim(), date: fmtISO(txDate.value), cat: txCat.value, amt: amt });
    resetTxForm();
    toast(t.vendor + ' was added to your spending tracker.');
  });

  $('#txReset').addEventListener('click', resetTxForm);
  $('#tabManual').addEventListener('click', function () { setTab(false); });
  $('#tabScan').addEventListener('click', function () { setTab(true); });

  /* ---------- Receipt OCR (Tesseract.js, loaded on first use) ---------- */
  var OCR_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  var ocrLoader = null, ocrBusy = false;
  var receiptZone = $('#receiptZone'), receiptInput = $('#receiptInput');
  var scanKind = 'receipt';

  function loadOCR() {
    if (window.Tesseract) return Promise.resolve();
    if (ocrLoader) return ocrLoader;
    ocrLoader = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = OCR_SRC;
      s.async = true;
      s.onload = function () { if (window.Tesseract) resolve(); else reject(new Error('unavailable')); };
      s.onerror = function () { ocrLoader = null; reject(new Error('offline')); };
      document.head.appendChild(s);
    });
    return ocrLoader;
  }

  function setStatus(msg) {
    var el = $('#ocrStatus');
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  function receiptErr(msg) {
    var el = $('#receiptErr');
    if (!msg) { el.hidden = true; el.innerHTML = ''; receiptZone.classList.remove('invalid'); return; }
    el.hidden = false;
    el.innerHTML = '<strong>' + esc(msg) + '</strong>';
    receiptZone.classList.add('invalid');
  }

  function pickReceipt(file) {
    if (!file || ocrBusy) return;
    receiptErr('');
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|bmp)$/i.test(file.name)) {
      receiptErr('That file isn\u2019t a photo. Use a JPG or PNG image of the document.');
      return;
    }
    if (file.size > MAX_SIZE) { receiptErr('That photo is over the 10 MB limit. Try a smaller one.'); return; }
    var reader = new FileReader();
    reader.onload = function () { runOCR(String(reader.result), scanKind); };
    reader.onerror = function () { receiptErr('We couldn\u2019t open that file. Try another photo.'); };
    reader.readAsDataURL(file);
  }

  function runOCR(dataUrl, kind) {
    var statement = false;
    var what = 'receipt';
    ocrBusy = true;
    $('#ocrResult').hidden = true;
    setStatus('Loading the ' + what + ' reader\u2026');
    loadOCR().then(function () {
      setStatus('Reading the ' + what + '\u2026');
      return window.Tesseract.recognize(dataUrl, 'eng', {
        logger: function (m) {
          if (m.status === 'recognizing text') setStatus('Reading the ' + what + '\u2026 ' + Math.round((m.progress || 0) * 100) + '%');
        }
      });
    }).then(function (res) {
      handleScan((res && res.data && res.data.text) || '', dataUrl, kind);
    }).catch(function () {
      setStatus('');
      receiptErr(window.Tesseract
        ? 'We couldn\u2019t read that photo. Try a sharper, straight-on shot, or ' + (statement ? 'scan the statement again.' : 'add the transaction manually.')
        : 'The ' + what + ' reader needs an internet connection the first time. ' + (statement ? 'Try again online.' : 'Add the transaction manually, or try again online.'));
    }).then(function () {
      ocrBusy = false;
    });
  }

  function handleScan(text, dataUrl, kind) {
    var read = parseReceipt(text);
    setStatus('');
    if (read.amount > 0) {
      var t = addTx({
        vendor: read.vendor || 'Scanned receipt',
        note: 'Added from a scanned receipt',
        date: fmtISO(read.date),
        cat: read.cat,
        amt: read.amount,
        source: 'scan'
      });
      var el = $('#ocrResult');
      el.innerHTML = '<div class="ocr-thumb"><img src="' + dataUrl + '" alt="The receipt you scanned"></div>' +
        '<div class="ocr-read"><strong><svg class="ico"><use href="#i-check"/></svg>Added to your spending tracker</strong>' +
        '<span>' + esc(t.vendor) + ' \u00b7 ' + esc(t.date) + ' \u00b7 ' + esc(t.cat) + '</span>' +
        '<span class="ocr-amt">' + peso(t.amt) + '</span>' +
        '<div class="btn-row"><button type="button" class="btn inline sm ghost" data-txdel="' + esc(t.id) + '">Remove this entry</button>' +
        '<button type="button" class="btn inline sm" data-scan-again>Scan another receipt</button></div></div>';
      el.hidden = false;
      toast('Scanned ' + peso(t.amt) + ' from ' + t.vendor + ' and added it to your tracker.');
    } else {
      setTab(false);
      txVendor.value = read.vendor || '';
      txDate.value = read.date || isoToday();
      if (read.cat) txCat.value = read.cat;
      txAmount.value = '';
      fieldError(txAmount, 'We couldn\u2019t find the total on that receipt. Type it here.');
      txAmount.focus();
      toast('We couldn\u2019t find the total on that receipt. Check the details and add the amount.', 'error');
    }
  }

  receiptZone.addEventListener('click', function () { receiptInput.click(); });
  receiptZone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); receiptInput.click(); }
  });
  receiptInput.addEventListener('change', function () { pickReceipt(receiptInput.files[0]); receiptInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    receiptZone.addEventListener(ev, function (e) { e.preventDefault(); receiptZone.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    receiptZone.addEventListener(ev, function (e) { e.preventDefault(); receiptZone.classList.remove('drag'); });
  });
  receiptZone.addEventListener('drop', function (e) { if (e.dataTransfer) pickReceipt(e.dataTransfer.files[0]); });

  /* ---------- Receipt camera (same flow as the staff side) ---------- */
  var scanner = $('#scanner'), scanVideo = $('#scanVideo'), scanMsg = $('#scanMsg'), scanSheet = $('#scanSheet');
  var camStream = null, facing = 'environment', torchOn = false, shotUrl = '', camOpener = null;

  function stopCam() {
    if (camStream) { camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; }
    scanVideo.srcObject = null; scanVideo.hidden = true;
  }

  function camFail(text) { stopCam(); scanMsg.textContent = text; scanMsg.hidden = false; }

  function setTorch(on) {
    try {
      var t = camStream && camStream.getVideoTracks()[0];
      if (t && t.applyConstraints) t.applyConstraints({ advanced: [{ torch: on }] }).catch(function () {});
    } catch (e) {}
  }

  function startCam() {
    stopCam(); scanMsg.hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      camFail('This browser can\u2019t open the camera here. Use the photo button below instead.');
      return;
    }
    if (!window.isSecureContext) {
      camFail('The camera needs the page opened over http:// or https://. Use the photo button below instead.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false }).then(function (stream) {
      if (scanner.hidden) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      camStream = stream; scanVideo.srcObject = stream; scanVideo.hidden = false;
      var p = scanVideo.play(); if (p && p.catch) p.catch(function () {});
      if (torchOn) setTorch(true);
    }).catch(function (err) {
      camFail(err && err.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow it in your browser settings, or use the photo button below.'
        : 'No camera found. Use the photo button below to choose a receipt picture.');
    });
  }

  function openScanner() {
    if (ocrBusy) { toast('Hold on \u2014 we\u2019re still reading the last document.'); return; }
    setTab(true);
    camOpener = document.activeElement;
    scanSheet.hidden = true; scanMsg.hidden = true;
    scanner.hidden = false;
    document.documentElement.classList.add('scan-open');
    $('#scanClose').focus();
    startCam();
  }

  function closeScanner() {
    if (scanner.hidden) return;
    scanner.hidden = true; scanSheet.hidden = true;
    document.documentElement.classList.remove('scan-open');
    stopCam(); torchOn = false;
    $('#scanFlash').setAttribute('aria-pressed', 'false'); $('#scanFlash').classList.remove('on');
    var back = camOpener && document.contains(camOpener) ? camOpener : $('#tabScan');
    try { back.focus(); } catch (e) {}
  }

  function showShot(url) {
    shotUrl = url;
    var th = $('#scanThumb');
    th.style.backgroundImage = url ? 'url("' + url + '")' : '';
    th.classList.toggle('has-img', !!url);
    scanSheet.hidden = false;
    try { scanVideo.pause(); } catch (e) {}
    $('#scanUse').focus();
  }

  function shoot() {
    var fx = $('#scanFx'); fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    var url = '';
    if (camStream && scanVideo.videoWidth) {
      var w = Math.min(1600, scanVideo.videoWidth), h = Math.round(w * scanVideo.videoHeight / scanVideo.videoWidth);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      try { c.getContext('2d').drawImage(scanVideo, 0, 0, w, h); url = c.toDataURL('image/jpeg', 0.85); } catch (e) {}
    }
    setTimeout(function () {
      if (!url) { camFail('We couldn\u2019t capture that photo. Try again, or use the photo button below.'); return; }
      showShot(url);
    }, 180);
  }

  document.addEventListener('click', function (e) { if (e.target.closest('[data-scan-open]')) openScanner(); });
  $('#scanClose').addEventListener('click', closeScanner);
  $('#scanFlash').addEventListener('click', function () {
    torchOn = !torchOn;
    this.setAttribute('aria-pressed', torchOn); this.classList.toggle('on', torchOn);
    setTorch(torchOn);
  });
  $('#scanFlip').addEventListener('click', function () {
    facing = facing === 'environment' ? 'user' : 'environment';
    shotUrl = ''; scanSheet.hidden = true;
    startCam();
  });
  $('#scanGallery').addEventListener('click', function () { $('#scanFile').click(); });
  $('#scanFile').addEventListener('change', function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    closeScanner();
    pickReceipt(f);
  });
  $('#scanShutter').addEventListener('click', shoot);
  $('#scanRetake').addEventListener('click', function () {
    scanSheet.hidden = true; shotUrl = '';
    try { var p = scanVideo.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    $('#scanShutter').focus();
  });
  $('#scanUse').addEventListener('click', function () {
    if (!shotUrl) { $('#scanShutter').focus(); return; }
    var url = shotUrl;
    closeScanner();
    runOCR(url, scanKind);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !scanner.hidden) closeScanner(); });

  /* ---------- Reading a receipt ---------- */
  var MONTH_NUM = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  function isoOf(y, m, d) {
    var dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime()) || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return y + '-' + pad2(m) + '-' + pad2(d);
  }

  function findDate(text) {
    var s = String(text || ''), m;
    m = s.match(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/);
    if (m) return isoOf(+m[1], +m[2], +m[3]);
    m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
    if (m) return isoOf(+m[3], MONTH_NUM[m[1].toLowerCase()], +m[2]);
    m = s.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})/i);
    if (m) return isoOf(+m[3], MONTH_NUM[m[2].toLowerCase()], +m[1]);
    m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})\b/);
    if (m) {
      var a = +m[1], b = +m[2], y = +m[3];
      if (y < 100) y += 2000;
      return a > 12 && b <= 12 ? isoOf(y, b, a) : isoOf(y, a, b);
    }
    return '';
  }

  function moneyOnLine(line) {
    var m = line.match(/(?:grand\s*total|total\s*due|amount\s*due|total\s*amount|total)[^\d]{0,12}((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)/i);
    return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  }

  function findAmount(text) {
    var bare = String(text || '').replace(/\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g, ' ').replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ');
    var lines = bare.split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);

    var best = 0;
    lines.forEach(function (l) {
      if (!/(total|amount\s*due)/i.test(l) || /sub\s*-?\s*total/i.test(l)) return;
      var direct = moneyOnLine(l);
      if (direct >= 1 && direct <= 1e7) { best = Math.max(best, direct); return; }
      var nums = l.match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g) || [];
      nums.forEach(function (raw) {
        var n = parseFloat(raw.replace(/,/g, ''));
        if (!isNaN(n) && n >= 1 && n <= 1e7) best = Math.max(best, n);
      });
    });
    if (best) return best;

    var decimals = bare.match(/(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}\b/g) || [];
    var cands = decimals.map(function (r) { return parseFloat(r.replace(/,/g, '')); })
      .filter(function (n) { return n >= 1 && n <= 1e7; });
    return cands.length ? Math.max.apply(null, cands) : 0;
  }

  function findVendor(text) {
    var skip = /(receipt|invoice|official|sales|thank|welcome|cash|change|vat|tin\b|address|tel|phone|date|time|cashier|or\s*no|invoice\s*no|#\d)/i;
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean).slice(0, 8);
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].replace(/^[^A-Za-z]+/, '').trim();
      if (l.length < 3 || l.length > 48) continue;
      if (!/[A-Za-z]{3,}/.test(l)) continue;
      if (skip.test(l)) continue;
      if (/\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(l)) continue;
      return l;
    }
    return '';
  }

  function guessCat(text) {
    var s = String(text || '').toLowerCase();
    if (/(meralco|electric|kuryente|water|maynilad|internet|globe|pldt|converge|smart|mobile|phone|utilit|bill|gas)/.test(s)) return 'Utilities';
    if (/(office|supplies|stationery|paper|ink|toner|printer|computer|equipment|rent|salary|wage|delivery|transport|fuel|gasoline|repair|maintenance|professional|service)/.test(s)) return 'Operational';
    return 'Misc/Other';
  }

  function parseReceipt(text) {
    return { vendor: findVendor(text), amount: findAmount(text), date: findDate(text), cat: guessCat(text) };
  }

  /* ---------- Fraud & Anomalies (results from your CPA team's checks) ---------- */
  var FX_LABEL = { fake: 'High concern', review: 'Needs review', clear: 'Clear' };
  function getFindings() { var l = store.get('dcm_findings', []); return Array.isArray(l) ? l : []; }
  function findingFor(uploadId) { return getFindings().filter(function (f) { return f.uploadId === uploadId; })[0] || null; }
  function isFlagged(f) { return f.verdict !== 'clear'; }
  function isOpen(f) { return isFlagged(f) && f.status !== 'resolved'; }
  function fxTone(score) { return score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high'; }

  function fxMeter(score) {
    var v = score >= 70 ? 'clear' : score >= 40 ? 'review' : 'fake';
    return '<div class="fx-score"><div class="fx-score-top">' + score + '%<small>' + FX_LABEL[v] + '</small></div>' +
      '<div class="fx-meter" role="img" aria-label="Authenticity ' + score + ' percent"><i class="' + fxTone(score) + '" style="width:' + score + '%"></i></div></div>';
  }
  function fxWhen(f) { return f.date ? fmtISO(f.date) : (f.checkedAt || ''); }

  function fxRowHTML(f) {
    var sigs = f.signals || [];
    var chips = sigs.length
      ? sigs.slice(0, 2).map(function (s) { return '<span class="sig sev-' + (s.sev || 'med') + '">' + esc(s.label) + '</span>'; }).join('') +
        (sigs.length > 2 ? '<span class="sig">+' + (sigs.length - 2) + '</span>' : '')
      : '<span class="fx-clear">Nothing unusual</span>';
    return '<tr class="filterable" data-fxv="' + (isFlagged(f) ? 'flagged' : 'clear') + '">' +
      '<td><div class="vendor-name">' + esc(f.title) + '</div><div class="vendor-category">' + esc(fxWhen(f)) + '</div></td>' +
      '<td class="amount">' + (f.amount ? peso(f.amount) : '—') + '</td>' +
      '<td><div class="fx-sigs">' + chips + '</div></td>' +
      '<td>' + fxMeter(f.score) + '</td></tr>';
  }

  function fxCardHTML(f) {
    var tone = fxTone(f.score), sigs = f.signals || [], bad = isFlagged(f), stmt = f.kind === 'statement';
    var badge = !bad ? '<span class="badge verified">Clear</span>'
      : f.status === 'resolved' ? '<span class="badge verified">Resolved</span>'
      : '<span class="badge ' + (f.verdict === 'review' ? 'pending' : 'flagged') + '">' + FX_LABEL[f.verdict] + '</span>';
    var lead = bad
      ? (stmt ? 'Your CPA team read the totals, dates and figures on this statement and checked them against each other. ' : 'Your CPA team compared this document with the rest of your records. ') + plural(sigs.length, stmt ? 'anomaly' : 'thing', stmt ? 'anomalies' : 'things') + (stmt ? ' came back:' : ' stood out:')
      : 'Your CPA team checked this ' + (stmt ? 'statement' : 'document') + ' and nothing conflicts.';
    return '<article class="card flag-card fx-card ' + (bad && f.status !== 'resolved' ? tone : 'low') + '">' +
      '<div class="flag-top"><div><h3>' + esc(f.title) + '</h3><span class="muted small">' + esc(fxWhen(f)) + (f.amount ? ' · ' + peso(f.amount) : '') + (f.checkedAt ? ' · Checked ' + esc(f.checkedAt) : '') + '</span></div>' + badge + '</div>' +
      (stmt ? '<div class="fx-scoreRow">' + fxMeter(f.score) + '</div>' : '<div class="flag-meta"><div>Authenticity<b>' + f.score + '%</b></div></div>') +
      '<p class="fx-lead">' + esc(lead) + '</p>' +
      (bad ? '<ul class="fx-reasons">' + sigs.map(function (s) {
        return '<li><b>' + esc(s.label) + '</b>' + (s.variance ? ' <span class="sig sev-' + (s.sev === 'high' ? 'high' : 'med') + '">' + s.variance + '% variance</span>' : '') + ' — ' + esc(s.detail) + '</li>';
      }).join('') + '</ul>' + (f.rec ? '<div class="fx-next"><strong>What to do next</strong><span>' + esc(f.rec) + '</span></div>' : '') : '') +
      (bad && f.status !== 'resolved' ? '<div class="btn-row"><button type="button" class="btn inline sm" data-fx-ask="' + esc(f.id) + '"><svg class="ico"><use href="#i-message"/></svg>Message my CPA</button>' +
      '<button type="button" class="btn inline sm ghost" data-go="upload"><svg class="ico"><use href="#i-upload"/></svg>Upload supporting document</button></div>' : '') +
      '</article>';
  }

  function setFxTab(stmts) {
    $('#fxTabDocs').setAttribute('aria-selected', stmts ? 'false' : 'true');
    $('#fxTabStmts').setAttribute('aria-selected', stmts ? 'true' : 'false');
    $('#fxPanelDocs').hidden = !!stmts;
    $('#fxPanelStmts').hidden = !stmts;
  }

  function renderFraud() {
    var all = getFindings(), ups = store.get('dcm_uploads', []);
    var docs = all.filter(function (f) { return f.kind !== 'statement'; });
    var stm = all.filter(function (f) { return f.kind === 'statement'; });
    var docBad = docs.filter(isOpen), stBad = stm.filter(isOpen);
    var waiting = ups.filter(function (u) { return !u.id || !findingFor(u.id); }).length;

    $('#fxStatSent').textContent = ups.length;
    $('#fxStatChecked').textContent = all.length;
    $('#fxStatDocFlag').textContent = docBad.length;
    $('#fxStatStmtFlag').textContent = stBad.length;
    [['#fxTabDocsN', docBad.length], ['#fxTabStmtsN', stBad.length]].forEach(function (p) {
      var el = $(p[0]); el.textContent = p[1]; el.hidden = p[1] === 0;
    });
    var nav = $('#navFx'), total = docBad.length + stBad.length;
    nav.textContent = total; nav.hidden = total === 0;

    $('#fxWait').hidden = waiting === 0;
    $('#fxWaitText').textContent = plural(waiting, 'document is', 'documents are') + ' waiting for your CPA team to check. Results will show up here.';

    var f = $('#fxFilter').value;
    var list = docs.slice().sort(function (a, b) { return a.score - b.score; }).filter(function (x) {
      return f === 'all' || (f === 'flagged' ? isFlagged(x) : !isFlagged(x));
    });
    $('#fxRows').innerHTML = list.map(fxRowHTML).join('');
    $('#fxDocsNone').hidden = docs.length > 0;
    $('#fxDocsEmpty').hidden = true;

    var shown = docs.filter(isFlagged).sort(function (a, b) { return (a.status === 'resolved') - (b.status === 'resolved') || a.score - b.score; });
    $('#fxFoundHead').hidden = shown.length === 0;
    $('#fxFound').innerHTML = shown.map(fxCardHTML).join('');

    $('#fxStmts').innerHTML = stm.length
      ? stm.slice().sort(function (a, b) { return (a.status === 'resolved') - (b.status === 'resolved') || a.score - b.score; }).map(fxCardHTML).join('')
      : '<section class="card"><div class="empty">No statements have been checked yet. Upload a bank or financial statement and your CPA team will review it.</div></section>';

    var alertBox = $('#dashAlert');
    var open = all.filter(isOpen);
    alertBox.hidden = open.length === 0;
    if (open.length) {
      $('#dashAlertText').innerHTML = '<strong>Your CPA flagged ' + plural(open.length, 'item', 'items') + ':</strong> ' +
        open.slice(0, 2).map(function (x) { return esc(x.title); }).join(', ') + (open.length > 2 ? ' and ' + (open.length - 2) + ' more' : '') +
        '. <a href="#fraud" class="link">See what to do</a>';
    }
    applyFilter();
  }

  /* ---------- Messages ---------- */
  var SEED = [{ from: 'them', time: 'Welcome', text: 'Hi! Message us here if you have a question about your documents or anything we flag. We\u2019ll reply as soon as we can.' }];
  function getMsgs() { return store.get('dcm_msgs', SEED); }
  function renderMsgs() {
    var body = $('#chatBody');
    body.innerHTML = getMsgs().map(function (m, i) {
      var del = m.from === 'me'
        ? '<button type="button" class="msg-del" data-del="' + i + '" aria-label="Delete this message"><svg class="ico"><use href="#i-x"/></svg></button>'
        : '';
      return '<div class="msg ' + m.from + '">' + del + esc(m.text) + '<small>' + esc(m.time) + '</small></div>';
    }).join('');
    $('#clearMsgs').hidden = !getMsgs().some(function (m) { return m.from === 'me'; });
    body.scrollTop = body.scrollHeight;
  }
  $('#chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#chatInput'), text = input.value.trim();
    if (!text) return;
    var msgs = getMsgs();
    msgs.push({ from: 'me', time: nowStamp(), text: text });
    store.set('dcm_msgs', msgs);
    input.value = '';
    renderMsgs();
  });

  /* ---------- Ask AI ---------- */
  /* To use a real LLM, set window.DCM_LLM_ENDPOINT to a server route you control (never put an API key in this file).
     It receives POST { question, history, context } and must answer { answer: "..." }.
     Without it, answers are written locally from this client's own data. */
  var AI_HELLO = 'Hi, I’m the DCM assistant. I can explain what your CPA flagged, summarise your spending, and tell you what to do next. What would you like to know?';
  var AI_ASKS = ['Why was something flagged?', 'What should I do next?', 'Summarise my spending', 'Did you check my uploads?'];
  var aiBusy = false;
  function setPane(p) {
    $('#paneCPA').hidden = p !== 'cpa'; $('#paneAI').hidden = p !== 'ai';
    $$('.msg-tab').forEach(function (t) { var on = t.dataset.pane === p; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    var box = p === 'ai' ? $('#aiBody') : $('#chatBody'); box.scrollTop = box.scrollHeight;
  }
  document.addEventListener('click', function (e) { var t = e.target.closest('.msg-tab'); if (t) setPane(t.dataset.pane); });
  function getAI() { var l = store.get('dcm_ai', []); return Array.isArray(l) ? l : []; }
  function renderAI() {
    var list = getAI(), body = $('#aiBody');
    var html = '<div class="msg them">' + esc(AI_HELLO) + '</div>' + list.map(function (m) {
      return '<div class="msg ' + (m.from === 'me' ? 'me' : 'them') + '">' + esc(m.text) + '<small>' + esc(m.time) + '</small></div>';
    }).join('');
    if (aiBusy) html += '<div class="msg them typing" aria-label="The assistant is typing"><i></i><i></i><i></i></div>';
    body.innerHTML = html;
    $('#aiChips').innerHTML = list.length ? '' : AI_ASKS.map(function (q) { return '<button type="button" class="ai-chip" data-ai-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
    $('#aiClear').hidden = list.length === 0;
    $('#aiSend').disabled = aiBusy;
    body.scrollTop = body.scrollHeight;
  }
  function aiContext() {
    var f = getFindings(), up = store.get('dcm_uploads', []);
    return { name: displayName(), totalSpend: totalSpend(), transactions: TX.length,
      uploads: up.length, flagged: f.filter(isOpen).map(function (x) { return { title: x.title, signals: (x.signals || []).map(function (s) { return s.label; }), advice: x.rec }; }) };
  }
  function aiLocal(q) {
    var s = q.toLowerCase(), f = getFindings(), open = f.filter(isOpen), up = store.get('dcm_uploads', []);
    var has = function (re) { return re.test(s); };
    if (has(/^(hi|hello|hey|good (morning|afternoon|evening))\b/)) return 'Hello! Ask me about your flagged documents, your spending, or what to send your CPA next.';
    if (has(/flag|why|suspic|fraud|anomal|wrong|problem|issue|alert/)) {
      if (!up.length) return 'Nothing has been flagged because you haven’t uploaded a document yet. Upload one and your CPA team will check it.';
      if (!open.length) return f.length ? 'Good news: nothing needs your attention right now. Your CPA checked ' + plural(f.length, 'document', 'documents') + ' and the open issues are cleared.' : 'Nothing has been flagged. Your CPA hasn’t finished checking your uploads yet, so you’ll see a result in Fraud & Anomalies as soon as they do.';
      return open.map(function (x) {
        return '• ' + x.title + ': ' + (x.signals || []).map(function (g) { return g.label.toLowerCase(); }).join(', ') + '.';
      }).join('\n') + '\n\nOpen Fraud & Anomalies to see the full reasons for each one.';
    }
    if (has(/next|what (do|should)|how (do|can) i (fix|resolve)|resolve|fix|send/)) {
      if (!open.length) return 'You’re all caught up. Keep uploading receipts and statements as you get them and your CPA team will check them.';
      return 'Here’s what to do:\n' + open.slice(0, 3).map(function (x, i) { return (i + 1) + '. ' + x.title + ': ' + (x.rec || 'Message your CPA team about it.'); }).join('\n');
    }
    if (has(/spend|spent|expense|cost|categor|total|how much|largest|biggest/)) {
      if (!TX.length) return 'You haven’t added any transactions yet. Add one in Spending Tracker, or scan a receipt, and I can summarise it.';
      var cats = catTotals(), top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; })[0];
      return 'You’ve spent ' + peso(totalSpend()) + ' across ' + plural(TX.length, 'transaction', 'transactions') + '. Your biggest category is ' + top + ' at ' + peso(cats[top]) + '.';
    }
    if (has(/upload|document|receipt|statement|check|review|status|sent/)) {
      if (!up.length) return 'You haven’t uploaded anything yet. Go to Upload Documents to send a receipt, invoice or statement.';
      var checked = up.filter(function (u) { return f.some(function (x) { return x.uploadId === u.id; }); }).length;
      return 'You’ve uploaded ' + plural(up.length, 'document', 'documents') + '. Your CPA has checked ' + checked + (checked === up.length ? ', so everything is reviewed.' : ' and the other ' + (up.length - checked) + (up.length - checked === 1 ? ' is' : ' are') + ' still waiting.');
    }
    if (has(/how.*(work|detect|check)|ghost|duplicate|tin\b/)) return 'When you upload a document, your CPA team checks it for things like duplicate invoices, vendors that appear under another client’s tax ID, and figures that don’t add up. If something looks off, it appears in Fraud & Anomalies with what to do next.';
    if (has(/thank/)) return 'You’re welcome! Ask me anything else whenever you like.';
    return 'I’m not sure about that one. I can explain what was flagged, summarise your spending, or tell you what to send next. For anything else, message your CPA team in Messages.';
  }
  function askAssistant(q) {
    var url = window.DCM_LLM_ENDPOINT;
    if (!url) return new Promise(function (r) { setTimeout(function () { r(aiLocal(q)); }, 650); });
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history: getAI().slice(-10), context: aiContext() }) })
      .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(function (d) { return d.answer || aiLocal(q); });
  }
  function sendAI(q) {
    q = (q || '').trim();
    if (!q || aiBusy) return;
    var l = getAI(); l.push({ from: 'me', time: nowStamp(), text: q }); store.set('dcm_ai', l);
    $('#aiInput').value = ''; aiBusy = true; renderAI();
    askAssistant(q).catch(function () { return 'I couldn’t reach the assistant just now. Try again in a moment, or message your CPA team.'; }).then(function (a) {
      var l2 = getAI(); l2.push({ from: 'them', time: nowStamp(), text: a }); store.set('dcm_ai', l2);
      aiBusy = false; renderAI();
    });
  }
  $('#aiForm').addEventListener('submit', function (e) { e.preventDefault(); sendAI($('#aiInput').value); });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-ai-q]'); if (c) { sendAI(c.dataset.aiQ); return; }
    if (e.target.closest('#aiClear')) { store.set('dcm_ai', []); renderAI(); }
  });

  /* ---------- Settings ---------- */
  function loadSettings() {
    var prefs = store.get('dcm_prefs', { flag: true, docs: true, weekly: false });
    $('#setName').value = displayName();
    $('#setEmail').value = (session && session.email) || '';
    $('#prefFlag').checked = !!prefs.flag;
    $('#prefDocs').checked = !!prefs.docs;
    $('#prefWeekly').checked = !!prefs.weekly;
  }
  function setNameErr(msg) {
    var inp = $('#setName'), f = inp.closest('.field'), el = f.querySelector('.field-error');
    if (msg) {
      if (!el) { el = document.createElement('div'); el.className = 'field-error'; el.id = 'setNameErr'; el.setAttribute('role', 'alert'); f.appendChild(el); }
      el.textContent = msg; inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', 'setNameErr'); f.classList.add('invalid');
    } else { if (el) el.remove(); inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); f.classList.remove('invalid'); }
  }
  $('#setName').addEventListener('input', function () { if (this.getAttribute('aria-invalid') && this.value.trim()) setNameErr(''); });
  $('#settingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#setName').value.trim();
    if (!name) { setNameErr('Enter the name you\u2019d like us to use.'); $('#setName').focus(); return; }
    setNameErr('');
    store.set('dcm_name', name);
    store.set('dcm_prefs', { flag: $('#prefFlag').checked, docs: $('#prefDocs').checked, weekly: $('#prefWeekly').checked });
    updateUser();
    toast('Your settings are saved.');
  });

  /* ---------- Search + category filter ---------- */
  var searchInput = $('#searchInput'), catFilter = $('#catFilter');
  function applyFilter() {
    var q = searchInput.value.trim().toLowerCase();
    var cat = catFilter.value;
    $$('tr.filterable').forEach(function (tr) {
      var okQ = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
      var okC = !tr.closest('#txFull') || cat === 'all' || tr.dataset.cat === cat;
      tr.hidden = !(okQ && okC);
    });
    $$('.table-wrap').forEach(function (w) {
      var empty = w.nextElementSibling;
      if (empty && empty.classList.contains('empty')) {
        empty.hidden = $$('tbody tr:not([hidden])', w).length > 0;
      }
    });
  }
  $('#fxFilter').addEventListener('change', renderFraud);
  $('#fxTabDocs').addEventListener('click', function () { setFxTab(false); });
  $('#fxTabStmts').addEventListener('click', function () { setFxTab(true); });
  searchInput.addEventListener('input', applyFilter);
  catFilter.addEventListener('change', applyFilter);

  /* ---------- Router ---------- */
  var TITLES = { dashboard: 'Dashboard', upload: 'Upload Documents', spending: 'Spending Tracker', fraud: 'Fraud & Anomalies', reports: 'Financial Reports', messages: 'Messages', settings: 'Settings' };
  var app = $('#app');
  var current = null;

  function show(name) {
    if (!TITLES[name]) name = 'dashboard';
    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + name; });
    $$('[data-view]').forEach(function (a) {
      var on = a.dataset.view === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = TITLES[name] + ' | DCM & Co.';
    if (current !== null && current !== name) { searchInput.value = ''; catFilter.value = 'all'; applyFilter(); window.scrollTo(0, 0); }
    current = name;
    app.classList.remove('menu-open');
    if (name === 'messages') { renderMsgs(); renderAI(); }
  }
  function route() { var n = location.hash.replace('#', ''); if (n === 'ask') { location.replace('#messages'); setPane('ai'); return; } show(n); }
  function go(name) { if (location.hash === '#' + name) show(name); else location.hash = name; }

  window.addEventListener('hashchange', route);

  /* ---------- Click handling ---------- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-go]'))) { go(t.dataset.go); return; }
    if ((t = e.target.closest('[data-fx-ask]'))) {
      var ff = getFindings().filter(function (x) { return String(x.id) === t.dataset.fxAsk; })[0];
      if (!ff) return;
      go('messages');
      $('#chatInput').value = 'Hi, I\'d like to follow up on "' + ff.title + '" that was flagged in my documents. ';
      $('#chatInput').focus();
      return;
    }
    if (e.target.closest('[data-scan-again]')) {
      $('#ocrResult').hidden = true;
      openScanner();
      return;
    }
    if ((t = e.target.closest('[data-txdel]'))) {
      var id = t.dataset.txdel;
      var row = TX.filter(function (x) { return String(x.id) === id; })[0];
      if (!row) return;
      if (!confirm('Delete the ' + row.vendor + ' transaction (' + peso(row.amt) + ')?')) return;
      TX = TX.filter(function (x) { return String(x.id) !== id; });
      saveTx();
      $('#ocrResult').hidden = true;
      renderAll();
      toast('Transaction deleted.');
      return;
    }
    if ((t = e.target.closest('[data-del]'))) {
      var all = getMsgs();
      all.splice(+t.dataset.del, 1);
      store.set('dcm_msgs', all);
      renderMsgs();
      toast('Message deleted.');
      return;
    }
    if (e.target.closest('#clearMsgs')) {
      if (confirm('Delete all of your messages in this chat?')) {
        store.set('dcm_msgs', getMsgs().filter(function (m) { return m.from !== 'me'; }));
        renderMsgs();
        toast('Your messages were cleared.');
      }
      return;
    }
    if ((t = e.target.closest('[data-remove]'))) { queue.splice(+t.dataset.remove, 1); renderQueue(); return; }
    if ((t = e.target.closest('[data-report]'))) {
      var r = REPORTS[t.dataset.report]();
      download(r[0], r[1]);
      toast('Downloaded ' + r[0]);
      return;
    }
  });

  /* ---------- Mobile menu + logout ---------- */
  $('#menuBtn').addEventListener('click', function () { app.classList.add('menu-open'); });
  $('#scrim').addEventListener('click', function () { app.classList.remove('menu-open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') app.classList.remove('menu-open'); });
  $('#logoutLink').addEventListener('click', function () {
    try { sessionStorage.removeItem('dcm_session'); } catch (e) {}
  });

  /* ---------- Staff results arrive live ---------- */
  function ensureAccount() {
    var a = acct();
    if (!a) return;
    try {
      var list = JSON.parse(localStorage.getItem('dcm_accounts')) || {};
      if (!list[a]) { list[a] = { name: displayName(), email: session.email, createdAt: new Date().toISOString() }; localStorage.setItem('dcm_accounts', JSON.stringify(list)); }
    } catch (e) {}
  }
  var lastFlagged = getFindings().filter(isOpen).length;
  var lastThem = getMsgs().filter(function (m) { return m.from === 'them'; }).length;
  /* Another tab (staff) changed this account's data: refresh once per burst of writes. */
  var onRemoteChange = DCM.debounce(function () {
    renderFraud(); renderUploads(); renderMsgs(); renderAI(); applyFilter();
    var themNow = getMsgs().filter(function (m) { return m.from === 'them'; }).length;
    if (themNow > lastThem) toast('Your CPA team replied. Open Messages to read it.');
    lastThem = themNow;
    var now = getFindings().filter(isOpen).length;
    if (now > lastFlagged) toast('Your CPA flagged something in your documents. Open Fraud & Anomalies to see what to do.', 'error');
    lastFlagged = now;
  }, 80);
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf('::' + acct()) >= 0) onRemoteChange();
  });

  /* ---------- Init ---------- */
  txDate.value = isoToday();
  ensureAccount();
  renderAll(); renderQueue(); renderFraud(); renderUploads(); renderMsgs();
  loadSettings(); updateUser();
  route();
})();
