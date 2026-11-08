(function () {
  var $ = DCM.$, $$ = DCM.$$, esc = DCM.esc, peso = DCM.peso, nowStamp = DCM.nowStamp, isoToday = DCM.isoToday;

  /* ---------- Storage ---------- */
  var store = DCM.createStore();
  var session = DCM.session();

  var KEYS = {
    clients: 'dcm_staff_clients', receipts: 'dcm_staff_receipts', docs: 'dcm_staff_docs',
    deadlines: 'dcm_staff_deadlines', alerts: 'dcm_staff_alerts', prefs: 'dcm_staff_prefs', scan: 'dcm_staff_scan', files: 'dcm_staff_files',
    statements: 'dcm_staff_statements'
  };

  /* ---------- Sample data ---------- */
  var STATUSES = ['Awaiting Docs', 'Data Processing', 'Under Review', 'Completed'];
  var TYPES = ['Audit Engagement', 'Tax Preparation', 'Bookkeeping', 'Business Consultancy'];
  var DEF = {
    clients: [
      { id: 'c1', name: 'Diligence Corp.',  type: 'Audit Engagement',     status: 'Data Processing', score: 92, anomalies: '3 Suspicious Vendors',  priority: true },
      { id: 'c2', name: 'Commitment Inc.',  type: 'Tax Preparation',      status: 'Awaiting Docs',   score: 65, anomalies: 'Unusual Expense Spike', priority: true },
      { id: 'c3', name: 'Matter & Co.',     type: 'Business Consultancy', status: 'Completed',       score: 12, anomalies: 'None Detected',         priority: true },
      { id: 'c4', name: 'Client A',         type: 'Bookkeeping',          status: 'Awaiting Docs',   score: 78, anomalies: 'Ghost vendor, duplicate invoice' },
      { id: 'c5', name: 'Client B',         type: 'Bookkeeping',          status: 'Awaiting Docs',   score: 58, anomalies: 'Ghost vendor' },
      { id: 'c6', name: 'Client C',         type: 'Tax Preparation',      status: 'Data Processing', score: 49, anomalies: 'Ghost vendor' },
      { id: 'c7', name: 'Client D',         type: 'Bookkeeping',          status: 'Completed',       score: 41, anomalies: 'Ghost vendor' }
    ],
    receipts: [
      { id: 'r1', client: 'c4', vendor: 'XYZ Trading', tin: '123-456-789', invoice: 'XYZ-0101', date: '2026-10-10', amt: 50000, file: '',
        doc: { name: 'XYZ TRADING CORPORATION', tin: '123-456-789', total: 50000, lines: [42000, 8000], date: '2026-10-10', layout: 'T-07', hash: '' } },
      { id: 'r2', client: 'c5', vendor: 'XYZ Trading', tin: '123-456-789', invoice: 'XT-5521',  date: '2026-10-11', amt: 48500, file: '',
        doc: { name: 'XYZ Trading', tin: '123-456-798', total: 48500, lines: [30000, 18500], date: '2026-10-11', layout: 'T-07', hash: '' } },
      { id: 'r3', client: 'c6', vendor: 'XYZ Trading', tin: '123-456-789', invoice: 'XT-0090',  date: '2026-10-12', amt: 51200, file: '',
        doc: { name: 'XYZ Trading', tin: '123-456-789', total: 51200, lines: [40000, 10000], date: '2026-10-12', layout: 'T-07', hash: '' } },
      { id: 'r4', client: 'c7', vendor: 'XYZ Trading', tin: '123-456-789', invoice: 'XT-0077',  date: '2026-10-13', amt: 49900, file: '',
        doc: { name: 'XYZ Trading', tin: '123-456-789', total: 49900, lines: [49900], date: '2026-09-30', layout: 'T-07', hash: '' } },
      { id: 'r5', client: 'c4', vendor: 'ABC Office Supplies', tin: '456-789-123', invoice: 'INV-2026-004', date: '2026-09-20', amt: 12500, file: '',
        doc: { name: 'ABC Office Supplies', tin: '456-789-123', total: 12500, lines: [12500], date: '2026-09-20', layout: 'T-07', hash: 'a1b2c3' } },
      { id: 'r6', client: 'c4', vendor: 'ABC Office Supplies', tin: '456-789-123', invoice: 'INV-2026-004', date: '2026-10-15', amt: 12500, file: '',
        doc: { name: 'ABC Office Supplies', tin: '456-789-123', total: 12500, lines: [12500], date: '2026-10-15', layout: 'T-07', hash: 'a1b2c3' } },
      { id: 'r7', client: 'c2', vendor: 'Meralco',        tin: '000-111-222', invoice: 'ML-8841', date: '2026-10-12', amt: 8200, file: '',
        doc: { name: 'Meralco', tin: '000-111-222', total: 8200, lines: [7800, 400], date: '2026-10-12', layout: 'T-02', hash: '' } },
      { id: 'r8', client: 'c1', vendor: 'Globe Business', tin: '333-444-555', invoice: 'GB-2210', date: '2026-10-08', amt: 3450, file: '',
        doc: { name: 'Globe Business', tin: '333-444-555', total: 3450, lines: [3000, 450], date: '2026-10-08', layout: 'T-11', hash: '' } }
    ],
    docs: [
      { id: 'q1', client: 'c4', what: 'Q3 Receipts',      status: 'overdue',  note: 'Overdue 3 days', reminded: false },
      { id: 'q2', client: 'c5', what: 'Bank Statement',   status: 'pending',  note: 'Pending',        reminded: false },
      { id: 'q3', client: 'c6', what: 'BIR 2307',         status: 'received', note: 'Received',       reminded: false },
      { id: 'q4', client: 'c7', what: 'January Invoices', status: 'received', note: 'Received',       reminded: false }
    ],
    deadlines: [
      { id: 'd1', client: 'c4', task: 'Collect Q3 receipts',              due: '2026-10-28', done: false },
      { id: 'd2', client: 'c5', task: 'Collect bank statement',           due: '2026-11-05', done: false },
      { id: 'd3', client: 'c2', task: 'Review quarterly tax filing',      due: '2026-11-15', done: false },
      { id: 'd4', client: 'c1', task: 'Plan year-end audit fieldwork',    due: '2026-11-30', done: false },
      { id: 'd5', client: 'c3', task: 'Deliver final consultancy report', due: '2026-10-20', done: true }
    ],
    alerts: {},
    statements: [],
    prefs: { name: '', high: 75, med: 50, nFraud: true, nDocs: true },
    scan: '',
    files: { folders: [], files: [] }
  };
  var S = {};
  function loadAll() {
    Object.keys(DEF).forEach(function (k) { S[k] = store.get(KEYS[k], JSON.parse(JSON.stringify(DEF[k]))); });
    /* receipts saved by an earlier version have no extracted document fields yet */
    (S.receipts || []).forEach(function (r) {
      if (r.doc) return;
      var base = DEF.receipts.filter(function (d) { return d.id === r.id; })[0];
      if (base && base.doc) r.doc = JSON.parse(JSON.stringify(base.doc));
    });
  }
  function save(k) { store.set(KEYS[k], S[k]); }

  /* ---------- Helpers ---------- */
  function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ''); }
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) { return pd(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function cname(id) { var c = S.clients.filter(function (x) { return x.id === id; })[0]; return c ? c.name : 'Unknown client'; }
  function level(score) { return score >= S.prefs.high ? 'high' : score >= S.prefs.med ? 'medium' : 'low'; }
  var LV = { high: 'High Risk', medium: 'Med Risk', low: 'Low Risk' };
  function riskHTML(score) {
    var l = level(score);
    return '<div class="risk ' + l + '"><div class="risk-label"><span class="risk-dot"></span>' + LV[l] + ' (' + score + '%)</div><div class="meter"><i style="width:' + score + '%"></i></div></div>';
  }
  function ico(id) { return '<svg class="ico"><use href="#i-' + id + '"/></svg>'; }

  /* ---------- Toast ---------- */
  var toast = DCM.createToast($('#toast'), 3400);

  /* ---------- Fraud analysis (runs on the receipt register) ---------- */
  function analyze() {
    var flags = {}, alerts = [];
    function add(id, r) { flags[id] = flags[id] || []; if (flags[id].indexOf(r) < 0) flags[id].push(r); }

    var tins = {};
    S.receipts.forEach(function (r) {
      var k = norm(r.tin);
      var g = tins[k] || (tins[k] = { vendor: r.vendor, tin: r.tin, clients: [], ids: [] });
      if (g.clients.indexOf(r.client) < 0) g.clients.push(r.client);
      g.ids.push(r.id);
    });
    Object.keys(tins).forEach(function (k) {
      var g = tins[k];
      if (g.clients.length >= 3) {
        g.ids.forEach(function (id) { add(id, 'Ghost vendor'); });
        alerts.push({ id: 'ghost:' + k, type: 'ghost', g: g });
      }
    });

    var seen = [];
    S.receipts.map(function (r, i) { return { r: r, i: i }; })
      .sort(function (a, b) { return a.r.date < b.r.date ? -1 : a.r.date > b.r.date ? 1 : a.i - b.i; })
      .forEach(function (o) {
        var r = o.r;
        var orig = seen.filter(function (s) {
          return s.client === r.client && (norm(s.invoice) === norm(r.invoice) ||
            (norm(s.vendor) === norm(r.vendor) && s.amt === r.amt && s.date === r.date));
        })[0];
        if (orig) { add(r.id, 'Duplicate invoice'); alerts.push({ id: 'dup:' + r.id, type: 'dup', r: r, orig: orig }); }
        seen.push(r);
      });
    return { flags: flags, alerts: alerts };
  }

  function fsaAnalyze(r) {
    var anomalies = [];
    if (r.tin && r.doc && r.doc.tin !== r.tin) {
      anomalies.push('TIN mismatch: doc says ' + r.doc.tin + ', form says ' + r.tin);
    }
    if (r.doc && r.doc.lines) {
      var total = r.doc.lines.reduce(function (a, b) { return a + b; }, 0);
      if (total !== r.amt) {
        anomalies.push('Line items sum to ₱' + total + ', but stated amount is ₱' + r.amt);
      }
    }
    if (r.amt >= 50000 && r.amt % 10000 === 0) {
      anomalies.push('Round-number total ≥ ₱50,000 may need additional approval');
    }
    return anomalies.length > 0 ? anomalies.join('. ') + '.' : '';
  }
  function astatus(a) { return S.alerts[a.id] || 'open'; }

  function alertHTML(a, actions) {
    var st = astatus(a), body, cls = 'alert', reportBtn = '';
    if (a.type === 'ghost') {
      var names = a.g.clients.map(cname).join(', ');
      body = '<h4>' + ico('circle-alert') + '"Ghost Vendor" Detected</h4>' +
        '<p>The vendor <strong>' + esc(a.g.vendor) + '</strong> (TIN: ' + esc(a.g.tin) + ') is appearing across <strong>' + a.g.clients.length + ' different clients</strong>.</p>' +
        '<span class="tagline">Flagged in: ' + esc(names) + '</span>';
    } else if (a.type === 'dup') {
      cls += ' warn';
      body = '<h4>' + ico('copy') + 'Duplicate Invoice Detected</h4>' +
        '<p>Invoice <strong>#' + esc(a.r.invoice) + '</strong> recorded for ' + esc(cname(a.r.client)) + ' matches an earlier invoice from the same client.</p>' +
        '<span class="tagline">Vendor: ' + esc(a.r.vendor) + ' | Amount: ' + peso(a.r.amt) + '</span>';
    } else if (a.type === 'fx') {
      var fx = a.x, fr = fx.r;
      var labels = fx.sigs.map(function (s) { return s.label; });
      cls += fx.score >= 40 ? ' warn' : '';
      body = '<h4>' + ico('file') + 'Document flagged for review</h4>' +
        '<p><strong>' + esc(fr.vendor) + '</strong> (invoice #' + esc(fr.invoice) + ' dated ' + esc(fmtDate(fr.date)) + ') for ' + esc(cname(fr.client)) + ' scored <strong>' + fx.score + '% authenticity</strong> after ' + labels.length + ' signal' + (labels.length === 1 ? '' : 's') + '.</p>' +
        '<span class="tagline">' + esc(labels.slice(0, 3).join(' · ')) + (labels.length > 3 ? ' +' + (labels.length - 3) + ' more' : '') + '</span>';
      reportBtn = '<button type="button" class="btn sm ghost" data-fx="' + esc(fr.id) + '">Open document report</button>';
    } else if (a.type === 'fsa') {
      var sx = a.x, issues = fsaFindings(sx);
      cls += sx.verdict === 'review' ? ' warn' : '';
      body = '<h4>' + ico('file') + 'Financial statement flagged</h4>' +
        '<p><strong>' + esc(fsaStatementName(sx)) + '</strong> for ' + esc(sx.client) + ' scored <strong>' + (parseFloat(sx.authenticity) || 0) + '% authenticity</strong> with ' + issues.length + ' finding' + (issues.length === 1 ? '' : 's') + '.</p>' +
        '<span class="tagline">' + esc(issues.slice(0, 3).join(' · ')) + (issues.length > 3 ? ' +' + (issues.length - 3) + ' more' : '') + '</span>';
      reportBtn = '<button type="button" class="btn sm ghost" data-fsa-report="' + esc(sx.id) + '">Open statement report</button>';
    }
    if (st === 'resolved') cls += ' resolved';
    var foot = '';
    if (actions) {
      var badge = st === 'resolved' ? '<span class="badge received">Resolved</span>' : st === 'review' ? '<span class="badge pending">In review</span>' : '<span class="badge overdue">Open</span>';
      var id = esc(a.id), btns = '';
      if (st === 'open') btns = '<button type="button" class="btn sm ghost" data-alert="' + id + '" data-act="review">Start reviewing</button><button type="button" class="btn sm dark" data-alert="' + id + '" data-act="resolve">Mark as resolved</button>';
      if (st === 'review') btns = '<button type="button" class="btn sm dark" data-alert="' + id + '" data-act="resolve">Mark as resolved</button><button type="button" class="btn sm ghost" data-alert="' + id + '" data-act="reopen">Reopen</button>';
      if (st === 'resolved') btns = '<button type="button" class="btn sm ghost" data-alert="' + id + '" data-act="reopen">Reopen</button>';
      foot = '<div class="alert-actions">' + badge + reportBtn + btns + '</div>';
    }
    return '<div class="' + cls + (actions ? ' filterable' : '') + '" data-status="' + st + '">' + body + foot + '</div>';
  }

  /* ---------- Render: dashboard ---------- */
  function renderDashboard() {
    var active = allAlerts().filter(function (a) { return astatus(a) !== 'resolved'; });
    $('#openCount').textContent = active.length + ' open';
    $('#dashAlerts').innerHTML = active.length
      ? active.slice(0, 3).map(function (a) { return alertHTML(a, false); }).join('')
      : '<div class="empty">No open alerts. Nothing needs your attention right now.</div>';

    $('#dashDocs').innerHTML = S.docs.map(function (d) {
      var cls = d.status === 'overdue' ? 'overdue' : d.status === 'pending' ? 'pending' : 'received';
      var extra = d.status !== 'received'
        ? (d.reminded ? '<span class="sent">Reminder sent</span>' : '') +
          '<button type="button" class="btn sm ghost" data-recv="' + esc(d.id) + '">Mark as received</button>'
        : '';
      return '<li><span><b>' + esc(cname(d.client)) + '</b> <span class="what">- ' + esc(d.what) + '</span></span>' +
        '<span class="doc-right">' + extra + '<span class="badge ' + cls + '">' + esc(d.note) + '</span></span></li>';
    }).join('');

    var pri = S.clients.filter(function (c) { return c.priority; });
    $('#dashRisk').innerHTML = pri.map(function (c) {
      var btn = level(c.score) === 'high'
        ? '<button type="button" class="btn sm danger" data-client="' + esc(c.id) + '">Review this client</button>'
        : '<button type="button" class="btn sm ghost" data-client="' + esc(c.id) + '">Open client</button>';
      return '<tr class="filterable"><td><div class="client-name">' + esc(c.name) + '</div><div class="client-type">' + esc(c.type) + '</div></td>' +
        '<td>' + esc(c.status) + '</td><td>' + esc(c.anomalies) + '</td><td>' + riskHTML(c.score) + '</td><td>' + btn + '</td></tr>';
    }).join('');

    $('#scanInfo').textContent = 'Last scan: ' + (S.scan || 'never');
  }

  /* ---------- Render: clients ---------- */
  function renderClients() {
    var rf = $('#riskFilter').value, sf = $('#statusFilter').value;
    var list = S.clients.slice().sort(function (a, b) { return b.score - a.score; })
      .filter(function (c) { return (rf === 'all' || level(c.score) === rf) && (sf === 'all' || c.status === sf); });
    $('#clientRows').innerHTML = list.map(function (c) {
      return '<tr class="filterable"><td><div class="client-name">' + esc(c.name) + '</div><div class="client-type">' + esc(c.type) + '</div></td>' +
        '<td>' + esc(c.status) + '</td><td>' + esc(c.anomalies) + '</td><td>' + riskHTML(c.score) + '</td>' +
        '<td><button type="button" class="btn sm ghost" data-client="' + esc(c.id) + '">Open client</button></td></tr>';
    }).join('');
  }
  function fillSelects() {
    var opts = S.clients.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('');
    ['#rClient', '#dClient', '#scanClient'].forEach(function (id) { var el = $(id), v = el.value; el.innerHTML = opts; if (v) el.value = v; });
    var sf = $('#statusFilter'), cur = sf.value;
    sf.innerHTML = '<option value="all">All statuses</option>' + STATUSES.map(function (s) { return '<option>' + s + '</option>'; }).join('');
    sf.value = cur || 'all';
  }

  /* ---------- Render: receipts ---------- */
  function renderReceipts() {
    var an = analyze();
    var list = S.receipts.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    $('#receiptRows').innerHTML = list.map(function (r) {
      var f = an.flags[r.id];
      var status = f
        ? '<span class="badge overdue">Flagged</span><div class="reasons">' + esc(f.join(' · ')) + '</div>'
        : '<span class="badge received">Clear</span>';
      return '<tr class="filterable' + (f ? ' flag-row' : '') + '"><td>' + esc(fmtDate(r.date)) + '</td>' +
        '<td>' + esc(cname(r.client)) + '</td>' +
        '<td><div class="client-name">' + esc(r.vendor) + '</div><div class="cell-sub">TIN ' + esc(r.tin) + '</div></td>' +
        '<td>' + esc(r.invoice) + (r.file ? '<div class="cell-sub">' + esc(r.file) + '</div>' : '') + '</td>' +
        '<td class="amount">' + peso(r.amt) + '</td><td>' + status + '</td>' +
        '<td class="right"><button type="button" class="icon-btn" data-del-receipt="' + esc(r.id) + '" aria-label="Delete receipt">' + ico('trash') + '</button>' + '<button type="button" class="icon-btn" data-fsa-analyze="' + esc(r.id) + '">FS</button></td></tr>';
    }).join('');
  }

  /* ---------- Render: alerts (all sources) ---------- */
  function allAlerts() {
    var list = analyze().alerts.slice();
    fxAll().forEach(function (x) {
      if (x.verdict !== 'clear') list.push({ id: 'fx:' + x.r.id, type: 'fx', x: x });
    });
    fsaAll().forEach(function (x) {
      if (x.verdict !== 'clear') list.push({ id: 'fsa:' + x.id, type: 'fsa', x: x });
    });
    return list;
  }

  function renderFraud() {
    var all = allAlerts();
    var cross = all.filter(function (a) { return a.type === 'ghost' || a.type === 'dup'; }).length;
    var docs = all.filter(function (a) { return a.type === 'fx'; }).length;
    var stmts = all.filter(function (a) { return a.type === 'fsa'; }).length;
    var open = all.filter(function (a) { return astatus(a) !== 'resolved'; }).length;
    var high = S.clients.filter(function (c) { return level(c.score) === 'high'; }).length;
    $('#stOpen').textContent = open; $('#stCross').textContent = cross; $('#stFx').textContent = docs; $('#stFsa').textContent = stmts; $('#stHigh').textContent = high;
    $('#stHighNote').textContent = 'Score ' + S.prefs.high + '% or more';

    var f = $('#alertFilter').value;
    var rank = { open: 0, review: 1, resolved: 2 };
    var list = all.filter(function (a) { return f === 'all' || astatus(a) === f; })
      .sort(function (a, b) { return rank[astatus(a)] - rank[astatus(b)]; });
    $('#fraudList').innerHTML = list.map(function (a) { return alertHTML(a, true); }).join('');

    $('#riskBars').innerHTML = S.clients.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) {
      return '<div class="rbar"><div class="rbar-top"><span>' + esc(c.name) + '</span><span><b>' + c.score + '%</b> · ' + LV[level(c.score)] + '</span></div>' +
        '<div class="bar"><i class="' + level(c.score) + '" style="width:' + c.score + '%"></i></div></div>';
    }).join('');

    var badge = $('#navAlerts');
    badge.textContent = open; badge.hidden = open === 0;

    var tab = $('#tabAlertCount');
    tab.textContent = open; tab.classList.toggle('hot', open > 0);
  }

  /* ---------- Cross-Client Checks ---------- */
  function renderCross() {
    var an = analyze();
    var ghosts = an.alerts.filter(function (a) { return a.type === 'ghost'; });
    var dupes = an.alerts.filter(function (a) { return a.type === 'dup'; });
    
    // Stats
    $('#crossDocs').textContent = S.receipts.length;
    $('#crossGhosts').textContent = ghosts.length;
    $('#crossDupes').textContent = dupes.length;
    $('#crossClear').textContent = S.receipts.length - Object.keys(an.flags).length;

    var tabCount = $('#tabCrossCount');
    var totalFlagged = ghosts.length + dupes.length;
    tabCount.textContent = totalFlagged;
    tabCount.hidden = totalFlagged === 0;
    tabCount.classList.toggle('hot', totalFlagged > 0);

    // Table
    var f = $('#crossFilter').value;
    var rows = [];

    S.receipts.forEach(function(r) {
        var flags = an.flags[r.id];
        if (!flags) return; // clear
        
        var isGhost = flags.indexOf('Ghost vendor') >= 0;
        var isDup = flags.indexOf('Duplicate invoice') >= 0;
        
        if (f === 'ghost' && !isGhost) return;
        if (f === 'dup' && !isDup) return;

        var label = flags.join(', ');
        
        rows.push('<tr class="filterable">' +
            '<td><div class="fx-doc"><span class="fx-tile bad">' + ico('file') + '</span><div>' +
                '<div class="fx-name">' + esc(r.vendor) + '</div>' +
                '<div class="fx-sub">' + esc(r.invoice) + ' · ' + esc(fmtDate(r.date)) + '</div></div></div></td>' +
            '<td>' + esc(cname(r.client)) + '<div class="fx-sub">TIN ' + esc(r.tin) + '</div></td>' +
            '<td><span class="sig sev-high">' + esc(label) + '</span></td>' +
            '<td><span class="badge overdue">Flagged</span></td>' +
            '<td class="right"><button type="button" class="btn sm ghost" data-cross-goto="' + esc(r.id) + '">View in register</button></td>' +
        '</tr>');
    });

    $('#crossRows').innerHTML = rows.join('');
    $('#crossRows').parentNode.parentNode.hidden = rows.length === 0 && f === 'all';
  }

  /* ---------- Document forensics (LLM over the receipt register) ---------- */
  var FX_LIMIT = 50000;            /* purchases at or above this need a second signature */
  var FX_W = { name: 12, tin: 22, lines: 26, total: 20, date: 16, template: 24, image: 28, under: 20, round: 6, repeat: 15 };
  var FX_LABEL = { fake: 'Likely fabricated', review: 'Needs review', clear: 'Clear' };
  var FX_FIELDS = ['name', 'tin', 'total', 'date'];

  function fxTone(score) { return score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high'; }

  function fxShared() {
    var map = {};
    S.receipts.forEach(function (r) {
      if (!r.doc || !r.doc.layout) return;
      var L = map[r.doc.layout] || (map[r.doc.layout] = { ids: [], tins: [] });
      L.ids.push(r.id);
      if (L.tins.indexOf(norm(r.tin)) < 0) L.tins.push(norm(r.tin));
    });
    var out = {};
    Object.keys(map).forEach(function (k) { if (map[k].tins.length > 1) out[k] = map[k]; });
    return out;
  }

  function fxReport(r, shared) {
    var d = r.doc, sigs = [], amt = Number(r.amt) || 0;
    function add(code, label, sev, detail) { sigs.push({ code: code, label: label, sev: sev, w: FX_W[code], detail: detail }); }

    if (d) {
      if (d.name && norm(d.name) !== norm(r.vendor))
        add('name', 'Vendor name differs', 'med', 'The name printed on the document reads “' + d.name + '”, while the register has “' + r.vendor + '”.');
      if (d.tin && norm(d.tin) !== norm(r.tin))
        add('tin', 'TIN differs', 'high', 'The TIN on the document (' + d.tin + ') does not match the TIN recorded for this vendor (' + r.tin + ').');
      if (d.lines && d.lines.length && d.total != null) {
        var sum = d.lines.reduce(function (a, b) { return a + Number(b); }, 0);
        if (Math.abs(sum - Number(d.total)) > 0.5)
          add('lines', 'Line items don’t add up', 'high', 'The line items total ' + peso(sum) + ' but the document states ' + peso(d.total) + '.');
      }
      if (d.total != null && Math.abs(Number(d.total) - amt) > 0.5)
        add('total', 'Total differs from register', 'high', 'The document shows ' + peso(d.total) + ' but ' + peso(amt) + ' was keyed into the register.');
      if (d.date && d.date !== r.date) {
        var gap = Math.round((pd(r.date) - pd(d.date)) / 86400000);
        add('date', 'Document date differs', 'med', 'The document is dated ' + fmtDate(d.date) + ', ' + Math.abs(gap) + ' day' + (Math.abs(gap) === 1 ? '' : 's') + (gap > 0 ? ' before' : ' after') + ' it was recorded on ' + fmtDate(r.date) + '.');
      }
      var L = d.layout ? shared[d.layout] : null;
      if (L) {
        var others = L.ids.length - 1, otherTins = L.tins.length - 1;
        add('template', 'Shared layout', 'high', 'The page layout matches ' + others + ' other document' + (others === 1 ? '' : 's') + ' on file, ' + otherTins + ' of them filed under a different supplier TIN.');
      }
      if (d.hash) {
        var twin = S.receipts.filter(function (x) { return x.id !== r.id && x.doc && x.doc.hash === d.hash; })[0];
        if (twin) add('image', 'Same scan as another receipt', 'high', 'The scan is identical to invoice ' + twin.invoice + ' filed for ' + cname(twin.client) + ' on ' + fmtDate(twin.date) + '.');
      }
    }

    if (amt >= 10000 && amt % 1000 === 0)
      add('round', 'Round-number total', 'low', 'The total is exactly ' + peso(amt) + ', which is unusual for goods actually received.');
    if (amt < FX_LIMIT && amt >= FX_LIMIT * 0.95)
      add('under', 'Just under the approval limit', 'high', 'The total sits ' + peso(FX_LIMIT - amt) + ' below ' + peso(FX_LIMIT) + ', the amount that needs a second signature.');
    var same = S.receipts.filter(function (x) { return x.id !== r.id && Number(x.amt) === amt && norm(x.tin) !== norm(r.tin); });
    if (same.length)
      add('repeat', 'Same amount, another supplier', 'med', 'The amount ' + peso(amt) + ' also appears on ' + same.length + ' document' + (same.length === 1 ? '' : 's') + ' filed under a different TIN.');

    var score = 100;
    sigs.forEach(function (s) { score -= s.w; });
    score = Math.max(5, score);
    var highs = sigs.filter(function (s) { return s.sev === 'high'; }).length;
    return {
      r: r, sigs: sigs, score: score,
      conf: sigs.length ? Math.min(96, 58 + sigs.length * 7 + highs * 9) : 0,
      verdict: score >= 70 ? 'clear' : score >= 40 ? 'review' : 'fake'
    };
  }
  function fxAll() { var shared = fxShared(); return S.receipts.map(function (r) { return fxReport(r, shared); }); }

  function fxNarrative(x) {
    var r = x.r, who = cname(r.client);
    if (!x.sigs.length) {
      return (r.doc
        ? 'We read the vendor name, TIN, date and total on this document and compared them with the register and every other document on file. Nothing conflicts.'
        : 'This receipt was keyed in by hand, so there is no image to read. The amount and the rest of the register were still checked, and nothing conflicts.')
        + ' The ' + peso(r.amt) + ' from ' + r.vendor + ' for ' + who + ' looks like an ordinary expense.';
    }
    var open = (r.doc
      ? 'We extracted the vendor name, TIN, date and total from this document, then compared them with the register and the other documents on file.'
      : 'This receipt was keyed in by hand, so only the amount and the register could be checked.') +
      ' ' + x.sigs.length + ' signal' + (x.sigs.length === 1 ? '' : 's') + ' came back for ' + who + '.';
    return open + ' ' + x.sigs.map(function (s) { return s.detail; }).join(' ');
  }
  function fxRecommend(x) {
    if (!x.sigs.length) return 'No action needed beyond normal review.';
    var has = function (c) { return x.sigs.some(function (s) { return s.code === c; }); };
    if (has('image')) return 'Ask the client for the supplier’s own copy of this receipt. An identical scan is already on file, so the same expense cannot be claimed twice.';
    if (has('tin') || has('template')) return 'Request the supplier’s BIR-registered details and check the TIN before posting. If the client cannot produce a matching official receipt, treat the expense as unsupported.';
    if (has('lines') || has('total') || has('date') || has('name')) return 'Ask the client for the original document so the fields can be compared by hand. Differences like these usually mean the receipt was re-issued or amended.';
    if (has('under')) return 'Ask whether this purchase was split to stay under the approval limit, and get the second signature on file.';
    return 'Flag it for a quick look at the next review.';
  }

  function fxRowHTML(x) {
    var r = x.r, d = r.doc || {}, tone = fxTone(x.score);
    var read = r.doc ? FX_FIELDS.filter(function (k) { return d[k] != null && d[k] !== ''; }).length : 0;
    var chips = x.sigs.length
      ? x.sigs.slice(0, 3).map(function (s) { return '<span class="sig sev-' + s.sev + '">' + esc(s.label) + '</span>'; }).join('') +
        (x.sigs.length > 3 ? '<span class="sig">+' + (x.sigs.length - 3) + '</span>' : '')
      : '<span class="fx-clear">No signals</span>';
    return '<tr class="filterable">' +
      '<td><div class="fx-doc"><span class="fx-tile ' + (tone === 'low' ? '' : tone === 'medium' ? 'warn' : 'bad') + '">' + ico('file') + '</span><div>' +
        '<div class="fx-name">' + esc(r.vendor) + '</div>' +
        '<div class="fx-sub">' + esc(r.invoice) + ' · ' + esc(fmtDate(r.date)) + '</div></div></div></td>' +
      '<td>' + esc(cname(r.client)) + '<div class="fx-sub">TIN ' + esc(r.tin) + '</div></td>' +
      '<td>' + (r.doc ? '<span class="fx-sub">' + read + ' of 4 fields</span>' : '<span class="fx-sub">Not extracted</span>') + '</td>' +
      '<td><div class="fx-sigs">' + chips + '</div></td>' +
      '<td><div class="fx-score"><div class="fx-score-top">' + x.score + '%<small>' + FX_LABEL[x.verdict] + '</small></div>' +
        '<div class="fx-meters"><i class="' + tone + '" style="width:' + x.score + '%"></i></div></div></td>' +
      '<td class="right"><button type="button" class="btn sm ghost" data-fx="' + esc(r.id) + '">Open report</button></td></tr>';
  }

  function renderAmounts(docs) {
    var pick = function (code) { return docs.filter(function (x) { return x.sigs.some(function (s) { return s.code === code; }); }); };
    var under = pick('under'), round = pick('round'), repeat = pick('repeat');
    var items = [
      { ok: !under.length, t: 'Under the approval limit',
        d: under.length
          ? under.map(function (x) { return peso(x.r.amt) + ' (' + x.r.invoice + ')'; }).join(', ') + ' sit within 5% of ' + peso(FX_LIMIT) + ', where a second signature is required.'
          : 'No document sits just under the ' + peso(FX_LIMIT) + ' approval limit.' },
      { ok: !round.length, t: 'Round-number totals',
        d: round.length
          ? round.length + ' of ' + docs.length + ' totals end in 000 — ' + round.map(function (x) { return peso(x.r.amt); }).join(', ') + '.'
          : 'No total is a round figure.' },
      { ok: !repeat.length, t: 'Repeated amounts',
        d: repeat.length
          ? repeat.length + ' document' + (repeat.length === 1 ? '' : 's') + ' repeat an amount that also appears under a different TIN.'
          : 'No amount is repeated under a different TIN.' }
    ];
    $('#fxAmounts').innerHTML = items.map(function (it) {
      return '<li>' + ico(it.ok ? 'check' : 'circle-alert') + '<div><strong>' + esc(it.t) + '</strong><span>' + esc(it.d) + '</span></div></li>';
    }).join('');
  }

  function renderForensics() {
    var docs = fxAll();
    var flagged = docs.filter(function (x) { return x.verdict !== 'clear'; });
    $('#fxDocs').textContent = docs.length;
    $('#fxFlagged').textContent = flagged.length;
    $('#fxSignals').textContent = docs.reduce(function (n, x) { return n + x.sigs.length; }, 0);
    $('#fxClusters').textContent = Object.keys(fxShared()).length;

    var tab = $('#tabFxCount');
    tab.textContent = flagged.length; tab.hidden = flagged.length === 0;
    tab.classList.toggle('hot', flagged.length > 0);

    var f = $('#fxFilter').value;
    var list = docs.slice().sort(function (a, b) { return a.score - b.score; }).filter(function (x) {
      return f === 'all' || (f === 'flagged' ? x.verdict !== 'clear' : x.verdict === f);
    });
    $('#fxRows').innerHTML = list.map(fxRowHTML).join('');
    renderAmounts(docs);
  }

  function fsaAll() {
    var base = [
      { id: 'a1', statement: 'Q3 2026 Financial Statement · Client A', client: 'Client A', type: 'Expense Spike', variance: '312%', authenticity: '34%', verdict: 'fake', llm: 'The 312% increase in Miscellaneous Expenses significantly exceeds typical operational variance. This pattern is consistent with hidden withdrawals or personal expenses being routed through the company accounts, a common tactic in fraud schemes where personal costs are disguised as business expenses.', rec: 'Request the client provide BIR-registered expense documentation and verify each Miscellaneous Expense entry before posting.', sigs: ['Expense Spike'] },
      { id: 'a2', statement: 'Q3 2026 Financial Statement · Client B', client: 'Client B', type: 'Cash Variance', variance: '45%', authenticity: '40%', verdict: 'review', llm: 'Revenue growth of ₱500k without a corresponding increase in Cash suggests either channel stuffing (artificial inflation of sales to meet targets) or severe collection issues where receivables are not being converted to cash. Both indicate fundamental problems with revenue recognition and cash flow.', rec: 'Review revenue recognition policies and aging receivables schedule. Confirm all ₱500k in reported revenue has corresponding cash receipts. If channel stuffing is suspected, inspect sales contracts and dispatch documents for artificial volume inflation.', sigs: ['Cash Variance'] }
    ];
    var scanned = (S.statements || []).map(function (s) {
      return {
        id: s.id, statement: s.name, client: cname(s.client), type: s.type,
        variance: s.variance, authenticity: s.authenticity + '%', verdict: s.verdict,
        llm: s.llm, rec: s.rec, sigs: s.sigs || [], scanned: true, total: s.total, date: s.date
      };
    });
    return scanned.concat(base);
  }

  function fsaStatementName(x) {
    var suffix = ' · ' + x.client;
    return x.statement.slice(-suffix.length) === suffix ? x.statement.slice(0, -suffix.length) : x.statement;
  }

  function fsaFindings(x) {
    if (x.verdict === 'clear') return [];
    if (x.scanned && x.sigs && x.sigs.length) {
      return x.sigs.map(function (s) { return typeof s === 'string' ? s : s.label; });
    }
    return [x.type];
  }

  function fsaSummaryData(anomalies) {
    var d = { total: anomalies.length, flagged: [], fake: 0, review: 0, clear: 0, findings: [], clients: [] };
    anomalies.forEach(function (x) { if (x.verdict !== 'clear') d.flagged.push(x); });
    d.flagged.forEach(function (x) {
      if (x.verdict === 'fake') d.fake++;
      else if (x.verdict === 'review') d.review++;
    });
    d.clear = d.total - d.flagged.length;

    var fc = {};
    d.flagged.forEach(function (x) {
      fsaFindings(x).forEach(function (label) { fc[label] = (fc[label] || 0) + 1; });
    });
    d.findings = Object.keys(fc).map(function (label) { return { label: label, count: fc[label] }; })
      .sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label); });

    var cc = {};
    d.flagged.forEach(function (x) {
      var c = cc[x.client] || (cc[x.client] = { name: x.client, count: 0, score: 100 });
      c.count++;
      c.score = Math.min(c.score, parseFloat(x.authenticity) || 0);
    });
    d.clients = Object.keys(cc).map(function (k) { return cc[k]; })
      .sort(function (a, b) { return b.count - a.count || a.score - b.score; });
    return d;
  }

  function renderFSASummary(anomalies) {
    var box = $('#fsaSummary');
    if (!box) return;
    var d = fsaSummaryData(anomalies);
    var pct = d.total ? Math.round((d.flagged.length / d.total) * 100) : 0;
    var tone = d.fake ? 'high' : d.review ? 'medium' : 'low';
    var lead;

    if (!d.total) {
      lead = 'No financial statements are in the register yet. Scan a statement to start building the summary.';
    } else if (!d.flagged.length) {
      lead = 'All ' + d.total + ' statements in the register are clear. No anomalies were found in the latest analysis.';
    } else {
      var mix = [];
      if (d.fake) mix.push(d.fake + ' likely fabricated');
      if (d.review) mix.push(d.review + ' for review');
      lead = d.flagged.length + ' of ' + d.total + ' statements need attention (' + mix.join(', ') + ').';
      if (d.findings.length) {
        lead += ' The most common finding is ' + d.findings[0].label + ' (' + d.findings[0].count + ' statement' + (d.findings[0].count === 1 ? '' : 's') + ').';
      }
      if (d.clients.length) {
        var top = d.clients[0];
        lead += ' ' + top.name + ' has the highest exposure, with ' + top.count + ' flagged statement' + (top.count === 1 ? '' : 's') + ' and a lowest authenticity score of ' + top.score + '%.';
      }
    }

    var rec;
    if (!d.flagged.length) {
      rec = 'No follow-up is needed. Keep the register current and re-run the analysis after the next batch of statements is scanned.';
    } else if (d.fake) {
      rec = 'Request the supporting schedules and ledger detail for the ' + d.fake + ' likely fabricated statement' + (d.fake === 1 ? '' : 's') + ', starting with ' + d.clients[0].name + '. Hold approvals until the figures are explained.';
    } else {
      rec = 'Send the ' + d.review + ' review item' + (d.review === 1 ? '' : 's') + ' to the engagement team, starting with ' + d.clients[0].name + ', and confirm the figures against the client ledger before posting.';
    }

    var findingsHTML = d.findings.length
      ? d.findings.slice(0, 4).map(function (f) {
          return '<li><span>' + esc(f.label) + '</span><b>' + f.count + '</b></li>';
        }).join('')
      : '<li class="is-empty">No findings in this register.</li>';
    var clientsHTML = d.clients.length
      ? d.clients.slice(0, 4).map(function (c) {
          return '<li><span>' + esc(c.name) + '<small>' + c.count + ' flagged statement' + (c.count === 1 ? '' : 's') + ' · ' + c.score + '% lowest authenticity</small></span><b>' + c.count + '</b></li>';
        }).join('')
      : '<li class="is-empty">No clients need follow-up.</li>';
    var share = function (n) { return d.total ? (n / d.total) * 100 : 0; };

    box.innerHTML =
      '<div class="fsa-report-top">' +
        '<div>' +
          '<span class="fsa-kicker">Financial statement register · generated ' + esc(nowStamp()) + '</span>' +
          '<p class="fsa-lead">' + esc(lead) + '</p>' +
        '</div>' +
        '<div class="fsa-score">' +
          '<div class="fx-verdict ' + tone + '">' + pct + '%<small>need attention</small></div>' +
          '<span class="badge ' + (d.fake ? 'overdue' : d.review ? 'pending' : 'received') + '">' + (d.fake ? 'Elevated risk' : d.review ? 'Review needed' : 'Portfolio clear') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fsa-mix">' +
        '<div class="fsa-mix-item bad"><small>Likely fabricated</small><strong>' + d.fake + '</strong></div>' +
        '<div class="fsa-mix-item warn"><small>For review</small><strong>' + d.review + '</strong></div>' +
        '<div class="fsa-mix-item ok"><small>Clear</small><strong>' + d.clear + '</strong></div>' +
      '</div>' +
      '<div class="fsa-bar" aria-hidden="true"><i class="bad" style="width:' + share(d.fake) + '%"></i><i class="warn" style="width:' + share(d.review) + '%"></i><i class="ok" style="width:' + share(d.clear) + '%"></i></div>' +
      '<div class="fsa-cols">' +
        '<div><h4>Most common findings</h4><ul class="fsa-list">' + findingsHTML + '</ul></div>' +
        '<div><h4>Clients to follow up</h4><ul class="fsa-list">' + clientsHTML + '</ul></div>' +
      '</div>' +
      '<div class="fx-rec"><h4>' + ico('shield') + 'Recommended action</h4><p>' + esc(rec) + '</p></div>';
  }

  function exportFSASummary() {
    var anomalies = fsaAll();
    var d = fsaSummaryData(anomalies);
    var rows = [
      ['DCM & Co. - Financial Statement Analytics summary'],
      ['Generated', nowStamp()],
      ['Statements analyzed', d.total],
      ['Need attention', d.flagged.length],
      ['Likely fabricated', d.fake],
      ['For review', d.review],
      ['Clear', d.clear],
      [],
      ['Most common findings', 'Count']
    ];
    d.findings.forEach(function (f) { rows.push([f.label, f.count]); });
    rows.push([], ['Clients to follow up', 'Flagged statements', 'Lowest authenticity (%)']);
    d.clients.forEach(function (c) { rows.push([c.name, c.count, c.score]); });
    rows.push([], ['Statement', 'Client', 'Findings', 'Verdict', 'Authenticity (%)', 'Variance', 'Date']);
    anomalies.forEach(function (x) {
      rows.push([
        x.statement, x.client, fsaFindings(x).join('; ') || 'None',
        x.verdict === 'clear' ? 'Clear' : x.verdict === 'review' ? 'Review' : 'Fake',
        parseFloat(x.authenticity) || 0, x.variance, x.date || ''
      ]);
    });
    var file = 'dcm-financial-statement-summary-' + isoToday() + '.csv';
    download(file, rows);
    toast('Downloaded ' + file);
  }

  function renderFSA() {
    var anomalies = fsaAll();
    var flagged = anomalies.filter(function (x) { return x.verdict !== 'clear'; });
    $('#fsDocs').textContent = anomalies.length;
    $('#fsFlagged').textContent = flagged.length;
    var variances = anomalies.map(function (x) { return parseFloat(x.variance) || 0; });
    var topVariance = Math.max.apply(null, variances.concat([0]));
    $('#fsVariance').textContent = topVariance ? topVariance + '%' : '—';
    $('#fsClean').textContent = (anomalies.length - flagged.length) + '/' + anomalies.length;
    var tab = $('#tabFSACount');
    tab.textContent = flagged.length; tab.hidden = flagged.length === 0; tab.classList.toggle('hot', flagged.length > 0);

    var f = $('#fsFilter').value;
    var list = anomalies.filter(function (x) {
      return f === 'all' || (f === 'flagged' ? x.verdict !== 'clear' : x.verdict === f);
    });
    $('#fsaRows').innerHTML = list.map(function (x) {
      var score = parseFloat(x.authenticity) || 0;
      var tone = x.verdict === 'clear' ? 'low' : score < 50 ? 'high' : 'medium';
      var label = x.verdict === 'clear' ? 'Clear' : score < 50 ? 'Fake' : 'Review';
      return '<tr class="filterable" data-fsa-report="' + esc(x.id) + '">' +
        '<td>' + esc(x.statement) + '</td>' +
        '<td>' + esc(x.client) + '</td>' +
        '<td>' + esc(x.type) + '</td>' +
        '<td>' + esc(x.variance) + '</td>' +
        '<td><div class="risk ' + tone + '"><div class="risk-label"><span class="risk-dot"></span>' + label + ' (' + x.authenticity + ')</div><div class="meter"><i style="width:' + score + '%"></i></div></div></td>' +
        '<td><button type="button" class="btn sm ghost" data-fsa-report="' + esc(x.id) + '">Open report</button></td>' +
      '</tr>';
    }).join('');
    $('#fsaRows').parentNode.parentNode.hidden = list.length === 0 && f === 'all';
    renderFSASummary(anomalies);
  }

  function fxModal(id) {
    var x = fxAll().filter(function (d) { return d.r.id === id; })[0];
    if (!x) return;
    var r = x.r, tone = fxTone(x.score);
    var sigs = x.sigs.length
      ? '<div class="fx-sig-list">' + x.sigs.map(function (s) {
          return '<div class="fx-sig ' + s.sev + '"><span class="dot"></span><div><strong>' + esc(s.label) + '</strong><span>' + esc(s.detail) + '</span></div><span class="fx-weight">−' + s.w + '</span></div>';
        }).join('') + '</div>'
      : '<div class="fx-sig-list"><div class="fx-sig low"><span class="dot"></span><div><strong>No signals</strong><span>Every extracted field matched the register and no amount pattern fired.</span></div><span class="fx-weight">0</span></div></div>';
    openModal(r.vendor + ' · ' + r.invoice,
      '<div class="fx-report-top"><div>' +
        '<div class="fx-sub">' + esc(cname(r.client)) + ' · TIN ' + esc(r.tin) + ' · ' + esc(fmtDate(r.date)) + ' · ' + peso(r.amt) + '</div>' +
        '<div class="fx-verdict ' + tone + '">' + x.score + '%<small>authenticity</small></div>' +
      '</div><span class="badge ' + (x.verdict === 'clear' ? 'received' : x.verdict === 'review' ? 'pending' : 'overdue') + '">' + FX_LABEL[x.verdict] + '</span></div>' +
      '<div class="fx-narr"><h4>' + ico('cpu') + 'What the model saw' + (x.conf ? ' · ' + x.conf + '% confidence' : '') + '</h4><p>' + esc(fxNarrative(x)) + '</p></div>' +
      sigs +
      '<div class="fx-rec"><h4>' + ico('shield') + 'Recommended next step</h4><p>' + esc(fxRecommend(x)) + '</p></div>' +
      '<div class="btn-row mt-0"><button type="button" class="btn sm ghost" data-fx-goto="' + esc(r.invoice) + '">View in receipt register</button><button type="button" class="btn sm dark" data-close>Close</button></div>');
    $('.dialog', modal).classList.add('wide');
  }

  function setFTab(name) {
    $$('.tab[data-ftab]').forEach(function (b) {
      var on = b.dataset.ftab === name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    $('#panelAlerts').hidden = name !== 'alerts';
    $('#panelCross').hidden = name !== 'cross';
    $('#panelForensics').hidden = name !== 'forensics';
    $('#panelFSA').hidden = name !== 'fsa';
    if (name === 'alerts') renderFraud();
    if (name === 'cross') renderCross();
    if (name === 'forensics') renderForensics();
    if (name === 'fsa') renderFSA();
    applyFilter();
  }

  function fsaModal(id) {
    var x = fsaAll().filter(function (d) { return d.id === id; })[0];
    if (!x) return;
    var score = parseFloat(x.authenticity) || 0;
    var tone = x.verdict === 'clear' ? 'low' : score < 50 ? 'high' : 'medium';
    var sigs = x.sigs.length
      ? '<div class="fx-sig-list">' + x.sigs.map(function (s) {
          return '<div class="fx-sig ' + s.sev + '"><span class="dot"></span><div><strong>' + esc(s.label) + '</strong><span>' + esc(s.detail) + '</span></div><span class="fx-weight">−' + s.w + '</span></div>';
        }).join('') + '</div>'
      : '<div class="fx-sig-list"><div class="fx-sig low"><span class="dot"></span><div><strong>No signals</strong><span>Every field matched the register and no pattern fired.</span></div><span class="fx-weight">0</span></div></div>';
    openModal(x.statement,
      '<div class="fx-report-top"><div>' +
        '<div class="fx-sub">' + esc(x.client) + ' · ' + (x.scanned ? peso(x.total || 0) + ' total' + (x.date ? ' · ' + fmtDate(x.date) : '') : x.variance + ' variance') + '</div>' +
        '<div class="fx-verdict ' + tone + '">' + score + '%<small>authenticity</small></div>' +
      '</div><span class="badge ' + (x.verdict === 'clear' ? 'received' : x.verdict === 'review' ? 'pending' : 'overdue') + '">' + (x.verdict === 'clear' ? 'Clear' : x.verdict === 'review' ? 'Review' : 'Fake') + '</span></div>' +
      '<div class="fx-narr"><h4>' + ico('cpu') + 'LLM explanation</h4><p>' + esc(x.llm) + '</p></div>' +
      sigs +
      '<div class="fx-rec"><h4>' + ico('shield') + 'Recommended next step</h4><p>' + esc(x.rec) + '</p></div>' +
      '<div class="btn-row mt-0">' + (x.scanned ? '' : '<button type="button" class="btn sm ghost" data-fx-goto="' + esc(x.id) + '">View in receipt register</button>') + '<button type="button" class="btn sm dark" data-close>Close</button></div>');
    $('.dialog', modal).classList.add('wide');
  }

  (function () {
    $('#tabAlerts').parentNode.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(e.key) < 0) return;
      var tabs = $$('.tab[data-ftab]'), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : tabs.length - 1;
      setFTab(tabs[n].dataset.ftab); tabs[n].focus();
    });
  })();

  function runForensics() {
    var btn = $('#fxRun'), label = $('span', btn);
    btn.disabled = true; label.textContent = 'Reading documents...';
    $('.ico', btn).classList.add('spin');
    setTimeout(function () {
      btn.disabled = false; label.textContent = 'Re-run analysis';
      $('.ico', btn).classList.remove('spin');
      renderForensics(); applyFilter();
      var n = fxAll().filter(function (x) { return x.verdict !== 'clear'; }).length;
      toast('Forensics finished. ' + n + ' document' + (n === 1 ? '' : 's') + ' need' + (n === 1 ? 's' : '') + ' review.');
    }, 1400);
  }

  /* ---------- Render: deadlines ---------- */
  function dlInfo(d) {
    if (d.done) return { key: 'done', label: 'Done', cls: 'received', days: 0 };
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var days = Math.round((pd(d.due) - t) / 86400000);
    if (days < 0) return { key: 'overdue', label: 'Overdue ' + (-days) + ' day' + (days === -1 ? '' : 's'), cls: 'overdue', days: days };
    if (days <= 7) return { key: 'soon', label: days === 0 ? 'Due today' : 'Due in ' + days + ' day' + (days === 1 ? '' : 's'), cls: 'pending', days: days };
    return { key: 'upcoming', label: 'Upcoming', cls: 'info', days: days };
  }
  function renderDeadlines() {
    var infos = S.deadlines.map(function (d) { return { d: d, i: dlInfo(d) }; });
    $('#dlOpen').textContent = infos.filter(function (x) { return x.i.key !== 'done'; }).length;
    $('#dlSoon').textContent = infos.filter(function (x) { return x.i.key === 'soon'; }).length;
    $('#dlOver').textContent = infos.filter(function (x) { return x.i.key === 'overdue'; }).length;

    var f = $('#deadlineFilter').value;
    var list = infos.filter(function (x) {
      return f === 'all' || (f === 'open' && x.i.key !== 'done') || (f === 'overdue' && x.i.key === 'overdue') || (f === 'done' && x.i.key === 'done');
    }).sort(function (a, b) {
      if ((a.i.key === 'done') !== (b.i.key === 'done')) return a.i.key === 'done' ? 1 : -1;
      return a.d.due < b.d.due ? -1 : a.d.due > b.d.due ? 1 : 0;
    });
    $('#deadlineRows').innerHTML = list.map(function (x) {
      var d = x.d, id = esc(d.id);
      return '<tr class="filterable"><td><div class="client-name' + (x.i.key === 'done' ? ' struck' : '') + '">' + esc(d.task) + '</div></td>' +
        '<td>' + esc(cname(d.client)) + '</td><td>' + esc(fmtDate(d.due)) + '</td>' +
        '<td><span class="badge ' + x.i.cls + '">' + esc(x.i.label) + '</span></td>' +
        '<td class="right"><button type="button" class="btn sm ghost" data-toggle-dl="' + id + '">' + (d.done ? 'Reopen' : 'Mark done') + '</button> ' +
        '<button type="button" class="icon-btn" data-del-dl="' + id + '" aria-label="Delete deadline">' + ico('trash') + '</button></td></tr>';
    }).join('');
  }

  /* ---------- Render: settings + user ---------- */
  function defaultName() {
    var base = session && session.email ? session.email.split('@')[0] : 'Staff';
    var w = base.split(/[._\-+]+/).filter(Boolean).map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); });
    return w.length ? w.join(' ') : 'Staff';
  }
  function displayName() { return S.prefs.name || defaultName(); }
  function updateUser() {
    var n = displayName();
    $('#userName').textContent = 'Welcome, ' + n;
    $('#userAvatar').textContent = n.split(' ').slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'S';
  }
  function renderSettings() {
    $('#setName').value = displayName();
    $('#setEmail').value = (session && session.email) || '';
    $('#setHigh').value = S.prefs.high; $('#setMed').value = S.prefs.med;
    $('#prefFraud').checked = !!S.prefs.nFraud; $('#prefDocs').checked = !!S.prefs.nDocs;
  }

  /* ---------- Search filter ---------- */
  var searchInput = $('#searchInput');
  function applyFilter() {
    var q = searchInput.value.trim().toLowerCase();
    if (current === 'files') renderFiles();
    $$('.filterable').forEach(function (el) {
      el.hidden = !!q && el.textContent.toLowerCase().indexOf(q) === -1;
    });
    $$('.scope').forEach(function (sc) {
      var empty = sc.nextElementSibling;
      if (empty && empty.classList.contains('empty')) {
        empty.hidden = $$('.filterable:not([hidden])', sc).length > 0;
      }
    });
  }
  function refresh() {
    syncPortal();
    fillSelects();
    renderDashboard(); renderClients(); renderReceipts(); renderFraud(); renderCross(); renderDeadlines(); renderFiles(); renderForensics(); renderInbox(); renderMessages();
    updateUser(); applyFilter();
  }

  /* ---------- Modal ---------- */
  var modal = $('#modal'), lastFocus = null;
  function openModal(title, html) {
    lastFocus = document.activeElement;
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    modal.hidden = false;
    $('.dialog', modal).focus();
  }
  function openFSAModal(rec) {
    var anomalies = [];
    if (rec.tin && rec.doc && rec.doc.tin !== rec.tin) {
      anomalies.push('TIN mismatch: doc says ' + rec.doc.tin + ', form says ' + rec.tin);
    }
    if (rec.doc && rec.doc.lines) {
      var total = rec.doc.lines.reduce(function (a, b) { return a + b; }, 0);
      if (total !== rec.amt) {
        anomalies.push('Line items sum to ₱' + total + ', but stated amount is ₱' + rec.amt);
      }
    }
    if (rec.amt >= 50000 && rec.amt % 10000 === 0) {
      anomalies.push('Round-number total ≥ ₱50,000 may need additional approval');
    }
    var tone = anomalies.length > 0 ? 'red' : 'green';
    var body = anomalies.length > 0 ? '<p>' + anomalies.join('<br>') + '</p>' : '<p>No anomalies detected. Statement appears consistent.</p>';
    openModal(rec.vendor + ' · ' + rec.invoice,
      '<div class="fx-report-top"><div>' +
        '<div class="fx-sub">' + esc(cname(rec.client)) + ' · TIN ' + esc(rec.tin) + ' · ' + esc(fmtDate(rec.date)) + ' · ' + peso(rec.amt) + '</div>' +
        '<div class="fx-verdict ' + tone + '">' + (anomalies.length > 0 ? 'Fake' : 'Clear') + '</div>' +
      '</div>' +
      '<div class="fx-narr"><h4>' + ico('cpu') + 'Financial Statement Analysis</h4>' + body + '</div>' +
      '<div class="fx-rec"><h4>Recommended next step</h4><p>Review the vendor TIN and line-item totals against the official receipt. If discrepancies are found, request BIR-registered documentation.</p></div>' +
      '<div class="btn-row mt-0"><button type="button" class="btn sm dark" data-close>Close</button></div>');
    $('.dialog', modal).classList.add('wide');
  }
  function closeModal() { modal.hidden = true; $('#modalBody').innerHTML = ''; $('.dialog', modal).classList.remove('wide'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function clientModal(id) {
    var c = S.clients.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var an = analyze();
    var recs = S.receipts.filter(function (r) { return r.client === id; });
    var flagged = recs.filter(function (r) { return an.flags[r.id]; }).length;
    var docs = S.docs.filter(function (d) { return d.client === id && d.status !== 'received'; }).length;
    var dls = S.deadlines.filter(function (d) { return d.client === id && !d.done; }).length;
    var opts = STATUSES.map(function (s) { return '<option' + (s === c.status ? ' selected' : '') + '>' + s + '</option>'; }).join('');
    openModal(c.name,
      '<div class="detail-top"><div><div class="client-type">' + esc(c.type) + (c.email ? ' &middot; ' + esc(c.email) : '') + '</div><div class="client-type">Anomalies: ' + esc(c.anomalies) + '</div></div>' + riskHTML(c.score) + '</div>' +
      '<div class="detail-grid">' +
        '<div class="box"><small>Receipts</small><b>' + recs.length + '</b></div>' +
        '<div class="box"><small>Flagged receipts</small><b>' + flagged + '</b></div>' +
        '<div class="box"><small>Documents outstanding</small><b>' + docs + '</b></div>' +
        '<div class="box"><small>Open deadlines</small><b>' + dls + '</b></div>' +
      '</div>' +
      '<div class="field"><label for="clientStatus">Engagement status</label><select class="select" id="clientStatus" data-set-status="' + esc(c.id) + '">' + opts + '</select></div>' +
      '<div class="btn-row"><button type="button" class="btn sm primary" data-view-receipts="' + esc(c.id) + '">View receipts</button><button type="button" class="btn sm ghost" data-open-client-files="' + esc(c.id) + '">Open files</button><button type="button" class="btn sm ghost" data-close>Close</button></div>');
  }
  function addClientModal() {
    openModal('Add client',
      '<form novalidate id="clientForm" autocomplete="off">' +
      '<div class="field"><label for="ncName">Client name</label><input class="input" id="ncName" type="text" maxlength="60" placeholder="e.g. Sample Trading Corp."></div>' +
      '<div class="two-col"><div class="field"><label for="ncType">Engagement type</label><select class="select" id="ncType">' + TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ncStatus">Status</label><select class="select" id="ncStatus">' + STATUSES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="btn-row mt-0"><button type="submit" class="btn primary">Add client</button><button type="button" class="btn ghost" data-close>Cancel</button></div></form>');
    $('#ncName').focus();
  }

  /* ---------- Reports (real CSV downloads) ---------- */
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'); }
  function download(name, rows) {
    var blob = new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  function alertText(a) {
    return a.type === 'ghost'
      ? 'Ghost vendor ' + a.g.vendor + ' (TIN ' + a.g.tin + ') across ' + a.g.clients.length + ' clients: ' + a.g.clients.map(cname).join('; ')
      : 'Duplicate invoice #' + a.r.invoice + ' for ' + cname(a.r.client) + ' (' + a.r.vendor + ', ' + peso(a.r.amt) + ')';
  }
  var REPORTS = {
    risk: function () {
      return ['dcm-client-risk-report', [['Client', 'Engagement', 'Status', 'Risk score (%)', 'Risk level', 'Anomalies']].concat(
        S.clients.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) { return [c.name, c.type, c.status, c.score, LV[level(c.score)], c.anomalies]; }))];
    },
    fraud: function () {
      return ['dcm-fraud-anomaly-report', [['Type', 'Details', 'Review status']].concat(
        analyze().alerts.map(function (a) { return [a.type === 'ghost' ? 'Ghost vendor' : 'Duplicate invoice', alertText(a), astatus(a)]; }))];
    },
    receipts: function () {
      var an = analyze();
      return ['dcm-receipt-register', [['Date', 'Client', 'Vendor', 'TIN', 'Invoice #', 'Amount (PHP)', 'Flags']].concat(
        S.receipts.map(function (r) { return [r.date, cname(r.client), r.vendor, r.tin, r.invoice, Number(r.amt).toFixed(2), (an.flags[r.id] || []).join('; ') || 'Clear']; }))];
    },
    deadlines: function () {
      return ['dcm-deadline-schedule', [['Task', 'Client', 'Due date', 'Status']].concat(
        S.deadlines.map(function (d) { return [d.task, cname(d.client), d.due, dlInfo(d).label]; }))];
    },
    docs: function () {
      return ['dcm-document-collection', [['Client', 'Document', 'Status', 'Reminder sent']].concat(
        S.docs.map(function (d) { return [cname(d.client), d.what, d.note, d.reminded ? 'Yes' : 'No']; }))];
    }
  };



  /* ---------- Inline form errors (shown right under the field) ---------- */
  function setErr(input, msg) {
    var field = input.closest('.field') || input.parentNode, el = field.querySelector('.field-error');
    if (msg) {
      if (!el) { el = document.createElement('div'); el.className = 'field-error'; el.setAttribute('role', 'alert'); el.id = (input.id || uid()) + 'Err'; field.appendChild(el); }
      el.textContent = msg;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', el.id); field.classList.add('invalid');
    } else {
      if (el) el.remove();
      input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); field.classList.remove('invalid');
    }
    return !msg;
  }
  var V = {
    rClient:  function (el) { return el.value ? '' : 'Choose which client this receipt belongs to.'; },
    rVendor:  function (el) { return el.value.trim() ? '' : 'Enter the vendor’s name.'; },
    rTin:     function (el) { var v = el.value.trim(); return !v ? 'Enter the vendor’s TIN, like 123-456-789.' : /^[0-9-]{5,}$/.test(v) ? '' : 'Use digits and hyphens only, like 123-456-789.'; },
    rInvoice: function (el) { return el.value.trim() ? '' : 'Enter the invoice number.'; },
    rDate:    function (el) { return el.value ? '' : 'Pick the invoice date.'; },
    rAmount:  function (el) { return parseFloat(el.value) > 0 ? '' : 'Enter an amount greater than zero.'; },
    dClient:  function (el) { return el.value ? '' : 'Choose which client this is for.'; },
    dTask:    function (el) { return el.value.trim() ? '' : 'Say what needs doing, like “Submit quarterly filing”.'; },
    dDue:     function (el) { return el.value ? '' : 'Pick a due date.'; },
    ncName:   function (el) {
      var v = el.value.trim();
      if (!v) return 'Enter the client’s name.';
      return S.clients.some(function (c) { return norm(c.name) === norm(v); }) ? 'You already have a client called “' + v + '”.' : '';
    },
    setName:  function (el) { return el.value.trim() ? '' : 'Enter the name you want shown at the top.'; },
    setHigh:  function (el) { var n = parseInt(el.value, 10); return n >= 2 && n <= 100 ? '' : 'Enter a number from 2 to 100.'; },
    setMed:   function (el) {
      var n = parseInt(el.value, 10), hi = parseInt($('#setHigh').value, 10);
      if (!(n >= 1 && n <= 99)) return 'Enter a number from 1 to 99.';
      return n < hi ? '' : 'Medium has to be lower than High (' + hi + ').';
    },
    sVendor:  function (el) { return el.value.trim() ? '' : 'Enter the vendor\u2019s name as printed on the document.'; },
    sTin:     function (el) { var v = el.value.trim(); return !v ? 'Enter the vendor\u2019s TIN, like 123-456-789.' : /^[0-9-]{5,}$/.test(v) ? '' : 'Use digits and hyphens only, like 123-456-789.'; },
    sInvoice: function (el) { return el.value.trim() ? '' : 'Enter the invoice number.'; },
    sDate:    function (el) { return el.value ? '' : 'Pick the date on the document.'; },
    sAmount:  function (el) { return parseFloat(el.value) > 0 ? '' : 'Enter the total on the document.'; },
    ssText:   function (el) { return el.value.trim() ? '' : 'Paste the statement text, or read the photo automatically first.'; },
    fldName:  function (el) { return el.value.trim() ? '' : 'Give the folder a name.'; },
    renName:  function (el) { return el.value.trim() ? '' : 'Enter a name.'; }
  };
  function checkForm(form, ids) {
    var first = null;
    ids.forEach(function (id) {
      var el = form.querySelector('#' + id);
      if (el && !setErr(el, V[id](el)) && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  /* check a field when the person leaves it; clear the message the moment it is fixed */
  document.addEventListener('focusout', function (e) {
    var t = e.target;
    if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('button')) return; /* heading to a button: let the full check run instead, so nothing shifts under the click */
    if (t.id && V[t.id] && String(t.value || '').trim() !== '') setErr(t, V[t.id](t));
  });
  function liveFix(e) {
    var t = e.target;
    if (t.id === 'setHigh' && $('#setMed').getAttribute('aria-invalid')) setErr($('#setMed'), V.setMed($('#setMed')));
    if (!t.id || !V[t.id] || !t.getAttribute('aria-invalid')) return;
    setErr(t, V[t.id](t));
  }
  document.addEventListener('input', liveFix);
  document.addEventListener('change', liveFix);

  /* ---------- Client Files (Drive-style) ---------- */
  var FILE_MAX = 25 * 1024 * 1024;
  var fPath = '', fQuiet = false, fUrls = {}, fMem = {}, fWarned = false;
  var fView = store.get('dcm_staff_fview', 'grid');
  var fSort = store.get('dcm_staff_fsort', 'name');

  /* file contents live in IndexedDB (localStorage is too small for documents) */
  var idbP = null;
  function idb() {
    if (idbP) return idbP;
    idbP = new Promise(function (res, rej) {
      try {
        var r = indexedDB.open('dcm_staff_files', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('blobs'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
    return idbP;
  }
  function idbRun(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('blobs', mode), out = fn(tx.objectStore('blobs'));
        tx.oncomplete = function () { res(out && out.result); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function putBlob(id, blob) { fMem[id] = blob; return idbRun('readwrite', function (st) { return st.put(blob, id); }).then(function () { return true; }, function () { return false; }); }
  function getBlob(id) { if (id.indexOf('pu_') === 0) return sharedBlob(id.slice(3)); if (fMem[id]) return Promise.resolve(fMem[id]); return idbRun('readonly', function (st) { return st.get(id); }).then(function (b) { return b || null; }, function () { return null; }); }
  function delBlob(id) { delete fMem[id]; if (fUrls[id]) { URL.revokeObjectURL(fUrls[id]); delete fUrls[id]; } return idbRun('readwrite', function (st) { return st.delete(id); }).catch(function () {}); }
  function clearBlobs() { fMem = {}; fUrls = {}; return idbRun('readwrite', function (st) { return st.clear(); }).catch(function () {}); }

  function isClient(id) { return S.clients.some(function (c) { return c.id === id; }); }
  function folderOf(id) { return S.files.folders.filter(function (f) { return f.id === id; })[0]; }
  function exists(id) { return id === '' || isClient(id) || !!folderOf(id); }
  function fname(id) { return id === '' ? 'Client Files' : isClient(id) ? cname(id) : (folderOf(id) || {}).name || 'Folder'; }
  function parentOf(id) { return isClient(id) ? '' : (folderOf(id) || { parent: '' }).parent; }
  function pathOf(id) { var p = []; while (id !== '' && p.length < 20) { p.unshift(id); id = parentOf(id); } return p; }
  function subfolders(id) {
    var list = S.files.folders.filter(function (f) { return f.parent === id; }).map(function (f) { return { id: f.id, name: f.name, client: false }; });
    if (id === '') list = S.clients.map(function (c) { return { id: c.id, name: c.name, client: true }; }).concat(list);
    return list;
  }
  function filesIn(id) { return S.files.files.filter(function (f) { return f.folder === id; }); }
  function descendants(id) {
    var out = [id];
    S.files.folders.filter(function (f) { return f.parent === id; }).forEach(function (f) { out = out.concat(descendants(f.id)); });
    return out;
  }
  function fmtSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function fmtWhen(t) { return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function extOf(n) { var m = /\.([a-z0-9]+)$/i.exec(n); return m ? m[1].toLowerCase() : ''; }
  function kindOf(f) {
    var e = extOf(f.name), t = f.type || '';
    if (t.indexOf('image/') === 0 || /^(png|jpe?g|gif|webp|bmp|heic)$/.test(e)) return 'img';
    if (e === 'pdf' || t === 'application/pdf') return 'pdf';
    if (/^(xlsx?|csv|ods)$/.test(e)) return 'xls';
    if (/^(docx?|odt|rtf)$/.test(e)) return 'doc';
    if (/^(txt|md|log)$/.test(e) || t.indexOf('text/') === 0) return 'txt';
    return 'file';
  }
  var KIND_LABEL = { img: 'IMG', pdf: 'PDF', xls: 'XLS', doc: 'DOC', txt: 'TXT', file: 'FILE' };
  function uniqueName(name, siblings) {
    var names = siblings.map(function (n) { return n.toLowerCase(); });
    if (names.indexOf(name.toLowerCase()) < 0) return name;
    var dot = name.lastIndexOf('.'), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '', i = 2;
    while (names.indexOf((base + ' (' + i + ')' + ext).toLowerCase()) >= 0) i++;
    return base + ' (' + i + ')' + ext;
  }

  function tileHTML(f) {
    var k = kindOf(f);
    if (k === 'img') return '<div class="ftile img"><img alt="" data-thumb="' + esc(f.id) + '"><span>IMG</span></div>';
    return '<div class="ftile ' + k + '"><span>' + KIND_LABEL[k] + '</span></div>';
  }
  function actionsHTML(kind, id, locked) {
    var b = '';
    if (kind === 'file') b += '<button type="button" class="ibtn" data-f-dl="' + id + '" aria-label="Download" title="Download">' + ico('download') + '</button>';
    if (!locked) {
      b += '<button type="button" class="ibtn" data-f-ren="' + kind + ':' + id + '" aria-label="Rename" title="Rename">' + ico('edit') + '</button>';
      b += '<button type="button" class="ibtn del" data-f-del="' + kind + ':' + id + '" aria-label="Delete" title="Delete">' + ico('trash') + '</button>';
    }
    return '<div class="facts">' + b + '</div>';
  }

  function renderFiles() {
    if (!$('#driveBody')) return;
    if (!exists(fPath)) fPath = '';
    var q = searchInput.value.trim().toLowerCase();
    $$('[data-fview]').forEach(function (b) { var on = b.dataset.fview === fView; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#fileSort').value = fSort;

    /* breadcrumbs */
    var crumbs = '<a href="#files" class="crumb' + (fPath === '' && !q ? ' cur' : '') + '" data-open-folder="">Client Files</a>';
    pathOf(fPath).forEach(function (id, i, a) {
      crumbs += '<svg class="ico sep"><use href="#i-chev"/></svg><a href="#files/' + encodeURIComponent(id) + '" class="crumb' + (i === a.length - 1 && !q ? ' cur' : '') + '" data-open-folder="' + esc(id) + '">' + esc(fname(id)) + '</a>';
    });
    if (q) crumbs += '<svg class="ico sep"><use href="#i-chev"/></svg><span class="crumb cur">Search: &ldquo;' + esc(searchInput.value.trim()) + '&rdquo;</span>';
    $('#crumbs').innerHTML = crumbs;

    var folders, files, here = fPath;
    if (q) {
      var all = S.clients.map(function (c) { return { id: c.id, name: c.name, client: true }; })
        .concat(S.files.folders.map(function (f) { return { id: f.id, name: f.name, client: false }; }));
      folders = all.filter(function (f) { return f.name.toLowerCase().indexOf(q) >= 0; });
      files = S.files.files.filter(function (f) { return f.name.toLowerCase().indexOf(q) >= 0; });
    } else { folders = subfolders(here); files = filesIn(here); }

    var by = {
      name: function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; },
      new: function (a, b) { return (b.added || 0) - (a.added || 0); },
      size: function (a, b) { return (b.size || 0) - (a.size || 0); }
    };
    folders = folders.slice().sort(by.name);
    files = files.slice().sort(by[fSort] || by.name);

    var body = $('#driveBody');
    if (!folders.length && !files.length) {
      body.innerHTML = '<div class="empty drive-empty">' + (q ? 'We couldn\u2019t find a file or folder with that name.' :
        '<div class="big">' + ico('folder') + '</div><b>Nothing in here yet</b><br>Drop files here, or choose <b>Upload files</b>.') + '</div>';
      return;
    }

    var list = fView === 'list' || !!q, h = '';
    function pathLabel(id) { var p = pathOf(id); return p.length ? p.map(fname).join(' / ') : 'Client Files'; }
    if (list) {
      h += '<div class="flist"><div class="frow head"><span>Name</span><span>' + (q ? 'Location' : 'Modified') + '</span><span>Size</span><span></span></div>';
      folders.forEach(function (f) {
        var n = subfolders(f.id).length + filesIn(f.id).length;
        h += '<div class="frow" data-folder="' + esc(f.id) + '"><a class="fmain" href="#files/' + encodeURIComponent(f.id) + '" data-open-folder="' + esc(f.id) + '"><span class="fold">' + ico('folder') + '</span><span class="fn">' + esc(f.name) + (f.client ? ' <em class="tag">Client</em>' : '') + '</span></a><span class="fm">' + (q ? esc(pathLabel(parentOf(f.id))) : n + ' item' + (n === 1 ? '' : 's')) + '</span><span class="fm">&mdash;</span>' + actionsHTML('folder', esc(f.id), f.client) + '</div>';
      });
      files.forEach(function (f) {
        h += '<div class="frow" data-file="' + esc(f.id) + '"><button type="button" class="fmain" data-f-open="' + esc(f.id) + '">' + tileHTML(f).replace('ftile', 'ftile sm') + '<span class="fn">' + esc(f.name) + '</span></button><span class="fm">' + (q ? esc(pathLabel(f.folder)) : fmtWhen(f.added)) + '</span><span class="fm">' + fmtSize(f.size) + '</span>' + actionsHTML('file', esc(f.id), f.portal) + '</div>';
      });
      h += '</div>';
    } else {
      if (folders.length) {
        h += '<div class="fsec">Folders</div><div class="fgrid">';
        folders.forEach(function (f) {
          var n = subfolders(f.id).length + filesIn(f.id).length;
          h += '<div class="fcard folder" data-folder="' + esc(f.id) + '"><a class="fmain" href="#files/' + encodeURIComponent(f.id) + '" data-open-folder="' + esc(f.id) + '"><span class="fold">' + ico('folder') + '</span><span class="fn">' + esc(f.name) + '</span><span class="fm">' + n + ' item' + (n === 1 ? '' : 's') + (f.client ? ' &middot; Client' : '') + '</span></a>' + actionsHTML('folder', esc(f.id), f.client) + '</div>';
        });
        h += '</div>';
      }
      if (files.length) {
        h += '<div class="fsec">Files</div><div class="fgrid">';
        files.forEach(function (f) {
          h += '<div class="fcard" data-file="' + esc(f.id) + '"><button type="button" class="fmain" data-f-open="' + esc(f.id) + '">' + tileHTML(f) + '<span class="fn">' + esc(f.name) + '</span><span class="fm">' + fmtSize(f.size) + ' &middot; ' + fmtWhen(f.added) + '</span></button>' + actionsHTML('file', esc(f.id), f.portal) + '</div>';
        });
        h += '</div>';
      }
    }
    body.innerHTML = h;

    $$('img[data-thumb]', body).forEach(function (img) {
      var id = img.dataset.thumb;
      if (fUrls[id]) { img.src = fUrls[id]; img.parentNode.classList.add('has'); return; }
      getBlob(id).then(function (b) {
        if (!b) return;
        fUrls[id] = URL.createObjectURL(b);
        img.onload = function () { img.parentNode.classList.add('has'); };
        img.src = fUrls[id];
      });
    });
  }

  function openFolder(id) {
    if (searchInput.value) searchInput.value = '';
    var h = id ? 'files/' + encodeURIComponent(id) : 'files';
    if (location.hash === '#' + h) { fPath = id; renderFiles(); } else location.hash = h;
  }

  function addFiles(list, target) {
    target = target === undefined ? fPath : target;
    if (target === '') { toast('Open a client\u2019s folder first, then upload their files there.', 'error'); return; }
    var items = Array.prototype.slice.call(list || []);
    if (!items.length) return;
    var ok = 0, big = 0, chain = Promise.resolve();
    items.forEach(function (file) {
      if (file.size > FILE_MAX) { big++; return; }
      chain = chain.then(function () {
        var id = uid();
        return putBlob(id, file).then(function (saved) {
          if (!saved && !fWarned) { fWarned = true; toast('Your browser can\u2019t keep files for later, so they\u2019ll be gone when you close this tab.', 'error'); }
          var name = uniqueName(file.name, filesIn(target).map(function (f) { return f.name; }));
          S.files.files.push({ id: id, name: name, folder: target, size: file.size, type: file.type || '', added: Date.now(), by: (S.prefs.name || (session && session.email) || 'Staff') });
          ok++;
        });
      });
    });
    chain.then(function () {
      save('files'); renderFiles();
      if (ok) toast('Done. ' + ok + ' file' + (ok > 1 ? 's' : '') + ' added to ' + fname(target).replace(/\.$/, '') + '.');
      if (big) toast(big + ' file' + (big > 1 ? 's were' : ' was') + ' too big to add. Each file can be up to 25 MB.', 'error');
    });
  }

  function folderModal() {
    openModal('New folder',
      '<form novalidate id="folderForm" autocomplete="off"><div class="field"><label for="fldName">Folder name</label><input class="input" id="fldName" type="text" maxlength="60" placeholder="e.g. 2026 Receipts"></div>' +
      '<div class="btn-row mt-0"><button type="submit" class="btn primary">Create folder</button><button type="button" class="btn ghost" data-close>Cancel</button></div></form>');
    $('#fldName').focus();
  }
  function renameModal(kind, id) {
    var cur = kind === 'file' ? (S.files.files.filter(function (f) { return f.id === id; })[0] || {}).name : (folderOf(id) || {}).name;
    if (!cur) return;
    if (kind === 'file' && (S.files.files.filter(function (f) { return f.id === id; })[0] || {}).portal) { toast('Files sent by a client can\u2019t be renamed.', 'error'); return; }
    openModal('Rename ' + kind,
      '<form novalidate id="renameForm" data-kind="' + kind + '" data-id="' + esc(id) + '" autocomplete="off"><div class="field"><label for="renName">Name</label><input class="input" id="renName" type="text" maxlength="100" value="' + esc(cur) + '"></div>' +
      '<div class="btn-row mt-0"><button type="submit" class="btn primary">Save name</button><button type="button" class="btn ghost" data-close>Cancel</button></div></form>');
    var inp = $('#renName'); inp.focus();
    var dot = kind === 'file' ? cur.lastIndexOf('.') : -1;
    inp.setSelectionRange(0, dot > 0 ? dot : cur.length);
  }

  function previewFile(id) {
    var f = S.files.files.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    getBlob(id).then(function (blob) {
      var k = kindOf(f), meta = '<p class="pv-meta">' + fmtSize(f.size) + ' &middot; Added ' + fmtWhen(f.added) + ' by ' + esc(f.by || 'Staff') + '<br>In ' + esc(pathOf(f.folder).map(fname).join(' / ')) + '</p>';
      var actions = '<div class="btn-row"><button type="button" class="btn sm primary" data-f-dl="' + esc(id) + '">' + ico('download') + 'Download</button><button type="button" class="btn sm ghost" data-close>Close</button></div>';
      if (!blob) { openModal(f.name, meta + '<div class="empty">We can&rsquo;t open this file right now. Try uploading it again.</div>' + '<div class="btn-row"><button type="button" class="btn sm ghost" data-close>Close</button></div>'); return; }
      if (k === 'img' || k === 'pdf') {
        if (!fUrls[id]) fUrls[id] = URL.createObjectURL(blob);
        openModal(f.name, meta + '<div class="pv-box">' + (k === 'img' ? '<img alt="' + esc(f.name) + '" src="' + fUrls[id] + '">' : '<iframe title="' + esc(f.name) + '" src="' + fUrls[id] + '"></iframe>') + '</div>' + actions);
      } else if (k === 'txt' && blob.size < 200000) {
        var r = new FileReader();
        r.onload = function () { openModal(f.name, meta + '<pre class="pv-text">' + esc(r.result) + '</pre>' + actions); };
        r.readAsText(blob);
      } else {
        openModal(f.name, meta + '<div class="empty">We can&rsquo;t show a preview of this file type. Download it to open it.</div>' + actions);
      }
      $('.dialog', modal).classList.add('wide');
    });
  }
  function downloadFile(id) {
    var f = S.files.files.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    getBlob(id).then(function (blob) {
      if (!blob) { toast('We can\u2019t open that file right now. Try uploading it again.', 'error'); return; }
      var u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = f.name; document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 400);
    });
  }
  function deleteItem(kind, id) {
    if (kind === 'file') {
      var f = S.files.files.filter(function (x) { return x.id === id; })[0];
      if (f && f.portal) { toast('This file was sent by the client, so it stays in their folder.', 'error'); return; }
      if (!f || !confirm('Delete "' + f.name + '"? This can\u2019t be undone.')) return;
      S.files.files = S.files.files.filter(function (x) { return x.id !== id; });
      delBlob(id); save('files'); renderFiles(); toast('File deleted.');
    } else {
      var fo = folderOf(id); if (!fo) return;
      var ids = descendants(id), n = S.files.files.filter(function (x) { return ids.indexOf(x.folder) >= 0; }).length;
      if (!confirm('Delete folder "' + fo.name + '"' + (n ? ' and the ' + n + ' file' + (n > 1 ? 's' : '') + ' inside it' : '') + '? This cannot be undone.')) return;
      S.files.files.filter(function (x) { return ids.indexOf(x.folder) >= 0; }).forEach(function (x) { delBlob(x.id); });
      S.files.files = S.files.files.filter(function (x) { return ids.indexOf(x.folder) < 0; });
      S.files.folders = S.files.folders.filter(function (x) { return ids.indexOf(x.id) < 0; });
      if (ids.indexOf(fPath) >= 0) fPath = fo.parent;
      save('files'); renderFiles(); toast('Folder deleted.');
    }
  }

  $('#uploadBtn').addEventListener('click', function () {
    if (fPath === '' || searchInput.value) { toast('Open a client\u2019s folder first, then upload their files there.', 'error'); return; }
    $('#fileInput').click();
  });
  $('#fileInput').addEventListener('change', function () { addFiles(this.files); this.value = ''; });
  $('#newFolderBtn').addEventListener('click', function () { if (searchInput.value) searchInput.value = ''; folderModal(); });
  $('#fileSort').addEventListener('change', function () { fSort = this.value; store.set('dcm_staff_fsort', fSort); renderFiles(); });

  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-fview]'))) { fView = t.dataset.fview; store.set('dcm_staff_fview', fView); renderFiles(); return; }
    if ((t = e.target.closest('[data-open-folder]'))) { e.preventDefault(); openFolder(t.dataset.openFolder); return; }
    if ((t = e.target.closest('[data-f-open]'))) { previewFile(t.dataset.fOpen); return; }
    if ((t = e.target.closest('[data-f-dl]'))) { downloadFile(t.dataset.fDl); return; }
    if ((t = e.target.closest('[data-f-ren]'))) { var r = t.dataset.fRen.split(':'); renameModal(r[0], r.slice(1).join(':')); return; }
    if ((t = e.target.closest('[data-f-del]'))) { var d = t.dataset.fDel.split(':'); deleteItem(d[0], d.slice(1).join(':')); return; }
    if ((t = e.target.closest('[data-open-client-files]'))) { closeModal(); openFolder(t.dataset.openClientFiles); }
  });
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.id === 'folderForm') {
      e.preventDefault();
      if (!checkForm(form, ['fldName'])) return;
      var nm = $('#fldName').value.trim();
      var sibs = subfolders(fPath).map(function (f) { return f.name; });
      nm = uniqueName(nm, sibs);
      S.files.folders.push({ id: uid(), name: nm, parent: fPath, created: Date.now() });
      save('files'); closeModal(); renderFiles(); toast('Folder "' + nm + '" is ready.');
    } else if (form.id === 'renameForm') {
      e.preventDefault();
      if (!checkForm(form, ['renName'])) return;
      var v = $('#renName').value.trim(), id = form.dataset.id;
      if (form.dataset.kind === 'file') {
        var f = S.files.files.filter(function (x) { return x.id === id; })[0];
        if (f) f.name = uniqueName(v, filesIn(f.folder).filter(function (x) { return x.id !== id; }).map(function (x) { return x.name; }));
      } else {
        var fo = folderOf(id);
        if (fo) fo.name = uniqueName(v, subfolders(fo.parent).filter(function (x) { return x.id !== id; }).map(function (x) { return x.name; }));
      }
      save('files'); closeModal(); renderFiles(); toast('Name updated.');
    }
  });

  /* drag & drop (drop on the page = current folder, drop on a folder = that folder) */
  (function () {
    var drive = $('#drive'), fx = $('#dropFx'), depth = 0;
    function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
    drive.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; fx.hidden = false; });
    drive.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
    drive.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) fx.hidden = true; });
    drive.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth = 0; fx.hidden = true;
      var fo = e.target.closest('[data-folder]');
      addFiles(e.dataTransfer.files, fo ? fo.dataset.folder : (searchInput.value ? '' : fPath));
    });
    window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('drop', function (e) { if (hasFiles(e)) e.preventDefault(); });
  })();

  /* ---------- Router ---------- */
  var TITLES = { command: 'Command Center', clients: 'Client Database', files: 'Client Files', messages: 'Messages', receipts: 'Receipts', fraud: 'Fraud Analytics', deadlines: 'Deadline Tracker', reports: 'Reports', settings: 'Admin Settings' };
  var app = $('#app'), current = null, pendingSearch = '';
  function show(name) {
    if (!TITLES[name]) name = 'command';
    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + name; });
    $$('[data-view]').forEach(function (a) {
      var on = a.dataset.view === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = TITLES[name] + ' | DCM & Co.';
    if (current !== null && current !== name) { searchInput.value = ''; window.scrollTo(0, 0); }
    if (pendingSearch) { searchInput.value = pendingSearch; pendingSearch = ''; }
    current = name;
    app.classList.remove('menu-open');
    if (name === 'settings') renderSettings();
    if (name === 'files') renderFiles();
    if (name === 'fraud') setFTab('alerts');
    applyFilter();
  }
  function route() {
    var h = location.hash.replace('#', '').split('/');
    if (h[0] === 'files') fPath = decodeURIComponent(h.slice(1).join('/') || '');
    show(h[0]);
  }
  function go(name) { if (location.hash === '#' + name) show(name); else location.hash = name; }
  window.addEventListener('hashchange', route);

  /* ---------- Actions ---------- */
  function runScan() {
    var btn = $('#runScan'), label = $('span', btn);
    btn.disabled = true; label.textContent = 'Checking...';
    $('.ico', btn).classList.add('spin');
    setTimeout(function () {
      S.scan = nowStamp(); save('scan');
      btn.disabled = false; label.textContent = 'Check all clients for problems';
      $('.ico', btn).classList.remove('spin');
      refresh();
      var open = allAlerts().filter(function (a) { return astatus(a) !== 'resolved'; }).length;
      var high = S.clients.filter(function (c) { return level(c.score) === 'high'; }).length;
      toast('All done. We checked ' + S.receipts.length + ' receipt' + (S.receipts.length === 1 ? '' : 's') + ': ' + open + ' open alert' + (open === 1 ? '' : 's') + ' and ' + high + ' high-risk client' + (high === 1 ? '' : 's') + '.');
    }, 1600);
  }

  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-sub-check]'))) { subCheckModal(t.dataset.subCheck); return; }
    if ((t = e.target.closest('[data-sub-ocr]'))) { subOcr(t); return; }
    if (e.target.closest('#runScan')) { runScan(); return; }
    if (e.target.closest('#fxRun')) { runForensics(); return; }
    if (e.target.closest('#fsSummaryCsv')) { exportFSASummary(); return; }
    if (e.target.closest('#crossRun')) {
      var btn = $('#crossRun'), label = $('span', btn);
      btn.disabled = true; label.textContent = 'Checking...';
      $('.ico', btn).classList.add('spin');
      setTimeout(function() {
        btn.disabled = false; label.textContent = 'Re-run checks';
        $('.ico', btn).classList.remove('spin');
        renderCross(); applyFilter();
        toast('Cross-client checks finished.');
      }, 1000);
      return;
    }
    if (e.target.closest('#bulkRemind')) {
      var out = S.docs.filter(function (d) { return d.status !== 'received'; });
      if (!out.length) { toast('Nothing to chase. Every document has been received.'); return; }
      out.forEach(function (d) { d.reminded = true; });
      save('docs'); refresh();
      toast('Reminders sent for ' + out.length + ' missing document' + (out.length > 1 ? 's' : '') + '.');
      return;
    }
    if ((t = e.target.closest('[data-recv]'))) {
      var d = S.docs.filter(function (x) { return x.id === t.dataset.recv; })[0];
      if (d) { d.status = 'received'; d.note = 'Received'; save('docs'); refresh(); toast('Got it. ' + cname(d.client) + '\u2019s ' + d.what + ' is marked as received.'); }
      return;
    }
    if ((t = e.target.closest('[data-client]'))) { clientModal(t.dataset.client); return; }
    if ((t = e.target.closest('[data-ftab]'))) { setFTab(t.dataset.ftab); return; }
    if ((t = e.target.closest('[data-fsa-report]'))) { fsaModal(t.dataset.fsaReport); return; }
    if ((t = e.target.closest('[data-fx]'))) { fxModal(t.dataset.fx); return; }
    if ((t = e.target.closest('[data-cross-goto]'))) {
      var rec = S.receipts.find(function(r) { return r.id === t.dataset.crossGoto; });
      if (rec) {
        closeModal();
        pendingSearch = rec.invoice;
        if (location.hash === '#receipts') { searchInput.value = rec.invoice; applyFilter(); } else location.hash = 'receipts';
      }
      return;
    }
    if ((t = e.target.closest('[data-fx-goto]'))) {
      var fxInv = t.dataset.fxGoto;
      closeModal(); pendingSearch = fxInv;
      if (location.hash === '#receipts') { searchInput.value = fxInv; applyFilter(); } else location.hash = 'receipts';
      return;
    }
    if (e.target.closest('#addClientBtn')) { addClientModal(); return; }
    if ((t = e.target.closest('[data-view-receipts]'))) {
      var name = cname(t.dataset.viewReceipts);
      closeModal(); pendingSearch = name;
      if (location.hash === '#receipts') { searchInput.value = name; applyFilter(); } else location.hash = 'receipts';
      return;
    }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if ((t = e.target.closest('[data-alert]'))) {
      var id = t.dataset.alert, act = t.dataset.act;
      S.alerts[id] = act === 'review' ? 'review' : act === 'resolve' ? 'resolved' : 'open';
      syncFindingStatus(id, S.alerts[id]);
      save('alerts'); refresh();
      toast(act === 'resolve' ? 'Marked as resolved.' : act === 'review' ? 'Moved to "In review".' : 'Reopened.');
      return;
    }
    if ((t = e.target.closest('[data-del-receipt]'))) {
      if (confirm('Delete this receipt? This can\u2019t be undone.')) {
        var gone = S.receipts.filter(function (r) { return r.id === t.dataset.delReceipt; })[0];
        if (gone && gone.uploadId && gone.email) removeFinding(gone.email, gone.uploadId);
        S.receipts = S.receipts.filter(function (r) { return r.id !== t.dataset.delReceipt; });
        save('receipts'); refresh(); toast('Receipt deleted.');
      }
      return;
    }
    if ((t = e.target.closest('[data-toggle-dl]'))) {
      var dl = S.deadlines.filter(function (x) { return x.id === t.dataset.toggleDl; })[0];
      if (dl) { dl.done = !dl.done; save('deadlines'); refresh(); toast(dl.done ? 'Marked as done.' : 'Deadline reopened.'); }
      return;
    }
    if ((t = e.target.closest('[data-del-dl]'))) {
      if (confirm('Delete this deadline? This can\u2019t be undone.')) {
        S.deadlines = S.deadlines.filter(function (x) { return x.id !== t.dataset.delDl; });
        save('deadlines'); refresh(); toast('Deadline deleted.');
      }
      return;
    }
    if ((t = e.target.closest('[data-report]'))) {
      var r = REPORTS[t.dataset.report](), file = r[0] + '-' + isoToday() + '.csv';
      download(file, r[1]); toast('Downloaded ' + file);
      return;
    }
    if (e.target.closest('#resetDemo')) {
      if (confirm('Clear all demo data in this browser and start over?')) {
        Object.keys(KEYS).forEach(function (k) { store.del(KEYS[k]); });
        clearBlobs(); fPath = '';
        loadAll(); refresh(); renderSettings(); toast('Demo data cleared. You\u2019re back to the sample data.');
      }
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-set-status]')) {
      var c = S.clients.filter(function (x) { return x.id === t.dataset.setStatus; })[0];
      if (c) { c.status = t.value; save('clients'); refresh(); toast(c.name + ' is now "' + c.status + '".'); }
      return;
    }
    if (t.id === 'riskFilter' || t.id === 'statusFilter') { renderClients(); applyFilter(); }
    if (t.id === 'alertFilter') { renderFraud(); applyFilter(); }
    if (t.id === 'crossFilter') { renderCross(); applyFilter(); }
    if (t.id === 'fxFilter') { renderForensics(); applyFilter(); }
    if (t.id === 'fsFilter') { renderFSA(); applyFilter(); }
    if (t.id === 'deadlineFilter') { renderDeadlines(); applyFilter(); }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target;
    e.preventDefault();

    if (f.id === 'subRcptForm') { subSubmitReceipt(f); return; }
    if (f.id === 'subStmtForm') { subSubmitStatement(f); return; }

    if (f.id === 'receiptForm') {
      var client = $('#rClient').value, vendor = $('#rVendor').value.trim(), tin = $('#rTin').value.trim();
      var inv = $('#rInvoice').value.trim(), date = $('#rDate').value, amt = parseFloat($('#rAmount').value);
      if (!checkForm(f, ['rClient', 'rVendor', 'rTin', 'rInvoice', 'rDate', 'rAmount'])) return;
      var file = $('#rFile').files[0];
      var rec = { id: uid(), client: client, vendor: vendor, tin: tin, invoice: inv, date: date, amt: Math.round(amt * 100) / 100, file: file ? file.name : (scanName || '') };
      S.receipts.push(rec); save('receipts');
      var flags = analyze().flags[rec.id] || [];
      var fsa = fsaAnalyze(rec);
      f.reset(); clearScan(); $('#rDate').value = isoToday();
      refresh();
      var msg = flags.length ? 'Receipt saved, but it needs a look: ' + flags.join(', ').toLowerCase() + '.' : 'Receipt saved. Nothing suspicious found.';
      if (fsa.length) msg += ' FSA: ' + fsa;
      toast(msg, flags.length || fsa.length ? 'error' : '');
      return;
    }

    if (f.id === 'deadlineForm') {
      var dc = $('#dClient').value, task = $('#dTask').value.trim(), due = $('#dDue').value;
      if (!checkForm(f, ['dClient', 'dTask', 'dDue'])) return;
      S.deadlines.push({ id: uid(), client: dc, task: task, due: due, done: false });
      save('deadlines'); f.reset(); refresh(); toast('Deadline added.');
      return;
    }

    if (f.id === 'clientForm') {
      var nm = $('#ncName').value.trim();
      if (!checkForm(f, ['ncName'])) return;
      S.clients.push({ id: uid(), name: nm, type: $('#ncType').value, status: $('#ncStatus').value, score: 10, anomalies: 'None Detected' });
      save('clients'); closeModal(); refresh(); toast(nm + ' is added. Their folder is ready in Client Files.');
      return;
    }

    if (f.id === 'settingsForm') {
      var name = $('#setName').value.trim(), hi = parseInt($('#setHigh').value, 10), md = parseInt($('#setMed').value, 10);
      if (!checkForm(f, ['setName', 'setHigh', 'setMed'])) return;
      S.prefs = { name: name, high: hi, med: md, nFraud: $('#prefFraud').checked, nDocs: $('#prefDocs').checked };
      save('prefs'); refresh(); toast('Your settings are saved.');
    }
  });

  searchInput.addEventListener('input', applyFilter);

  /* ---------- Menu, keyboard, logout ---------- */
  $('#menuBtn').addEventListener('click', function () { app.classList.add('menu-open'); });
  $('#scrim').addEventListener('click', function () { app.classList.remove('menu-open'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { app.classList.remove('menu-open'); if (!modal.hidden) closeModal(); }
  });
  $('#logoutLink').addEventListener('click', function () {
    try { sessionStorage.removeItem('dcm_session'); } catch (err) {}
  });

  /* ---------- Receipt scanner (camera demo) ---------- */
  var scanner = $('#scanner'), scanVideo = $('#scanVideo'), scanMsg = $('#scanMsg'), scanSheet = $('#scanSheet');
  var camStream = null, facing = 'environment', flashOn = false;
  var scanName = '', pendingName = '', pendingUrl = '';
  var scanKind = 'receipt', stmtBusy = false;

  function setScanKind(kind) {
    scanKind = kind === 'statement' ? 'statement' : 'receipt';
    var st = scanKind === 'statement';
    $('#scanKindReceipt').classList.toggle('on', !st);
    $('#scanKindReceipt').setAttribute('aria-pressed', String(!st));
    $('#scanKindStatement').classList.toggle('on', st);
    $('#scanKindStatement').setAttribute('aria-pressed', String(st));
    $('#scanClientField').hidden = !st;
    $('#scanHint').textContent = st ? 'Snap a financial statement' : 'Snap a receipt or invoice';
    $('#scanSheetTitle').textContent = st ? 'Statement photo taken' : 'Photo taken';
    $('#scanSheetText').textContent = st ? 'We will read the totals and check the statement for anomalies.' : 'Nice shot. Type in the details next, and the photo stays with the receipt.';
    $('#scanUse').textContent = st ? 'Check this statement' : 'Use this photo';
  }
  $('#scanKindReceipt').addEventListener('click', function () { setScanKind('receipt'); });
  $('#scanKindStatement').addEventListener('click', function () { setScanKind('statement'); });
  setScanKind('receipt');

  function stamp() {
    var d = new Date(), p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }
  function stopCam() {
    if (camStream) { camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; }
    scanVideo.srcObject = null; scanVideo.hidden = true;
  }
  function noCam(text) { stopCam(); scanMsg.textContent = text; scanMsg.hidden = false; }
  function setTorch(on) {
    try {
      var t = camStream && camStream.getVideoTracks()[0];
      if (t && t.applyConstraints) t.applyConstraints({ advanced: [{ torch: on }] }).catch(function () {});
    } catch (e) {}
  }
  function startCam() {
    stopCam(); scanMsg.hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      noCam('Camera is not available here. Tap the gallery button to choose a photo, or the shutter for a demo capture.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false }).then(function (stream) {
      if (scanner.hidden) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      camStream = stream; scanVideo.srcObject = stream; scanVideo.hidden = false;
      var p = scanVideo.play(); if (p && p.catch) p.catch(function () {});
      if (flashOn) setTorch(true);
    }).catch(function (err) {
      noCam(err && err.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow it in your browser settings, or use the gallery button.'
        : 'No camera found. Tap the gallery button to choose a photo, or the shutter for a demo capture.');
    });
  }
  function openScanner() {
    scanSheet.hidden = true; scanner.hidden = false;
    document.documentElement.classList.add('scan-open');
    app.classList.remove('menu-open');
    $('#scanClose').focus();
    startCam();
  }
  function closeScanner() {
    scanner.hidden = true; scanSheet.hidden = true;
    document.documentElement.classList.remove('scan-open');
    stopCam(); flashOn = false;
    $('#scanFlash').setAttribute('aria-pressed', 'false'); $('#scanFlash').classList.remove('on');
  }
  function showResult(url, name) {
    pendingUrl = url || ''; pendingName = name || ('scan-' + stamp() + '.jpg');
    var th = $('#scanThumb');
    th.style.backgroundImage = pendingUrl ? 'url("' + pendingUrl + '")' : '';
    th.classList.toggle('has-img', !!pendingUrl);
    scanSheet.hidden = false;
    try { scanVideo.pause(); } catch (e) {}
    $('#scanUse').focus();
  }
  function setScan(name, url) {
    scanName = name;
    $('#scanChipName').textContent = name;
    $('#scanChipThumb').style.backgroundImage = url ? 'url("' + url + '")' : '';
    $('#scanChip').hidden = false;
  }
  function clearScan() { scanName = ''; $('#scanChip').hidden = true; }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-scan-open]')) openScanner();
    if (e.target.closest('[data-fsa-analyze]')) {
      var rec = S.receipts.find(function (r) { return r.id === e.target.closest('[data-fsa-analyze]').dataset.fsaAnalyze; });
      if (rec) openFSAModal(rec);
    }
  });
  $('#scanClose').addEventListener('click', closeScanner);
  $('#scanChipX').addEventListener('click', clearScan);
  $('#scanFlash').addEventListener('click', function () {
    flashOn = !flashOn;
    this.setAttribute('aria-pressed', flashOn); this.classList.toggle('on', flashOn);
    setTorch(flashOn);
  });
  $('#scanFlip').addEventListener('click', function () { facing = facing === 'environment' ? 'user' : 'environment'; startCam(); });
  $('#scanGallery').addEventListener('click', function () { $('#scanFile').click(); });
  $('#scanFile').addEventListener('change', function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { showResult(String(rd.result), f.name); };
    rd.readAsDataURL(f);
  });
  $('#scanShutter').addEventListener('click', function () {
    var fx = $('#scanFx'); fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    var url = '';
    if (camStream && scanVideo.videoWidth) {
      var w = Math.min(1280, scanVideo.videoWidth), h = Math.round(w * scanVideo.videoHeight / scanVideo.videoWidth);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      try { c.getContext('2d').drawImage(scanVideo, 0, 0, w, h); url = c.toDataURL('image/jpeg', 0.85); } catch (err) {}
    }
    setTimeout(function () { showResult(url); }, 180);
  });
  $('#scanRetake').addEventListener('click', function () {
    scanSheet.hidden = true;
    try { var p = scanVideo.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    $('#scanShutter').focus();
  });
  $('#scanUse').addEventListener('click', function () {
    if (!pendingUrl) { $('#scanShutter').focus(); return; }
    if (scanKind === 'statement') {
      if (stmtBusy) return;
      var client = $('#scanClient').value, url = pendingUrl;
      scanSheet.hidden = true;
      runStatementScan(url, client);
      return;
    }
    setScan(pendingName, pendingUrl);
    closeScanner(); go('receipts');
    toast('Photo attached. Add the receipt details below, then save.');
    setTimeout(function () { $('#rVendor').focus(); }, 60);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !scanner.hidden) closeScanner(); });

  /* ---------- Financial statement scan (browser OCR + anomaly checks) ---------- */
  var OCR_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  var ocrLoader = null;
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

  var MONTH_NUM = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function isoOf(y, m, d) {
    var dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime()) || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
  }
  function findStatementDate(text) {
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
  function findStatementName(text) {
    var skip = /(page|date|as of|for the (year|period)|period ended|currency|amounts? in|note\s*\d|tel|address)/i;
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean).slice(0, 8);
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].replace(/^[^A-Za-z]+/, '').trim();
      if (l.length < 3 || l.length > 56) continue;
      if (!/[A-Za-z]{3,}/.test(l)) continue;
      if (skip.test(l)) continue;
      if (/\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(l)) continue;
      return l;
    }
    return '';
  }
  function findStatementTotal(text) {
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var best = 0;
    lines.forEach(function (l) {
      if (!/(grand\s*total|total\b|amount\s*due|net\s+(income|sales|profit)|balance|revenue)/i.test(l)) return;
      if (/sub\s*-?\s*total/i.test(l)) return;
      var nums = l.match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g) || [];
      nums.forEach(function (raw) {
        var v = parseFloat(raw.replace(/,/g, ''));
        if (v >= 1 && v <= 1e9) best = Math.max(best, v);
      });
    });
    if (best) return best;
    var decimals = String(text || '').match(/(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}\b/g) || [];
    var cands = decimals.map(function (r) { return parseFloat(r.replace(/,/g, '')); }).filter(function (v) { return v >= 1 && v <= 1e9; });
    return cands.length ? Math.max.apply(null, cands) : 0;
  }
  function labelledAmount(text, re) {
    var lines = String(text || '').split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      if (!re.test(lines[i])) continue;
      var nums = lines[i].match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g) || [];
      if (!nums.length) continue;
      var v = parseFloat(nums[nums.length - 1].replace(/,/g, ''));
      if (v >= 1 && v <= 1e9) return v;
    }
    return 0;
  }
  function statementChecks(read, text) {
    var out = [], total = read.total;
    if (!total) out.push({ label: 'Total not read', detail: 'We could not find a statement total. Check that the figures are in the photo and not cut off.', sev: 'high' });
    if (!read.date) out.push({ label: 'No date read', detail: 'The statement has no readable date, so the period cannot be verified.', sev: 'med' });
    else if (read.date > isoToday()) out.push({ label: 'Future date', detail: 'The statement is dated after today, which is not possible for a filed statement.', sev: 'high' });
    if (total >= 50000 && total % 10000 === 0) out.push({ label: 'Round-number total', detail: peso(total) + ' is a round figure at or above the ' + peso(50000) + ' approval limit. Verify it against the ledger.', sev: 'med' });
    if (total >= 47500 && total < 50000) out.push({ label: 'Just under the limit', detail: peso(total) + ' sits within 5% of the ' + peso(50000) + ' approval limit.', sev: 'high' });

    var assets = labelledAmount(text, /total\s*assets/i);
    var liab = labelledAmount(text, /total\s*liabilit/i);
    var equity = labelledAmount(text, /total\s*(equity|stockholders|shareholders)/i);
    if (assets && liab && equity) {
      var gap = assets - (liab + equity);
      if (Math.abs(gap) > Math.max(100, assets * 0.01)) out.push({ label: 'Balance sheet does not balance', detail: 'Total assets are ' + peso(assets) + ', but liabilities plus equity add up to ' + peso(liab + equity) + ' (a ' + peso(Math.abs(gap)) + ' gap).', sev: 'high', variance: Math.round(Math.abs(gap) / assets * 100) });
    }

    var revenue = labelledAmount(text, /total\s*(revenue|sales)/i);
    var expenses = labelledAmount(text, /total\s*(expenses?|costs?)/i);
    var net = labelledAmount(text, /net\s*(income|profit)/i);
    if (revenue && expenses && net) {
      var diff = revenue - expenses - net;
      if (Math.abs(diff) > Math.max(100, revenue * 0.01)) out.push({ label: 'Income statement does not reconcile', detail: 'Revenue of ' + peso(revenue) + ' less expenses of ' + peso(expenses) + ' gives ' + peso(revenue - expenses) + ', not the stated net income of ' + peso(net) + '.', sev: 'high', variance: Math.round(Math.abs(diff) / revenue * 100) });
    }

    var counts = {};
    String(text || '').replace(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g, function (raw) {
      var v = parseFloat(raw.replace(/,/g, ''));
      if (v >= 1000 && v <= 1e9 && !(v >= 1900 && v <= 2100)) counts[v] = (counts[v] || 0) + 1;
      return raw;
    });
    Object.keys(counts).forEach(function (k) {
      if (counts[k] >= 3 && Number(k) !== total) out.push({ label: 'Repeated amount', detail: peso(Number(k)) + ' appears ' + counts[k] + ' times on the statement. Make sure these are separate entries.', sev: 'med' });
    });
    return out;
  }

  function buildStatement(text, clientId) {
    var total = findStatementTotal(text);
    var date = findStatementDate(text);
    var name = findStatementName(text) || 'Scanned statement';
    var checks = statementChecks({ total: total, date: date }, text);
    var high = checks.filter(function (c) { return c.sev === 'high'; }).length;
    var med = checks.filter(function (c) { return c.sev === 'med'; }).length;
    var score = checks.length ? Math.max(20, 100 - high * 25 - med * 12) : 100;
    var verdict = !checks.length ? 'clear' : high ? 'fake' : 'review';
    var variance = '\u2014';
    checks.forEach(function (c) { if (variance === '\u2014' && c.variance) variance = c.variance + '%'; });
    var summary = checks.length
      ? 'I read a total of ' + peso(total) + (date ? ' dated ' + fmtDate(date) : '') + ' and found ' + checks.length + ' issue' + (checks.length === 1 ? '' : 's') + ': ' + checks.map(function (c) { return c.detail; }).join(' ')
      : 'I read a total of ' + peso(total) + (date ? ' dated ' + fmtDate(date) : '') + '. The totals, dates and amount patterns match the rest of the engagement file.';
    return {
      id: uid(), client: clientId, name: name, date: date || isoToday(), total: total,
      type: checks.length ? checks[0].label : 'No anomalies detected',
      variance: variance, authenticity: score, verdict: verdict, llm: summary,
      rec: checks.length
        ? 'Ask the client for the supporting schedule and ledger detail behind the flagged figures before posting the statement.'
        : 'File the statement with the engagement and continue normal review.',
      sigs: checks.map(function (c) { return { label: c.label, detail: c.detail, sev: c.sev, w: c.sev === 'high' ? 24 : 12 }; }),
      reasons: checks, when: nowStamp()
    };
  }

  function runStatementScan(dataUrl, clientId) {
    stmtBusy = true;
    scanMsg.hidden = false;
    scanMsg.textContent = 'Reading the statement\u2026';
    loadOCR().then(function () {
      return window.Tesseract.recognize(dataUrl, 'eng', {
        logger: function (m) {
          if (m.status === 'recognizing text') scanMsg.textContent = 'Reading the statement\u2026 ' + Math.round((m.progress || 0) * 100) + '%';
        }
      });
    }).then(function (res) {
      stmtBusy = false;
      var rec = buildStatement((res && res.data && res.data.text) || '', clientId);
      S.statements = S.statements || [];
      S.statements.unshift(rec);
      save('statements');
      closeScanner();
      go('fraud');
      setFTab('fsa');
      fsaModal(rec.id);
      toast(rec.verdict === 'clear'
        ? 'Statement checked. No anomalies found. Saved to the statement register.'
        : 'Statement checked: ' + rec.reasons.length + ' anomal' + (rec.reasons.length === 1 ? 'y' : 'ies') + ' found. Saved to the statement register.', rec.verdict === 'clear' ? '' : 'error');
    }).catch(function () {
      stmtBusy = false;
      scanMsg.hidden = false;
      scanMsg.textContent = window.Tesseract
        ? 'We couldn\u2019t read that statement. Try a sharper, straight-on shot.'
        : 'The statement reader needs an internet connection the first time. Try again online.';
    });
  }

  /* ---------- Client portal link (clients in this browser) ---------- */
  function pk(base, email) { return base + '::' + String(email).trim().toLowerCase(); }
  function pid(email) { return 'p_' + String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_'); }
  function readList(key) { var l = store.get(key, []); return Array.isArray(l) ? l : []; }
  function portalAccounts() {
    var o = store.get('dcm_accounts', {}) || {};
    return Object.keys(o).map(function (k) { return o[k]; }).filter(function (a) { return a && a.email; });
  }
  function sharedBlob(id) {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('dcm_shared_uploads', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('blobs'); };
        r.onsuccess = function () {
          try {
            var g = r.result.transaction('blobs', 'readonly').objectStore('blobs').get(id);
            g.onsuccess = function () { res(g.result || null); };
            g.onerror = function () { res(null); };
          } catch (e) { res(null); }
        };
        r.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function submissions() {
    var out = [];
    portalAccounts().forEach(function (a) {
      var fs = readList(pk('dcm_findings', a.email));
      readList(pk('dcm_uploads', a.email)).forEach(function (u) {
        if (!u.id) return;
        out.push({ id: u.id, email: a.email, client: pid(a.email), clientName: a.name || a.email, name: u.name, type: u.type || 'Other',
          bytes: u.bytes || 0, date: u.date || '', ts: u.ts || 0, finding: fs.filter(function (f) { return f.uploadId === u.id; })[0] || null });
      });
    });
    return out.sort(function (a, b) { return b.ts - a.ts; });
  }
  function subStatus(s) {
    var f = s.finding;
    if (!f) return { key: 'wait', label: 'Needs a check', cls: 'pending' };
    if (f.verdict === 'clear') return { key: 'clear', label: 'All clear', cls: 'received' };
    return f.status === 'resolved' ? { key: 'clear', label: 'Resolved', cls: 'received' } : { key: 'flag', label: 'Flagged', cls: 'overdue' };
  }
  function syncPortal() {
    var accts = portalAccounts(), keep = {}, cChanged = false, fChanged = false;
    accts.forEach(function (a) {
      var id = pid(a.email); keep[id] = 1;
      var c = S.clients.filter(function (x) { return x.id === id; })[0];
      if (!c) { c = { id: id, name: a.name || a.email, type: 'Bookkeeping', status: 'Awaiting Docs', score: 0, anomalies: 'None Detected', portal: true, email: a.email }; S.clients.push(c); cChanged = true; }
      var open = readList(pk('dcm_findings', a.email)).filter(function (f) { return f.verdict !== 'clear' && f.status !== 'resolved'; });
      var score = Math.min(95, open.reduce(function (n, f) { return n + (100 - (f.score || 0)); }, 0));
      var an = open.length ? open.map(function (f) { return (f.signals || []).map(function (s) { return s.label; }); }).reduce(function (x, y) { return x.concat(y); }, []).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 3).join(', ') : 'None Detected';
      if (c.score !== score || c.anomalies !== an || c.email !== a.email || c.portal !== true) { c.score = score; c.anomalies = an; c.email = a.email; c.portal = true; c.priority = score >= S.prefs.med; cChanged = true; }
    });
    var before = S.clients.length;
    S.clients = S.clients.filter(function (c) { return !c.portal || keep[c.id]; });
    if (S.clients.length !== before) cChanged = true;

    var want = {};
    submissions().forEach(function (s) {
      var fid = 'pu_' + s.id; want[fid] = 1;
      if (!S.files.files.some(function (f) { return f.id === fid; })) {
        S.files.files.push({ id: fid, name: s.name, folder: s.client, size: s.bytes, type: '', added: s.ts || Date.now(), by: s.clientName, portal: true });
        fChanged = true;
      }
    });
    var n = S.files.files.length;
    S.files.files = S.files.files.filter(function (f) { return !f.portal || want[f.id]; });
    if (S.files.files.length !== n) fChanged = true;
    if (cChanged) save('clients');
    if (fChanged) save('files');
  }

  /* ---------- Checking a client's document, then telling the client ---------- */
  var FX_EXTRA = { ghost: 34, dup: 26 };
  function clientSignals(x, flags) {
    var out = x.sigs.map(function (s) {
      var d = s.detail;
      if (s.code === 'image') d = 'The scan looks identical to another document already on file.';
      if (s.code === 'template') d = 'The page layout matches other documents filed under a different supplier TIN.';
      return { label: s.label, detail: d, sev: s.sev, code: s.code };
    });
    flags.forEach(function (fl) {
      if (fl === 'Ghost vendor') out.unshift({ label: 'Possible ghost vendor', sev: 'high', code: 'ghost', detail: 'The vendor’s Tax Identification Number (TIN) also appears on records for other clients, which is a common sign of a ghost vendor.' });
      else if (fl === 'Duplicate invoice') out.unshift({ label: 'Duplicate invoice', sev: 'high', code: 'dup', detail: 'This invoice matches an earlier one you already sent.' });
    });
    return out;
  }
  function clientAdvice(sigs) {
    var has = function (c) { return sigs.some(function (s) { return s.code === c; }); };
    if (!sigs.length) return '';
    if (has('ghost') || has('tin') || has('template')) return 'Send your CPA the supplier’s official receipt showing its BIR-registered TIN. If you don’t recognise this vendor, tell your CPA right away.';
    if (has('dup')) return 'Check whether you paid this twice. If you did, ask the supplier for a refund or a credit note and tell your CPA.';
    if (has('image')) return 'Send the supplier’s own copy of this receipt. An identical scan is already on file.';
    if (has('lines') || has('total') || has('date') || has('name')) return 'Send the original document so your CPA can compare the details. Differences like these usually mean the receipt was re-issued or amended.';
    if (has('under')) return 'If this purchase was part of a larger order, let your CPA know so the right approval is on file.';
    return 'Keep the official receipt. Your CPA will take another look at the next review.';
  }
  function stmtAdvice(reasons) {
    var out = [];
    reasons.forEach(function (c) {
      var l = String(c.label).toLowerCase(), t;
      if (/balance|reconcile/.test(l)) t = 'Compare each total with your ledger and send your CPA a corrected statement.';
      else if (/spike/.test(l)) t = 'Gather the BIR-registered receipts for the unusual expenses and send them to your CPA.';
      else if (/cash|revenue/.test(l)) t = 'Send your CPA the list of unpaid invoices so they can match revenue to cash received.';
      else if (/date/.test(l)) t = 'Check the statement date and upload a clear copy.';
      else if (/not read/.test(l)) t = 'Retake the photo so every figure is inside the frame.';
      else t = 'Send your CPA the ledger behind these figures so they can confirm each entry.';
      if (out.indexOf(t) < 0) out.push(t);
    });
    return out.slice(0, 2).join(' ');
  }
  function verdictOf(score) { return score >= 70 ? 'clear' : score >= 40 ? 'review' : 'fake'; }
  function writeFinding(email, f) {
    var key = pk('dcm_findings', email);
    var list = readList(key).filter(function (x) { return x.uploadId !== f.uploadId; });
    list.unshift(f);
    store.set(key, list);
    if (f.verdict !== 'clear') {
      var mk = pk('dcm_msgs', email), m = store.get(mk, null);
      if (!Array.isArray(m)) m = [];
      m.push({ from: 'them', time: nowStamp(), text: 'We checked "' + f.title + '" and flagged ' + (f.signals || []).length + ' thing' + ((f.signals || []).length === 1 ? '' : 's') + ' for review. You can see what we found and what to do next in Fraud & Anomalies.' });
      store.set(mk, m);
    }
  }
  function updateFinding(email, uploadId, fn) {
    var key = pk('dcm_findings', email), list = readList(key);
    list.forEach(function (f) { if (f.uploadId === uploadId) fn(f); });
    store.set(key, list);
  }
  function removeFinding(email, uploadId) {
    var key = pk('dcm_findings', email);
    store.set(key, readList(key).filter(function (f) { return f.uploadId !== uploadId; }));
  }
  function syncFindingStatus(alertId, st) {
    var m = /^(fx|fsa):(.+)$/.exec(alertId);
    if (!m) return;
    var rec = (m[1] === 'fx' ? S.receipts : S.statements || []).filter(function (r) { return r.id === m[2]; })[0];
    if (!rec || !rec.uploadId || !rec.email) return;
    updateFinding(rec.email, rec.uploadId, function (f) { f.status = st === 'resolved' ? 'resolved' : 'open'; });
  }

  function renderInbox() {
    if (!$('#view-inbox')) return;
    var all = submissions();
    var wait = all.filter(function (s) { return subStatus(s).key === 'wait'; }).length;
    var flag = all.filter(function (s) { return subStatus(s).key === 'flag'; }).length;
    $('#inWait').textContent = wait; $('#inFlag').textContent = flag; $('#inClear').textContent = all.length - wait - flag;
    var nb = $('#navInbox'); nb.textContent = wait; nb.hidden = wait === 0;
    var f = $('#inFilter').value;
    $('#inRows').innerHTML = all.filter(function (s) { return f === 'all' || subStatus(s).key === f; }).map(function (s) {
      var st = subStatus(s);
      return '<tr class="filterable"><td><div class="client-name">' + esc(s.name) + '</div><div class="cell-sub">' + esc(s.type) + '</div></td>' +
        '<td>' + esc(s.clientName) + '<div class="cell-sub">' + esc(s.email) + '</div></td><td>' + esc(s.date) + '</td>' +
        '<td><span class="badge ' + st.cls + '">' + st.label + '</span>' + (s.finding && s.finding.verdict !== 'clear' ? '<div class="reasons">' + esc((s.finding.signals || []).map(function (x) { return x.label; }).slice(0, 2).join(' · ')) + '</div>' : '') + '</td>' +
        '<td class="right"><button type="button" class="btn sm ghost" data-f-open="pu_' + esc(s.id) + '">Open</button> ' +
        '<button type="button" class="btn sm primary" data-sub-check="' + esc(s.id) + '">' + (s.finding ? 'Check again' : 'Check document') + '</button></td></tr>';
    }).join('');
  }

  function isStatementType(t) { return /statement/i.test(t || ''); }
  function subCheckModal(sid) {
    var s = submissions().filter(function (x) { return x.id === sid; })[0];
    if (!s) return;
    sharedBlob(sid).then(function (blob) {
      var isImg = !!blob && /^image\//.test(blob.type || '') || (!!blob && /\.(png|jpe?g|webp|bmp)$/i.test(s.name));
      var isPdf = !!blob && ((blob.type || '') === 'application/pdf' || /\.pdf$/i.test(s.name));
      var url = blob ? URL.createObjectURL(blob) : '';
      subBlobUrl = url; subIsImg = isImg;
      var preview = !blob ? '<div class="empty">We can’t open this file. The client’s browser did not keep a copy. Ask them to send it again.</div>'
        : isImg ? '<div class="pv-box"><img alt="' + esc(s.name) + '" src="' + url + '"></div>'
        : isPdf ? '<div class="pv-box"><iframe title="' + esc(s.name) + '" src="' + url + '"></iframe></div>'
        : '<div class="empty">No preview for this file type. Close this and use Open to download it.</div>';
      var head = '<p class="pv-meta">' + esc(s.clientName) + ' &middot; ' + esc(s.type) + ' &middot; sent ' + esc(s.date) + '</p>';
      var body;
      if (isStatementType(s.type)) {
        body = '<form novalidate id="subStmtForm" data-sub="' + esc(s.id) + '" autocomplete="off">' +
          '<div class="field"><label for="ssText">Statement text</label><textarea class="input" id="ssText" rows="6" placeholder="Paste the text from the statement, or read the photo automatically."></textarea></div>' +
          '<p class="muted small" id="ssStatus" role="status"></p>' +
          '<div class="btn-row mt-12">' + (isImg ? '<button type="button" class="btn ghost" data-sub-ocr>' + ico('scan') + 'Read the photo for me</button>' : '') +
          '<button type="submit" class="btn primary">Check statement</button><button type="button" class="btn ghost" data-close>Cancel</button></div></form>';
      } else {
        body = '<form novalidate id="subRcptForm" data-sub="' + esc(s.id) + '" autocomplete="off">' +
          '<p class="muted small mb-12">Type in what the document says. We compare it with every other receipt on file for duplicates, ghost vendors and mismatched figures.</p>' +
          '<div class="form-grid">' +
          '<div class="field"><label for="sVendor">Vendor name</label><input class="input" id="sVendor" type="text" maxlength="80"></div>' +
          '<div class="field"><label for="sTin">Vendor TIN</label><input class="input" id="sTin" type="text" maxlength="20" placeholder="123-456-789"></div>' +
          '<div class="field"><label for="sInvoice">Invoice #</label><input class="input" id="sInvoice" type="text" maxlength="40"></div>' +
          '<div class="field"><label for="sDate">Date on the document</label><input class="input" id="sDate" type="date" value="' + (s.ts ? new Date(s.ts).toISOString().slice(0, 10) : isoToday()) + '"></div>' +
          '<div class="field span2"><label for="sAmount">Total (₱)</label><input class="input" id="sAmount" type="number" min="0" step="0.01"></div></div>' +
          '<div class="btn-row mt-0"><button type="submit" class="btn primary">Check and send result</button><button type="button" class="btn ghost" data-close>Cancel</button></div></form>';
      }
      openModal('Check: ' + s.name, head + preview + body);
      $('.dialog', modal).classList.add('wide');
    });
  }
  var subBlobUrl = '', subIsImg = false;

  function subSubmitReceipt(f) {
    var s = submissions().filter(function (x) { return x.id === f.dataset.sub; })[0];
    if (!s) return;
    if (!checkForm(f, ['sVendor', 'sTin', 'sInvoice', 'sDate', 'sAmount'])) return;
    S.receipts = S.receipts.filter(function (r) { return r.uploadId !== s.id; });
    var rec = { id: uid(), client: s.client, vendor: $('#sVendor').value.trim(), tin: $('#sTin').value.trim(), invoice: $('#sInvoice').value.trim(),
      date: $('#sDate').value, amt: Math.round(parseFloat($('#sAmount').value) * 100) / 100, file: s.name, uploadId: s.id, email: s.email };
    S.receipts.push(rec); save('receipts');
    var flags = analyze().flags[rec.id] || [], x = fxReport(rec, fxShared());
    var sigs = clientSignals(x, flags), score = 100;
    sigs.forEach(function (g) { score -= (FX_W[g.code] || FX_EXTRA[g.code] || 10); });
    score = Math.max(5, score);
    if (sigs.some(function (g) { return g.sev === 'high'; })) score = Math.min(score, 65);
    var fnd = { id: 'f_' + s.id, uploadId: s.id, kind: 'document', title: rec.vendor + ' (' + rec.invoice + ')', date: rec.date, amount: rec.amt,
      verdict: verdictOf(score), score: score, signals: sigs.map(function (g) { return { label: g.label, detail: g.detail, sev: g.sev }; }),
      rec: clientAdvice(sigs), checkedAt: nowStamp(), status: 'open' };
    writeFinding(s.email, fnd);
    closeModal(); refresh();
    toast(fnd.verdict === 'clear' ? 'Checked. All clear. ' + s.clientName + ' can see the result.' : 'Flagged ' + sigs.length + ' thing' + (sigs.length === 1 ? '' : 's') + '. ' + s.clientName + ' has been notified in Fraud & Anomalies.', fnd.verdict === 'clear' ? '' : 'error');
  }

  function subSubmitStatement(f) {
    var s = submissions().filter(function (x) { return x.id === f.dataset.sub; })[0];
    if (!s) return;
    if (!checkForm(f, ['ssText'])) return;
    var rec = buildStatement($('#ssText').value, s.client);
    if (!rec.name || rec.name === 'Scanned statement') rec.name = s.name;
    rec.uploadId = s.id; rec.email = s.email;
    S.statements = (S.statements || []).filter(function (r) { return r.uploadId !== s.id; });
    S.statements.unshift(rec); save('statements');
    var sigs = (rec.reasons || []).map(function (c) { return { label: c.label, detail: c.detail, sev: c.sev, variance: c.variance }; });
    var fnd = { id: 'f_' + s.id, uploadId: s.id, kind: 'statement', title: rec.name, date: rec.date, amount: rec.total, verdict: rec.verdict === 'clear' ? 'clear' : verdictOf(rec.authenticity),
      score: rec.authenticity, signals: sigs, rec: stmtAdvice(sigs), checkedAt: nowStamp(), status: 'open' };
    if (sigs.length && fnd.verdict === 'clear') fnd.verdict = 'review';
    writeFinding(s.email, fnd);
    closeModal(); refresh();
    toast(sigs.length ? 'Flagged ' + sigs.length + ' anomal' + (sigs.length === 1 ? 'y' : 'ies') + '. ' + s.clientName + ' has been notified in Fraud & Anomalies.' : 'Statement checked. All clear. ' + s.clientName + ' can see the result.', sigs.length ? 'error' : '');
  }

  function subOcr(btn) {
    var st = $('#ssStatus'); st.textContent = 'Loading the reader…';
    btn.disabled = true;
    loadOCR().then(function () {
      st.textContent = 'Reading the statement…';
      return window.Tesseract.recognize(subBlobUrl, 'eng', { logger: function (m) { if (m.status === 'recognizing text') st.textContent = 'Reading the statement… ' + Math.round((m.progress || 0) * 100) + '%'; } });
    }).then(function (res) {
      $('#ssText').value = (res && res.data && res.data.text) || '';
      st.textContent = 'Done. Look the text over, fix anything that was misread, then check the statement.';
      btn.disabled = false;
    }).catch(function () {
      st.textContent = window.Tesseract ? 'We couldn’t read that photo. Paste the text instead.' : 'The reader needs an internet connection the first time. Paste the text instead.';
      btn.disabled = false;
    });
  }

  /* ---------- Messages with clients ---------- */
  var mcActive = '';
  function mcThreadOf(email) { var l = store.get(pk('dcm_msgs', email), []); return Array.isArray(l) ? l : []; }
  function mcSeen() { var s = store.get('dcm_staff_seen', {}); return s && typeof s === 'object' ? s : {}; }
  function mcClientCount(list) { return list.filter(function (m) { return m.from === 'me'; }).length; }
  function mcUnread(email) { return Math.max(0, mcClientCount(mcThreadOf(email)) - (mcSeen()[String(email).toLowerCase()] || 0)); }
  function mcMarkSeen(email) { var s = mcSeen(); s[String(email).toLowerCase()] = mcClientCount(mcThreadOf(email)); store.set('dcm_staff_seen', s); }
  function initials(n) { return String(n).split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase() || '?'; }
  function renderMessages() {
    var accts = portalAccounts(), total = 0;
    $('#mcList').innerHTML = accts.length ? accts.map(function (a) {
      var th = mcThreadOf(a.email), last = th[th.length - 1], un = mcUnread(a.email); total += un;
      return '<button type="button" class="mc-item' + (a.email.toLowerCase() === mcActive ? ' on' : '') + '" data-mc="' + esc(a.email) + '">' +
        '<span class="avatar" aria-hidden="true">' + esc(initials(a.name || a.email)) + '</span>' +
        '<span class="mc-txt"><b>' + esc(a.name || a.email) + '</b><small>' + (last ? esc((last.from === 'them' ? 'You: ' : '') + last.text) : 'No messages yet') + '</small></span>' +
        (un ? '<em class="mc-un">' + un + '</em>' : '') + '</button>';
    }).join('') : '<div class="mc-none">Clients appear here after they create a portal account.</div>';
    var nb = $('#navMsgs'); nb.textContent = total; nb.hidden = total === 0;
    var a = accts.filter(function (x) { return x.email.toLowerCase() === mcActive; })[0];
    $('#mcEmpty').hidden = !!a; $('#mcOpen').hidden = !a;
    if (!a) return;
    $('#mcAvatar').textContent = initials(a.name || a.email); $('#mcName').textContent = a.name || a.email; $('#mcEmail').textContent = a.email;
    var th = mcThreadOf(a.email);
    $('#mcBody').innerHTML = th.length ? th.map(function (m) {
      return '<div class="mc-msg ' + (m.from === 'them' ? 'out' : 'in') + '">' + esc(m.text) + '<small>' + esc(m.time) + '</small></div>';
    }).join('') : '<div class="mc-none">No messages yet. Write the first one below.</div>';
    var body = $('#mcBody'); body.scrollTop = body.scrollHeight;
  }
  function mcOpenThread(email) { mcActive = String(email).toLowerCase(); mcMarkSeen(email); renderMessages(); var i = $('#mcInput'); if (i && window.innerWidth > 800) i.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mc]'); if (t) mcOpenThread(t.dataset.mc);
  });
  $('#mcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#mcInput'), text = input.value.trim();
    if (!text || !mcActive) return;
    var a = portalAccounts().filter(function (x) { return x.email.toLowerCase() === mcActive; })[0];
    if (!a) return;
    var key = pk('dcm_msgs', a.email), th = mcThreadOf(a.email);
    th.push({ from: 'them', time: nowStamp(), text: text });
    store.set(key, th); mcMarkSeen(a.email);
    input.value = ''; renderMessages();
  });

  /* A client changed their data in another tab: refresh once per burst of writes. */
  var onRemoteChange = DCM.debounce(refresh, 80);
  window.addEventListener('storage', function (e) {
    if (!e.key || !/^dcm_(accounts|uploads|findings|msgs)/.test(e.key)) return;
    if (/^dcm_msgs/.test(e.key) && mcActive) mcMarkSeen(mcActive);
    onRemoteChange();
  });

  /* ---------- Init ---------- */
  loadAll();
  $('#rDate').value = isoToday();
  refresh();
  renderSettings();
  route();
})();
