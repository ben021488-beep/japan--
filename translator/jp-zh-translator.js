/*!
 * 日文 → 中文 翻譯外掛
 * 用法：
 *   <script src="jp-zh-translator.js"
 *           data-endpoint="https://你的伺服器/api/translate"
 *           data-target="zh-Hant"       (zh-Hant 繁體 / zh-Hans 简体)
 *           data-selection="true"       (選取日文時出現「翻譯」小按鈕)
 *           data-button="true"          (右下角浮動翻譯按鈕)
 *           data-position="right"       (right / left)
 *           defer></script>
 * JS API：
 *   await JpZhTranslator.translate("こんにちは")  // => "你好"
 *   JpZhTranslator.open("預先填入的日文")
 */
(function () {
  "use strict";
  if (window.JpZhTranslator) return;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="jp-zh-translator"]');
  var ds = (script && script.dataset) || {};

  var defaultEndpoint = (function () {
    try {
      return new URL("/api/translate", script.src).href;
    } catch (e) {
      return "/api/translate";
    }
  })();

  var cfg = {
    endpoint: ds.endpoint || defaultEndpoint,
    target: ds.target === "zh-Hans" ? "zh-Hans" : "zh-Hant",
    selection: ds.selection !== "false",
    button: ds.button !== "false",
    position: ds.position === "left" ? "left" : "right",
  };

  var simp = cfg.target === "zh-Hans";
  var T = simp
    ? { title: "日文 → 中文 翻译", ph: "在此贴上日文…", go: "翻译", copy: "复制", copied: "已复制", busy: "翻译中…", sel: "翻译", close: "关闭", err: "翻译失败", empty: "请输入日文" }
    : { title: "日文 → 中文 翻譯", ph: "在此貼上日文…", go: "翻譯", copy: "複製", copied: "已複製", busy: "翻譯中…", sel: "翻譯", close: "關閉", err: "翻譯失敗", empty: "請輸入日文" };

  // 含平假名、片假名或漢字才視為日文
  var JA_RE = /[぀-ヿㇰ-ㇿｦ-ﾟ一-鿿]/;
  var KANA_RE = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;

  var memo = new Map();

  function translate(text, opts) {
    opts = opts || {};
    text = String(text || "").trim();
    if (!text) return Promise.reject(new Error(T.empty));
    var target = opts.target || cfg.target;
    var key = target + "\u0000" + text;
    if (memo.has(key)) return Promise.resolve(memo.get(key));
    return fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, target: target, context: opts.context || document.title }),
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) throw new Error(j.error || T.err + " (" + r.status + ")");
          return j.translation || "";
        });
      })
      .then(function (t) {
        memo.set(key, t);
        return t;
      });
  }

  // ---- UI（Shadow DOM，避免與網站樣式互相干擾） ----
  var host = document.createElement("div");
  host.id = "jp-zh-translator";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483646;top:0;left:0;width:0;height:0;";
  var root = host.attachShadow({ mode: "open" });
  var side = cfg.position;

  root.innerHTML =
    "<style>" +
    ":host{--c:#9C6B48;--bg:#FFFDF9;--ink:#3B3530;--soft:#857A70;--line:#E3D8CB;}" +
    "*{box-sizing:border-box;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei','Hiragino Sans',sans-serif}" +
    ".fab{position:fixed;" + side + ":18px;bottom:18px;width:52px;height:52px;border-radius:50%;border:0;background:var(--c);color:#fff;font-size:20px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".fab:focus-visible,button:focus-visible,textarea:focus-visible{outline:3px solid var(--c);outline-offset:2px}" +
    ".panel{position:fixed;" + side + ":18px;bottom:82px;width:min(380px,calc(100vw - 36px));max-height:calc(100vh - 110px);display:none;flex-direction:column;gap:10px;padding:14px;background:var(--bg);color:var(--ink);border:1.5px solid var(--line);border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.2)}" +
    ".panel.open{display:flex}" +
    ".head{display:flex;justify-content:space-between;align-items:center;font-weight:700}" +
    ".x{border:0;background:none;font-size:20px;cursor:pointer;color:var(--soft)}" +
    "textarea{width:100%;min-height:96px;resize:vertical;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-size:15px;line-height:1.6;background:#fff;color:var(--ink)}" +
    "textarea:lang(ja){font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic','Meiryo',sans-serif}" +
    ".row{display:flex;gap:8px}" +
    ".btn{flex:1;padding:9px;border:0;border-radius:10px;background:var(--c);color:#fff;font-weight:700;font-size:15px;cursor:pointer}" +
    ".btn.ghost{flex:0 0 auto;background:transparent;color:var(--c);border:1.5px solid var(--c)}" +
    ".btn:disabled{opacity:.6;cursor:wait}" +
    ".out{min-height:48px;max-height:40vh;overflow:auto;white-space:pre-wrap;padding:10px;border-radius:10px;background:#F6F1EA;font-size:15px;line-height:1.7}" +
    ".err{color:#C0584F}" +
    ".selbtn{position:fixed;display:none;padding:5px 10px;border:0;border-radius:8px;background:var(--c);color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}" +
    ".pop{position:fixed;display:none;width:min(360px,calc(100vw - 16px));padding:12px 14px;background:var(--bg);color:var(--ink);border:1.5px solid var(--line);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);font-size:15px;line-height:1.7;white-space:pre-wrap}" +
    ".pop .src{color:var(--soft);font-size:13px;margin-bottom:6px;max-height:4.5em;overflow:hidden;font-family:'Noto Sans JP','Hiragino Sans',sans-serif}" +
    ".pop .tools{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}" +
    ".pop .tools button{border:1px solid var(--line);background:#fff;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;color:var(--ink)}" +
    "</style>" +
    (cfg.button ? '<button class="fab" type="button" aria-label="' + T.title + '" title="' + T.title + '">譯</button>' : "") +
    '<div class="panel" role="dialog" aria-label="' + T.title + '">' +
    '<div class="head"><span>' + T.title + '</span><button class="x" type="button" aria-label="' + T.close + '">×</button></div>' +
    '<textarea lang="ja" placeholder="' + T.ph + '"></textarea>' +
    '<div class="row"><button class="btn go" type="button">' + T.go + '</button><button class="btn ghost cp" type="button">' + T.copy + "</button></div>" +
    '<div class="out" aria-live="polite"></div>' +
    "</div>" +
    '<button class="selbtn" type="button">' + T.sel + "</button>" +
    '<div class="pop" role="status" aria-live="polite"><div class="src"></div><div class="res"></div><div class="tools"><button class="pcp" type="button">' + T.copy + '</button><button class="px" type="button">' + T.close + "</button></div></div>";

  var $ = function (s) { return root.querySelector(s); };
  var fab = $(".fab"), panel = $(".panel"), ta = $("textarea"), go = $(".go"), out = $(".out"), cp = $(".cp");
  var selbtn = $(".selbtn"), pop = $(".pop");

  function copy(text, btn) {
    if (!text) return;
    navigator.clipboard && navigator.clipboard.writeText(text).then(function () {
      var old = btn.textContent;
      btn.textContent = T.copied;
      setTimeout(function () { btn.textContent = old; }, 1200);
    });
  }

  function open(prefill) {
    panel.classList.add("open");
    if (prefill) ta.value = prefill;
    ta.focus();
  }
  function closePanel() { panel.classList.remove("open"); }

  function runPanel() {
    var text = ta.value.trim();
    if (!text) { out.textContent = T.empty; out.className = "out err"; return; }
    go.disabled = true; go.textContent = T.busy;
    out.className = "out"; out.textContent = "";
    translate(text)
      .then(function (t) { out.textContent = t; })
      .catch(function (e) { out.textContent = e.message || T.err; out.className = "out err"; })
      .then(function () { go.disabled = false; go.textContent = T.go; });
  }

  if (fab) fab.addEventListener("click", function () {
    panel.classList.contains("open") ? closePanel() : open();
  });
  $(".x").addEventListener("click", closePanel);
  go.addEventListener("click", runPanel);
  cp.addEventListener("click", function () { copy(out.textContent, cp); });
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runPanel();
    if (e.key === "Escape") closePanel();
  });

  // ---- 選取文字翻譯 ----
  var pendingText = "";
  function hideSel() { selbtn.style.display = "none"; }
  function hidePop() { pop.style.display = "none"; }

  function place(el, rect, below) {
    el.style.display = "block";
    var w = el.offsetWidth, h = el.offsetHeight;
    var x = Math.min(Math.max(8, rect.left), window.innerWidth - w - 8);
    var y = below ? rect.bottom + 8 : rect.top - h - 8;
    if (y < 8) y = rect.bottom + 8;
    if (y + h > window.innerHeight - 8) y = Math.max(8, rect.top - h - 8);
    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  if (cfg.selection) {
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("keyup", function (e) { if (e.shiftKey) onSelect(e); });
    document.addEventListener("selectionchange", function () {
      var s = window.getSelection();
      if (!s || s.isCollapsed) hideSel();
    });
  }

  function onSelect(e) {
    if (e && e.composedPath && e.composedPath().indexOf(host) !== -1) return;
    setTimeout(function () {
      var s = window.getSelection();
      var text = s ? s.toString().trim() : "";
      if (!text || text.length > 5000 || !JA_RE.test(text)) return hideSel();
      var range = s.getRangeAt(0);
      // 只有漢字時可能是中文：需含假名，或位於 lang="ja" 的元素內才顯示
      if (!KANA_RE.test(text)) {
        var node = range.commonAncestorContainer;
        var el = node.nodeType === 1 ? node : node.parentElement;
        var langEl = el && el.closest("[lang]");
        if (!langEl || !/^ja/i.test(langEl.getAttribute("lang"))) return hideSel();
      }
      var rect = range.getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) return hideSel();
      pendingText = text;
      place(selbtn, rect, true);
    }, 10);
  }

  selbtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
  selbtn.addEventListener("click", function () {
    var rect = selbtn.getBoundingClientRect();
    hideSel();
    var text = pendingText;
    pop.querySelector(".src").textContent = text;
    var res = pop.querySelector(".res");
    res.className = "res"; res.textContent = T.busy;
    place(pop, rect, true);
    translate(text)
      .then(function (t) { res.textContent = t; place(pop, rect, true); })
      .catch(function (err) { res.textContent = err.message || T.err; res.className = "res err"; });
  });
  $(".px").addEventListener("click", hidePop);
  $(".pcp").addEventListener("click", function () { copy(pop.querySelector(".res").textContent, $(".pcp")); });

  document.addEventListener("mousedown", function (e) {
    if (e.composedPath && e.composedPath().indexOf(host) !== -1) return;
    hidePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { hidePop(); hideSel(); } });
  window.addEventListener("scroll", function () { hideSel(); }, { passive: true });

  // 預先喚醒伺服器（免費主機閒置會休眠，第一次要等較久）
  try {
    fetch(new URL("/health", cfg.endpoint).href, { mode: "no-cors" }).catch(function () {});
  } catch (e) {}

  function mount() { document.body.appendChild(host); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.JpZhTranslator = { translate: translate, open: open, close: closePanel, config: cfg };
})();
