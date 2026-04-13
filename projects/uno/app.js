// ===== CONFIGURAÇÃO DE SOM =====
const soundManager = {
  enabled: localStorage.getItem('unoSoundEnabled') !== 'false',
  
  playSound(type) {
    if (!this.enabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    switch(type) {
      case 'play':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;
      case 'draw':
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
      case 'uno':
        oscillator.frequency.value = 1200;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
      case 'win':
        for (let i = 0; i < 3; i++) {
          const freqs = [800, 1000, 1200];
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freqs[i];
          gain.gain.setValueAtTime(0.2, now + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.3);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.3);
        }
        break;
    }
  }
};

// ===== CONFIGURAÇÃO DE DARK MODE =====
const themeManager = {
  isDark: localStorage.getItem('unoDarkMode') === 'true',
  
  init() {
    if (this.isDark) {
      document.body.classList.add('dark-mode');
      document.getElementById('toggleDarkMode').textContent = '☀️';
    }
  },
  
  toggle() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('unoDarkMode', this.isDark);
    document.getElementById('toggleDarkMode').textContent = this.isDark ? '☀️' : '🌙';
  }
};

// ===== RASTREAMENTO DE PONTOS =====
const scoreTracker = {
  scores: JSON.parse(localStorage.getItem('unoScores')) || {},
  
  getScore(playerName) {
    return this.scores[playerName] || 0;
  },
  
  addScore(playerName, points) {
    this.scores[playerName] = (this.scores[playerName] || 0) + points;
    localStorage.setItem('unoScores', JSON.stringify(this.scores));
  },
  
  getDisplay(p1Name, p2Name) {
    const p1Score = this.getScore(p1Name);
    const p2Score = this.getScore(p2Name);
    return `📊 ${p1Name}: ${p1Score} | ${p2Name}: ${p2Score}`;
  },
  
  reset() {
    this.scores = {};
    localStorage.removeItem('unoScores');
  }
};

// ===== TIMER DE TURNO =====
const turnTimer = {
  maxTime: 30,
  remainingTime: 30,
  interval: null,
  
  start(callback) {
    this.remainingTime = this.maxTime;
    this.updateDisplay();
    
    this.interval = setInterval(() => {
      this.remainingTime--;
      this.updateDisplay();
      
      if (this.remainingTime <= 0) {
        this.stop();
        callback();
      }
    }, 1000);
  },
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },
  
  updateDisplay() {
    const timerEl = document.getElementById('turnTimer');
    if (timerEl) {
      timerEl.textContent = String(this.remainingTime);
      timerEl.classList.toggle('warning', this.remainingTime <= 5);
    }
  }
};

// ===== CÓDIGO ORIGINAL (LIGEIRAMENTE MODIFICADO) =====
const COLORS = ["R", "G", "B", "Y"];
const VALUE_LABEL = {
  SKIP: "PULA",
  REV: "REV",
  D2: "+2",
  WILD: "COR",
  W4: "+4"
};

