/**
 * Core Quiz Engine for Ayuntamiento de Madrid TIC Exam Practice App
 */

class QuizEngine {
    constructor(examData, examIdOrType, examMeta = null) {
        this.data = examData;
        this.examId = examData.id || examIdOrType || 'examen';
        this.examType = examData.tipo || examIdOrType || 'teorica';
        this.meta = examMeta || (typeof window !== 'undefined' && window.EXAM_REGISTRY && typeof window.EXAM_REGISTRY.getExamById === 'function' ? window.EXAM_REGISTRY.getExamById(this.examId) : null);
        this.storageKey = `tic_madrid_${this.examId}_state`;
        this.historyKey = `tic_madrid_history`;

        this.currentQuestionIndex = 0;
        this.answers = {}; // questionId -> optionKey ('a','b','c')
        this.flagged = new Set(); // questionIds flagged for review
        this.mode = 'exam'; // 'exam' or 'practice'
        this.checkedQuestions = new Set(); // in practice mode, questions checked for instant feedback

        this.timeRemaining = (examData.timeMinutes || 60) * 60;
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
            this.calculateResults();
            this.showResultsScreen();
        }
    }

    loadState() {
        try {
            let saved = localStorage.getItem(this.storageKey);
            if (!saved && this.examType && this.storageKey !== `tic_madrid_${this.examType}_state`) {
                saved = localStorage.getItem(`tic_madrid_${this.examType}_state`);
            }
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
        const titleEl = document.getElementById('exam-title');
        if (titleEl) {
            titleEl.textContent = this.data.title;
        }
        const subtitleEl = document.getElementById('exam-subtitle');
        if (subtitleEl) {
            const grupoText = this.data.grupo ? `[Grupo ${this.data.grupo}] ` : '';
            const convText = this.data.convocatoria || this.data.date;
            const stipulated = this.getStipulatedQuestionsCount();
            const totalAvailable = this.data.questions.length;
            const reserveCount = totalAvailable - stipulated;
            const reserveText = reserveCount > 0 ? ` (+${reserveCount} de reserva)` : '';
            subtitleEl.textContent = `${grupoText}Convocatoria: ${convText} • ${stipulated} Preguntas${reserveText} • ${this.data.timeMinutes} Minutos`;
        }

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
        document.getElementById('btn-prev')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('btn-next')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-flag')?.addEventListener('click', () => this.toggleFlag());
        document.getElementById('btn-clear')?.addEventListener('click', () => this.clearAnswer());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());

        // Submit button
        document.getElementById('btn-submit')?.addEventListener('click', () => {
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
        const isAnulada = this.isQuestionAnulada(q);
        const isReserve = this.isReserveQuestion(q);
        const stipulated = this.getStipulatedQuestionsCount();
        const totalAvailable = this.data.questions.length;
        const plan = this.getExamEvaluationPlan();

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
                if (isAnulada) {
                    if (selectedOpt === key) {
                        badgeHTML = '<span class="badge badge-purpura-suave ms-2">Tu Selección (Pregunta Anulada - No Computa)</span>';
                    }
                } else {
                    if (key === q.correct) {
                        optionClass += ' correct-option';
                        badgeHTML = '<span class="badge badge-verde-suave ms-2">✓ Respuesta Correcta</span>';
                    } else if (selectedOpt === key && key !== q.correct) {
                        optionClass += ' incorrect-option';
                        badgeHTML = '<span class="badge badge-rojo-suave ms-2">✗ Tu Selección (Errónea)</span>';
                    }
                }
            }

            const disabledAttr = this.isSubmitted ? 'disabled' : '';

            optionsHTML += `
                <div class="${optionClass} p-3 mb-2 rounded border" onclick="quiz.selectOption('${key}')">
                    <div class="form-check d-flex align-items-start">
                        <input class="form-check-input me-3 mt-1" type="radio" name="q_${q.id}" id="opt_${q.id}_${key}" 
                               value="${key}" ${selectedOpt === key ? 'checked' : ''} ${disabledAttr} onchange="quiz.selectOption('${key}')">
                        <label class="form-check-label flex-grow-1 cursor-pointer" for="opt_${q.id}_${key}">
                            <strong class="text-primary me-1">${key.toUpperCase()})</strong> ${this.formatOptionText(q.options[key])} ${badgeHTML}
                        </label>
                    </div>
                </div>
            `;
        });

        // Reserve badge display
        let reserveBadgeHTML = '';
        if (isReserve) {
            const resIdx = this.data.questions.findIndex(item => item.id === q.id) - plan.stipulated + 1;
            reserveBadgeHTML = `<span class="badge bg-secondary-subtle text-dark border fs-6">🛡️ Reserva ${resIdx}</span>`;
            if (this.isSubmitted) {
                if (plan.reverseSubstitutionMap.has(q.id)) {
                    const sub = plan.reverseSubstitutionMap.get(q.id);
                    reserveBadgeHTML += `<span class="badge bg-primary fs-6"><i class="bi bi-arrow-repeat me-1"></i>Sustituye a P${sub.anulada.id} anulada</span>`;
                } else {
                    reserveBadgeHTML += `<span class="badge bg-light text-muted border fs-6">Reserva no requerida</span>`;
                }
            }
        } else if (isAnulada && this.isSubmitted) {
            if (plan.substitutionMap.has(q.id)) {
                const sub = plan.substitutionMap.get(q.id);
                reserveBadgeHTML = `<span class="badge badge-purpura-suave fs-6"><i class="bi bi-arrow-repeat me-1"></i>Sustituida por Reserva P${sub.replacement.id}</span>`;
            } else {
                reserveBadgeHTML = `<span class="badge badge-purpura-suave fs-6">Anulada (no computa)</span>`;
            }
        }
        
        let instantCheckBtn = '';
        if (this.mode === 'practice' && !this.isSubmitted && selectedOpt) {
            instantCheckBtn = `
                <button class="btn btn-outline-info btn-sm mt-2" onclick="quiz.checkInstantAnswer()">
                    ${isChecked ? '🔄 Ocultar solución' : '💡 Comprobar Respuesta'}
                </button>
            `;
        }

        const alegInfo = this.getAlegacionesInfo(q);
        const tags = this.getQuestionTags(q);

        let tagsHTML = '';
        if (tags.length > 0) {
            tags.forEach(tag => {
                const isAlegTag = tag.toLowerCase().includes('alegaci');
                const isAnuladaTag = tag.toLowerCase().includes('anulad');
                if (alegInfo && (isAlegTag || isAnuladaTag)) {
                    const badgeClass = isAnuladaTag ? 'badge-anulada' : 'badge-alegaciones';
                    const iconClass = isAnuladaTag ? 'bi-slash-circle-fill' : 'bi-chat-left-text-fill';
                    const btnTitle = isAnuladaTag 
                        ? 'Pregunta anulada. Haz clic para ver u ocultar la resolución del Tribunal.' 
                        : 'Pregunta con alegaciones registradas. Haz clic para ver u ocultar los motivos.';
                    tagsHTML += `
                        <button type="button" class="${badgeClass}" 
                                onclick="const d = document.getElementById('alegaciones-details-${q.id}'); if (d) { d.open = !d.open; d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }"
                                title="${btnTitle}">
                            <i class="bi ${iconClass}" aria-hidden="true"></i> ${this.escapeHTML(tag)}
                        </button>
                    `;
                } else if (isAnuladaTag) {
                    tagsHTML += `<span class="badge badge-purpura-suave ms-2">${this.escapeHTML(tag)}</span>`;
                } else {
                    tagsHTML += `<span class="badge bg-secondary-subtle text-dark border">${this.escapeHTML(tag)}</span>`;
                }
            });
        }

        const alegacionesCollapseHTML = alegInfo ? this.renderAlegacionesHTML(q, alegInfo, 'alegaciones-details') : '';

        container.innerHTML = `
            <fieldset class="border-0 p-0 m-0">
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <span class="badge bg-dark fs-6" aria-label="Pregunta ${q.id} de un total de ${totalAvailable}">Pregunta ${q.id} de ${totalAvailable}</span>
                        ${reserveBadgeHTML}
                        ${tagsHTML}
                    </div>
                    <div>
                        <button id="btn-flag-inner" class="btn btn-sm ${isFlagged ? 'btn-gris-madrid text-white fw-bold' : 'btn-outline-gris-madrid'}" onclick="quiz.toggleFlag()" aria-pressed="${isFlagged}">
                            ${isFlagged ? '🚩 Marcada para revisión' : '🏳️ Marcar duda'}
                        </button>
                    </div>
                </div>
                <legend class="h5 question-text mb-3 text-dark" id="q_legend_${q.id}">${this.formatQuestionContent(q.question, q.id)}</legend>
                ${alegacionesCollapseHTML}
                <div class="options-group" role="radiogroup" aria-labelledby="q_legend_${q.id}">${optionsHTML}</div>
                ${instantCheckBtn}
            </fieldset>
        `;

        // Update nav buttons state
        const btnPrev = document.getElementById('btn-prev');
        if (btnPrev) btnPrev.disabled = this.currentQuestionIndex === 0;

        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.disabled = this.currentQuestionIndex === totalAvailable - 1;

        const btnFlag = document.getElementById('btn-flag');
        if (btnFlag) {
            btnFlag.className = `btn btn-sm ${isFlagged ? 'btn-gris-madrid text-white fw-bold' : 'btn-outline-gris-madrid'}`;
            btnFlag.textContent = isFlagged ? '🚩 Desmarcar' : '🏳️ Marcar';
            btnFlag.setAttribute('aria-pressed', isFlagged.toString());
        }

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
        if (this.currentQuestionIndex < this.data.questions.length - 1) {
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

        const plan = this.getExamEvaluationPlan();
        const evalIds = plan.evaluatedIds;
        const subMap = plan.substitutionMap;
        const revSubMap = plan.reverseSubstitutionMap;
        const stipulated = plan.stipulated;

        let html = '';
        this.data.questions.forEach((q, idx) => {
            const isCurrent = idx === this.currentQuestionIndex;
            const isAnswered = !!this.answers[q.id];
            const isFlagged = this.flagged.has(q.id);
            const isAnulada = this.isQuestionAnulada(q);
            const isReserve = idx >= stipulated;

            if (isReserve && idx === stipulated) {
                html += `
                    <div class="w-100 my-2 pt-2 border-top d-flex justify-content-between align-items-center">
                        <span class="small fw-bold text-secondary text-uppercase tracking-wider">
                            🛡️ Preguntas de Reserva (${this.data.questions.length - stipulated})
                        </span>
                    </div>
                `;
            }

            let btnClass = 'grid-btn btn-outline-secondary';
            let statusLabel = '';

            if (this.isSubmitted) {
                if (isAnulada) {
                    btnClass = 'grid-btn grid-btn-anulada';
                    if (subMap.has(q.id)) {
                        const sub = subMap.get(q.id);
                        statusLabel = `Anulada (sustituida por Reserva P${sub.replacement.id})`;
                    } else {
                        statusLabel = 'Anulada (no computable)';
                    }
                } else if (isReserve && !revSubMap.has(q.id)) {
                    btnClass = 'grid-btn grid-btn-reserva-unused';
                    statusLabel = 'Reserva no requerida (no computable)';
                } else {
                    const userAns = this.answers[q.id];
                    const isReplacement = revSubMap.has(q.id);
                    const suffix = isReplacement ? ' (Reserva activa)' : '';
                    if (!userAns) {
                        btnClass = 'grid-btn grid-btn-no-contestada'; // Blank / No contestada
                        statusLabel = 'No contestada' + suffix;
                    } else if (userAns === q.correct) {
                        btnClass = 'grid-btn grid-btn-correcta'; // Correct
                        statusLabel = 'Correcta' + suffix;
                    } else {
                        btnClass = 'grid-btn grid-btn-erronea'; // Incorrect / Errónea
                        statusLabel = 'Errónea' + suffix;
                    }
                }
            } else {
                if (isAnulada) {
                    btnClass = 'grid-btn grid-btn-anulada';
                    statusLabel = 'Anulada';
                    if (isAnswered) {
                        statusLabel += ', respondida';
                    }
                } else if (isAnswered) {
                    btnClass = 'grid-btn btn-primary';
                    statusLabel = isReserve ? 'Reserva respondida' : 'Respondida';
                } else {
                    statusLabel = isReserve ? 'Reserva sin responder' : 'Sin responder';
                }
                if (isFlagged) {
                    if (!isAnulada) {
                        btnClass = 'grid-btn btn-gris-madrid text-white fw-bold';
                    }
                    statusLabel += ', marcada para revisión';
                }
            }

            const alegInfo = this.getAlegacionesInfo(q);
            if (alegInfo) {
                statusLabel += isAnulada ? ', cuenta con resolución del Tribunal' : ', cuenta con alegaciones';
            }

            if (isCurrent) {
                btnClass += ' border-3 border-dark active-grid';
                statusLabel += ', actual';
            }

            const titleAttr = isReserve && !this.isSubmitted
                ? `Pregunta ${q.id} (Reserva ${idx - stipulated + 1}): ${statusLabel}`
                : `Pregunta ${q.id}: ${statusLabel}`;
            const alegDotTitle = isAnulada ? 'Pregunta con motivos de resolución' : 'Pregunta con alegaciones';

            html += `
                <button class="btn btn-sm ${btnClass} position-relative m-1" 
                        onclick="quiz.jumpToQuestion(${idx})" 
                        aria-label="Pregunta ${q.id}: ${statusLabel}"
                        title="${titleAttr}"
                        aria-current="${isCurrent ? 'true' : 'false'}">
                    ${q.id}
                    ${isFlagged && !this.isSubmitted ? '<span class="position-absolute top-0 start-100 translate-middle p-1 bg-gris-madrid border border-light rounded-circle" aria-hidden="true"></span>' : ''}
                    ${alegInfo ? `<span class="position-absolute top-0 start-0 translate-middle p-1 bg-warning border border-light rounded-circle" title="${alegDotTitle}" aria-hidden="true"></span>` : ''}
                </button>
            `;
        });

        grid.innerHTML = html;

        const legendEl = document.getElementById('grid-legend');
        if (legendEl) {
            if (this.isSubmitted) {
                legendEl.innerHTML = `
                    <div class="fw-bold text-dark mb-2">Corrección del examen:</div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge badge-verde-suave px-2">✓</span> Correcta (+1.00)
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge badge-rojo-suave px-2">✗</span> Errónea (-0.33)
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge badge-gris-suave px-2">⚪</span> No contestada (0.00)
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge badge-purpura-suave px-2">🚫</span> Anulada (no computa)
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-outline-secondary border px-2 position-relative">N<span class="position-absolute top-0 start-0 translate-middle p-1 bg-warning border border-light rounded-circle"></span></span> Con alegaciones
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-muted border px-2">R</span> Reserva no requerida
                    </div>
                `;
            } else {
                legendEl.innerHTML = `
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-azul-madrid px-2">N</span> Respondida
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge badge-purpura-suave px-2">🚫</span> Anulada
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-outline-secondary border px-2 position-relative">N<span class="position-absolute top-0 start-100 translate-middle p-1 bg-gris-madrid border border-light rounded-circle"></span></span> Marcada duda
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-outline-secondary border px-2 position-relative">N<span class="position-absolute top-0 start-0 translate-middle p-1 bg-warning border border-light rounded-circle"></span></span> Alegaciones
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-outline-secondary border px-2">N</span> Sin responder
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-muted border px-2">R</span> Reserva no requerida
                    </div>
                `;
            }
        }
    }

    updateProgress() {
        const answeredCount = Object.keys(this.answers).length;
        const total = this.data.questions.length;
        const percent = Math.min(100, Math.round((answeredCount / total) * 100));

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

    calculateResults() {
        const plan = this.getExamEvaluationPlan();

        let correctCount = 0;
        let incorrectCount = 0;
        let blankCount = 0;

        plan.evaluatedQuestions.forEach(q => {
            const userAns = this.answers[q.id];
            if (!userAns) {
                blankCount++;
            } else if (userAns === q.correct) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const totalEvaluated = plan.totalEvaluated;
        // Official formula: 1 point per correct answer, -0.33 penalty per error
        const netPoints = Math.max(0, correctCount - (incorrectCount * 0.333333));
        const finalGrade = totalEvaluated > 0 ? ((netPoints / totalEvaluated) * 10).toFixed(2) : '0.00';

        this.results = {
            correctCount,
            incorrectCount,
            blankCount,
            total: totalEvaluated,
            stipulated: plan.stipulated,
            totalAvailable: plan.totalAvailable,
            netPoints: netPoints.toFixed(2),
            finalGrade,
            timeSpentSeconds: typeof this.results?.timeSpentSeconds === 'number'
                ? this.results.timeSpentSeconds
                : (this.data.timeMinutes * 60) - this.timeRemaining,
            dateCompleted: this.results?.dateCompleted || new Date().toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            anuladasCount: plan.anuladasMain.length,
            activatedReservesCount: plan.activatedReserveQuestions.length,
            unusedReservesCount: plan.unusedReserveQuestions.length + plan.anuladaReservePool.length,
            substitutionsSummary: plan.substitutions.map(s => ({
                anuladaId: s.anulada.id,
                replacementId: s.replacement.id,
                reserveIndex: s.reserveIndex
            }))
        };
        this.saveState();
    }

    submitExam() {
        this.isSubmitted = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.calculateResults();
        this.saveToHistory();
        this.showResultsScreen();
    }

    saveToHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
            history.unshift({
                examId: this.examId,
                examType: this.examType,
                grupo: this.data.grupo || 'C1',
                convocatoria: this.data.convocatoria || '2026',
                tipo: this.data.tipo || this.examType,
                title: this.data.title,
                grade: this.results.finalGrade,
                correct: this.results.correctCount,
                incorrect: this.results.incorrectCount,
                blank: this.results.blankCount,
                total: this.results.total,
                date: this.results.dateCompleted
            });
            localStorage.setItem(this.historyKey, JSON.stringify(history.slice(0, 30))); // Keep last 30
        } catch (e) {
            console.error("Error saving history", e);
        }
    }

    showResultsScreen() {
        const resultsModal = document.getElementById('results-section');
        if (!resultsModal) return;

        resultsModal.classList.remove('d-none');
        
        const gradeEl = document.getElementById('res-final-grade') || document.getElementById('res-grade');
        if (gradeEl) gradeEl.textContent = `${this.results.finalGrade} / 10`;

        const correctEl = document.getElementById('res-correct-count') || document.getElementById('res-correct');
        if (correctEl) correctEl.textContent = this.results.correctCount;

        const incorrectEl = document.getElementById('res-incorrect-count') || document.getElementById('res-incorrect');
        if (incorrectEl) incorrectEl.textContent = this.results.incorrectCount;

        const blankEl = document.getElementById('res-blank-count') || document.getElementById('res-blank');
        if (blankEl) blankEl.textContent = this.results.blankCount;

        const netPointsEl = document.getElementById('res-net-points');
        if (netPointsEl) netPointsEl.textContent = `${this.results.netPoints} / ${this.results.total}`;

        const examTitleEl = document.getElementById('res-exam-title');
        if (examTitleEl && this.data && this.data.title) examTitleEl.textContent = this.data.title;

        const plan = this.getExamEvaluationPlan();
        const infoEl = document.getElementById('res-anuladas-banner') || document.getElementById('res-correction-info');
        if (infoEl) {
            if (plan.anuladasMain.length > 0 || plan.hasReserveQuestions) {
                infoEl.classList.remove('d-none');
                let substitutionsHTML = '';
                if (plan.substitutions.length > 0) {
                    const listItems = plan.substitutions.map(s => 
                        `<li>Pregunta <strong>${s.anulada.id}</strong> (anulada) ➔ sustituida por Pregunta de Reserva <strong>${s.replacement.id}</strong> (Reserva ${s.reserveIndex}).</li>`
                    ).join('');
                    substitutionsHTML = `
                        <div class="mt-2 pt-2 border-top border-secondary-subtle">
                            <span class="fw-bold text-dark">Sustituciones aplicadas correlativamente:</span>
                            <ul class="mb-0 ps-3 mt-1">${listItems}</ul>
                        </div>
                    `;
                }

                let unreplacedHTML = '';
                if (plan.unreplacedAnuladas.length > 0) {
                    const unreplIds = plan.unreplacedAnuladas.map(q => q.id).join(', ');
                    if (plan.hasReserveQuestions) {
                        unreplacedHTML = `<li>Preguntas anuladas sin reserva disponible (${unreplIds}): no computan (examen calificado sobre ${plan.totalEvaluated} preguntas).</li>`;
                    } else {
                        unreplacedHTML = `<li>Preguntas anuladas oficialmente (${unreplIds}): quedan anuladas y no computan (examen calificado sobre ${plan.totalEvaluated} preguntas ordinarias).</li>`;
                    }
                }

                let unusedReserveHTML = '';
                const unusedCount = plan.unusedReserveQuestions.length + plan.anuladaReservePool.length;
                if (plan.hasReserveQuestions && unusedCount > 0) {
                    unusedReserveHTML = `<li><strong>${unusedCount} pregunta(s) de reserva</strong> no fueron necesarias para la corrección y quedan excluidas del cómputo.</li>`;
                }

                infoEl.innerHTML = `
                    <div class="alert alert-secondary border-secondary-subtle p-3 mb-0 rounded shadow-sm text-start">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="bi bi-shield-check text-azul-madrid fs-5" aria-hidden="true"></i>
                            <h3 class="h6 mb-0 fw-bold text-dark">Criterio Oficial de Corrección del Tribunal Calificador</h3>
                        </div>
                        <ul class="mb-0 ps-3 small text-secondary">
                            ${plan.anuladasMain.length > 0 ? `<li><strong>${plan.anuladasMain.length} pregunta(s) anulada(s)</strong> en el cuestionario oficial (no suman ni penalizan).</li>` : '<li>No hubo preguntas anuladas en el cuestionario oficial.</li>'}
                            ${unreplacedHTML}
                            ${unusedReserveHTML}
                            <li><strong>Total de preguntas evaluadas para la calificación:</strong> ${plan.totalEvaluated} preguntas${plan.hasReserveQuestions ? ` (sobre ${plan.stipulated} estipuladas)` : ''}.</li>
                        </ul>
                        ${substitutionsHTML}
                    </div>
                `;
            } else {
                infoEl.classList.add('d-none');
                infoEl.innerHTML = '';
            }
        }

        this.renderQuestion(); // re-render question view with correction badges
        this.renderReviewList('all');
    }

    renderReviewList(filter = 'all') {
        const reviewContainer = document.getElementById('review-list-container');
        if (!reviewContainer) return;

        const plan = this.getExamEvaluationPlan();
        const evalIds = plan.evaluatedIds;
        const subMap = plan.substitutionMap;
        const revSubMap = plan.reverseSubstitutionMap;

        let filtered = this.data.questions.filter(q => {
            const userAns = this.answers[q.id];
            const isEvaluated = evalIds.has(q.id);
            const isAnulada = this.isQuestionAnulada(q);
            const isReserve = this.isReserveQuestion(q);

            if (filter === 'correct') {
                return isEvaluated && userAns === q.correct;
            }
            if (filter === 'incorrect') {
                return isEvaluated && userAns && userAns !== q.correct;
            }
            if (filter === 'blank') {
                return isEvaluated && !userAns;
            }
            if (filter === 'flagged') {
                return this.flagged.has(q.id);
            }
            if (filter === 'alegaciones') {
                return !!this.getAlegacionesInfo(q) || isAnulada;
            }
            if (filter === 'anuladas') {
                return isAnulada;
            }
            if (filter === 'reserva') {
                return isReserve;
            }
            return true;
        });

        if (filtered.length === 0) {
            reviewContainer.innerHTML = '<div class="alert alert-info">No hay preguntas que coincidan con este filtro.</div>';
            return;
        }

        let html = '';
        filtered.forEach(q => {
            const userAns = this.answers[q.id];
            const isAnulada = this.isQuestionAnulada(q);
            const isReserve = this.isReserveQuestion(q);
            const isSubstituted = subMap.has(q.id);
            const isReplacement = revSubMap.has(q.id);

            let cardClass = 'card-review-no-contestada';
            let statusText = '';
            let statusBadgeClass = 'badge-gris-suave';
            let reserveBadgesHTML = '';

            if (isAnulada) {
                cardClass = 'card-review-anulada';
                statusBadgeClass = 'badge-purpura-suave';
                if (isSubstituted) {
                    const sub = subMap.get(q.id);
                    statusText = `🚫 Anulada (Sustituida por Reserva P${sub.replacement.id})`;
                    reserveBadgesHTML = `<span class="badge badge-purpura-suave ms-2"><i class="bi bi-arrow-repeat me-1"></i>Sustituida por Reserva P${sub.replacement.id}</span>`;
                } else {
                    statusText = '🚫 Anulada por el Tribunal (No computable)';
                    reserveBadgesHTML = `<span class="badge badge-purpura-suave ms-2">Anulada sin reserva</span>`;
                }
            } else if (isReserve) {
                if (isReplacement) {
                    const sub = revSubMap.get(q.id);
                    const isCorrect = userAns === q.correct;
                    const isBlank = !userAns;
                    cardClass = isCorrect ? 'card-review-correcta' : (isBlank ? 'card-review-no-contestada' : 'card-review-erronea');
                    statusBadgeClass = isCorrect ? 'badge-verde-suave' : (isBlank ? 'badge-gris-suave' : 'badge-rojo-suave');
                    statusText = isCorrect 
                        ? `✓ Correcta (+1.00) · Reserva (Sustituye a P${sub.anulada.id})`
                        : (isBlank 
                            ? `⚪ No contestada (0.00) · Reserva (Sustituye a P${sub.anulada.id})` 
                            : `✗ Errónea (-0.33) · Reserva (Sustituye a P${sub.anulada.id})`);
                    reserveBadgesHTML = `
                        <span class="badge bg-light text-dark ms-2 border">🛡️ Reserva ${sub.reserveIndex}</span>
                        <span class="badge bg-primary ms-1"><i class="bi bi-arrow-repeat me-1"></i>Sustituye a P${sub.anulada.id}</span>
                    `;
                } else {
                    cardClass = 'card-review-reserva-unused';
                    statusBadgeClass = 'bg-light text-muted border';
                    statusText = '⚪ Reserva no utilizada (No computable)';
                    const resIdx = this.data.questions.findIndex(item => item.id === q.id) - plan.stipulated + 1;
                    reserveBadgesHTML = `
                        <span class="badge bg-secondary-subtle text-dark ms-2 border">🛡️ Reserva ${resIdx}</span>
                        <span class="badge bg-light text-muted ms-1 border">No computa</span>
                    `;
                }
            } else {
                const isCorrect = userAns === q.correct;
                const isBlank = !userAns;
                cardClass = isCorrect ? 'card-review-correcta' : (isBlank ? 'card-review-no-contestada' : 'card-review-erronea');
                statusBadgeClass = isCorrect ? 'badge-verde-suave' : (isBlank ? 'badge-gris-suave' : 'badge-rojo-suave');
                statusText = isCorrect ? '✓ Correcta (+1.00)' : (isBlank ? '⚪ No contestada (0.00)' : '✗ Errónea (-0.33)');
            }

            const alegInfo = this.getAlegacionesInfo(q);
            const tags = this.getQuestionTags(q);
            let reviewTagsHTML = '';
            if (tags.length > 0) {
                tags.forEach(tag => {
                    const isAlegTag = tag.toLowerCase().includes('alegaci');
                    const isAnuladaTag = tag.toLowerCase().includes('anulad');
                    if (alegInfo && (isAlegTag || isAnuladaTag)) {
                        const badgeClass = isAnuladaTag ? 'badge-anulada' : 'badge-alegaciones';
                        const iconClass = isAnuladaTag ? 'bi-slash-circle-fill' : 'bi-chat-left-text-fill';
                        const btnTitle = isAnuladaTag 
                            ? 'Pregunta anulada. Haz clic para ver u ocultar la resolución del Tribunal.' 
                            : 'Pregunta con alegaciones. Haz clic para ver u ocultar los motivos.';
                        reviewTagsHTML += `
                            <button type="button" class="${badgeClass} ms-2"
                                    onclick="const d = document.getElementById('review-alegaciones-${q.id}'); if (d) { d.open = !d.open; d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }"
                                    title="${btnTitle}">
                                <i class="bi ${iconClass}" aria-hidden="true"></i> ${this.escapeHTML(tag)}
                            </button>
                        `;
                    } else if (isAnuladaTag) {
                        reviewTagsHTML += `<span class="badge badge-purpura-suave ms-2">${this.escapeHTML(tag)}</span>`;
                    } else {
                        reviewTagsHTML += `<span class="badge bg-light text-dark ms-2 border">${this.escapeHTML(tag)}</span>`;
                    }
                });
            }

            const reviewAlegacionesHTML = alegInfo ? this.renderAlegacionesHTML(q, alegInfo, 'review-alegaciones') : '';

            html += `
                <div class="card mb-3 ${cardClass}">
                    <div class="card-header d-flex justify-content-between align-items-center py-2 flex-wrap gap-2">
                        <div class="d-flex align-items-center flex-wrap">
                            <span class="fw-bold">Pregunta ${q.id}</span>
                            ${reserveBadgesHTML}
                            ${reviewTagsHTML}
                        </div>
                        <span class="badge ${statusBadgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="question-text mb-3 text-dark">${this.formatQuestionContent(q.question, q.id)}</div>
                        ${reviewAlegacionesHTML}
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
        const isAnulada = this.isQuestionAnulada(q);
        const isCorrectOpt = !isAnulada && key === q.correct;
        const isUserOpt = key === userAns;

        let badge = '';
        let bgClass = '';

        if (isAnulada) {
            if (isUserOpt) {
                bgClass = 'bg-purpura-suave';
                badge = '<span class="badge badge-purpura-suave float-end">Tu Selección (Pregunta Anulada)</span>';
            }
        } else {
            if (isCorrectOpt) {
                bgClass = 'bg-verde-suave fw-bold';
                badge = '<span class="badge badge-verde-suave float-end">✓ Respuesta Correcta</span>';
            } else if (isUserOpt && !isCorrectOpt) {
                bgClass = 'bg-rojo-suave';
                badge = '<span class="badge badge-rojo-suave float-end">✗ Tu Respuesta (Errónea)</span>';
            }
        }

        return `
            <div class="list-group-item ${bgClass}">
                <strong>${key.toUpperCase()})</strong> ${this.formatOptionText(q.options[key])} ${badge}
            </div>
        `;
    }

    resetExam() {
        localStorage.removeItem(this.storageKey);
        if (this.storageKey !== `tic_madrid_${this.examType}_state`) {
            localStorage.removeItem(`tic_madrid_${this.examType}_state`);
        }
        try {
            const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
            const filteredHistory = history.filter(item => item.examId !== this.examId && item.examType !== this.examType);
            localStorage.setItem(this.historyKey, JSON.stringify(filteredHistory));
        } catch (e) {
            console.error("Error clearing history for exam", e);
        }
        window.location.reload();
    }

    escapeHTML(str) {
        return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
    }

    formatQuestionContent(rawText, qId = null) {
        if (!rawText) return '';

        const prefix = qId ? `<span class="question-number text-primary fw-bold me-2">${qId}.</span>` : '';

        // Extract code blocks ```lang ... ```
        const codeBlocks = [];
        let processedText = rawText.replace(/```([a-zA-Z0-9_-]*)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
            const index = codeBlocks.length;
            codeBlocks.push({ lang: (lang || '').toUpperCase(), code: code.trim() });
            return `__CODE_BLOCK_${index}__`;
        });

        // Extract inline code `...`
        const inlineCodes = [];
        processedText = processedText.replace(/`([^`\n]+)`/g, (match, inline) => {
            const index = inlineCodes.length;
            inlineCodes.push(inline);
            return `__INLINE_CODE_${index}__`;
        });

        // Escape HTML on the remaining text
        const html = this.escapeHTML(processedText);

        // Split paragraphs by double newlines \n\n
        const paragraphs = html.split(/\n\s*\n/);
        const formattedParagraphs = paragraphs.map((p, idx) => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            if (/^__CODE_BLOCK_\d+__$/.test(trimmed)) {
                return trimmed;
            }
            const withBreaks = trimmed.replace(/\n/g, '<br>');
            if (idx === 0 && prefix) {
                return `<div class="question-lead mb-2">${prefix}${withBreaks}</div>`;
            }
            return `<div class="question-paragraph mb-2">${withBreaks}</div>`;
        }).filter(Boolean);

        let finalHtml = formattedParagraphs.join('');

        // Restore inline codes
        finalHtml = finalHtml.replace(/__INLINE_CODE_(\d+)__/g, (match, idx) => {
            const item = inlineCodes[parseInt(idx, 10)];
            return `<code class="code-inline">${this.escapeHTML(item)}</code>`;
        });

        // Restore code blocks
        finalHtml = finalHtml.replace(/__CODE_BLOCK_(\d+)__/g, (match, idx) => {
            const item = codeBlocks[parseInt(idx, 10)];
            const langTitle = item.lang ? item.lang : 'CÓDIGO';
            const highlighted = this.highlightCode(item.code, item.lang);
            return `
                <div class="code-block-wrapper my-3 border rounded shadow-sm overflow-hidden">
                    <div class="code-block-header bg-dark text-white px-3 py-1.5 d-flex justify-content-between align-items-center">
                        <span class="badge bg-secondary font-monospace">${this.escapeHTML(langTitle)}</span>
                        <button type="button" class="btn btn-sm btn-outline-light py-0 px-2 btn-copy-code" onclick="quiz.copyCode(this)" aria-label="Copiar fragmento de código">📋 Copiar</button>
                    </div>
                    <pre class="code-block-pre m-0 p-3 bg-dark text-white overflow-x-auto"><code class="font-monospace">${highlighted}</code></pre>
                </div>
            `;
        });

        return finalHtml;
    }

    formatOptionText(rawText) {
        if (!rawText) return '';
        if (Array.isArray(rawText)) rawText = rawText.join(' ');
        if (typeof rawText !== 'string') rawText = String(rawText);
        const inlineCodes = [];
        let processedText = rawText.replace(/`([^`\n]+)`/g, (match, inline) => {
            const index = inlineCodes.length;
            inlineCodes.push(inline);
            return `__INLINE_CODE_${index}__`;
        });
        let html = this.escapeHTML(processedText);
        html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, idx) => {
            const item = inlineCodes[parseInt(idx, 10)];
            return `<code class="code-inline">${this.escapeHTML(item)}</code>`;
        });
        return html;
    }

    highlightCode(code, lang) {
        lang = (lang || '').toUpperCase();
        let escaped = this.escapeHTML(code);

        if (lang === 'JAVA') {
            const pattern = /(\/\/[^\n]*)|(&quot;[^&]*?&quot;)|(@\w+)|\b(public|class|private|protected|void|new|return|import|package|int|boolean|throw|throws|try|catch|finally|if|else|static|final)\b|\b(EntityManager|Incidencia|Auditoria|String|Long|Integer|List|Map|Set|RuntimeException|Exception)\b/g;
            return escaped.replace(pattern, (match, comment, str, annotation, keyword, type) => {
                if (comment) return `<span class="token-comment">${comment}</span>`;
                if (str) return `<span class="token-string">${str}</span>`;
                if (annotation) return `<span class="token-annotation">${annotation}</span>`;
                if (keyword) return `<span class="token-keyword">${keyword}</span>`;
                if (type) return `<span class="token-type">${type}</span>`;
                return match;
            });
        } else if (lang === 'SQL') {
            const pattern = /(--[^\n]*)|(&#039;[^&#]*?&#039;|&quot;[^&]*?&quot;)|\b(SELECT|FROM|WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|INSERT\s+INTO|VALUES|UPDATE|SET|DELETE|AND|OR|NOT|IN|LIKE|IS|NULL|DESC|ASC|CURRENT_DATE|ROLLBACK|COMMIT|BEGIN)\b/gi;
            return escaped.replace(pattern, (match, comment, str, keyword) => {
                if (comment) return `<span class="token-comment">${comment}</span>`;
                if (str) return `<span class="token-string">${str}</span>`;
                if (keyword) return `<span class="token-keyword">${keyword}</span>`;
                return match;
            });
        } else if (lang === 'JAVASCRIPT' || lang === 'JS') {
            const pattern = /(\/\/[^\n]*)|(&quot;[^&]*?&quot;|&#039;[^&#]*?&#039;)|\b(const|let|var|function|return|new|import|export|if|else|async|await)\b|\b(fetch|then|catch|setInterval|setTimeout|console|log|json)\b/g;
            return escaped.replace(pattern, (match, comment, str, keyword, builtin) => {
                if (comment) return `<span class="token-comment">${comment}</span>`;
                if (str) return `<span class="token-string">${str}</span>`;
                if (keyword) return `<span class="token-keyword">${keyword}</span>`;
                if (builtin) return `<span class="token-builtin">${builtin}</span>`;
                return match;
            });
        } else if (lang === 'HTTP') {
            const pattern = /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b|\b(Authorization|Bearer|Host|Content-Type|Accept|User-Agent)\b/g;
            return escaped.replace(pattern, (match, method, header) => {
                if (method) return `<span class="token-keyword">${method}</span>`;
                if (header) return `<span class="token-type">${header}</span>`;
                return match;
            });
        }

        return escaped;
    }

    copyCode(btn) {
        const wrapper = btn.closest('.code-block-wrapper');
        if (!wrapper) return;
        const codeEl = wrapper.querySelector('code');
        if (!codeEl) return;

        const text = codeEl.innerText;
        const onCopied = () => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copiado';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-outline-light');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-light');
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(err => {
                console.error('Error copying code to clipboard:', err);
            });
        } else {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                onCopied();
            } catch (err) {
                console.error('Fallback error copying code:', err);
            }
        }
    }

    isQuestionAnulada(q) {
        if (!q) return false;
        if (q.anulada === true) return true;
        if (q.correct === '*') return true;
        if (typeof q.estado === 'string' && q.estado.toLowerCase().includes('anulad')) return true;
        if (typeof q.etiqueta === 'string' && q.etiqueta.toLowerCase().includes('anulad')) return true;
        if (Array.isArray(q.etiquetas) && q.etiquetas.some(t => typeof t === 'string' && t.toLowerCase().includes('anulad'))) return true;
        const tags = this.getQuestionTags(q);
        return tags.some(t => typeof t === 'string' && t.toLowerCase().includes('anulad'));
    }

    getStipulatedQuestionsCount() {
        // 1. Si los datos del examen definen explícitamente stipulatedQuestions
        if (typeof this.data.stipulatedQuestions === 'number' && this.data.stipulatedQuestions > 0) {
            return this.data.stipulatedQuestions;
        }

        // 2. Si los datos del examen definen reserveQuestions
        if (typeof this.data.reserveQuestions === 'number' && this.data.questions) {
            return Math.max(1, this.data.questions.length - this.data.reserveQuestions);
        }

        // 3. Metadatos del catálogo oficial (EXAM_REGISTRY)
        const meta = this.meta || (typeof window !== 'undefined' && window.EXAM_REGISTRY && typeof window.EXAM_REGISTRY.getExamById === 'function' ? window.EXAM_REGISTRY.getExamById(this.examId) : null);
        if (meta) {
            if (typeof meta.reserveQuestions === 'number' && this.data.questions && this.data.questions.length > meta.reserveQuestions) {
                return this.data.questions.length - meta.reserveQuestions;
            }
            if (typeof meta.totalQuestions === 'number' && meta.totalQuestions > 0) {
                return meta.totalQuestions;
            }
        }

        // 4. Si el objeto data tiene totalQuestions menor que el array de preguntas
        if (typeof this.data.totalQuestions === 'number' && this.data.questions && this.data.totalQuestions < this.data.questions.length) {
            return this.data.totalQuestions;
        }

        // 5. Criterio por Grupo y Convocatoria (según bases oficiales del Ayuntamiento de Madrid)
        const grupo = (this.data.grupo || (meta && meta.grupo) || '').toUpperCase();
        const conv = String(this.data.convocatoria || (meta && meta.convocatoria) || '');
        const tipo = (this.data.tipo || this.examType || (meta && meta.tipo) || '').toLowerCase();
        const total = this.data.questions ? this.data.questions.length : 0;

        if (grupo === 'A1') {
            // Grupo A1 (Técnico/a Superior TIC): 120 preguntas ordinarias (+ 9 de reserva)
            if (total >= 120) {
                return 120;
            }
            return total;
        }

        if (grupo === 'A2') {
            // Grupo A2 (Técnico/a Medio TIC): 100 preguntas ordinarias (+ 7 de reserva)
            if (total >= 100) {
                return 100;
            }
            return total;
        }

        if (grupo === 'C1') {
            // Grupo C1 (Técnico/a Auxiliar TIC): En las convocatorias del Ayto de Madrid generalmente sin reserva
            if (tipo === 'practica') {
                if (conv.includes('2024') && total >= 25) return 25;
                if (conv.includes('2025') && total >= 30) return 30;
            } else if (tipo === 'teorica') {
                if (total >= 90) return 90;
            }
            return total;
        }

        return (this.data.totalQuestions && this.data.totalQuestions <= total) 
            ? this.data.totalQuestions 
            : total;
    }

    getReserveQuestionsCount() {
        const total = this.data.questions ? this.data.questions.length : 0;
        const stipulated = this.getStipulatedQuestionsCount();
        return Math.max(0, total - stipulated);
    }

    isReserveQuestion(qOrIndex) {
        const stipulated = this.getStipulatedQuestionsCount();
        const total = this.data.questions ? this.data.questions.length : 0;
        if (stipulated >= total) {
            return false;
        }
        let idx = -1;
        if (typeof qOrIndex === 'number') {
            idx = qOrIndex;
        } else if (qOrIndex && typeof qOrIndex.id !== 'undefined') {
            idx = this.data.questions.findIndex(q => q.id === qOrIndex.id);
        }
        return idx >= stipulated;
    }

    getExamEvaluationPlan() {
        const stipulated = this.getStipulatedQuestionsCount();
        const mainQuestions = this.data.questions.slice(0, stipulated);
        const reserveQuestions = this.data.questions.slice(stipulated);

        const anuladasMain = [];
        const activeMain = [];
        mainQuestions.forEach(q => {
            if (this.isQuestionAnulada(q)) {
                anuladasMain.push(q);
            } else {
                activeMain.push(q);
            }
        });

        const validReservePool = reserveQuestions.filter(q => !this.isQuestionAnulada(q));
        const anuladaReservePool = reserveQuestions.filter(q => this.isQuestionAnulada(q));

        const substitutions = [];
        const substitutionMap = new Map();
        const reverseSubstitutionMap = new Map();
        const activatedReserveQuestions = [];
        const unreplacedAnuladas = [];

        let resPointer = 0;
        anuladasMain.forEach(anuladaQ => {
            if (resPointer < validReservePool.length) {
                const replacementQ = validReservePool[resPointer];
                const reserveIndex = reserveQuestions.findIndex(r => r.id === replacementQ.id) + 1;
                const match = { anulada: anuladaQ, replacement: replacementQ, reserveIndex };
                substitutions.push(match);
                substitutionMap.set(anuladaQ.id, match);
                reverseSubstitutionMap.set(replacementQ.id, match);
                activatedReserveQuestions.push(replacementQ);
                resPointer++;
            } else {
                unreplacedAnuladas.push(anuladaQ);
            }
        });

        const unusedReserveQuestions = validReservePool.slice(resPointer);
        const evaluatedQuestions = [...activeMain, ...activatedReserveQuestions];
        const evaluatedIds = new Set(evaluatedQuestions.map(q => q.id));

        return {
            stipulated,
            totalAvailable: this.data.questions.length,
            hasReserveQuestions: reserveQuestions.length > 0,
            mainQuestions,
            reserveQuestions,
            anuladasMain,
            validReservePool,
            anuladaReservePool,
            substitutions,
            substitutionMap,
            reverseSubstitutionMap,
            activatedReserveQuestions,
            unusedReserveQuestions,
            unreplacedAnuladas,
            evaluatedQuestions,
            evaluatedIds,
            totalEvaluated: evaluatedQuestions.length
        };
    }

    getQuestionTags(q) {
        if (!q) return [];
        const tags = [];
        if (typeof q.etiqueta === 'string' && q.etiqueta.trim()) {
            tags.push(q.etiqueta.trim());
        } else if (Array.isArray(q.etiquetas)) {
            q.etiquetas.forEach(t => {
                if (typeof t === 'string' && t.trim()) tags.push(t.trim());
            });
        }
        // If question has an alegaciones or alegacion property but no etiqueta declared
        const hasAlegField = q.alegaciones || q.alegacion;
        const hasAlegTag = tags.some(t => t.toLowerCase().includes('alegaci'));
        if (hasAlegField && !hasAlegTag) {
            tags.push('Alegaciones');
        }
        return tags;
    }

    getAlegacionesInfo(q) {
        if (!q) return null;
        const tags = this.getQuestionTags(q);
        const alegacionTag = tags.find(t => t.toLowerCase().includes('alegaci'));
        const isAnulada = this.isQuestionAnulada(q);
        const anuladaTag = tags.find(t => t.toLowerCase().includes('anulad'));

        let motivo = '';
        if (typeof q.alegaciones === 'string') {
            motivo = q.alegaciones;
        } else if (typeof q.alegaciones === 'object' && q.alegaciones) {
            motivo = q.alegaciones.motivo || q.alegaciones.texto || q.alegaciones.explicacion || q.alegaciones.descripcion || '';
        } else if (typeof q.alegacion === 'string') {
            motivo = q.alegacion;
        } else if (typeof q.alegacion === 'object' && q.alegacion) {
            motivo = q.alegacion.motivo || q.alegacion.texto || q.alegacion.explicacion || '';
        }

        if (!motivo) {
            motivo = q.motivo || q.motivoAlegaciones || q.motivoAlegacion || q.explicacionAlegaciones || q.explicacion || '';
        }

        // Check if there is an alegaciones tag or field, or if motivo is specified
        if (alegacionTag || q.alegaciones || q.alegacion || (motivo && (tags.some(t => t.toLowerCase().includes('alegaci')) || isAnulada))) {
            return {
                tag: alegacionTag || anuladaTag || (isAnulada ? 'Anulada' : 'Alegaciones'),
                motivo: (motivo || '').trim() || 'No se han especificado motivos detallados para esta resolución.'
            };
        }
        return null;
    }

    formatAlegacionesText(text) {
        if (!text) return '<p class="mb-0 text-muted fst-italic">No se han especificado motivos detallados.</p>';
        const escaped = this.escapeHTML(text);
        const paragraphs = escaped.split(/\r?\n\s*\r?\n/);
        return paragraphs
            .map(p => `<p class="mb-2">${p.trim().replace(/\r?\n/g, '<br>')}</p>`)
            .join('');
    }

    renderAlegacionesHTML(q, alegInfo, prefix = 'alegaciones-details') {
        if (!alegInfo) return '';
        const id = `${prefix}-${q.id}`;
        const isAnulada = this.isQuestionAnulada(q);
        const badgeClass = isAnulada ? 'badge-anulada' : 'badge-alegaciones';
        const iconClass = isAnulada ? 'bi-slash-circle-fill' : 'bi-chat-left-text-fill';
        const titleText = isAnulada ? 'Desplegar resolución y motivos de la anulación' : 'Desplegar motivos de la alegación';
        const detailsClass = isAnulada ? 'anulada-details' : '';
        const borderClass = isAnulada ? 'border-secondary-subtle' : 'border-warning-subtle';
        const headerClass = isAnulada ? 'text-secondary-emphasis' : 'text-warning-emphasis';
        const iconColor = isAnulada ? 'text-secondary' : 'text-warning';

        return `
            <div class="alegaciones-box mb-3" aria-label="Sección de alegaciones y motivos de la pregunta ${q.id}">
                <details class="alegaciones-details ${detailsClass}" id="${id}">
                    <summary class="alegaciones-summary d-flex align-items-center justify-content-between gap-2 p-1" role="button" aria-controls="${id}-body">
                        <span class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="${badgeClass}"><i class="bi ${iconClass}" aria-hidden="true"></i> ${this.escapeHTML(alegInfo.tag)}</span>
                            <span class="fw-semibold text-dark small">${titleText}</span>
                        </span>
                        <span class="d-flex align-items-center gap-1 text-secondary small fw-medium">
                            <span class="d-none d-sm-inline">Ver motivo</span>
                            <i class="bi bi-chevron-down alegaciones-chevron" aria-hidden="true"></i>
                        </span>
                    </summary>
                    <div class="alegaciones-body mt-2 pt-2 border-top ${borderClass}" id="${id}-body">
                        <div class="small fw-bold ${headerClass} mb-2 d-flex align-items-center gap-1">
                            <i class="bi bi-info-circle-fill ${iconColor}" aria-hidden="true"></i>
                            <span>Resolución y motivos del Tribunal Calificador:</span>
                        </div>
                        <div class="alegaciones-texto text-dark small">
                            ${this.formatAlegacionesText(alegInfo.motivo)}
                        </div>
                    </div>
                </details>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.QuizEngine = QuizEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizEngine;
}
