document.addEventListener('DOMContentLoaded', () => {
    const quizFileSelectorEl = document.getElementById('quiz-file-selector');
    const chapterSelectorContainerEl = document.getElementById('chapter-selector-container');
    const chapterSelectorEl = document.getElementById('chapter-selector');
    const startButtonContainerEl = document.getElementById('start-button-container');
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

    let allQuestionsFromFile = []; 
    let currentSessionQuestions = []; 
    let currentQuestionIndex = 0;
    let score = 0;

    // Event listener para o seletor de arquivo JSON
    quizFileSelectorEl.addEventListener('change', () => {
        const selectedFile = quizFileSelectorEl.value;
        errorMessageEl.textContent = ''; // Limpa mensagens de erro
        quizAreaEl.style.display = 'none'; // Esconde quiz anterior, se houver
        chapterSelectorContainerEl.style.display = 'none'; // Esconde seletor de capítulo
        startButtonContainerEl.style.display = 'none'; // Esconde botão de iniciar
        startQuizBtn.disabled = true; // Desabilita botão de iniciar

        if (selectedFile) {
            loadQuestions(selectedFile);
        } else {
            // Limpa o seletor de capítulos se nenhuma opção de quiz for selecionada
            chapterSelectorEl.innerHTML = '<option value="">-- Selecione o Capítulo --</option>';
            errorMessageEl.textContent = "Por favor, selecione um quiz no menu acima.";
        }
    });

    startQuizBtn.addEventListener('click', initiateQuizSession);

    async function loadQuestions(filename) {
        loadingMessageEl.style.display = 'block';
        errorMessageEl.textContent = '';

        try {
            const response = await fetch(filename); 
            if (!response.ok) {
                throw new Error(`Não foi possível carregar o arquivo '${filename}'. Verifique o nome e o caminho no repositório. Status: ${response.status}`);
            }
            const parsedQuestions = await response.json();
            
            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error(`Arquivo '${filename}' está vazio ou não é uma lista de perguntas válida.`);
            }
            
            allQuestionsFromFile = parsedQuestions.filter(q => {
                const isValid = q && typeof q.chapter !== 'undefined' && q.question && Array.isArray(q.options) && q.options.length > 0 && typeof q.correct_index === 'number' && q.explanation;
                if (!isValid) console.warn("Pergunta malformada ignorada:", q);
                return isValid;
            });

            if (allQuestionsFromFile.length === 0) {
                 throw new Error(`Nenhuma pergunta válida encontrada no arquivo '${filename}'.`);
            }
            
            populateChapterSelector(allQuestionsFromFile);
            chapterSelectorContainerEl.style.display = 'block';
            startButtonContainerEl.style.display = 'block';
            startQuizBtn.disabled = false; // Habilita o botão de iniciar
            loadingMessageEl.style.display = 'none';
            errorMessageEl.textContent = ""; // Limpa mensagem de erro se carregou bem

        } catch (error) {
            loadingMessageEl.style.display = 'none';
            errorMessageEl.textContent = `Erro ao carregar quiz: ${error.message}`;
            allQuestionsFromFile = [];
            chapterSelectorContainerEl.style.display = 'none'; // Esconde seletor de capítulo em caso de erro
            startButtonContainerEl.style.display = 'none'; // Esconde botão de iniciar
            console.error("Erro detalhado ao carregar/processar JSON:", error);
        }
    }

    function populateChapterSelector(questions) {
        chapterSelectorEl.innerHTML = ''; // Limpa opções antigas

        const defaultOption = document.createElement('option');
        defaultOption.value = "all";
        defaultOption.textContent = "Todos os Capítulos";
        chapterSelectorEl.appendChild(defaultOption);

        const chapters = [...new Set(questions.map(q => q.chapter))].sort((a, b) => {
            const numA = Number(a);
            const numB = Number(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return String(a).localeCompare(String(b)); // Ordenação alfanumérica para capítulos não numéricos
        });

        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = `Capítulo ${chapter}`;
            chapterSelectorEl.appendChild(option);
        });
    }

    function initiateQuizSession() {
        const selectedChapter = chapterSelectorEl.value;
        
        if (allQuestionsFromFile.length === 0) {
            errorMessageEl.textContent = "Nenhuma pergunta carregada. Selecione um quiz primeiro.";
            return;
        }
        if (!selectedChapter) {
            errorMessageEl.textContent = "Por favor, selecione um capítulo (ou 'Todos os Capítulos').";
            return;
        }

        if (selectedChapter === "all") {
            currentSessionQuestions = [...allQuestionsFromFile];
        } else {
            currentSessionQuestions = allQuestionsFromFile.filter(q => String(q.chapter) === String(selectedChapter));
        }
        
        if (currentSessionQuestions.length === 0) {
            errorMessageEl.textContent = `Nenhuma pergunta encontrada para o capítulo '${selectedChapter}'.`;
            quizAreaEl.style.display = 'none';
            return;
        }

        currentSessionQuestions.sort(() => Math.random() - 0.5);
        currentQuestionIndex = 0;
        score = 0;
        
        quizAreaEl.style.display = 'block';
        scoreAreaEl.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        feedbackAreaEl.style.display = 'none';
        errorMessageEl.textContent = ''; // Limpa mensagens de erro
        displayQuestion();
    }

    // Funções displayQuestion, handleAnswer, nextQuestion, showFinalScore permanecem as mesmas da versão anterior
    // Vou incluí-las aqui para o script ficar completo:

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

    // Estado inicial da interface
    quizAreaEl.style.display = 'none'; 
    chapterSelectorContainerEl.style.display = 'none';
    startButtonContainerEl.style.display = 'none'; // O botão só aparece depois que um arquivo é carregado e os capítulos populados
    loadingMessageEl.style.display = 'none';
    errorMessageEl.textContent = "Para começar, selecione um quiz no menu acima.";
});
