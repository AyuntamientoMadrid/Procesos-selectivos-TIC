/**
 * Core Quiz Engine for Ayuntamiento de Madrid TIC Exam Practice App
 */

class QuizEngine {
    constructor(examData, examType) {
        this.data = examData;
        this.examType = examType; // 'teorica' or 'practica'
        this.storageKey = `tic_madrid_${examType}_state`;
        this.historyKey = `tic_madrid_history`;

        this.currentQuestionIndex = 0;
        this.answers = {}; // questionId -> optionKey ('a','b','c')
        this.flagged = new Set(); // questionIds flagged for review
        this.mode = 'exam'; // 'exam' or 'practice'
        this.checkedQuestions = new Set(); // in practice mode, questions checked for instant feedback

        this.timeRemaining = examData.timeMinutes * 60;
        this.timerInterval = null;
        this.isPaused = false;
        this.isSubmitted = false;
        this.results = null;

        this.init();
    }

    init() {
        this.loadState();
        this.setupDOM();
        this.bindEvents();
        this.renderQuestion();
        this.renderGrid();
        this.updateProgress();

        if (!this.isSubmitted) {
            this.startTimer();
        } else {
            this.showResultsScreen();
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.answers = parsed.answers || {};
                this.flagged = new Set(parsed.flagged || []);
                this.currentQuestionIndex = parsed.currentQuestionIndex || 0;
                this.timeRemaining = typeof parsed.timeRemaining === 'number' ? parsed.timeRemaining : this.timeRemaining;
                this.isSubmitted = !!parsed.isSubmitted;
                this.mode = parsed.mode || 'exam';
                this.results = parsed.results || null;
            }
        } catch (e) {
            console.error("Error loading state from localStorage", e);
        }
    }

    saveState() {
        try {
            const state = {
                answers: this.answers,
                flagged: Array.from(this.flagged),
                currentQuestionIndex: this.currentQuestionIndex,
                timeRemaining: this.timeRemaining,
                isSubmitted: this.isSubmitted,
                mode: this.mode,
                results: this.results,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) {
            console.error("Error saving state to localStorage", e);
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            if (this.isPaused || this.isSubmitted) return;

            if (this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateTimerDisplay();
                if (this.timeRemaining % 5 === 0) {
                    this.saveState();
                }
            } else {
                clearInterval(this.timerInterval);
                this.autoSubmit();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer-display');
        const badgeEl = document.getElementById('timer-badge');
        if (!timerEl) return;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        timerEl.textContent = formatted;

        if (badgeEl) {
            if (this.timeRemaining < 300 && !this.isSubmitted) { // under 5 mins
                badgeEl.classList.add('bg-danger', 'pulse-alert');
                badgeEl.classList.remove('bg-primary', 'bg-warning');
            } else if (this.isPaused) {
                badgeEl.classList.add('bg-warning');
                badgeEl.classList.remove('bg-primary', 'bg-danger', 'pulse-alert');
            } else {
                badgeEl.classList.add('bg-primary');
                badgeEl.classList.remove('bg-danger', 'bg-warning', 'pulse-alert');
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('btn-pause');
        if (btn) {
            btn.innerHTML = this.isPaused ? '▶️ Reanudar' : '⏸️ Pausar';
            btn.classList.toggle('btn-warning', this.isPaused);
            btn.classList.toggle('text-dark', this.isPaused);
            btn.classList.toggle('btn-outline-light', !this.isPaused);
            btn.classList.remove('btn-outline-secondary');
            btn.setAttribute('aria-label', this.isPaused ? 'Reanudar el examen' : 'Pausar el examen');
        }
        this.updateTimerDisplay();
    }

    setupDOM() {
        document.getElementById('exam-title').textContent = this.data.title;
        document.getElementById('exam-subtitle').textContent = `Convocatoria: ${this.data.date} • ${this.data.totalQuestions} Preguntas • ${this.data.timeMinutes} Minutos`;

        // Render Scenario if available (Practical exam)
        const scenarioContainer = document.getElementById('scenario-container');
        if (scenarioContainer && this.data.scenario) {
            scenarioContainer.innerHTML = `
                <div class="card mb-4 shadow-sm scenario-card">
                    <div class="card-header bg-azul-madrid text-white fw-bold d-flex justify-content-between align-items-center py-2 px-3">
                        <span class="d-flex align-items-center gap-2 fs-6">📋 Supuesto Práctico Oficial</span>
                        <button class="btn btn-sm btn-outline-light fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#scenario-body" aria-expanded="true" aria-controls="scenario-body">
                            Mostrar / Ocultar Texto
                        </button>
                    </div>
                    <div class="collapse show" id="scenario-body">
                        <div class="card-body bg-white text-dark scenario-text p-4">
                            ${this.data.scenario.replace(/\n\n/g, '<br><br>')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('btn-prev').addEventListener('click', () => this.prevQuestion());
        document.getElementById('btn-next').addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-flag').addEventListener('click', () => this.toggleFlag());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearAnswer());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());

        // Submit button
        document.getElementById('btn-submit').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas finalizar el examen y ver los resultados?')) {
                this.submitExam();
            }
        });

        // Mode switch
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) {
            modeSelect.value = this.mode;
            modeSelect.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.saveState();
                this.renderQuestion();
            });
        }

        // Filter results buttons
        document.querySelectorAll('.btn-filter-result').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-filter-result').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderReviewList(e.target.dataset.filter);
            });
        });

        // Restart test
        const handleRestart = () => {
            if (confirm('¿Deseas reiniciar este examen desde el principio? Se borrarán todas las respuestas y resultados guardados.')) {
                this.resetExam();
            }
        };

        document.getElementById('btn-restart')?.addEventListener('click', handleRestart);
        document.getElementById('btn-restart-header')?.addEventListener('click', handleRestart);
    }

    renderQuestion() {
        const q = this.data.questions[this.currentQuestionIndex];
        if (!q) return;

        const container = document.getElementById('question-card');
        const isFlagged = this.flagged.has(q.id);
        const selectedOpt = this.answers[q.id];
        const isChecked = this.checkedQuestions.has(q.id);

        let optionsHTML = '';
        const keys = ['a', 'b', 'c'];

        keys.forEach(key => {
            if (!q.options[key]) return;

            let optionClass = 'option-item';
            let badgeHTML = '';

            if (selectedOpt === key) {
                optionClass += ' selected';
            }

            // Practice mode or post-submission feedback
            if (this.isSubmitted || (this.mode === 'practice' && isChecked)) {
                if (key === q.correct) {
                    optionClass += ' correct-option';
                    badgeHTML = '<span class="badge bg-success ms-2">✓ Respuesta Correcta</span>';
                } else if (selectedOpt === key && key !== q.correct) {
                    optionClass += ' incorrect-option';
                    badgeHTML = '<span class="badge bg-danger ms-2">✗ Tu Selección</span>';
                }
            }

            const disabledAttr = this.isSubmitted ? 'disabled' : '';

            optionsHTML += `
                <div class="${optionClass} p-3 mb-2 rounded border" onclick="quiz.selectOption('${key}')">
                    <div class="form-check d-flex align-items-start">
                        <input class="form-check-input me-3 mt-1" type="radio" name="q_${q.id}" id="opt_${q.id}_${key}" 
                               value="${key}" ${selectedOpt === key ? 'checked' : ''} ${disabledAttr} onchange="quiz.selectOption('${key}')">
                        <label class="form-check-label flex-grow-1 cursor-pointer" for="opt_${q.id}_${key}">
                            <strong class="text-primary me-1">${key.toUpperCase()})</strong> ${this.escapeHTML(q.options[key])} ${badgeHTML}
                        </label>
                    </div>
                </div>
            `;
        });

        let instantCheckBtn = '';
        if (this.mode === 'practice' && !this.isSubmitted && selectedOpt) {
            instantCheckBtn = `
                <button class="btn btn-outline-info btn-sm mt-2" onclick="quiz.checkInstantAnswer()">
                    ${isChecked ? '🔄 Ocultar solución' : '💡 Comprobar Respuesta'}
                </button>
            `;
        }

        container.innerHTML = `
            <fieldset class="border-0 p-0 m-0">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge bg-dark fs-6" aria-label="Pregunta ${q.id} de un total de ${this.data.totalQuestions}">Pregunta ${q.id} de ${this.data.totalQuestions}</span>
                    <div>
                        <button id="btn-flag-inner" class="btn btn-sm ${isFlagged ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning'}" onclick="quiz.toggleFlag()" aria-pressed="${isFlagged}">
                            ${isFlagged ? '🚩 Marcada para revisión' : '🏳️ Marcar duda'}
                        </button>
                    </div>
                </div>
                <legend class="h5 question-text fw-bold mb-4 text-dark" id="q_legend_${q.id}">${q.id}. ${this.escapeHTML(q.question)}</legend>
                <div class="options-group" role="radiogroup" aria-labelledby="q_legend_${q.id}">${optionsHTML}</div>
                ${instantCheckBtn}
            </fieldset>
        `;

        // Update nav buttons state
        document.getElementById('btn-prev').disabled = this.currentQuestionIndex === 0;
        document.getElementById('btn-next').disabled = this.currentQuestionIndex === this.data.totalQuestions - 1;
        document.getElementById('btn-flag').className = `btn btn-sm ${isFlagged ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning'}`;
        document.getElementById('btn-flag').textContent = isFlagged ? '🚩 Desmarcar' : '🏳️ Marcar';
        document.getElementById('btn-flag').setAttribute('aria-pressed', isFlagged.toString());

        this.renderGrid();
        this.updateProgress();
    }

    selectOption(key) {
        if (this.isSubmitted) return;
        const q = this.data.questions[this.currentQuestionIndex];
        this.answers[q.id] = key;
        this.saveState();
        this.renderQuestion();
    }

    clearAnswer() {
        if (this.isSubmitted) return;
        const q = this.data.questions[this.currentQuestionIndex];
        delete this.answers[q.id];
        this.checkedQuestions.delete(q.id);
        this.saveState();
        this.renderQuestion();
    }

    toggleFlag() {
        const q = this.data.questions[this.currentQuestionIndex];
        if (this.flagged.has(q.id)) {
            this.flagged.delete(q.id);
        } else {
            this.flagged.add(q.id);
        }
        this.saveState();
        this.renderQuestion();
    }

    checkInstantAnswer() {
        const q = this.data.questions[this.currentQuestionIndex];
        if (this.checkedQuestions.has(q.id)) {
            this.checkedQuestions.delete(q.id);
        } else {
            this.checkedQuestions.add(q.id);
        }
        this.renderQuestion();
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.data.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.saveState();
            this.renderQuestion();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.saveState();
            this.renderQuestion();
        }
    }

    jumpToQuestion(index) {
        this.currentQuestionIndex = index;
        this.saveState();
        this.renderQuestion();
    }

    renderGrid() {
        const grid = document.getElementById('question-grid');
        if (!grid) return;

        let html = '';
        this.data.questions.forEach((q, idx) => {
            const isCurrent = idx === this.currentQuestionIndex;
            const isAnswered = !!this.answers[q.id];
            const isFlagged = this.flagged.has(q.id);

            let btnClass = 'grid-btn btn-outline-secondary';
            let statusLabel = '';

            if (this.isSubmitted) {
                const userAns = this.answers[q.id];
                if (!userAns) {
                    btnClass = 'grid-btn btn-secondary'; // Blank
                    statusLabel = 'No contestada';
                } else if (userAns === q.correct) {
                    btnClass = 'grid-btn btn-success'; // Correct
                    statusLabel = 'Correcta';
                } else {
                    btnClass = 'grid-btn btn-danger'; // Wrong
                    statusLabel = 'Incorrecta';
                }
            } else {
                if (isAnswered) {
                    btnClass = 'grid-btn btn-primary';
                    statusLabel = 'Respondida';
                } else {
                    statusLabel = 'Sin responder';
                }
                if (isFlagged) {
                    btnClass = 'grid-btn btn-warning text-dark fw-bold';
                    statusLabel += ', marcada para revisión';
                }
            }

            if (isCurrent) {
                btnClass += ' border-3 border-dark active-grid';
                statusLabel += ', actual';
            }

            html += `
                <button class="btn btn-sm ${btnClass} position-relative m-1" 
                        onclick="quiz.jumpToQuestion(${idx})" 
                        aria-label="Pregunta ${q.id}: ${statusLabel}"
                        aria-current="${isCurrent ? 'true' : 'false'}">
                    ${q.id}
                    ${isFlagged && !this.isSubmitted ? '<span class="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle" aria-hidden="true"></span>' : ''}
                </button>
            `;
        });

        grid.innerHTML = html;
    }

    updateProgress() {
        const answeredCount = Object.keys(this.answers).length;
        const total = this.data.totalQuestions;
        const percent = Math.round((answeredCount / total) * 100);

        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
        }
        if (progressText) progressText.textContent = `${answeredCount} de ${total} respondidas (${percent}%)`;
    }

    autoSubmit() {
        alert('⏰ El tiempo oficial ha finalizado. Se procederá a corregir el examen.');
        this.submitExam();
    }

    submitExam() {
        this.isSubmitted = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Calculate score
        let correctCount = 0;
        let incorrectCount = 0;
        let blankCount = 0;

        this.data.questions.forEach(q => {
            const userAns = this.answers[q.id];
            if (!userAns) {
                blankCount++;
            } else if (userAns === q.correct) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const total = this.data.totalQuestions;
        // Official formula: 1 point per correct answer, -0.33 penalty per error
        const netPoints = Math.max(0, correctCount - (incorrectCount * 0.333333));
        const finalGrade = ((netPoints / total) * 10).toFixed(2);

        this.results = {
            correctCount,
            incorrectCount,
            blankCount,
            total,
            netPoints: netPoints.toFixed(2),
            finalGrade,
            timeSpentSeconds: (this.data.timeMinutes * 60) - this.timeRemaining,
            dateCompleted: new Date().toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
        };

        this.saveState();
        this.saveToHistory();
        this.showResultsScreen();
    }

    saveToHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
            history.unshift({
                examType: this.examType,
                title: this.data.title,
                grade: this.results.finalGrade,
                correct: this.results.correctCount,
                incorrect: this.results.incorrectCount,
                blank: this.results.blankCount,
                date: this.results.dateCompleted
            });
            localStorage.setItem(this.historyKey, JSON.stringify(history.slice(0, 20))); // Keep last 20
        } catch (e) {
            console.error("Error saving history", e);
        }
    }

    showResultsScreen() {
        const resultsModal = document.getElementById('results-section');
        if (!resultsModal) return;

        resultsModal.classList.remove('d-none');
        document.getElementById('res-grade').textContent = `${this.results.finalGrade} / 10`;

        document.getElementById('res-correct').textContent = this.results.correctCount;
        document.getElementById('res-incorrect').textContent = this.results.incorrectCount;
        document.getElementById('res-blank').textContent = this.results.blankCount;
        document.getElementById('res-net-points').textContent = `${this.results.netPoints} / ${this.results.total}`;

        this.renderQuestion(); // re-render question view with correction badges
        this.renderReviewList('all');
    }

    renderReviewList(filter = 'all') {
        const reviewContainer = document.getElementById('review-list-container');
        if (!reviewContainer) return;

        let filtered = this.data.questions.filter(q => {
            const userAns = this.answers[q.id];
            if (filter === 'correct') return userAns === q.correct;
            if (filter === 'incorrect') return userAns && userAns !== q.correct;
            if (filter === 'blank') return !userAns;
            if (filter === 'flagged') return this.flagged.has(q.id);
            return true;
        });

        if (filtered.length === 0) {
            reviewContainer.innerHTML = '<div class="alert alert-info">No hay preguntas que coincidan con este filtro.</div>';
            return;
        }

        let html = '';
        filtered.forEach(q => {
            const userAns = this.answers[q.id];
            const isCorrect = userAns === q.correct;
            const isBlank = !userAns;

            let borderClass = isCorrect ? 'border-success' : (isBlank ? 'border-secondary' : 'border-danger');
            let headerBg = isCorrect ? 'bg-success text-white' : (isBlank ? 'bg-secondary text-white' : 'bg-danger text-white');
            let statusText = isCorrect ? '✓ Correcta (+1.00)' : (isBlank ? '⚪ No contestada (0.00)' : '✗ Incorrecta (-0.33)');

            html += `
                <div class="card mb-3 border-2 ${borderClass}">
                    <div class="card-header ${headerBg} d-flex justify-content-between align-items-center py-2">
                        <span class="fw-bold">Pregunta ${q.id}</span>
                        <span class="badge bg-light text-dark">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <p class="fw-bold text-dark mb-3">${q.id}. ${this.escapeHTML(q.question)}</p>
                        <div class="list-group">
                            ${this.renderReviewOption(q, 'a', userAns)}
                            ${this.renderReviewOption(q, 'b', userAns)}
                            ${this.renderReviewOption(q, 'c', userAns)}
                        </div>
                    </div>
                </div>
            `;
        });

        reviewContainer.innerHTML = html;
    }

    renderReviewOption(q, key, userAns) {
        if (!q.options[key]) return '';
        const isCorrectOpt = key === q.correct;
        const isUserOpt = key === userAns;

        let badge = '';
        let bgClass = '';

        if (isCorrectOpt) {
            bgClass = 'list-group-item-success fw-bold';
            badge = '<span class="badge bg-success float-end">✓ Respuesta Correcta</span>';
        } else if (isUserOpt && !isCorrectOpt) {
            bgClass = 'list-group-item-danger';
            badge = '<span class="badge bg-danger float-end">✗ Tu Respuesta</span>';
        }

        return `
            <div class="list-group-item ${bgClass}">
                <strong>${key.toUpperCase()})</strong> ${this.escapeHTML(q.options[key])} ${badge}
            </div>
        `;
    }

    resetExam() {
        localStorage.removeItem(this.storageKey);
        try {
            const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
            const filteredHistory = history.filter(item => item.examType !== this.examType);
            localStorage.setItem(this.historyKey, JSON.stringify(filteredHistory));
        } catch (e) {
            console.error("Error clearing history for exam", e);
        }
        window.location.reload();
    }

    escapeHTML(str) {
        return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
    }
}
