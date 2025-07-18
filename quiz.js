// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBuipITnagRRqOoDIwcap3pUqVzh0D-u_0",
  authDomain: "quiz-c31d9.firebaseapp.com",
  projectId: "quiz-c31d9",
  storageBucket: "quiz-c31d9.appspot.com",
  messagingSenderId: "346816706818",
  appId: "1:346816706818:web:dba0efe04b186ddc3bea1b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// App State
let allQuestions = {};
let currentCategory = "";
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 15;
let studentName = "";

// DOM Elements
const categoryScreen = document.getElementById("category-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const lastScoresEl = document.getElementById("last-scores");
const leaderboardEl = document.getElementById("leaderboard");
const timeEl = document.getElementById("time");
const nextBtn = document.getElementById("next-btn");

// 👤 Start Quiz after entering name
document.getElementById("startQuizBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("studentName").value.trim();
  if (!nameInput) {
    alert("Please enter your name.");
    return;
  }
  studentName = nameInput;
  document.getElementById("name-input-screen").classList.add("hide");
  categoryScreen.classList.remove("hide");
});

// Fetch Questions from JSON
fetch("questions.json")
  .then((res) => res.json())
  .then((data) => {
    allQuestions = data;
    renderCategories();
  })
  .catch((err) => console.error("Error loading questions:", err));

// Render Category Buttons
function renderCategories() {
  const container = document.createElement("div");
  container.id = "category-buttons";

  for (const category in allQuestions) {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.onclick = () => startQuiz(category);
    container.appendChild(btn);
  }

  categoryScreen.appendChild(container);
}

// Start Quiz
function startQuiz(category) {
  currentCategory = category;
  currentQuestionIndex = 0;
  score = 0;
  categoryScreen.classList.add("hide");
  quizScreen.classList.remove("hide");
  showQuestion();
}

// Show Current Question
function showQuestion() {
  const q = allQuestions[currentCategory][currentQuestionIndex];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";
  nextBtn.style.display = "none";
  timeLeft = 15;
  updateTimer();
  startTimer();

  const shuffled = shuffle([...q.options]);
  shuffled.forEach((opt) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.addEventListener("click", () => selectAnswer(opt, li));
    optionsEl.appendChild(li);
  });
}

// Shuffle Options
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Handle Answer
function selectAnswer(selected, clickedLi) {
  clearInterval(timerInterval);
  const correct = allQuestions[currentCategory][currentQuestionIndex].answer;

  Array.from(optionsEl.children).forEach((li) => {
    li.style.pointerEvents = "none";
    if (li.textContent === correct) {
      li.style.backgroundColor = "lightgreen";
    } else if (li === clickedLi) {
      li.style.backgroundColor = "salmon";
    }
  });

  if (selected === correct) score++;
  nextBtn.style.display = "block";
}

// Next Button
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < allQuestions[currentCategory].length) {
    showQuestion();
  } else {
    finishQuiz();
  }
});

// Show Results
function finishQuiz() {
  quizScreen.classList.add("hide");
  resultScreen.classList.remove("hide");
  scoreEl.textContent = `${score} / ${allQuestions[currentCategory].length}`;
  document.getElementById("result-category").textContent = `Category: ${currentCategory}`;
  saveScoreToLocalAndOnline();
  displayLocalScores();
  loadLeaderboard();
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      selectAnswer("none", null); // treat as wrong
    }
  }, 1000);
}

function updateTimer() {
  timeEl.textContent = timeLeft;
}

// Save Score to LocalStorage + Firestore
function saveScoreToLocalAndOnline() {
  let local = JSON.parse(localStorage.getItem("quizScores")) || {};
  if (!local[currentCategory]) local[currentCategory] = [];
  local[currentCategory].push(score);
  if (local[currentCategory].length > 5) local[currentCategory].shift(); // keep last 5
  localStorage.setItem("quizScores", JSON.stringify(local));

  // Save to Firestore
  addDoc(collection(db, "scores"), {
    name: studentName,
    category: currentCategory,
    score: score,
    timestamp: new Date()
  }).catch((err) => console.error("Error saving score to Firestore:", err));
}

// Display Last Scores
function displayLocalScores() {
  const scores = JSON.parse(localStorage.getItem("quizScores")) || {};
  const recent = scores[currentCategory] || [];
  lastScoresEl.innerHTML = recent.map(s => `<li>${s}</li>`).join("");
}

// Leaderboard
async function loadLeaderboard() {
  leaderboardEl.innerHTML = "Loading...";
  const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(5));
  const snapshot = await getDocs(q);

  leaderboardEl.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    leaderboardEl.innerHTML += `<li>${data.name} - ${data.score} (${data.category})</li>`;
  });
}
