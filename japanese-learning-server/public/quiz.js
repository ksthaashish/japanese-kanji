let exampleItems = [];
let allKanjiList = [];
let selectedKanji = new Set();
let currentMode = 'meaning';
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
const totalQuestions = 10;

const loading = document.getElementById('loading');
const kanjiSelectionDiv = document.getElementById('kanji-selection');
const quizSetupDiv = document.getElementById('quiz-setup');
const quizContainerDiv = document.getElementById('quiz-container');
const errorDiv = document.getElementById('error');

async function loadQuiz() {
    try {
        const response = await fetch('/api/kanji');
        if (!response.ok) throw new Error('Failed to load');
        const allKanji = await response.json();

        allKanjiList = allKanji.map(k => ({ character: k.character, meaning: k.meaning }));

        allKanji.forEach(kanji => {
            kanji.examples.forEach(ex => {
                exampleItems.push({
                    parentKanji: kanji.character,
                    kanji: ex.kanji,
                    hiragana: ex.hiragana,
                    english: ex.english
                });
            });
        });

        loading.style.display = 'none';
        showKanjiSelection();
    } catch (error) {
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: ' + error.message;
    }
}

function showKanjiSelection() {
    kanjiSelectionDiv.style.display = 'block';
    const container = document.getElementById('kanji-checkboxes');
    container.innerHTML = '';

    allKanjiList.forEach(kanji => {
        const div = document.createElement('div');
        div.className = 'kanji-select-item';
        div.setAttribute('data-char', kanji.character);
        div.innerHTML = `<span class="kanji-char">${kanji.character}</span><span class="kanji-meaning">${kanji.meaning}</span>`;
        div.addEventListener('click', () => {
            if (selectedKanji.has(kanji.character)) {
                selectedKanji.delete(kanji.character);
                div.classList.remove('selected');
            } else {
                selectedKanji.add(kanji.character);
                div.classList.add('selected');
            }
        });
        container.appendChild(div);
    });

    document.getElementById('select-all-btn').addEventListener('click', () => {
        const items = document.querySelectorAll('.kanji-select-item');
        if (selectedKanji.size === allKanjiList.length) {
            selectedKanji.clear();
            items.forEach(item => item.classList.remove('selected'));
        } else {
            allKanjiList.forEach(k => selectedKanji.add(k.character));
            items.forEach(item => item.classList.add('selected'));
        }
    });

    document.getElementById('continue-to-mode').addEventListener('click', () => {
        if (selectedKanji.size === 0) {
            alert('Please select at least one kanji.');
            return;
        }
        kanjiSelectionDiv.style.display = 'none';
        quizSetupDiv.style.display = 'block';
    });
}

document.getElementById('start-quiz-btn').addEventListener('click', () => {
    const selected = document.querySelector('input[name="mode"]:checked');
    if (!selected) return;
    currentMode = selected.value;

    quizSetupDiv.style.display = 'none';
    quizContainerDiv.style.display = 'block';

    generateQuestions();
    displayQuestion();
});

document.getElementById('quit-btn').addEventListener('click', () => {
    location.reload();
});

function generateQuestions() {
    questions = [];
    const filteredExamples = exampleItems.filter(item => selectedKanji.has(item.parentKanji));
    if (filteredExamples.length === 0) return;
    const shuffled = [...filteredExamples].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(totalQuestions, shuffled.length); i++) {
        const item = shuffled[i];
        let question = { type: currentMode, item: item };

        if (currentMode === 'meaning') {
            question.questionText = item.kanji;
            question.correct = item.english;
            question.options = generateOptions(item.english, 'english', filteredExamples);
        } else if (currentMode === 'kanji2hira') {
            question.questionText = item.kanji;
            question.correct = item.hiragana;
            question.options = generateOptions(item.hiragana, 'hiragana', filteredExamples);
        } else if (currentMode === 'hira2kanji') {
            question.questionText = item.hiragana;
            question.correct = item.kanji;
            question.options = generateOptions(item.kanji, 'kanji', filteredExamples);
        }
        questions.push(question);
    }
}

function generateOptions(correctValue, field, pool) {
    const allValues = pool.map(item => item[field]);
    const uniqueValues = [...new Set(allValues)];
    const others = uniqueValues.filter(v => v !== correctValue);
    const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    while (distractors.length < 3) distractors.push('???');
    const options = [correctValue, ...distractors];
    return shuffleArray(options);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function displayQuestion() {
    const q = questions[currentQuestionIndex];
    document.getElementById('question-display').textContent = q.questionText;

    const promptEl = document.getElementById('prompt');
    if (currentMode === 'meaning') promptEl.textContent = 'What is the meaning?';
    else if (currentMode === 'kanji2hira') promptEl.textContent = 'What is the hiragana reading?';
    else if (currentMode === 'hira2kanji') promptEl.textContent = 'Which kanji matches this hiragana?';

    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = questions.length;
    const progress = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';

    const optionsDiv = document.getElementById('options-container');
    optionsDiv.innerHTML = '';
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => checkAnswer(opt, btn));
        optionsDiv.appendChild(btn);
    });

    document.getElementById('feedback').innerHTML = '';
    document.getElementById('next-btn').disabled = true;
}

function checkAnswer(selected, btn) {
    const q = questions[currentQuestionIndex];
    const isCorrect = (selected === q.correct);
    const feedbackDiv = document.getElementById('feedback');

    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    if (isCorrect) {
        score++;
        document.getElementById('score').textContent = score;
        btn.classList.add('correct');
        feedbackDiv.innerHTML = '✅ Correct!';
    } else {
        btn.classList.add('incorrect');
        document.querySelectorAll('.option-btn').forEach(b => {
            if (b.textContent === q.correct) b.classList.add('correct');
        });
        feedbackDiv.innerHTML = `❌ Wrong. The correct answer is: <strong>${q.correct}</strong>`;
    }

    document.getElementById('next-btn').disabled = false;
}

document.getElementById('next-btn').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        document.getElementById('progress-fill').style.width = '100%';
        const quizCard = document.querySelector('.quiz-card');
        quizCard.innerHTML = `
            <h2>Quiz Completed!</h2>
            <p class="final-score">Your score: ${score} / ${questions.length}</p>
            <button onclick="location.reload()" class="restart-btn">🔁 Restart Quiz</button>
            <a href="index.html" class="restart-btn">🏠 Back to Kanji List</a>
        `;
    }
});

document.addEventListener('DOMContentLoaded', loadQuiz);
