(() => {
  "use strict";

  const CONFIG = Object.assign({
    studyId: "visual-reasoning-seven-item-demo",
    dataEndpoint: "",
    completionUrl: "",
    showDownloadButtons: true,
    shuffleTasks: true,
    shuffleChoices: true
  }, window.EXPERIMENT_CONFIG || {});

  // Answer digests are SHA-256(salt + ':' + normalized response). This keeps
  // ordinary page inspection from displaying an answer key. As with any
  // client-only study, it is tamper-resistant rather than secret.
  const TASKS = [
    {
      id: "modified-muller-lyer",
      image: "assets/modified-muller-lyer.png",
      question: "Which is longer, the blue line or the red line?",
      choices: ["Blue Line", "Red Line", "NONE (they are the same size)"],
      salt: "ml-7f2",
      digest: "1a153ea809dc4b1c02131a6df61de4b73731ecf6b208a40b40883e63b5bdad06"
    },
    {
      id: "modified-cafe-wall",
      image: "assets/modified-cafe-wall.png",
      question: "Are all the gray lines PERFECTLY STRAIGHT / HORIZONTAL or SLANTED / DIAGONAL?",
      choices: ["Straight / Horizontal", "Slanted / Diagonal"],
      salt: "cw-3ad",
      digest: "34e17d7da58632b69822725e2e7cec4e8d372015bce21b58c033518fd298359b"
    },
    {
      id: "modified-ebbinghaus",
      image: "assets/modified-ebbinghaus.jpg",
      question: "Which is bigger, the blue circle or the red circle?",
      choices: ["Blue Circle", "Red Circle", "NONE (they are the same size)"],
      salt: "eb-91c",
      digest: "2fe0b1fb1e36063dd05b25381c7587fa0a384877055271720ceaf7283c2f9fa5"
    },
    {
      id: "moving-robot",
      image: "assets/moving-robot.png",
      question: "Across each step, the robot moves with the same speed and trajectory. Where is it most likely that the robot will be located on Step 4?",
      choices: [
        "Mostly on the bottom right", "Mostly on the bottom left",
        "Mostly on the upper right", "Mostly on the upper left",
        "Mostly around the center of the square", "Off-screen (outside the square)"
      ],
      salt: "mr-52e",
      digest: "875f71a7da2abc3e9486f2316a62cddc6f93e0646aff4521289c115255ea31b4"
    },
    {
      id: "colliding-oranges",
      image: "assets/colliding-oranges.png",
      question: "The largest circle will move straight to the left towards the smallest circle. What are the objects in the way, if any?",
      choices: ["Green Triangle", "Other object combinations"],
      salt: "co-28b",
      digest: "d2f601ea4de7b58befda8f13d924ed32944c855e645a16874ea186114b59bce2"
    },
    {
      id: "surrounded-planets",
      image: "assets/surrounded-planets.png",
      question: "Each planet is surrounded by several shapes. Five planets have 5 shapes surrounding them. One planet has 4 shapes. What color is the planet that has only 4 shapes?",
      choices: ["Orange", "Purple", "Blue", "Red", "Green", "Gray"],
      salt: "sp-84d",
      digest: "78baa8ae52a7aff8696df4d9548bb7ff67a296f66bd263dc8f5133929c2f63a1"
    },
    {
      id: "shape-overload",
      image: "assets/shape-overload.png",
      question: "One of these shape types appears in more different colors than the other three. First, identify which shape appears with most colors. Then, count how many of those shapes are in the image.",
      input: "number",
      salt: "so-19a",
      digest: "622f0edf1662ea63f1d1dc1fb06e3246402b2247dce28e3a7c059227017898e1"
    }
  ];

  const app = document.querySelector("#app");
  const progressWrap = document.querySelector("#progressWrap");
  const progressText = document.querySelector("#progressText");
  const progressBar = document.querySelector("#progressBar");
  const params = new URLSearchParams(location.search);
  const state = {
    participantId: params.get("pid") || createId(),
    sessionId: createId(),
    startedAt: null,
    trialStartedAt: null,
    order: [],
    index: 0,
    responses: [],
    submitting: false
  };

  function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    });
  }

  function shuffle(values) {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const n = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
      const j = Math.floor(n * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[ch]);
  }

  function normalize(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().match(/[a-z0-9]+/g)?.join(" ") || "";
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  }

  function focusMain() {
    requestAnimationFrame(() => app.focus({ preventScroll: true }));
  }

  function showWelcome() {
    progressWrap.hidden = true;
    app.innerHTML = `
      <section class="panel welcome-panel">
        <p class="eyebrow">Seven-item demonstration</p>
        <h1>Visual reasoning study</h1>
        <p class="lede">You will see seven images and answer one question about each. Work carefully, but rely on your own first judgment.</p>
        <div class="info-grid">
          <div><strong>About 3–5 minutes</strong><span>Complete in one sitting</span></div>
          <div><strong>No feedback during tasks</strong><span>This avoids influencing later answers</span></div>
          <div><strong>Local by default</strong><span>Responses stay in this browser unless configured otherwise</span></div>
        </div>
        <form id="consentForm" class="consent-box">
          <label class="check-row">
            <input id="consent" type="checkbox" required>
            <span>I am at least 18 years old, understand that my choices and response times will be recorded for this demonstration, and consent to continue.</span>
          </label>
          <button class="primary" type="submit">Begin study <span aria-hidden="true">→</span></button>
        </form>
      </section>`;
    document.querySelector("#consentForm").addEventListener("submit", event => {
      event.preventDefault();
      if (!document.querySelector("#consent").checked) return;
      state.startedAt = new Date().toISOString();
      state.order = CONFIG.shuffleTasks ? shuffle(TASKS) : TASKS.slice();
      state.index = 0;
      state.responses = [];
      showTrial();
    });
    focusMain();
  }

  function updateProgress() {
    progressWrap.hidden = false;
    progressText.textContent = `Item ${state.index + 1} of ${state.order.length}`;
    progressBar.style.width = `${((state.index + 1) / state.order.length) * 100}%`;
  }

  function showTrial() {
    updateProgress();
    const task = state.order[state.index];
    const choices = task.choices && CONFIG.shuffleChoices ? shuffle(task.choices) : task.choices;
    const response = task.input === "number"
      ? `<form id="numberForm" class="number-form">
           <label for="numericAnswer">Your answer</label>
           <div class="number-row">
             <input id="numericAnswer" name="answer" type="number" inputmode="numeric" min="0" max="99" required autocomplete="off">
             <button class="primary" type="submit">Continue <span aria-hidden="true">→</span></button>
           </div>
         </form>`
      : `<div class="choices" role="group" aria-label="Response options">
           ${choices.map(choice => `<button class="choice" type="button" data-response="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("")}
         </div>`;

    app.innerHTML = `
      <section class="trial" data-trap-id="${escapeHtml(task.id)}">
        <div class="stimulus-wrap">
          <img class="stimulus" src="${escapeHtml(task.image)}" alt="Visual reasoning stimulus" draggable="false">
        </div>
        <div class="question-card">
          <p class="item-label">Visual item ${state.index + 1}</p>
          <h1>${escapeHtml(task.question)}</h1>
          ${response}
          <p id="responseError" class="error" role="alert" hidden>Please provide a response.</p>
        </div>
      </section>`;

    state.trialStartedAt = performance.now();
    if (task.input === "number") {
      document.querySelector("#numberForm").addEventListener("submit", event => {
        event.preventDefault();
        const input = document.querySelector("#numericAnswer");
        if (!input.value.trim()) {
          document.querySelector("#responseError").hidden = false;
          input.focus();
          return;
        }
        recordResponse(task, input.value.trim());
      });
      document.querySelector("#numericAnswer").focus();
    } else {
      document.querySelectorAll(".choice").forEach(button => {
        button.addEventListener("click", () => recordResponse(task, button.dataset.response));
      });
      document.querySelector(".choice")?.focus();
    }
  }

  async function recordResponse(task, response) {
    if (state.submitting) return;
    state.submitting = true;
    document.querySelectorAll("button, input").forEach(el => { el.disabled = true; });
    const rtMs = Math.round(performance.now() - state.trialStartedAt);
    const digest = await sha256(`${task.salt}:${normalize(response)}`);
    state.responses.push({
      trialIndex: state.index + 1,
      trapId: task.id,
      response,
      correct: digest === task.digest,
      rtMs,
      presentedAt: new Date(Date.now() - rtMs).toISOString(),
      answeredAt: new Date().toISOString()
    });
    state.index += 1;
    state.submitting = false;
    if (state.index < state.order.length) {
      app.innerHTML = `<section class="transition" aria-label="Next item"><span></span></section>`;
      setTimeout(showTrial, 350);
    } else {
      await finishStudy();
    }
  }

  function payload() {
    return {
      schemaVersion: 1,
      studyId: CONFIG.studyId,
      participantId: state.participantId,
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      taskOrder: state.order.map(task => task.id),
      score: state.responses.filter(row => row.correct).length,
      possibleScore: state.responses.length,
      responses: state.responses,
      context: {
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: { width: innerWidth, height: innerHeight }
      }
    };
  }

  async function finishStudy() {
    progressWrap.hidden = true;
    const data = payload();
    let uploadStatus = "Results are stored in this browser only.";
    if (CONFIG.dataEndpoint) {
      uploadStatus = "Submitting responses…";
      try {
        const response = await fetch(CONFIG.dataEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          keepalive: true
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        uploadStatus = "Responses submitted successfully.";
      } catch (error) {
        uploadStatus = "Submission could not be completed. Please download the results and contact the researcher.";
      }
    }

    app.innerHTML = `
      <section class="panel finish-panel">
        <div class="complete-icon" aria-hidden="true">✓</div>
        <p class="eyebrow">Study complete</p>
        <h1>Thank you for taking part.</h1>
        <p class="lede">Your seven responses have been recorded. ${escapeHtml(uploadStatus)}</p>
        <div id="downloadActions" class="finish-actions" ${CONFIG.showDownloadButtons ? "" : "hidden"}>
          <button id="downloadCsv" class="primary" type="button">Download CSV</button>
          <button id="downloadJson" class="secondary" type="button">Download JSON</button>
        </div>
        <details class="debrief">
          <summary>Read the study debrief</summary>
          <div>
            <h2>What was this study testing?</h2>
            <p>These images are cognitive traps: visual tasks designed to compare human perception with the behavior of vision-language models and autonomous software. The purpose was described generally at the beginning so that awareness of the screening goal would not change how the items were answered.</p>
            <p>This demonstration does not make a reliable human-versus-automation judgment about an individual. In research, these items should be combined with informed consent, a preregistered scoring rule, privacy safeguards, and appropriate ethics review.</p>
          </div>
        </details>
        ${CONFIG.completionUrl ? `<a class="completion-link" href="${escapeHtml(CONFIG.completionUrl)}">Continue to completion page →</a>` : ""}
      </section>`;

    if (CONFIG.showDownloadButtons) {
      document.querySelector("#downloadCsv").addEventListener("click", () => downloadCsv(data));
      document.querySelector("#downloadJson").addEventListener("click", () => downloadFile(
        `visual-reasoning-${state.sessionId}.json`, JSON.stringify(data, null, 2), "application/json"
      ));
    }
    focusMain();
  }

  function downloadCsv(data) {
    const columns = ["participant_id", "session_id", "trial_index", "trap_id", "response", "correct", "rt_ms", "presented_at", "answered_at"];
    const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = data.responses.map(row => [
      data.participantId, data.sessionId, row.trialIndex, row.trapId,
      row.response, row.correct, row.rtMs, row.presentedAt, row.answeredAt
    ]);
    const csv = [columns, ...rows].map(row => row.map(quote).join(",")).join("\r\n");
    downloadFile(`visual-reasoning-${state.sessionId}.csv`, csv, "text/csv;charset=utf-8");
  }

  function downloadFile(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  showWelcome();
})();
