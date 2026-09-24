document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector(".pokedex-footer");
  const pokebolaBtn = document.getElementById("pokebola-btn");
  const panel = document.getElementById("minigame-panel");
  const closeBtn = document.getElementById("minigame-close");
  const encontroTitle = document.querySelector("#encontro-title");

  const spriteImg = document.getElementById("mystery-sprite");
  const stageHint = document.getElementById("stage-hint");
  const stageGlow = document.querySelector(".stage-glow");

  const guessForm = document.getElementById("guess-form");
  const guessInput = document.getElementById("guess-input");
  const guessSubmit = document.getElementById("guess-submit");
  const guessFeedback = document.getElementById("guess-feedback");
  const guessTries = document.getElementById("guess-tries");
  const guessSuggestions = document.getElementById("guess-suggestions");
  const rerollBtn = document.getElementById("reroll-btn");

  const hintBudgetEl = document.getElementById("hint-budget");
  const hintTypeBtn = document.getElementById("hint-type-btn");
  const hintGenBtn = document.getElementById("hint-gen-btn");
  const hintLetterBtn = document.getElementById("hint-letter-btn");
  const hintTypesEl = document.getElementById("hint-types");
  const hintGenTextEl = document.getElementById("hint-gen-text");
  const hintsDisplay = document.getElementById("hints-display");

  if (!footer || !pokebolaBtn || !panel) return;

  const REGIOES = [
    { nome: "Kanto", min: 1, max: 151 },
    { nome: "Johto", min: 152, max: 251 },
    { nome: "Hoenn", min: 252, max: 386 },
    { nome: "Sinnoh", min: 387, max: 493 },
    { nome: "Unova", min: 494, max: 649 },
    { nome: "Kalos", min: 650, max: 721 },
    { nome: "Alola", min: 722, max: 809 },
    { nome: "Galar", min: 810, max: 905 },
    { nome: "Paldea", min: 906, max: 1025 },
  ];

  let pokemonList = [];
  let currentPokemon = null;
  let attempts = 0;
  let solved = false;
  let spinning = false;
  let isOpen = false;
  let hintsLeft = 3;
  let revealedIndices = [];
  let typeRevealed = false;
  let genRevealed = false;
  let streak = 0;
  let titleAnimation = null;
  let titleTransitionId = 0;
  let activeSuggestionIndex = -1;
  let currentSuggestions = [];

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

  function regionFor(id) {
    const found = REGIOES.find((r) => id >= r.min && id <= r.max);
    return found ? found.nome : null;
  }

  function generationLabel(generation) {
    if (!generation) return "";
    return generation.replace("generation-", "Geração ").replace(/-/g, " ").toUpperCase().replace("GERAÇÃO", "Geração");
  }

  function saveState() {
    try {
      sessionStorage.setItem('minigame_state', JSON.stringify({
        open: isOpen,
        solved,
        attempts,
        hintsLeft,
        revealedIndices,
        typeRevealed,
        genRevealed,
        currentName: currentPokemon ? currentPokemon.name : null,
        currentSprite: currentPokemon ? currentPokemon.sprite : null,
        currentId: currentPokemon ? currentPokemon.id : null,
        currentTypes: currentPokemon ? currentPokemon.types : null,
        currentGeneration: currentPokemon ? currentPokemon.generation : null,
        streak
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
      streak = typeof s.streak === "number" ? s.streak : 0;
      renderStreak("load");
      hintsLeft = typeof s.hintsLeft === 'number' ? s.hintsLeft : 3;
      revealedIndices = Array.isArray(s.revealedIndices) ? s.revealedIndices : [];
      typeRevealed = s.typeRevealed || false;
      genRevealed = s.genRevealed || false;
      if (s.currentName) {
        currentPokemon = {
          name: s.currentName,
          sprite: s.currentSprite || '',
          id: s.currentId || null,
          types: s.currentTypes || [],
          generation: s.currentGeneration || ''
        };
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
      renderHintButtons();
      renderHints();
      renderTypeHint();
      renderGenHint();
      if (solved) revealEverything();
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
    closeSuggestions();
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
    typeRevealed = false;
    genRevealed = false;
    closeSuggestions();

    spriteImg.classList.remove("revealed", "shake");
    spriteImg.classList.add("silhouette");

    const list = await loadPokemonList();
    if (!list.length) {
      stageHint.textContent = "Não foi possível carregar os Pokémon.";
      return;
    }

    currentPokemon = randomPokemon(list);
    hintsLeft = Math.min(6, Math.max(3, Math.ceil((currentPokemon.name || "").replace(/\s/g, "").length / 3)));
    renderHintButtons();
    renderHints();
    renderTypeHint();
    renderGenHint();
    spinReveal(list, currentPokemon);
    saveState();
  }

  function spriteUrl(p) {
    return p.sprite.startsWith("/") ? p.sprite : `/${p.sprite}`;
  }

  function spinReveal(list, finalPokemon) {
    spinning = true;
    setHintButtonsDisabled(true);
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
        renderHintButtons();
      }
    }

    step();
  }

  guessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitGuess(guessInput.value);
  });

  function submitGuess(rawGuess) {
    if (spinning || solved || !currentPokemon) return;

    const guess = rawGuess;
    if (!guess || !guess.trim()) return;

    closeSuggestions();
    attempts += 1;

    if (normalize(guess) === normalize(currentPokemon.name)) {
      handleCorrectGuess();
      renderStreak("add");
      saveState();
    } else {
      handleWrongGuess();
      renderStreak("reset");
      saveState();
    }
  }

  function handleCorrectGuess() {
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

    revealEverything();
    saveState();
  }

  function revealEverything() {
    typeRevealed = true;
    genRevealed = true;
    if (currentPokemon) {
      const cleanName = (currentPokemon.name || "").replace(/\s/g, "");
      revealedIndices = Array.from({ length: cleanName.length }, (_, i) => i);
    }
    renderHintButtons();
    renderHints();
    renderTypeHint();
    renderGenHint();
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
    if (hintsDisplay) {
      if (!currentPokemon) {
        hintsDisplay.textContent = "";
      } else {
        const name = (currentPokemon.name || "");
        const letters = name.split("");
        const display = letters.map((ch, i) => {
          if (ch === " " || ch === "-") return ch;
          if (solved || revealedIndices.includes(i)) return ch.toUpperCase();
          return "_";
        }).join(" ");
        hintsDisplay.textContent = display;
      }
    }
    if (hintBudgetEl) hintBudgetEl.textContent = `Dicas restantes: ${hintsLeft}`;
  }

  function renderTypeHint() {
    if (!hintTypesEl) return;
    hintTypesEl.innerHTML = "";
    if (!typeRevealed || !currentPokemon || !Array.isArray(currentPokemon.types)) return;
    currentPokemon.types.forEach((t) => {
      const span = document.createElement("span");
      span.className = "search-type t-" + (t ? t.toLowerCase() : "");
      span.textContent = t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
      hintTypesEl.appendChild(span);
    });
  }

  function renderGenHint() {
    if (!hintGenTextEl) return;
    if (!genRevealed || !currentPokemon) {
      hintGenTextEl.textContent = "";
      return;
    }
    const gen = generationLabel(currentPokemon.generation);
    const regiao = currentPokemon.id ? regionFor(currentPokemon.id) : null;
    const parts = [gen, regiao].filter(Boolean);
    hintGenTextEl.textContent = parts.join(" — ");
  }

  function setHintButtonsDisabled(disabled) {
    if (hintTypeBtn) hintTypeBtn.disabled = disabled;
    if (hintGenBtn) hintGenBtn.disabled = disabled;
    if (hintLetterBtn) hintLetterBtn.disabled = disabled;
  }

  function renderHintButtons() {
    if (!currentPokemon || solved) {
      setHintButtonsDisabled(true);
      return;
    }
    const cleanName = (currentPokemon.name || "").replace(/\s/g, "");
    const allLettersRevealed = revealedIndices.length >= cleanName.length;

    if (hintTypeBtn) hintTypeBtn.disabled = typeRevealed || hintsLeft <= 0;
    if (hintGenBtn) hintGenBtn.disabled = genRevealed || hintsLeft <= 0;
    if (hintLetterBtn) hintLetterBtn.disabled = allLettersRevealed || hintsLeft <= 0;
  }

  function spendHint() {
    hintsLeft -= 1;
    renderHints();
    renderHintButtons();
    saveState();
  }

  if (hintTypeBtn) {
    hintTypeBtn.addEventListener("click", () => {
      if (typeRevealed || hintsLeft <= 0 || !currentPokemon) return;
      typeRevealed = true;
      renderTypeHint();
      spendHint();
    });
  }

  if (hintGenBtn) {
    hintGenBtn.addEventListener("click", () => {
      if (genRevealed || hintsLeft <= 0 || !currentPokemon) return;
      genRevealed = true;
      renderGenHint();
      spendHint();
    });
  }

  if (hintLetterBtn) {
    hintLetterBtn.addEventListener("click", () => {
      if (!currentPokemon || hintsLeft <= 0) return;
      const name = (currentPokemon.name || "").replace(/\s/g, "");
      const hidden = [];
      for (let i = 0; i < name.length; i++) {
        if (!revealedIndices.includes(i)) hidden.push(i);
      }
      if (hidden.length === 0) {
        renderHintButtons();
        return;
      }
      const pick = hidden[Math.floor(Math.random() * hidden.length)];
      revealedIndices.push(pick);
      spendHint();
    });
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

  function closeSuggestions() {
    if (!guessSuggestions) return;
    guessSuggestions.innerHTML = "";
    guessSuggestions.classList.remove("active");
    activeSuggestionIndex = -1;
    currentSuggestions = [];
  }

  function renderSuggestions(matches) {
    if (!guessSuggestions) return;
    currentSuggestions = matches;
    activeSuggestionIndex = -1;
    guessSuggestions.innerHTML = "";

    if (!matches.length) {
      guessSuggestions.classList.remove("active");
      return;
    }

    matches.forEach((p) => {
      const item = document.createElement("div");
      item.className = "guess-suggestion";

      const img = document.createElement("img");
      img.className = "guess-suggestion-image";
      img.src = p.sprite ? spriteUrl(p) : "";
      img.alt = p.name || "";

      const name = document.createElement("span");
      name.className = "guess-suggestion-name";
      name.textContent = capitalize(p.name || "");

      item.appendChild(img);
      item.appendChild(name);

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        guessInput.value = p.name;
        closeSuggestions();
        submitGuess(p.name);
      });

      guessSuggestions.appendChild(item);
    });

    guessSuggestions.classList.add("active");
  }

  function updateSuggestions() {
    if (!guessInput || solved || spinning) {
      closeSuggestions();
      return;
    }
    const typed = normalize(guessInput.value);
    if (!typed) {
      closeSuggestions();
      return;
    }

    const matches = pokemonList
      .filter((p) => normalize(p.name).startsWith(typed))
      .slice(0, 8);

    renderSuggestions(matches);
  }

  if (guessInput) {
    guessInput.addEventListener("input", updateSuggestions);

    guessInput.addEventListener("keydown", (e) => {
      if (!guessSuggestions || !guessSuggestions.classList.contains("active")) return;
      const items = Array.from(guessSuggestions.querySelectorAll(".guess-suggestion"));
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
      } else if (e.key === "Escape") {
        closeSuggestions();
        return;
      } else {
        return;
      }

      items.forEach((it, i) => it.classList.toggle("active-option", i === activeSuggestionIndex));
      if (activeSuggestionIndex >= 0) {
        guessInput.value = currentSuggestions[activeSuggestionIndex].name;
      }
    });

    guessInput.addEventListener("blur", () => {
      setTimeout(closeSuggestions, 120);
    });

    guessInput.addEventListener("focus", updateSuggestions);
  }

  async function transitionEncounterTitle(nextText, color) {
    if (!encontroTitle) return;

    const transitionId = ++titleTransitionId;
    if (titleAnimation) {
      titleAnimation.cancel();
      titleAnimation = null;
    }

    const applyTitle = () => {
      encontroTitle.textContent = nextText;
      encontroTitle.style.color = color;
    };

    if (encontroTitle.textContent.toUpperCase() === nextText.toUpperCase()) {
      applyTitle();
      return;
    }

    const prefersReducedMotion = typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof encontroTitle.animate !== "function") {
      applyTitle();
      return;
    }

    try {
      titleAnimation = encontroTitle.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-6px)" }
        ],
        { duration: 140, easing: "ease-in", fill: "forwards" }
      );
      await titleAnimation.finished;

      if (transitionId !== titleTransitionId) return;
      titleAnimation.cancel();
      titleAnimation = null;
      applyTitle();

      titleAnimation = encontroTitle.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 180, easing: "ease-out" }
      );
      await titleAnimation.finished;

      if (transitionId === titleTransitionId) titleAnimation = null;
    } catch (e) {
      if (transitionId === titleTransitionId) {
        applyTitle();
        titleAnimation = null;
      }
    }
  }

  function renderStreak(type) {
    if (type === "add") {
      streak++;
    } else if (type === "reset") {
      streak = 0;
    } else if (type === "load") {
      streak = streak;
    }

    if (!stageGlow) return;

    if (!encontroTitle) return;

    let trainerTitle = "Treinador Amador";
    let titleColor = "";
    stageGlow.style.backgroundColor = "";

    if (streak >= 2 && streak < 3) {
      trainerTitle = "Treinador Intermediário";
      titleColor = "orange";
      stageGlow.style.backgroundColor = "orange";
    } else if (streak >= 3 && streak < 5) {
      trainerTitle = "Treinador Experiente";
      titleColor = "green";
      stageGlow.style.backgroundColor = "green";
    } else if (streak >= 5) {
      trainerTitle = "Mestre Pokemon";
      titleColor = "red";
      stageGlow.style.backgroundColor = "red";
    }

    transitionEncounterTitle(
      `ENCONTRO SELVAGEM (STREAK ${streak}) - ${trainerTitle}`,
      titleColor
    );
  }

  loadState();
});
