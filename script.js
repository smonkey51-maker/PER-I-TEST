(function(){
  const screens = {
    landing: document.getElementById('screen-landing'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
  };

  const progressLabel = document.getElementById('progressLabel');
  const progressFill = document.getElementById('progressFill');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const resultEyebrow = document.getElementById('resultEyebrow');
  const resultName = document.getElementById('resultName');
  const resultDesc = document.getElementById('resultDesc');
  const resultAxes = document.getElementById('resultAxes');
  const restartBtn = document.getElementById('restartBtn');
  const liquid = document.getElementById('liquid');

  const AXIS_NAMES = ['Intensità', 'Dolcezza', 'Sperimentale', 'Intimità'];

  let state = {
    testType: null,     // 'standard' | 'special'
    questions: [],
    drinks: [],
    qIndex: 0,
    profile: [5,5,5,5],
  };

  function showScreen(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function startTest(type){
    state.testType = type;
    state.questions = type === 'standard' ? STANDARD_QUESTIONS : SPECIAL_QUESTIONS;
    state.drinks = type === 'standard' ? STANDARD_DRINKS : SPECIAL_DRINKS;
    state.qIndex = 0;
    state.profile = [5,5,5,5];
    liquid.setAttribute('fill', type === 'standard' ? getComputedStyle(document.documentElement).getPropertyValue('--amber-dim') : getComputedStyle(document.documentElement).getPropertyValue('--olive-dim'));
    updateGlass(0);
    renderQuestion();
    showScreen('quiz');
  }

  function renderQuestion(){
    const q = state.questions[state.qIndex];
    progressLabel.textContent = `${state.qIndex + 1} / ${state.questions.length}`;
    progressFill.style.width = `${(state.qIndex / state.questions.length) * 100}%`;
    progressFill.style.background = state.testType === 'standard' ? 'var(--amber)' : 'var(--olive)';
    questionText.textContent = q.q;

    optionsContainer.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt.t;
      btn.addEventListener('click', () => selectOption(opt.d));
      optionsContainer.appendChild(btn);
    });

    updateGlass((state.qIndex) / state.questions.length);
  }

  function selectOption(delta){
    state.profile = state.profile.map((v, i) => v + delta[i]);
    state.qIndex++;
    if (state.qIndex >= state.questions.length){
      updateGlass(1);
      setTimeout(showResult, 500);
    } else {
      renderQuestion();
    }
  }

  function updateGlass(fraction){
    // glass path inner region roughly y:10 to y:120, width tapering — approximate fill rect
    const maxHeight = 108; // 120-12
    const h = maxHeight * fraction;
    const y = 122 - h;
    liquid.setAttribute('height', h);
    liquid.setAttribute('y', y);

    // color shifts with dolcezza (profile[1]) blended toward amber/olive
    const dolc = state.profile[1];
    const t = Math.max(0, Math.min(1, dolc / 10));
    const base = state.testType === 'special' ? [110,138,107] : [217,143,43]; // olive vs amber rgb
    const sweet = [232, 178, 90]; // warm honey tone for "dolce"
    const r = Math.round(base[0] + (sweet[0]-base[0]) * t * 0.4);
    const g = Math.round(base[1] + (sweet[1]-base[1]) * t * 0.4);
    const b = Math.round(base[2] + (sweet[2]-base[2]) * t * 0.4);
    liquid.setAttribute('fill', `rgb(${r},${g},${b})`);
  }

  function nearestDrink(){
    let best = null, bestDist = Infinity;
    state.drinks.forEach(d => {
      const dist = Math.sqrt(
        d.axes.reduce((sum, val, i) => sum + Math.pow(val - state.profile[i], 2), 0)
      );
      if (dist < bestDist){ bestDist = dist; best = d; }
    });
    return best;
  }

  function showResult(){
    const drink = nearestDrink();
    resultEyebrow.textContent = state.testType === 'standard' ? 'il tuo profilo — test classico' : 'il tuo profilo — test riservato';
    resultName.textContent = drink.name;
    resultName.style.color = state.testType === 'standard' ? 'var(--amber)' : 'var(--olive)';
    resultDesc.textContent = drink.desc;

    resultAxes.innerHTML = '';
    const clamped = state.profile.map(v => Math.max(0, Math.min(10, v)));
    AXIS_NAMES.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'axis-row';
      row.innerHTML = `
        <div class="axis-label"><span>${name}</span><span>${clamped[i].toFixed(0)}/10</span></div>
        <div class="axis-track"><div class="axis-fill" style="width:${clamped[i]*10}%"></div></div>
      `;
      resultAxes.appendChild(row);
    });

    showScreen('result');
  }

  document.querySelectorAll('.path-card').forEach(card => {
    card.addEventListener('click', () => startTest(card.dataset.test));
  });

  restartBtn.addEventListener('click', () => {
    updateGlass(0);
    showScreen('landing');
  });

  showScreen('landing');
})();