const ui = {
  lobby: document.getElementById("lobby"),
  game: document.getElementById("game"),
  playerName: document.getElementById("playerName"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  status: document.getElementById("status"),
  roomCode: document.getElementById("roomCode"),
  connectionLabel: document.getElementById("connectionLabel"),
  myName: document.getElementById("myName"),
  opponentName: document.getElementById("opponentName"),
  myCount: document.getElementById("myCount"),
  opponentCount: document.getElementById("opponentCount"),
  myCards: document.getElementById("myCards"),
  opponentCards: document.getElementById("opponentCards"),
  discardPile: document.getElementById("discardPile"),
  drawBtn: document.getElementById("drawBtn"),
  unoBtn: document.getElementById("unoBtn"),
  activeColor: document.getElementById("activeColor"),
  turnLabel: document.getElementById("turnLabel"),
  log: document.getElementById("log"),
  colorPicker: document.getElementById("colorPicker"),
  scoreDisplay: document.getElementById("scoreDisplay"),
  toggleSound: document.getElementById("toggleSound"),
  toggleDarkMode: document.getElementById("toggleDarkMode")
};

const app = {
  peer: null,
  conn: null,
  isHost: false,
  myIndex: -1,
  myName: "",
  roomCode: "",
  hostState: null,
  viewState: null,
  waitingCardId: null
};

function setStatus(text) {
  ui.status.textContent = text;
}

function addLog(text) {
  const p = document.createElement("p");
  p.textContent = text;
  ui.log.prepend(p);
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function createDeck() {
  const deck = [];
  let idCount = 0;

  for (const color of COLORS) {
    deck.push({ id: `C${idCount++}`, color, value: "0" });

    for (let n = 1; n <= 9; n += 1) {
      deck.push({ id: `C${idCount++}`, color, value: String(n) });
      deck.push({ id: `C${idCount++}`, color, value: String(n) });
    }

    ["SKIP", "REV", "D2"].forEach((action) => {
      deck.push({ id: `C${idCount++}`, color, value: action });
      deck.push({ id: `C${idCount++}`, color, value: action });
    });
  }

  for (let i = 0; i < 4; i += 1) {
    deck.push({ id: `W${idCount++}`, color: "W", value: "WILD" });
    deck.push({ id: `W${idCount++}`, color: "W", value: "W4" });
  }

  shuffle(deck);
  return deck;
}

function buildInitialState(hostName, guestName) {
  const drawPile = createDeck();
  const players = [
    { name: hostName, hand: [] },
    { name: guestName, hand: [] }
  ];

  for (let i = 0; i < 7; i += 1) {
    players[0].hand.push(drawPile.pop());
    players[1].hand.push(drawPile.pop());
  }

  let firstCard = drawPile.pop();
  while (firstCard.value === "WILD" || firstCard.value === "W4") {
    drawPile.unshift(firstCard);
    firstCard = drawPile.pop();
  }

  return {
    players,
    drawPile,
    discard: [firstCard],
    activeColor: firstCard.color,
    turn: 0,
    winner: null,
    saidUno: [false, false],
    lastAction: "Partida iniciada"
  };
}

function cardLabel(card) {
  return VALUE_LABEL[card.value] || card.value;
}

function colorName(color) {
  return (
    {
      R: "Vermelho",
      G: "Verde",
      B: "Azul",
      Y: "Amarelo",
      W: "Livre"
    }[color] || "-"
  );
}

function canPlay(card, topCard, activeColor) {
  if (card.value === "WILD" || card.value === "W4") {
    return true;
  }

  return card.color === activeColor || card.value === topCard.value;
}

function ensureDrawPile(state) {
  if (state.drawPile.length > 0) {
    return;
  }

  const top = state.discard.pop();
  const recycle = state.discard;
  shuffle(recycle);
  state.drawPile = recycle;
  state.discard = [top];
}

function drawCards(state, playerIndex, count) {
  for (let i = 0; i < count; i += 1) {
    ensureDrawPile(state);
    const card = state.drawPile.pop();
    if (!card) {
      break;
    }
    state.players[playerIndex].hand.push(card);
  }
}

function advanceTurn(state, steps) {
  state.turn = (state.turn + steps) % 2;
}

function applyCardEffect(state, card, chosenColor) {
  if (card.value === "SKIP" || card.value === "REV") {
    advanceTurn(state, 2);
    return;
  }

  if (card.value === "D2") {
    const target = (state.turn + 1) % 2;
    drawCards(state, target, 2);
    advanceTurn(state, 2);
    return;
  }

  if (card.value === "W4") {
    const target = (state.turn + 1) % 2;
    drawCards(state, target, 4);
    state.activeColor = chosenColor;
    advanceTurn(state, 2);
    return;
  }

  if (card.value === "WILD") {
    state.activeColor = chosenColor;
    advanceTurn(state, 1);
    return;
  }

  state.activeColor = card.color;
  advanceTurn(state, 1);
}

function hostPlayCard(playerIndex, cardId, chosenColor) {
  const state = app.hostState;

  if (!state || state.winner !== null || playerIndex !== state.turn) {
    return;
  }

  const hand = state.players[playerIndex].hand;
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx === -1) {
    return;
  }

  const card = hand[idx];
  const top = state.discard[state.discard.length - 1];
  if (!canPlay(card, top, state.activeColor)) {
    return;
  }

  if ((card.value === "WILD" || card.value === "W4") && !chosenColor) {
    return;
  }

  hand.splice(idx, 1);
  state.discard.push(card);

  if (card.value !== "WILD" && card.value !== "W4") {
    state.activeColor = card.color;
  }

  const beforeAdvancePlayer = state.turn;
  applyCardEffect(state, card, chosenColor);

  if (hand.length === 1 && !state.saidUno[playerIndex]) {
    drawCards(state, playerIndex, 2);
    state.lastAction = `${state.players[playerIndex].name} esqueceu UNO e comprou 2 cartas.`;
  } else {
    state.lastAction = `${state.players[playerIndex].name} jogou ${colorName(card.color)} ${cardLabel(card)}.`;
  }

  state.saidUno[beforeAdvancePlayer] = false;

  if (hand.length === 0) {
    state.winner = playerIndex;
    state.lastAction = `${state.players[playerIndex].name} venceu a partida!`;
    soundManager.playSound('win');
    updateScoreDisplay();
  }

  soundManager.playSound('play');
  broadcastState();
}

function hostDrawOne(playerIndex) {
  const state = app.hostState;
  if (!state || state.winner !== null || playerIndex !== state.turn) {
    return;
  }

  drawCards(state, playerIndex, 1);
  state.saidUno[playerIndex] = false;
  state.lastAction = `${state.players[playerIndex].name} comprou 1 carta.`;
  advanceTurn(state, 1);
  soundManager.playSound('draw');
  broadcastState();
}

function hostCallUno(playerIndex) {
  const state = app.hostState;
  if (!state || state.winner !== null || playerIndex !== state.turn) {
    return;
  }

  if (state.players[playerIndex].hand.length === 2) {
    state.saidUno[playerIndex] = true;
    state.lastAction = `${state.players[playerIndex].name} gritou UNO!`;
    soundManager.playSound('uno');
    broadcastState();
  }
}

function cardToHtml(card, isPlayable) {
  return `
    <div class="card c-${card.color} ${isPlayable ? "playable" : ""}" data-id="${card.id}">
      <div class="small">${cardLabel(card)}</div>
      <div class="big">${cardLabel(card)}</div>
      <div class="small">${colorName(card.color)}</div>
    </div>
  `;
}

function backCardHtml() {
  return `
    <div class="card">
      <div class="small">UNO</div>
      <div class="big">?</div>
      <div class="small">Online</div>
    </div>
  `;
}

function updateScoreDisplay() {
  const p1Name = app.viewState.players[0].name;
  const p2Name = app.viewState.players[1].name;
  ui.scoreDisplay.textContent = scoreTracker.getDisplay(p1Name, p2Name);
}

function render() {
  const state = app.viewState;
  if (!state) {
    return;
  }

  ui.myName.textContent = state.players[app.myIndex].name;
  ui.opponentName.textContent = state.players[(app.myIndex + 1) % 2].name;
  ui.myCount.textContent = String(state.players[app.myIndex].hand.length);
  ui.opponentCount.textContent = String(state.players[(app.myIndex + 1) % 2].hand.length);

  const top = state.discard[state.discard.length - 1];
  ui.discardPile.innerHTML = cardToHtml(top, false);
  ui.activeColor.textContent = `Cor ativa: ${colorName(state.activeColor)}`;

  const isMyTurn = state.turn === app.myIndex;
  
  if (state.winner !== null) {
    ui.turnLabel.innerHTML = `Fim de jogo: <strong>${state.players[state.winner].name}</strong> venceu!`;
    turnTimer.stop();
  } else {
    if (isMyTurn) {
      ui.turnLabel.innerHTML = `Sua vez <span id="turnTimer" class="turn-timer">30</span>`;
      turnTimer.start(() => {
        if (app.isHost) {
          hostDrawOne(app.myIndex);
        } else {
          send({ type: "action", action: "draw", playerIndex: app.myIndex });
        }
      });
    } else {
      ui.turnLabel.textContent = "Vez do adversario...";
      turnTimer.stop();
    }
  }

  const myHand = state.players[app.myIndex].hand;
  ui.myCards.innerHTML = myHand
    .map((card) => cardToHtml(card, isMyTurn && canPlay(card, top, state.activeColor) && state.winner === null))
    .join("");

  const enemyCount = state.players[(app.myIndex + 1) % 2].hand.length;
  ui.opponentCards.innerHTML = new Array(enemyCount).fill("").map(backCardHtml).join("");

  ui.drawBtn.disabled = !isMyTurn || state.winner !== null;
  ui.unoBtn.disabled = !isMyTurn || state.winner !== null || myHand.length !== 2;

  updateScoreDisplay();

  if (state.lastAction) {
    addLog(state.lastAction);
    state.lastAction = "";
  }
}

function send(data) {
  if (app.conn && app.conn.open) {
    app.conn.send(data);
  }
}

function broadcastState() {
  app.viewState = JSON.parse(JSON.stringify(app.hostState));
  render();
  send({ type: "state", state: app.hostState });
}

function startGameView() {
  ui.lobby.classList.add("hidden");
  ui.game.classList.remove("hidden");
  ui.roomCode.textContent = app.roomCode;
  ui.connectionLabel.textContent = "Conectado ✓";
}

function handleAction(msg) {
  if (!app.isHost || !msg || !msg.action) {
    return;
  }

  if (msg.action === "play") {
    hostPlayCard(msg.playerIndex, msg.cardId, msg.chosenColor);
    return;
  }

  if (msg.action === "draw") {
    hostDrawOne(msg.playerIndex);
    return;
  }

  if (msg.action === "uno") {
    hostCallUno(msg.playerIndex);
  }
}

function setupConn(conn) {
  app.conn = conn;

  conn.on("open", () => {
    if (!app.isHost) {
      send({ type: "join", name: app.myName });
      startGameView();
    }

    ui.connectionLabel.textContent = "Conectado ✓";
  });

  conn.on("data", (data) => {
    if (!data || typeof data !== "object") {
      return;
    }

    if (app.isHost && data.type === "join") {
      app.hostState = buildInitialState(app.myName, data.name || "Convidado");
      app.viewState = JSON.parse(JSON.stringify(app.hostState));
      startGameView();
      broadcastState();
      return;
    }

    if (app.isHost && data.type === "action") {
      handleAction(data);
      return;
    }

    if (!app.isHost && data.type === "state") {
      app.viewState = data.state;
      render();
    }
  });

  conn.on("close", () => {
    ui.connectionLabel.textContent = "Conexao encerrada ✗";
    addLog("Conexao foi encerrada.");
    turnTimer.stop();
  });

  conn.on("error", () => {
    ui.connectionLabel.textContent = "Erro de conexao ⚠";
    addLog("Erro na conexao entre os jogadores.");
  });
}

function validateName() {
  const name = ui.playerName.value.trim();
  if (!name) {
    setStatus("Informe um nome para continuar.");
    return "";
  }
  return name.slice(0, 24);
}

ui.createRoomBtn.addEventListener("click", () => {
  const name = validateName();
  if (!name) {
    return;
  }

  app.isHost = true;
  app.myIndex = 0;
  app.myName = name;
  app.roomCode = randomRoomCode();
  ui.connectionLabel.textContent = "Aguardando seu filho entrar...";

  app.peer = new Peer(app.roomCode);

  app.peer.on("open", (id) => {
    setStatus(`Sala criada com sucesso. Codigo: ${id}`);
    ui.roomCode.textContent = id;
  });

  app.peer.on("connection", (conn) => {
    if (app.conn && app.conn.open) {
      conn.close();
      return;
    }
    setupConn(conn);
  });

  app.peer.on("error", () => {
    setStatus("Nao foi possivel criar a sala agora. Tente de novo.");
  });
});

ui.joinRoomBtn.addEventListener("click", () => {
  const name = validateName();
  const roomCode = ui.roomCodeInput.value.trim().toUpperCase();
  if (!name) {
    return;
  }
  if (!roomCode) {
    setStatus("Informe o codigo da sala para entrar.");
    return;
  }

  app.isHost = false;
  app.myIndex = 1;
  app.myName = name;
  app.roomCode = roomCode;

  app.peer = new Peer();

  app.peer.on("open", () => {
    const conn = app.peer.connect(roomCode, { reliable: true });
    setupConn(conn);
    setStatus("Tentando conectar na sala...");
  });

  app.peer.on("error", () => {
    setStatus("Nao foi possivel entrar na sala. Confira o codigo e tente novamente.");
  });
});

ui.drawBtn.addEventListener("click", () => {
  if (!app.viewState || app.viewState.turn !== app.myIndex || app.viewState.winner !== null) {
    return;
  }

  if (app.isHost) {
    hostDrawOne(app.myIndex);
  } else {
    send({ type: "action", action: "draw", playerIndex: app.myIndex });
  }
});

ui.unoBtn.addEventListener("click", () => {
  if (!app.viewState || app.viewState.turn !== app.myIndex || app.viewState.winner !== null) {
    return;
  }

  if (app.isHost) {
    hostCallUno(app.myIndex);
  } else {
    send({ type: "action", action: "uno", playerIndex: app.myIndex });
  }
});

ui.myCards.addEventListener("click", (event) => {
  const target = event.target.closest(".card");
  if (!target || !app.viewState || app.viewState.turn !== app.myIndex || app.viewState.winner !== null) {
    return;
  }

  const cardId = target.dataset.id;
  if (!cardId) {
    return;
  }

  const myHand = app.viewState.players[app.myIndex].hand;
  const selected = myHand.find((c) => c.id === cardId);
  if (!selected) {
    return;
  }

  const top = app.viewState.discard[app.viewState.discard.length - 1];
  if (!canPlay(selected, top, app.viewState.activeColor)) {
    return;
  }

  if (selected.value === "WILD" || selected.value === "W4") {
    app.waitingCardId = cardId;
    ui.colorPicker.classList.remove("hidden");
    return;
  }

  if (app.isHost) {
    hostPlayCard(app.myIndex, cardId, null);
  } else {
    send({ type: "action", action: "play", playerIndex: app.myIndex, cardId, chosenColor: null });
  }
});

ui.colorPicker.addEventListener("click", (event) => {
  event.stopPropagation();
  const button = event.target.closest(".color-btn");
  if (!button || !app.waitingCardId) {
    return;
  }

  const chosenColor = button.dataset.color;
  const cardId = app.waitingCardId;
  app.waitingCardId = null;
  ui.colorPicker.classList.add("hidden");

  if (app.isHost) {
    hostPlayCard(app.myIndex, cardId, chosenColor);
  } else {
    send({
      type: "action",
      action: "play",
      playerIndex: app.myIndex,
      cardId,
      chosenColor
    });
  }
});

// Fechar modal ao clicar fora dos botões
ui.colorPicker.addEventListener("click", (event) => {
  if (event.target === ui.colorPicker) {
    ui.colorPicker.classList.add("hidden");
    app.waitingCardId = null;
  }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
  updateScoreDisplay();
  
  ui.toggleSound.addEventListener('click', () => {
    soundManager.enabled = !soundManager.enabled;
    localStorage.setItem('unoSoundEnabled', soundManager.enabled);
    ui.toggleSound.textContent = soundManager.enabled ? '🔊' : '🔇';
    soundManager.playSound('play');
  });
  
  ui.toggleDarkMode.addEventListener('click', () => {
    themeManager.toggle();
  });
  
  // Resetar timer ao sair
  window.addEventListener('beforeunload', () => {
    turnTimer.stop();
  });
});
