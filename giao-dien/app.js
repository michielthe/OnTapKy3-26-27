/* Web học tập - code dùng chung cho mọi môn.
   Dữ liệu: du-lieu/danh-sach-mon.json và du-lieu/<ma-mon>.json (xem README.md).
   Không cần sửa file này khi thêm câu hỏi, thêm môn hay thêm tài liệu. */
(function () {
  "use strict";

  var DS_MON = "du-lieu/danh-sach-mon.json";
  var KEYS = ["A", "B", "C", "D"];
  var WIRES = ["var(--w-or)", "var(--w-gr)", "var(--w-bl)", "var(--w-br)"];
  var PREFIX = "hoc-tap:v1:";
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MARK_OK = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var MARK_BAD = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  var main = document.getElementById("noi-dung");

  var registry = null;
  var subjects = {};
  var quiz = { view: "mon" };
  var lastView = "";

  /* ---------- Tiện ích ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function store(k, v) { try { if (v === null) localStorage.removeItem(PREFIX + k); else localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }
  function load(k) { try { var s = localStorage.getItem(PREFIX + k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function wire(i) { return WIRES[i % 4]; }
  /* Vẽ một màn hình. Chỉ chạy hiệu ứng vào trang khi đổi sang màn hình khác. */
  function render(html, viewName) {
    var v = viewName || "";
    var anim = v !== lastView;
    lastView = v;
    main.innerHTML = '<div class="page' + (anim ? " enter" : "") + '">' + html + "</div>";
  }
  function top() { window.scrollTo(0, 0); }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Không tìm thấy file " + path + " (mã " + r.status + ").");
      return r.text();
    }).then(function (txt) {
      try { return JSON.parse(txt); }
      catch (e) { throw new Error("File " + path + " bị lỗi định dạng JSON: " + e.message + ". Hãy kiểm tra file bằng một trang JSON validator."); }
    }, function (e) {
      if (location.protocol === "file:") throw new Error("Trình duyệt không cho đọc file dữ liệu khi mở trang bằng cách bấm đúp. Hãy mở trang qua GitHub Pages hoặc một server nhỏ (ví dụ VS Code + Live Server).");
      throw e;
    });
  }
  function errorBox(e) { return '<div class="err"><b>Không tải được dữ liệu.</b><br>' + esc(e.message || e) + "</div>"; }
  function getRegistry() {
    if (registry) return Promise.resolve(registry);
    return fetchJSON(DS_MON).then(function (d) { registry = d; return d; });
  }
  function getSubject(m) {
    if (subjects[m.ma_mon]) return Promise.resolve(subjects[m.ma_mon]);
    return fetchJSON(m.file_cau_hoi).then(function (d) { subjects[m.ma_mon] = d; return d; });
  }
  function findSubject(ma) { return (registry.mon || []).filter(function (m) { return m.ma_mon === ma; })[0]; }
  function chapLabel(ch) { var n = (ch.ten.match(/\d+/) || ["?"])[0]; return (ch.nhom === "PerfectEN" ? "E" : "") + n; }
  function chapShort(ch) { return ch.ten.replace(/^(Chương|PerfectEN)\s*\d+\s*-\s*/, ""); }
  function initials(t) { var w = t.split(/\s+/).filter(function (x) { return /[A-Za-zÀ-ỹ0-9]/.test(x); }); return w.length > 1 ? (w[0][0] + w[1][0]).toUpperCase() : t.slice(0, 3).toUpperCase(); }

  /* ---------- Điều hướng ---------- */
  var ROUTES = { "trang-chu": home, "trac-nghiem": quizRoute, "tai-lieu": docs };
  function route() {
    var r = (location.hash || "").replace("#", "");
    if (!ROUTES[r]) r = "trang-chu";
    document.querySelectorAll(".tab").forEach(function (t) {
      if (t.getAttribute("href") === "#" + r) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    ROUTES[r]();
  }
  window.addEventListener("hashchange", function () { route(); top(); });

  /* ================= TRANG CHỦ ================= */
  function home() {
    render('<p class="loading">Đang tải...</p>', "loading");
    getRegistry().then(function (reg) {
      var withQ = reg.mon.filter(function (m) { return m.file_cau_hoi; });
      return Promise.all(withQ.map(function (m) { return getSubject(m).catch(function () { return null; }); })).then(function (list) {
        var nQ = 0, nC = 0;
        list.forEach(function (d) { if (!d) return; d.chuong.forEach(function (c) { if (c.cau.length) { nC++; nQ += c.cau.length; } }); });
        var nDoc = reg.mon.reduce(function (s, m) { return s + (m.tai_lieu || []).length; }, 0);
        var qNames = withQ.map(function (m) { return m.ten; }).join(", ");
        var nodes = "", N = 7, dur = 2.8, delay = 0.35;
        for (var i = 0; i < N; i++) {
          var t = delay + dur * (i / (N - 1)) * 0.98;
          nodes += '<span class="node" style="--c:' + wire(i) + ';animation-delay:' + t.toFixed(2) + 's"></span>';
        }
        var h = '<section class="hero">'
          + '<div class="net run" aria-hidden="true"><div class="net-nodes">' + nodes + '</div><span class="packet"><i></i><i></i><i></i><i></i></span></div>'
          + "<h1>Ôn tập Học kỳ 3 bằng trắc nghiệm</h1>"
          + "<p>Trang tự học: làm trắc nghiệm theo từng chương để nhớ bài, mở lại bản tóm tắt khi cần. Hiện có câu hỏi cho môn " + esc(qNames || "chưa có") + ".</p>"
          + '<div class="row-actions"><a class="btn primary" href="#trac-nghiem">Làm trắc nghiệm</a><a class="btn" href="#tai-lieu">Xem tài liệu</a></div>'
          + "</section>"
          + '<div class="facts">'
          + '<div class="panel fact" style="--c:var(--w-or)"><strong>' + nQ + "</strong><span>câu hỏi</span></div>"
          + '<div class="panel fact" style="--c:var(--w-gr)"><strong>' + nC + "</strong><span>chương có câu hỏi</span></div>"
          + '<div class="panel fact" style="--c:var(--w-bl)"><strong>' + nDoc + "</strong><span>tài liệu PDF</span></div></div>"
          + '<section class="stack"><h2>Trang này làm được gì</h2><div class="features">'
          + feature(0, "Trắc nghiệm theo chương", "Chọn môn rồi chọn chương. Mỗi câu có 4 đáp án, thứ tự đáp án được đảo mỗi lần làm.")
          + feature(1, "Giải thích ngay", "Bấm chọn là khóa đáp án, hiện đáp án đúng, lời giải thích và nguồn trong bản tóm tắt.")
          + feature(2, "Câu khó", "Khoảng 30% số câu mỗi chương là câu tính toán hoặc chi tiết ít người để ý, có nhãn Khó.")
          + feature(3, "Xáo trộn câu hỏi", "Bật công tắc khi chọn chương để thứ tự câu hỏi thay đổi, tránh nhớ vị trí.")
          + feature(0, "Làm tiếp", "Trang nhớ câu bạn đang làm dở trên máy này, quay lại là làm tiếp được.")
          + feature(1, "Làm lại câu sai", "Nộp bài xong xem điểm, danh sách câu sai và làm lại riêng các câu đó.")
          + feature(2, "Chuỗi trả lời đúng", "Trả lời đúng liên tiếp từ 2 câu trở lên sẽ hiện chuỗi đúng để tạo động lực.")
          + feature(3, "Tài liệu môn học", "Bản tóm tắt PDF của từng chương để đọc lại trước khi làm bài.")
          + "</div></section>";
        render(h, "home");
      });
    }).catch(function (e) { render(errorBox(e), "err"); });
  }
  function feature(i, t, d) { return '<div class="panel feature" style="--c:' + wire(i) + '"><h3><i aria-hidden="true"></i>' + esc(t) + "</h3><p>" + esc(d) + "</p></div>"; }

  /* ================= TRẮC NGHIỆM ================= */
  function quizRoute() {
    render('<p class="loading">Đang tải...</p>', "loading");
    getRegistry().then(function () {
      if (quiz.view === "quiz" && quiz.s) return renderQuiz(0);
      if (quiz.view === "ketqua" && quiz.s) return results();
      if (quiz.view === "chuong" && quiz.mon) return chapters(quiz.mon);
      subjectsView();
    }).catch(function (e) { render(errorBox(e), "err"); });
  }

  function subjectsView() {
    quiz = { view: "mon" };
    var h = '<div class="stack"><h1>Trắc nghiệm môn học</h1><p class="muted">Chọn môn để xem các chương.</p></div><div class="panel list">';
    registry.mon.forEach(function (m, i) {
      var ok = !!m.file_cau_hoi;
      h += '<button class="item" style="--c:' + wire(i) + '" data-mon="' + esc(m.ma_mon) + '"' + (ok ? "" : " disabled") + ">"
        + '<span class="badge">' + esc(initials(m.ten)) + "</span>"
        + '<span class="item-body"><span class="item-name">' + esc(m.ten) + "</span>"
        + '<span class="item-meta" data-meta="' + esc(m.ma_mon) + '">' + (ok ? "Đang tải số câu..." : "Chưa có câu hỏi") + "</span></span>"
        + (ok ? '<span class="item-go">Chọn</span>' : '<span class="item-go soon">Sắp có</span>') + "</button>";
    });
    h += "</div>";
    render(h, "mon");
    main.querySelectorAll(".item[data-mon]").forEach(function (b) {
      b.addEventListener("click", function () { chapters(b.getAttribute("data-mon")); top(); });
    });
    registry.mon.filter(function (m) { return m.file_cau_hoi; }).forEach(function (m) {
      getSubject(m).then(function (d) {
        var n = 0, c = 0; d.chuong.forEach(function (ch) { if (ch.cau.length) { c++; n += ch.cau.length; } });
        var el = main.querySelector('[data-meta="' + m.ma_mon + '"]'); if (el) el.textContent = c + " chương, " + n + " câu";
      }).catch(function (e) {
        var el = main.querySelector('[data-meta="' + m.ma_mon + '"]'); if (el) el.textContent = "Lỗi tải câu hỏi: " + (e.message || e);
      });
    });
  }

  function chapters(ma) {
    var m = findSubject(ma); if (!m) return subjectsView();
    quiz = { view: "chuong", mon: ma };
    render('<p class="loading">Đang tải câu hỏi...</p>', "loading");
    getSubject(m).then(function (d) {
      var shuffleOn = load("xao-tron") === true, groups = [], idx = 0;
      d.chuong.forEach(function (ch) {
        var g = groups.filter(function (x) { return x.name === ch.nhom; })[0];
        if (!g) { g = { name: ch.nhom || "Khác", items: [] }; groups.push(g); }
        g.items.push(ch);
      });
      var h = '<div class="crumbs"><button class="link-btn" id="ve-mon">Tất cả môn</button><span>/</span><span>' + esc(d.mon) + "</span></div>"
        + '<div class="stack"><h1>' + esc(d.mon) + '</h1><p class="muted">Chọn một chương để làm bài.</p></div>'
        + '<label class="panel toggle" for="xao-tron"><input type="checkbox" id="xao-tron"' + (shuffleOn ? " checked" : "") + ">"
        + '<span class="switch" aria-hidden="true"></span><span class="toggle-text"><b>Xáo trộn thứ tự câu hỏi</b>'
        + '<span class="small muted">Áp dụng khi bắt đầu một lượt mới. Thứ tự đáp án luôn được đảo.</span></span></label>';
      groups.forEach(function (g, gi) {
        h += '<section class="stack"><div class="section-title" style="--c:' + wire(gi * 2) + '">' + esc(g.name) + '</div><div class="panel list">';
        g.items.forEach(function (ch) {
          var n = ch.cau.length, k = ch.cau.filter(function (q) { return q.kho; }).length;
          var meta = n ? n + " câu, " + k + " câu khó" : "Chưa có câu hỏi", meter = "";
          var prog = n ? validProgress(d, ch) : null, last = load("diem:" + d.ma_mon + ":" + ch.id);
          if (prog) {
            var done = prog.picks.filter(function (x) { return x !== null; }).length;
            meta += '. <span class="resume">Đang làm dở câu ' + (prog.cur + 1) + "/" + prog.ids.length + "</span>";
            meter = '<span class="meter prog"><i style="width:' + (done * 100 / prog.ids.length) + '%"></i></span>';
          } else if (last) {
            meta += ". Lần trước: " + last.dung + "/" + last.tong + " câu đúng";
            meter = '<span class="meter"><i style="width:' + (last.dung * 100 / last.tong) + '%"></i></span>';
          }
          h += '<button class="item" style="--c:' + wire(idx++) + '" data-ch="' + esc(ch.id) + '"' + (n ? "" : " disabled") + ">"
            + '<span class="badge">' + esc(chapLabel(ch)) + "</span>"
            + '<span class="item-body"><span class="item-name">' + esc(chapShort(ch)) + '</span><span class="item-meta">' + meta + "</span>" + meter + "</span>"
            + (n ? '<span class="item-go">' + (prog ? "Làm tiếp" : "Làm bài") + "</span>" : "") + "</button>";
        });
        h += "</div></section>";
      });
      render(h, "chuong:" + ma);
      document.getElementById("ve-mon").onclick = function () { subjectsView(); top(); };
      document.getElementById("xao-tron").addEventListener("change", function (e) { store("xao-tron", e.target.checked); });
      main.querySelectorAll(".item[data-ch]").forEach(function (b) {
        b.addEventListener("click", function () {
          var ch = d.chuong.filter(function (c) { return c.id === b.getAttribute("data-ch"); })[0];
          var prog = validProgress(d, ch);
          if (prog) resumeView(d, ch, prog); else start(d, ch);
          top();
        });
      });
    }).catch(function (e) {
      render('<div class="crumbs"><button class="link-btn" id="ve-mon">Tất cả môn</button></div>' + errorBox(e), "err");
      document.getElementById("ve-mon").onclick = subjectsView;
    });
  }

  /* ----- Lưu tiến độ (theo id câu hỏi, chỉ trên máy này) ----- */
  function progKey(d, ch) { return "tien-do:" + d.ma_mon + ":" + ch.id; }
  function validProgress(d, ch) {
    var p = load(progKey(d, ch));
    if (!p || !Array.isArray(p.ids) || !p.ids.length) return null;
    var byId = {}; ch.cau.forEach(function (q) { byId[q.id] = true; });
    var keep = p.ids.map(function (id, i) { return byId[id] ? i : -1; }).filter(function (i) { return i >= 0; });
    if (!keep.length) return null;
    if (keep.length !== p.ids.length) {
      p.ids = keep.map(function (i) { return p.ids[i]; });
      p.orders = keep.map(function (i) { return p.orders[i]; });
      p.picks = keep.map(function (i) { return p.picks[i]; });
      p.cur = Math.min(p.cur, p.ids.length - 1);
    }
    if (p.picks.every(function (x) { return x !== null; })) return null;
    return p;
  }
  function save() {
    var s = quiz.s;
    store(progKey(s.d, s.ch), { ids: s.items.map(function (it) { return it.q.id; }), orders: s.items.map(function (it) { return it.order; }),
      picks: s.items.map(function (it) { return it.pick; }), cur: s.cur, retry: s.retry, streak: s.streak });
  }

  function resumeView(d, ch, p) {
    quiz = { view: "chuong", mon: d.ma_mon };
    var done = p.picks.filter(function (x) { return x !== null; }).length;
    var h = '<div class="crumbs"><button class="link-btn" id="ve-chuong">' + esc(d.mon) + "</button><span>/</span><span>" + esc(chapShort(ch)) + "</span></div>"
      + '<section class="panel resume-box"><h2>' + esc(ch.ten) + "</h2>"
      + "<p>Bạn đang làm dở" + (p.retry ? " lượt làm lại câu sai" : "") + ": đã trả lời " + done + "/" + p.ids.length + " câu, đang ở câu " + (p.cur + 1) + ".</p>"
      + '<span class="meter prog"><i style="width:' + (done * 100 / p.ids.length) + '%"></i></span>'
      + '<div class="row-actions"><button class="btn primary" id="lam-tiep">Làm tiếp từ câu ' + (p.cur + 1) + "</button>"
      + '<button class="btn" id="lam-lai">Làm lại từ đầu</button></div></section>';
    render(h, "resume");
    document.getElementById("ve-chuong").onclick = function () { chapters(d.ma_mon); };
    document.getElementById("lam-tiep").onclick = function () {
      var byId = {}; ch.cau.forEach(function (q) { byId[q.id] = q; });
      quiz = { view: "quiz", mon: d.ma_mon, s: { d: d, ch: ch, cur: p.cur, retry: !!p.retry, streak: p.streak || 0,
        items: p.ids.map(function (id, i) { return { q: byId[id], order: p.orders[i], pick: p.picks[i] }; }) } };
      renderQuiz(0);
    };
    document.getElementById("lam-lai").onclick = function () { store(progKey(d, ch), null); start(d, ch); };
  }

  function start(d, ch, onlyIds) {
    var qs = onlyIds ? ch.cau.filter(function (q) { return onlyIds.indexOf(q.id) >= 0; }) : ch.cau.slice();
    if (load("xao-tron") === true) qs = shuffle(qs);
    quiz = { view: "quiz", mon: d.ma_mon, s: { d: d, ch: ch, cur: 0, retry: !!onlyIds, streak: 0,
      items: qs.map(function (q) { return { q: q, order: shuffle([0, 1, 2, 3]), pick: null }; }) } };
    save();
    renderQuiz(0);
  }

  function answered() { return quiz.s.items.filter(function (it) { return it.pick !== null; }).length; }
  function counterText() { var s = quiz.s; return "Câu " + (s.cur + 1) + "/" + s.items.length + ", đã làm " + answered(); }
  function streakHTML() { var n = quiz.s.streak || 0; return '<span class="streak' + (n >= 2 ? " on" : "") + '" id="streak" aria-live="polite">Chuỗi đúng <b>' + n + "</b></span>"; }
  function hopClass(x, i) {
    var c = "hop";
    if (x.pick !== null) c += x.order[x.pick] === 0 ? " ok" : " bad";
    if (i === quiz.s.cur) c += " cur";
    if (x.q.kho) c += " hard";
    return c;
  }
  function explainHTML(it) {
    var q = it.q, ok = it.order[it.pick] === 0;
    return '<div class="explain ' + (ok ? "yes" : "no") + '" role="status"><span class="verdict">' + (ok ? "Chính xác!" : "Chưa đúng. Đáp án đúng là " + KEYS[it.order.indexOf(0)] + ".") + "</span>"
      + "<span>" + esc(q.giai_thich) + "</span>" + (q.nguon ? '<span class="source">Nguồn: ' + esc(q.nguon) + "</span>" : "") + "</div>";
  }

  /* dir: 1 = sang câu sau, -1 = về câu trước, 0 = mở lần đầu */
  function renderQuiz(dir) {
    var s = quiz.s, it = s.items[s.cur], q = it.q, total = s.items.length, picked = it.pick !== null;
    var h = '<div class="quiz-top"><button class="link-btn" id="ve-chuong">' + esc(s.d.mon) + ": các chương</button>"
      + '<button class="link-btn" id="nop-bai">Nộp bài</button></div>'
      + '<div class="quiz-head"><div class="stack"><h2>' + esc(s.ch.ten) + (s.retry ? " (làm lại câu sai)" : "") + "</h2>"
      + '<div class="counter" id="counter">' + counterText() + "</div></div>" + streakHTML() + "</div>"
      + '<div class="route" id="route"><div class="route-inner">';
    s.items.forEach(function (x, i) {
      h += '<button class="' + hopClass(x, i) + '" data-i="' + i + '" aria-label="Câu ' + (i + 1) + (x.q.kho ? ", câu khó" : "") + '"></button>';
    });
    h += '</div></div><article class="panel qcard' + (dir > 0 ? " from-next" : dir < 0 ? " from-prev" : "") + '" id="qcard">'
      + '<div class="qtags"><span class="qnum">Câu <b>' + (s.cur + 1) + "</b></span>" + (q.kho ? '<span class="tag">Khó</span>' : "") + "</div>"
      + '<div class="qtext">' + esc(q.hoi) + '</div><div class="opts">';
    it.order.forEach(function (dIdx, pos) {
      var c = "opt";
      if (picked) c += dIdx === 0 ? " right" : (pos === it.pick ? " wrong" : " dim");
      h += '<button class="' + c + '" data-p="' + pos + '"' + (picked ? " disabled" : "") + '><span class="key">' + KEYS[pos] + '</span><span class="txt">' + esc(q.dap_an[dIdx]) + "</span>"
        + (dIdx === 0 ? MARK_OK : MARK_BAD) + "</button>";
    });
    h += "</div>" + (picked ? explainHTML(it) : "") + "</article>"
      + '<div class="nav"><button class="btn" id="truoc"' + (s.cur === 0 ? " disabled" : "") + ">Câu trước</button>"
      + (s.cur === total - 1 ? '<button class="btn primary" id="xem-kq">Xem kết quả</button>' : '<button class="btn primary" id="sau">Câu sau</button>') + "</div>"
      + '<p class="hint">Phím tắt: A, B, C, D (hoặc 1-4) để chọn; mũi tên trái, phải để chuyển câu.</p>';
    render(h, "quiz");
    // Khi xem lại câu đã làm thì không chạy lại hiệu ứng đúng/sai
    if (picked) main.querySelectorAll(".opt").forEach(function (o) { o.style.animation = "none"; o.querySelectorAll("path").forEach(function (p) { p.style.animation = "none"; p.style.strokeDashoffset = "0"; }); });
    if (picked) { var ex = main.querySelector(".explain"); if (ex) ex.style.animation = "none"; }
    document.getElementById("ve-chuong").onclick = function () { chapters(s.d.ma_mon); top(); };
    document.getElementById("nop-bai").onclick = results;
    document.getElementById("truoc").onclick = function () { go(-1); };
    var b = document.getElementById("sau"); if (b) b.onclick = function () { go(1); };
    b = document.getElementById("xem-kq"); if (b) b.onclick = results;
    main.querySelectorAll(".opt").forEach(function (o) { o.addEventListener("click", function () { choose(+o.getAttribute("data-p")); }); });
    main.querySelectorAll(".hop").forEach(function (o) {
      o.addEventListener("click", function () { var i = +o.getAttribute("data-i"); if (i === s.cur) return; var d = i > s.cur ? 1 : -1; s.cur = i; save(); renderQuiz(d); });
    });
    centerHop(false);
  }
  function centerHop(smooth) {
    var cur = main.querySelector(".hop.cur"), r = document.getElementById("route");
    if (!cur || !r) return;
    var x = cur.offsetLeft - r.clientWidth / 2 + 10;
    if (smooth && !REDUCED && r.scrollTo) r.scrollTo({ left: x, behavior: "smooth" }); else r.scrollLeft = x;
  }

  /* Chọn đáp án: cập nhật ngay trên trang (không vẽ lại) để hiệu ứng chạy mượt. */
  function choose(pos) {
    var s = quiz.s, it = s.items[s.cur];
    if (it.pick !== null || !main.querySelector(".qcard")) return;
    it.pick = pos;
    var ok = it.order[pos] === 0;
    s.streak = ok ? (s.streak || 0) + 1 : 0;
    save();
    main.querySelectorAll(".opt").forEach(function (o) {
      var p = +o.getAttribute("data-p");
      o.disabled = true;
      if (it.order[p] === 0) o.classList.add("right");
      else if (p === pos) o.classList.add("wrong");
      else o.classList.add("dim");
    });
    main.querySelector(".opts").insertAdjacentHTML("afterend", explainHTML(it));
    var hop = main.querySelector('.hop[data-i="' + s.cur + '"]');
    if (hop) { hop.className = hopClass(it, s.cur) + " pop"; }
    document.getElementById("counter").textContent = counterText();
    var st = document.getElementById("streak");
    st.querySelector("b").textContent = s.streak;
    st.classList.toggle("on", s.streak >= 2);
    if (s.streak >= 2) { st.classList.remove("bump"); void st.offsetWidth; st.classList.add("bump"); }
    var ex = main.querySelector(".explain");
    setTimeout(function () {
      if (ex && ex.getBoundingClientRect().bottom > window.innerHeight) ex.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
    }, 120);
  }
  function go(d) {
    var s = quiz.s, n = s.cur + d;
    if (n < 0 || n >= s.items.length) return;
    s.cur = n; save(); renderQuiz(d);
    var hd = main.querySelector(".quiz-head"); if (hd && hd.getBoundingClientRect().top < 70) hd.scrollIntoView({ block: "center" });
  }

  function scoreMsg(p) {
    if (p >= 90) return "Rất tốt, gần như đã thuộc chương này.";
    if (p >= 70) return "Khá chắc rồi. Xem lại vài câu sai là ổn.";
    if (p >= 50) return "Nắm được hơn nửa chương. Nên làm lại các câu sai.";
    return "Nên đọc lại bản tóm tắt rồi làm lại chương này.";
  }
  function countUp(el, to) {
    if (REDUCED || to === 0) { el.textContent = to; return; }
    var t0 = null, dur = 800;
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function results() {
    var s = quiz.s; quiz.view = "ketqua";
    var total = s.items.length;
    var right = s.items.filter(function (it) { return it.pick !== null && it.order[it.pick] === 0; });
    var wrong = s.items.filter(function (it) { return it.pick !== null && it.order[it.pick] !== 0; });
    var skip = s.items.filter(function (it) { return it.pick === null; });
    var pr = total ? right.length * 100 / total : 0, pw = total ? wrong.length * 100 / total : 0;
    if (!skip.length) { store(progKey(s.d, s.ch), null); if (!s.retry) store("diem:" + s.d.ma_mon + ":" + s.ch.id, { dung: right.length, tong: total }); }
    var review = wrong.concat(skip);
    var trail = s.items.map(function (it, i) {
      var c = it.pick === null ? "" : (it.order[it.pick] === 0 ? "ok" : "bad");
      return '<i class="' + c + '" title="Câu ' + (i + 1) + '" style="animation-delay:' + Math.min(i * 15, 900) + 'ms"></i>';
    }).join("");
    var h = '<div class="quiz-top"><button class="link-btn" id="ve-chuong">' + esc(s.d.mon) + ": các chương</button></div>"
      + '<section class="panel score"><h2>' + esc(s.ch.ten) + (s.retry ? " (làm lại câu sai)" : "") + "</h2>"
      + '<div class="score-num"><b id="so-dung">0</b><span> / ' + total + " câu đúng (" + Math.round(pr) + "%)</span></div>"
      + '<p class="score-msg">' + scoreMsg(pr) + "</p>"
      + '<div class="bar" aria-hidden="true"><i id="bar-ok"></i><i id="bar-bad"></i></div>'
      + '<div class="stats"><span class="ans-ok">Đúng: ' + right.length + '</span><span class="ans-bad">Sai: ' + wrong.length + '</span><span class="muted">Chưa làm: ' + skip.length + "</span></div>"
      + '<div class="trail" aria-label="Kết quả từng câu">' + trail + "</div>"
      + '<div class="row-actions">'
      + (wrong.length ? '<button class="btn primary" id="lai-sai">Làm lại ' + wrong.length + " câu sai</button>" : "")
      + (skip.length ? '<button class="btn' + (wrong.length ? "" : " primary") + '" id="lam-tiep">Làm tiếp ' + skip.length + " câu chưa làm</button>" : "")
      + '<button class="btn" id="lai-het">Làm lại cả chương</button></div></section>';
    if (review.length) {
      h += '<section class="stack"><h2>Cần xem lại</h2><div class="review">';
      review.forEach(function (it) {
        var q = it.q, sk = it.pick === null;
        h += '<div class="panel review-item' + (sk ? " skip" : "") + '"><div class="review-q">' + esc(q.hoi) + "</div>"
          + (sk ? '<div class="small muted">Chưa làm</div>' : '<div class="small ans-bad">Bạn chọn: ' + esc(q.dap_an[it.order[it.pick]]) + "</div>")
          + '<div class="small ans-ok">Đáp án đúng: ' + esc(q.dap_an[0]) + '</div><div class="small">' + esc(q.giai_thich) + "</div></div>";
      });
      h += "</div></section>";
    }
    render(h, "ketqua"); top();
    countUp(document.getElementById("so-dung"), right.length);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      document.getElementById("bar-ok").style.width = pr + "%";
      document.getElementById("bar-bad").style.width = pw + "%";
    }); });
    document.getElementById("ve-chuong").onclick = function () { chapters(s.d.ma_mon); top(); };
    document.getElementById("lai-het").onclick = function () { start(s.d, s.ch); top(); };
    var b = document.getElementById("lai-sai");
    if (b) b.onclick = function () { start(s.d, s.ch, wrong.map(function (it) { return it.q.id; })); top(); };
    b = document.getElementById("lam-tiep");
    if (b) b.onclick = function () { quiz.view = "quiz"; s.cur = s.items.indexOf(skip[0]); save(); renderQuiz(0); top(); };
  }

  /* ================= TÀI LIỆU ================= */
  function docs() {
    render('<p class="loading">Đang tải...</p>', "loading");
    getRegistry().then(function (reg) {
      var h = '<div class="stack"><h1>Tài liệu môn học</h1><p class="muted">Bản tóm tắt PDF theo chương. Bấm để mở trong tab mới.</p></div>';
      reg.mon.forEach(function (m, mi) {
        var list = m.tai_lieu || [];
        h += '<section class="stack"><div class="section-title" style="--c:' + wire(mi) + '">' + esc(m.ten) + '</div><div class="panel list">';
        if (!list.length) h += '<div class="item" aria-disabled="true"><span class="item-body"><span class="item-meta">Chưa có tài liệu</span></span></div>';
        list.forEach(function (t, i) {
          h += '<a class="item" style="--c:' + wire(i) + '" href="' + esc(t.file) + '" target="_blank" rel="noopener"><span class="doc-icon" aria-hidden="true">PDF</span>'
            + '<span class="item-body"><span class="item-name">' + esc(t.ten) + "</span>" + (t.loai ? '<span class="doc-type">' + esc(t.loai) + "</span>" : "") + "</span>"
            + '<span class="item-go">Mở</span></a>';
        });
        h += "</div></section>";
      });
      render(h, "tai-lieu");
    }).catch(function (e) { render(errorBox(e), "err"); });
  }

  /* ---------- Phím tắt khi làm bài ---------- */
  document.addEventListener("keydown", function (e) {
    if (!quiz.s || quiz.view !== "quiz" || !main.querySelector(".qcard") || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    var map = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 }, k = e.key.toUpperCase();
    if (k in map) { choose(map[k]); e.preventDefault(); }
    else if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
  });

  route();
})();
