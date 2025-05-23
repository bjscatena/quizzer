document.addEventListener('DOMContentLoaded', () => {
    const quizFileSelectorEl = document.getElementById('quiz-file-selector');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const errorMessageEl = document.getElementById('error-message');
    const loadingMessageEl = document.getElementById('loading-message');
    const quizAreaEl = document.getElementById('quiz-area');
    
    const chapterTitleEl = document.getElementById('chapter-title');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackAreaEl = document.getElementById('feedback-area');
    const feedbackTextEl = document.getElementById('feedback-text');
    const explanationTextEl = document.getElementById('explanation-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const scoreAreaEl = document.getElementById('score-area');
    const finalScoreEl = document.getElementById('final-score');
    const totalQuestionsAnsweredEl = document.getElementById('total-questions-answered');

    let allQuestions = []; 
    let currentSessionQuestions = []; 
    let currentQuestionIndex = 0;
    let score = 0;

    startQuizBtn.addEventListener('click', () => {
        const selectedFile = quizFileSelectorEl.value;
        errorMessageEl.textContent = '';
        
        if (!selectedFile) {
            errorMessageEl.textContent = "Por favor, selecione um quiz no menu.";
            return;
        }
        loadQuestions(selectedFile);
    });

    async function loadQuestions(filename) {
        quizAreaEl.style.display = 'none';
        loadingMessageEl.style.display = 'block';
        errorMessageEl.textContent = '';

        try {
            // Assume que o arquivo JSON está na mesma pasta ou em um caminho relativo
            // Para GitHub Pages, o caminho será relativo à raiz do repositório ou à pasta onde o HTML está.
            const response = await fetch(filename); 
            if (!response.ok) {
                throw new Error(`Não foi possível carregar o arquivo '${filename}'. Status: ${response.status}`);
            }
            const parsedQuestions = await response.json();
            
            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error(`Arquivo '${filename}' está vazio ou não é uma lista de perguntas válida.`);
            }
            
            allQuestions = parsedQuestions.filter(q => {
                const isValid = q && typeof q.chapter !== 'undefined' && q.question && Array.isArray(q.options) && q.options.length > 0 && typeof q.correct_index === 'number' && q.explanation;
                if (!isValid) {
                    console.warn("Pergunta malformada ignorada:", q);
                }
                return isValid;
            });

            if (allQuestions.length === 0) {
                 throw new Error(`Nenhuma pergunta válida encontrada no arquivo '${filename}'.`);
            }
            
            loadingMessageEl.style.display = 'none';
            quizAreaEl.style.display = 'block'; 
            startNewQuizSession();

        } catch (error) {
            loadingMessageEl.style.display = 'none';
            errorMessageEl.textContent = `Erro: ${error.message}`;
            allQuestions = [];
            console.error("Erro detalhado ao carregar/processar JSON:", error);
        }
    }

    function startNewQuizSession() {
        currentSessionQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
        currentQuestionIndex = 0;
        score = 0;
        
        scoreAreaEl.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        feedbackAreaEl.style.display = 'none';
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex < currentSessionQuestions.length) {
            const currentQuestion = currentSessionQuestions[currentQuestionIndex];
            chapterTitleEl.textContent = `Capítulo ${currentQuestion.chapter || 'N/A'}`;
            questionTextEl.textContent = currentQuestion.question;
            optionsContainerEl.innerHTML = ''; 

            currentQuestion.options.forEach((option, index) => {
                const button = document.createElement('button');
                const optionLetter = String.fromCharCode(65 + index);
                let cleanedOptionText = option;
                if (option.startsWith(optionLetter + ") ") || option.startsWith(optionLetter + ". ")) {
                    cleanedOptionText = option.substring(3);
                }
                button.textContent = `${optionLetter}) ${cleanedOptionText}`;
                button.onclick = () => handleAnswer(index, currentQuestion.correct_index, currentQuestion.explanation);
                optionsContainerEl.appendChild(button);
            });
            feedbackAreaEl.style.display = 'none';
            nextQuestionBtn.style.display = 'none';
        } else {
            showFinalScore();
        }
    }

    function handleAnswer(selectedIndex, correctIndex, explanation) {
        const buttons = optionsContainerEl.getElementsByTagName('button');
        
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
            if (i === correctIndex) {
                buttons[i].classList.add('correct');
            }
            if (i === selectedIndex && selectedIndex !== correctIndex) {
                buttons[i].classList.add('incorrect');
            }
        }

        if (selectedIndex === correctIndex) {
            score++;
            feedbackTextEl.textContent = "🎉 Correto!";
            feedbackAreaEl.className = 'feedback correct-feedback';
        } else {
            feedbackTextEl.textContent = "❌ Incorreto.";
            feedbackAreaEl.className = 'feedback incorrect-feedback';
        }
        explanationTextEl.innerHTML = `<strong>Explicação:</strong> ${explanation}`;
        feedbackAreaEl.style.display = 'block';
        nextQuestionBtn.style.display = 'block';
    }

    function nextQuestion() {
        currentQuestionIndex++;
        displayQuestion();
    }

    function showFinalScore() {
        chapterTitleEl.textContent = "Quiz Finalizado!";
        questionTextEl.textContent = `Você completou todas as ${currentSessionQuestions.length} perguntas.`;
        optionsContainerEl.innerHTML = '';
        feedbackAreaEl.style.display = 'none';
        nextQuestionBtn.style.display = 'none';

        finalScoreEl.textContent = score;
        totalQuestionsAnsweredEl.textContent = currentSessionQuestions.length;
        scoreAreaEl.style.display = 'block';
    }

    nextQuestionBtn.addEventListener('click', nextQuestion);

    // Prepara a interface inicial
    quizAreaEl.style.display = 'none'; 
    chapterTitleEl.textContent = "";
    questionTextEl.textContent = ""; // Limpa qualquer texto inicial
    loadingMessageEl.style.display = 'none';
    errorMessageEl.textContent = "Selecione um quiz no menu acima e clique em 'Iniciar Quiz'.";


});
