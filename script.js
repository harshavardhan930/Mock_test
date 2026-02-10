
let questions = [];
let examDuration = 0;
let timerInterval;
let negativeEnabled = false;
let negativeMark = 0;
let mySessionId = null;

// clear previous session data per tab
window.addEventListener("load", () => {
  sessionStorage.clear();
});

fetch("questions.json")
  .then(res => res.json())
  .then(data => questions = data);

function joinExam() {
  const name = document.getElementById("studentName").value.trim();
  if (name === "") {
    alert("Enter your name");
    return;
  }

  sessionStorage.setItem("studentName", name);
  document.getElementById("waitMsg").style.display = "block";

  const waitInterval = setInterval(() => {
    const hostSession = localStorage.getItem("examSessionId");

    if (
      localStorage.getItem("examStatus") === "started" &&
      hostSession &&
      hostSession !== mySessionId
    ) {
      mySessionId = hostSession;
      clearInterval(waitInterval);
      startExam();
    }
  }, 1000);
}

function startExam() {
  examDuration = parseInt(localStorage.getItem("examTime"));
  negativeEnabled = localStorage.getItem("negativeEnabled") === "true";
  negativeMark = parseFloat(localStorage.getItem("negativeMark")) || 0;

  document.getElementById("waitMsg").style.display = "none";
  document.getElementById("examArea").style.display = "block";

  loadQuestions();
  startTimer();
}

function loadQuestions() {
  const form = document.getElementById("quizForm");
  form.innerHTML = "";

  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.id = `qblock${i}`;

    let html = `<b>Q${i + 1}. ${q.question}</b><br>`;
    for (let opt in q.options) {
      html += `
        <label>
          <input type="radio" name="q${i}" value="${opt}">
          ${opt}) ${q.options[opt]}
        </label><br>`;
    }

    div.innerHTML = html;
    form.appendChild(div);
  });
}

function startTimer() {
  let time = examDuration;
  const timerDiv = document.getElementById("timer");

  timerInterval = setInterval(() => {
    const min = Math.floor(time / 60);
    const sec = time % 60;

    timerDiv.innerText =
      `⏱ Time Left: ${min}:${sec < 10 ? "0" : ""}${sec}`;

    time--;

    if (time < 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function submitQuiz() {
  clearInterval(timerInterval);

  let correct = 0;
  let negative = 0;

  const analysisDiv = document.getElementById("analysis");
  analysisDiv.innerHTML = "<h3>Wrong Answer Analysis</h3>";

  questions.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    const block = document.getElementById(`qblock${i}`);
    const ans = sel ? sel.value : null;

    if (ans === q.answer) {
      correct++;
      block.classList.add("correct");
    } else {
      block.classList.add("wrong");

      if (negativeEnabled && ans !== null) {
        negative += negativeMark;
      }

      const ua = ans ? `${ans}) ${q.options[ans]}` : "Not Answered";
      const ca = `${q.answer}) ${q.options[q.answer]}`;

      analysisDiv.innerHTML += `
        <div class="question">
          <b>Question:</b> ${q.question}<br>
          <b>Your Answer:</b> ${ua}<br>
          <b>Correct Answer:</b> ${ca}
        </div>`;
    }
  });

  let finalScore = correct - negative;
  if (finalScore < 0) finalScore = 0;

  document.getElementById("result").innerText =
    `Final Score: ${finalScore}`;

  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  results.push({
    name: sessionStorage.getItem("studentName"),
    correct,
    negative,
    final: finalScore
  });

  localStorage.setItem("quizResults", JSON.stringify(results));
}
