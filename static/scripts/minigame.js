document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector(".pokedex-footer");
  const pokebolaBtn = document.getElementById("pokebola-btn");
  const panel = document.getElementById("minigame-panel");
  const closeBtn = document.getElementById("minigame-close");

  const spriteImg = document.getElementById("mystery-sprite");
  const stageHint = document.getElementById("stage-hint");

  const guessForm = document.getElementById("guess-form");
  const guessInput = document.getElementById("guess-input");
  const guessSubmit = document.getElementById("guess-submit");
  const guessFeedback = document.getElementById("guess-feedback");
  const guessTries = document.getElementById("guess-tries");
  const hintBtn = document.getElementById("hint-btn");
  const hintsDisplay = document.getElementById("hints-display");
  const rerollBtn = document.getElementById("reroll-btn");

  if (!footer || !pokebolaBtn || !panel) return;

  let pokemonList = [];
  let currentPokemon = null;
  let attempts = 0;
  let solved = false;
  let spinning = false;
  let isOpen = false;
  let hintsLeft = 3;
  let revealedIndices = [];

  async function loadPokemonList() {
    if (pokemonList.length) return pokemonList;
    try {
      const res = await fetch("/pokemon/api");
      const data = await res.json();
      pokemonList = Array.isArray(data) ? data.filter((p) => p && p.sprite) : [];
    } catch (err) {
      pokemonList = [];
    }
    return pokemonList;
  }

  function normalize(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.\-\s]/g, "");
  }

  function randomPokemon(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function saveState() {
    try {
      sessionStorage.setItem('minigame_state', JSON.stringify({
        open: isOpen,
        solved,
        attempts,
        hintsLeft,
        revealedIndices,
        currentName: currentPokemon ? currentPokemon.name : null,
        currentSprite: currentPokemon ? currentPokemon.sprite : null
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = sessionStorage.getItem('minigame_state');
      if (!raw) return;
      const s = JSON.parse(raw);
      solved = s.solved || false;
      attempts = s.attempts || 0;
      hintsLeft = typeof s.hintsLeft === 'number' ? s.hintsLeft : 3;
      revealedIndices = Array.isArray(s.revealedIndices) ? s.revealedIndices : [];
      if (s.currentName) {
        currentPokemon = { name: s.currentName, sprite: s.currentSprite || '' };
      }
      if (panel && s.open) {
        isOpen = true;
        footer.classList.add('footer-up');
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
        if (pokebolaBtn) pokebolaBtn.classList.add('no-bounce');
      }
      if (guessInput) guessInput.disabled = solved;
      if (guessSubmit) guessSubmit.disabled = solved;
      if (stageHint) stageHint.textContent = solved ? `É ${currentPokemon ? capitalize(currentPokemon.name) : ''}!` : "Quem é esse Pokémon?";
      if (guessFeedback) {
        guessFeedback.textContent = solved ? `Correto! Era ${currentPokemon ? capitalize(currentPokemon.name) : ''}.` : '';
        guessFeedback.className = solved ? 'guess-feedback ok' : 'guess-feedback';
      }
      if (guessTries) guessTries.textContent = solved ? `Descoberto em ${attempts} tentativa${attempts > 1 ? 's' : ''}.` : `Tentativas: ${attempts}`;
      if (spriteImg) {
        spriteImg.classList.remove('silhouette', 'spinning');
        if (currentPokemon && currentPokemon.sprite) spriteImg.src = currentPokemon.sprite.startsWith('/') ? currentPokemon.sprite : '/' + currentPokemon.sprite;
        if (solved) spriteImg.classList.add('revealed');
        else spriteImg.classList.add('silhouette');
      }
      if (hintBtn) {
        hintBtn.disabled = solved || hintsLeft <= 0;
        hintBtn.textContent = `Dica (${hintsLeft})`;
      }
      renderHints();
      if (hintsDisplay && currentPokemon) {
        const name = (currentPokemon.name || '').replace(/\s/g, '');
        const display = name.split('').map((ch, i) => {
          if (revealedIndices.includes(i)) return ch.toUpperCase();
          return '_';
        }).join(' ');
        hintsDisplay.textContent = display;
      }
    } catch (e) {}
  }

  function openPanel() {
    isOpen = true;
    footer.classList.add("footer-up");
    panel.classList.add("active");
    panel.setAttribute("aria-hidden", "false");
    if (pokebolaBtn) pokebolaBtn.classList.add("no-bounce");
    const hasState = sessionStorage.getItem('minigame_state');
    if (hasState) {
      loadState();
    } else {
      startNewRound();
    }
    saveState();
  }

  function closePanel() {
    isOpen = false;
    footer.classList.remove("footer-up");
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    if (pokebolaBtn) pokebolaBtn.classList.remove("no-bounce");
    saveState();
  }

  pokebolaBtn.addEventListener("click", () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener("click", closePanel);

  async function startNewRound() {
    solved = false;
    attempts = 0;
    guessFeedback.textContent = "";
    guessFeedback.className = "guess-feedback";
    guessTries.textContent = "";
    guessInput.value = "";
    guessInput.disabled = true;
    guessSubmit.disabled = true;
    stageHint.textContent = "Quem é esse Pokémon?";
    revealedIndices = [];
    if (hintBtn) {
      hintBtn.disabled = false;

    }
    renderHints();

    spriteImg.classList.remove("revealed", "shake");
    spriteImg.classList.add("silhouette");

    const list = await loadPokemonList();
    if (!list.length) {
      stageHint.textContent = "Não foi possível carregar os Pokémon.";
      return;
    }

    currentPokemon = randomPokemon(list);
    hintsLeft = Math.min(6, Math.max(3, Math.ceil((currentPokemon.name || "").replace(/\s/g, "").length / 3)));
    if (hintBtn) hintBtn.textContent = `Dica (${hintsLeft})`;
    spinReveal(list, currentPokemon);
    saveState();
  }

  function spriteUrl(p) {
    return p.sprite.startsWith("/") ? p.sprite : `/${p.sprite}`;
  }

  function spinReveal(list, finalPokemon) {
    spinning = true;
    hintBtn.disabled = true;
    spriteImg.classList.add("spinning");
    stageHint.textContent = "Um Pokémon selvagem apareceu...";

    let elapsed = 0;
    const totalDuration = 1900; 
    let delay = 55; 
    const maxDelay = 260;

    function step() {
      const randomP = randomPokemon(list);
      spriteImg.src = spriteUrl(randomP);

      elapsed += delay;
      delay = Math.min(maxDelay, delay * 1.18); 

      if (elapsed < totalDuration) {
        setTimeout(step, delay);
      } else {
        spriteImg.src = spriteUrl(finalPokemon);
        spriteImg.classList.remove("spinning");
        spinning = false;
        stageHint.textContent = "Quem é esse Pokémon?";
        guessInput.disabled = false;
        guessSubmit.disabled = false;
        guessInput.focus();
        hintBtn.disabled = false;
        renderHints();
      }
    }

    step();
  }

  guessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (spinning || solved || !currentPokemon) return;

    const guess = guessInput.value;
    if (!guess.trim()) return;

    attempts += 1;

    if (normalize(guess) === normalize(currentPokemon.name)) {
      handleCorrectGuess();
    } else {
      handleWrongGuess();
    }
  });

  function handleCorrectGuess() {
    console.log("SOLVED");
    solved = true;

    spriteImg.classList.remove("silhouette");
    spriteImg.classList.add("revealed");

    const displayName = capitalize(currentPokemon.name);
    stageHint.textContent = `É ${displayName}!`;

    guessFeedback.textContent = `Correto! Era ${displayName}.`;
    guessFeedback.className = "guess-feedback ok";

    guessInput.disabled = true;
    guessSubmit.disabled = true;
    guessTries.textContent = `Descoberto em ${attempts} tentativa${attempts > 1 ? "s" : ""}.`;

    if (hintsDisplay) {
      hintsDisplay.textContent = (currentPokemon.name || "").replace(/\s/g, " ").toUpperCase();
    }
    if (hintBtn) hintBtn.disabled = true;
    saveState();

  }

  function handleWrongGuess() {
    spriteImg.classList.remove("shake");
    void spriteImg.offsetWidth;
    spriteImg.classList.add("shake");

    guessFeedback.textContent = "Não foi dessa vez, tente de novo!";
    guessFeedback.className = "guess-feedback err";
    guessTries.textContent = `Tentativas: ${attempts}`;

    guessInput.value = "";
    guessInput.focus();
  }

  function renderHints() {
    if (!currentPokemon || !hintsDisplay) return;
    const name = currentPokemon.name || "";
    const letters = name.split("");
    const display = letters.map((ch, i) => {
      if (ch === " ") return " ";
      if (revealedIndices.includes(i)) return ch.toUpperCase();
      return "_";
    }).join(" ");
    hintsDisplay.textContent = display;
  }

  function applyHint() {
    if (!currentPokemon || hintsLeft <= 0 || revealedIndices.length >= (currentPokemon.name || "").replace(/\s/g, "").length) {
      if (hintBtn) hintBtn.disabled = true;
      return;
    }
    const name = (currentPokemon.name || "").replace(/\s/g, "");
    const hidden = [];
    for (let i = 0; i < name.length; i++) {
      if (!revealedIndices.includes(i)) hidden.push(i);
    }
    if (hidden.length === 0) {
      if (hintBtn) hintBtn.disabled = true;
      return;
    }
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    revealedIndices.push(pick);
    hintsLeft -= 1;
    if (hintsLeft <= 0 && hintBtn) hintBtn.disabled = true;
    if (hintBtn) hintBtn.textContent = `Dica (${hintsLeft})`;
    renderHints();
  }

  if (hintBtn) {
    hintBtn.addEventListener("click", applyHint);
  }

  if (rerollBtn) {
    rerollBtn.addEventListener("click", () => {
      if (isOpen && !spinning) {
        startNewRound();
      }
    });
  }

  function capitalize(str) {
    if (!str) return "";
    return str
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  loadState();
});
