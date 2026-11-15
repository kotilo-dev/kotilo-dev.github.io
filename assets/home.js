// Live fragments on the home page: the mission control demo, the status ticker, the Kit typing
// demo, the New Tab clock and the OS-aware download button. Plain JS, no dependencies.
(() => {
  "use strict";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---- Mission control demo: a ~9 s loop that pauses on hover ---- */
  const mc = $("#mc");
  if (mc) {
    const OUT = {
      gateway: {
        work: ["• Added migration", "  AddCancellationStatus", "• Needs a database write."],
        perm: ["• Added migration", "  AddCancellationStatus", "• Needs a database write.", "› dotnet ef database…"],
        after: ["• Added migration", "  AddCancellationStatus", "• Applying migration…"],
      },
      orders: { work: ["● Edit approval.ts +12 −3", "● Bash npm test", "  PASS 14 tests", "✻ Running full suite…"] },
      docs: {
        work: ["● Write approval.md", "● Bash npm run build", "✻ Building…"],
        done: ["● Bash npm run build", "  42 pages in 3.1 s", "● Done."],
      },
    };
    const LABEL = { work: "Working", perm: "Needs permission", done: "Done" };
    const BASE = { gateway: 72, orders: 123, docs: 340 }; // seconds already elapsed at the start
    const cards = {};
    for (const el of mc.querySelectorAll("[data-agent]")) cards[el.dataset.agent] = { el, since: 0, base: 0 };
    const sum = $("#mc-sum"), msg = $("#mc-msg"), wait = $("#mc-wait");
    let clock = 0; // demo time in ms; only advances while not paused

    const fmt = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
    function set(agent, state, lines) {
      const c = cards[agent];
      c.el.dataset.state = state;
      $(".chip", c.el).textContent = LABEL[state];
      $(".mc-out", c.el).textContent = lines.join("\n");
      c.base = state === "work" && c.base ? c.base : 0;
      c.since = clock;
    }
    function summary() {
      const states = Object.values(cards).map((c) => c.el.dataset.state);
      const n = (s) => states.filter((x) => x === s).length;
      const parts = [`${states.length} agents`];
      if (n("perm")) parts.push(`${n("perm")} needs you`);
      if (n("work")) parts.push(`${n("work")} working`);
      if (n("done")) parts.push(`${n("done")} done`);
      sum.textContent = parts.join(" · ");
    }
    function tickTimes() {
      for (const [id, c] of Object.entries(cards)) {
        const s = Math.floor((clock - c.since) / 1000) + c.base;
        $(".mc-t", c.el).textContent = fmt(s);
        if (id === "gateway" && c.el.dataset.state === "perm") wait.textContent = fmt(s);
      }
    }

    let resolved = false;
    function reset() {
      clock = 0;
      resolved = false;
      for (const b of mc.querySelectorAll(".mc-perm button")) b.classList.remove("picked");
      mc.dataset.perm = "closed";
      mc.dataset.snail = "work";
      for (const id of Object.keys(cards)) {
        set(id, "work", OUT[id].work);
        cards[id].base = BASE[id];
      }
      msg.textContent = "3 agents working";
      summary();
    }
    function ask() {
      set("gateway", "perm", OUT.gateway.perm);
      mc.dataset.perm = "open";
      mc.dataset.snail = "perm";
      msg.textContent = "gateway needs you: Codex CLI wants to run a command";
      summary();
    }
    function answer(button) {
      if (resolved || mc.dataset.perm !== "open") return;
      resolved = true;
      button.classList.add("picked");
      const done = () => {
        mc.dataset.perm = "closed";
        mc.dataset.snail = "work";
        set("gateway", "work", OUT.gateway.after);
        msg.textContent = `${button.dataset.answer} · gateway is working again`;
        summary();
      };
      still ? done() : setTimeout(done, 400);
    }
    function finish() {
      set("docs", "done", OUT.docs.done);
      mc.dataset.snail = "done";
      msg.textContent = "docs-site is done";
      summary();
    }
    for (const b of mc.querySelectorAll(".mc-perm button")) b.addEventListener("click", () => answer(b));

    reset();
    if (still) {
      // Reduced motion: the permission step as a still frame (the buttons still answer it).
      ask();
      tickTimes();
    } else {
      const STEPS = [
        [1500, ask],
        [4800, () => answer($(".mc-perm .primary", mc))],
        [6600, finish],
        [9200, reset],
      ];
      let next = 0, hover = false, visible = true, last = performance.now();
      mc.addEventListener("mouseenter", () => (hover = true));
      mc.addEventListener("mouseleave", () => (hover = false));
      mc.addEventListener("focusin", () => (hover = true));
      mc.addEventListener("focusout", () => (hover = false));
      new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(mc);
      setInterval(() => {
        const now = performance.now();
        const dt = now - last;
        last = now;
        if (hover || !visible || document.hidden) return;
        clock += dt;
        while (next < STEPS.length && clock >= STEPS[next][0]) {
          const [, fn] = STEPS[next];
          next = fn === reset ? 0 : next + 1;
          fn();
        }
        tickTimes();
      }, 250);
    }
  }

  /* ---- Ticker: a row changes state every few seconds ---- */
  const ticker = $("#ticker");
  if (ticker) {
    const rows = [...ticker.children];
    for (const r of rows) ticker.appendChild(r.cloneNode(true)); // a second copy for a seamless loop
    if (!still) {
      const NEXT = { work: ["done", "perm"], perm: ["work"], done: ["idle"], idle: ["work"] };
      const LABEL = { work: "Working", perm: "Needs you", done: "Done", idle: "Idle" };
      setInterval(() => {
        if (document.hidden || ticker.matches(":hover")) return;
        const i = Math.floor(Math.random() * rows.length);
        const opts = NEXT[rows[i].dataset.state];
        const state = opts[Math.floor(Math.random() * opts.length)];
        for (const r of [ticker.children[i], ticker.children[i + rows.length]]) {
          r.dataset.state = state;
          r.querySelector(".chip").textContent = LABEL[state];
          r.querySelector(".e").textContent = "0s";
        }
      }, 2800);
    }
  }

  /* ---- Kit: typed clipboard → result demo ---- */
  const typer = $("#typer");
  if (typer) {
    // [text, class, typed?, pause after (ms)]
    const SCRIPT = [
      ["# clipboard: eyJhbGciOiJIUzI1NiIsInR5cCI6…", "d", false, 700],
      ["Ctrl+Shift+K", "k", true, 250],
      ["  → JWT decode\n", "", false, 700],
      ["Enter", "k", true, 250],
      ["  → {\"sub\": \"1234567890\", …}\n", "", false, 350],
      ["# copied\n\n", "d", false, 900],
      ["$ echo 1700000000 | kotilo kit timestamp\n", "k", true, 400],
      ["2023-11-14 22:13:20 UTC", "", false, 2600],
    ];
    const span = (cls) => {
      const s = document.createElement("span");
      if (cls) s.className = cls;
      return s;
    };
    const caret = span("caret");
    const fixLine = (t) => (t.startsWith("# clipboard") ? t + "\n" : t);
    if (still) {
      for (const [t, cls] of SCRIPT) typer.appendChild(span(cls)).textContent = fixLine(t);
    } else {
      let paused = false;
      typer.closest(".product").addEventListener("mouseenter", () => (paused = true));
      typer.closest(".product").addEventListener("mouseleave", () => (paused = false));
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const waitPlay = async () => { while (paused || document.hidden) await sleep(200); };
      (async function run() {
        for (;;) {
          typer.textContent = "";
          typer.appendChild(caret);
          for (const [t, cls, typed, pause] of SCRIPT) {
            const s = typer.insertBefore(span(cls), caret);
            const text = fixLine(t);
            if (typed) {
              for (const ch of text) { await waitPlay(); s.textContent += ch; await sleep(38); }
            } else {
              await waitPlay();
              s.textContent = text;
            }
            await sleep(pause);
          }
        }
      })();
    }
  }

  /* ---- New Tab: the real time ---- */
  const ntTime = $("#nt-time"), ntDate = $("#nt-date");
  if (ntTime) {
    const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
    const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
    const paint = () => { const d = new Date(); ntTime.textContent = time.format(d); ntDate.textContent = date.format(d); };
    paint();
    setInterval(paint, 1000);
  }

  /* ---- Download button for the visitor's OS ---- */
  const buttons = document.querySelectorAll("[data-dl]");
  const ua = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "") + " " + navigator.userAgent;
  const os = /android|iphone|ipad/i.test(ua) ? "" : /win/i.test(ua) ? "windows" : /mac/i.test(ua) ? "macos" : /linux/i.test(ua) ? "linux" : "";
  const label = { windows: "Download for Windows", macos: "Download for macOS (preview)", linux: "Download for Linux" }[os];
  if (label) for (const b of buttons) b.textContent = label;
  if (os === "windows") for (const b of buttons) b.href = "https://github.com/kotilo-dev/kotilo/releases/latest";

  fetch("https://api.github.com/repos/kotilo-dev/kotilo/releases/latest")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(async (rel) => {
      for (const v of document.querySelectorAll("[data-version]")) v.textContent = rel.tag_name;
      if (os !== "windows") return;
      let arch = "x64";
      try {
        const hints = await navigator.userAgentData.getHighEntropyValues(["architecture"]);
        if (hints.architecture === "arm") arch = "arm64";
      } catch { /* not Chromium: x64 */ }
      const asset = rel.assets.find((a) => a.name.endsWith(`_${arch}-setup.exe`));
      if (asset) for (const b of buttons) b.href = asset.browser_download_url;
    })
    .catch(() => {});
})();
