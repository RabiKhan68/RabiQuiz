let allQuestions = {};
let currentCategory = "";
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 15;

const categoryScreen = document.getElementById("category-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const lastScoresEl = document.getElementById("last-scores");
const timeEl = document.getElementById("time");
const nextBtn = document.getElementById("next-btn");

nextBtn.addEventListener("click", nextQuestion);

// Fetch questions from local JSON or API
async function fetchQuestions() {
  const response = await fetch("questions.json");
  const data = await response.json();
  allQuestions = data;
  showCategories();
}

function showCategories() {
  categoryScreen.innerHTML = "<h1>Select a Category</h1>";
  for (const category in allQuestions) {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.onclick = () => startQuiz(category);
    categoryScreen.appendChild(btn);
  }
}

function startQuiz(category) {
  currentCategory = category;
  currentQuestionIndex = 0;
  score = 0;
  categoryScreen.classList.add("hide");
  quizScreen.classList.remove("hide");
  showQuestion();
}

function showQuestion() {
  const currentQuestion = allQuestions[currentCategory][currentQuestionIndex];
  questionEl.textContent = currentQuestion.question;
  optionsEl.innerHTML = "";
  nextBtn.style.display = "none";
  timeLeft = 15;
  updateTimer();
  startTimer();

  currentQuestion.options.forEach(option => {
    const li = document.createElement("li");
    li.textContent = option;
    li.addEventListener("click", () => selectAnswer(option));
    optionsEl.appendChild(li);
  });
}

function selectAnswer(selected) {
  clearInterval(timerInterval);
  const correct = allQuestions[currentCategory][currentQuestionIndex].answer;

  Array.from(optionsEl.children).forEach(li => {
    li.style.pointerEvents = "none";
    if (li.textContent === correct) {
      li.style.backgroundColor = "lightgreen";
    } else if (selected !== "none" && li.textContent === selected) {
      li.style.backgroundColor = "salmon";
    }
  });

  if (selected === correct) score++;
  nextBtn.style.display = "block";
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < allQuestions[currentCategory].length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  quizScreen.classList.add("hide");
  resultScreen.classList.remove("hide");
  scoreEl.textContent = `${score} / ${allQuestions[currentCategory].length}`;
  document.getElementById("result-category").textContent = `Category: ${currentCategory}`; // ✅ Added
  saveScore(currentCategory, score);
  displayLastScores();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      selectAnswer("none");
    }
  }, 1000);
}

function updateTimer() {
  timeEl.textContent = timeLeft;
}

function saveScore(category, score) {
  let scores = JSON.parse(localStorage.getItem("quizScores")) || {};
  if (!scores[category]) scores[category] = [];
  scores[category].push(score);
  if (scores[category].length > 5) scores[category].shift(); // keep last 5
  localStorage.setItem("quizScores", JSON.stringify(scores));
}

function displayLastScores() {
  const scores = JSON.parse(localStorage.getItem("quizScores")) || {};
  const last = scores[currentCategory] || [];
  lastScoresEl.innerHTML = last.map(s => `<li>${s}</li>`).join("");
}

// ✅ Initial call to load everything
fetchQuestions();
