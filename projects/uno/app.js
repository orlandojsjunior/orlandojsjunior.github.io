const COLORS = ["R", "G", "B", "Y"];
const COLOR_NAMES = {
  R: "Vermelho",
  G: "Verde",
  B: "Azul",
  Y: "Amarelo",
  W: "Livre"
};
const VALUE_LABELS = {
  SKIP: "Pula",
  REV: "Reverte",
  D2: "+2",
  WILD: "Cor",
  W4: "+4"
};

const state = {
  socket: null,
  connected: false,
  myRole: null,
  myIndex: null,
  roomCode: "",
  view: null,
  waitingCardId: null,
  lastRenderedAction: ""
};

const ui = {
  lobby: document.getElementById("lobby"),
  game: document.getElementById("game"),
  roleSelection: document.getElementById("roleSelection"),
  gameSetup: document.getElementById("gameSetup"),
  paiControls: document.getElementById("paiControls"),
  filhoControls: document.getElementById("filhoControls"),
  selectPai: document.getElementById("selectPai"),
  selectFilho: document.getElementById("selectFilho"),
  playerName: document.getElementById("playerName"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  status: document.getElementById("status"),
  roomCode: document.getElementById("roomCode"),
  connectionStatus: document.getElementById("connectionStatus"),
  myName: document.getElementById("myName"),
  opponentName: document.getElementById("opponentName"),
  myCount: document.getElementById("myCount"),
  opponentCount: document.getElementById("opponentCount"),
  myCards: document.getElementById("myCards"),
  opponentCards: document.getElementById("opponentCards"),
  discardPile: document.getElementById("discardPile"),
  drawBtn: document.getElementById("drawBtn"),
  unoBtn: document.getElementById("unoBtn"),
  restartBtn: document.getElementById("restartBtn"),
  activeColor: document.getElementById("activeColor"),
  turnLabel: document.getElementById("turnLabel"),
  log: document.getElementById("log"),
  colorPicker: document.getElementById("colorPicker")
};

function setStatus(text) {
  ui.status.textContent = text;
}

function setConnection(text) {
  ui.connectionStatus.textContent = text;
}

function send(type, payload = {}) {
  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    state.socket.send(JSON.stringify({ type, ...payload }));
  }
}

function wsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/projects/uno/ws`;
}

function connectSocket() {
  state.socket = new WebSocket(wsUrl());
  setConnection("Conectando ao servidor...");

  state.socket.addEventListener("open", () => {
    state.connected = true;
    setConnection("Servidor conectado");
    ui.createRoomBtn.disabled = false;
    ui.joinRoomBtn.disabled = false;
  });

  state.socket.addEventListener("close", () => {
    state.connected = false;
    ui.createRoomBtn.disabled = true;
    ui.joinRoomBtn.disabled = true;
    setConnection("Conexão encerrada");
    setStatus("Conexão com o servidor encerrada. Recarregue a página para tentar de novo.");
  });

  state.socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  });
}

function showGame() {
  ui.lobby.classList.add("hidden");
  ui.game.classList.remove("hidden");
}

function normalizeName() {
  const name = ui.playerName.value.trim();
  return name.slice(0, 24);
}

function cardLabel(card) {
  return VALUE_LABELS[card.value] || card.value;
}

function colorName(color) {
  return COLOR_NAMES[color] || "-";
}

function canPlay(card, topCard, activeColor) {
  if (!card || !topCard) {
    return false;
  }

  if (card.value === "WILD" || card.value === "W4") {
    return true;
  }

  return card.color === activeColor || card.value === topCard.value;
}

function appendLog(text) {
  if (!text) {
    return;
  }

  const entry = document.createElement("p");
  entry.textContent = text;
  ui.log.prepend(entry);
}

function openColorPicker(cardId) {
  state.waitingCardId = cardId;
  ui.colorPicker.classList.remove("hidden");
  ui.colorPicker.setAttribute("aria-hidden", "false");
}

function closeColorPicker() {
  state.waitingCardId = null;
  ui.colorPicker.classList.add("hidden");
  ui.colorPicker.setAttribute("aria-hidden", "true");
}

function cardMarkup(card, playable) {
  const label = cardLabel(card);
  const colorClass = `card-${card.color.toLowerCase()}`;
  const extra = playable ? "playable" : "";

  return `
    <button class="card ${colorClass} ${extra}" data-card-id="${card.id}" data-value="${card.value}" data-playable="${playable ? "true" : "false"}">
      <span class="small">${label}</span>
      <span class="big">${card.color === "W" ? "?" : label}</span>
      <span class="small">${card.color === "W" ? "Livre" : colorName(card.color)}</span>
    </button>
  `;
}

function renderState() {
  const view = state.view;
  if (!view || state.myIndex === null) {
    return;
  }

  const myPlayer = view.players[state.myIndex];
  const otherPlayer = view.players[(state.myIndex + 1) % 2];
  const topCard = view.discard[view.discard.length - 1];
  const isMyTurn = view.turn === state.myIndex && view.winner === null;

  ui.roomCode.textContent = view.roomCode;
  ui.myName.textContent = myPlayer.name;
  ui.opponentName.textContent = otherPlayer.name;
  ui.myCount.textContent = String(myPlayer.hand.length);
  ui.opponentCount.textContent = String(otherPlayer.hand.length);
  ui.activeColor.textContent = `Cor ativa: ${colorName(view.activeColor)}`;

  if (view.winner !== null) {
    ui.turnLabel.textContent = `Fim de jogo: ${view.players[view.winner].name} venceu!`;
    ui.restartBtn.classList.remove("hidden");
  } else {
    ui.turnLabel.textContent = isMyTurn ? "Sua vez" : "Vez do seu par";
    ui.restartBtn.classList.add("hidden");
  }

  ui.drawBtn.disabled = !isMyTurn;
  ui.unoBtn.disabled = !isMyTurn || myPlayer.hand.length !== 2;

  ui.discardPile.innerHTML = topCard ? cardMarkup(topCard, false) : "";
  ui.myCards.innerHTML = myPlayer.hand
    .map((card) => cardMarkup(card, isMyTurn && canPlay(card, topCard, view.activeColor)))
    .join("");

  ui.opponentCards.innerHTML = new Array(otherPlayer.hand.length)
    .fill("")
    .map(() => `<div class="card back"><span class="small">UNO</span><span class="big">?</span><span class="small">Online</span></div>`)
    .join("");

  if (view.lastAction && view.lastAction !== state.lastRenderedAction) {
    state.lastRenderedAction = view.lastAction;
    appendLog(view.lastAction);
  }
}

function handleMessage(message) {
  switch (message.type) {
    case "hello":
      setStatus(message.message);
      break;
    case "room_created":
      state.myRole = "pai";
      state.myIndex = 0;
      state.roomCode = message.roomCode;
      showGame();
      ui.roomCode.textContent = message.roomCode;
      setStatus(message.message);
      break;
    case "joined":
      state.myRole = "filho";
      state.myIndex = 1;
      state.roomCode = message.roomCode;
      showGame();
      ui.roomCode.textContent = message.roomCode;
      setStatus(message.message);
      break;
    case "status":
      if (message.message) {
        setConnection(message.message);
      }
      break;
    case "state":
      state.view = message.state;
      renderState();
      break;
    case "error":
      setStatus(message.message);
      break;
    default:
      break;
  }
}

function bindEvents() {
  ui.createRoomBtn.disabled = true;
  ui.joinRoomBtn.disabled = true;

  ui.selectPai.addEventListener("click", () => {
    state.myRole = "pai";
    ui.roleSelection.classList.add("hidden");
    ui.gameSetup.classList.remove("hidden");
    ui.paiControls.classList.remove("hidden");
    ui.filhoControls.classList.add("hidden");
    setStatus("Você é o PAI. Digite seu nome e crie a sala.");
  });

  ui.selectFilho.addEventListener("click", () => {
    state.myRole = "filho";
    ui.roleSelection.classList.add("hidden");
    ui.gameSetup.classList.remove("hidden");
    ui.paiControls.classList.add("hidden");
    ui.filhoControls.classList.remove("hidden");
    setStatus("Você é o FILHO. Digite seu nome e entre com o código da sala.");
  });

  ui.createRoomBtn.addEventListener("click", () => {
    const name = normalizeName();
    if (!name) {
      setStatus("Digite um nome para criar a sala.");
      return;
    }

    send("create", { name });
  });

  ui.joinRoomBtn.addEventListener("click", () => {
    const name = normalizeName();
    const roomCode = ui.roomCodeInput.value.trim().toUpperCase();

    if (!name) {
      setStatus("Digite um nome para entrar na sala.");
      return;
    }

    if (!roomCode) {
      setStatus("Informe o código da sala.");
      return;
    }

    send("join", { name, roomCode });
  });

  ui.drawBtn.addEventListener("click", () => send("draw"));
  ui.unoBtn.addEventListener("click", () => send("uno"));
  ui.restartBtn.addEventListener("click", () => send("restart"));

  ui.myCards.addEventListener("click", (event) => {
    const cardButton = event.target.closest(".card");
    if (!cardButton || cardButton.dataset.playable !== "true") {
      return;
    }

    const cardId = cardButton.dataset.cardId;
    const value = cardButton.dataset.value;

    if (value === "WILD" || value === "W4") {
      openColorPicker(cardId);
      return;
    }

    send("play", { cardId, chosenColor: null });
  });

  ui.colorPicker.addEventListener("click", (event) => {
    const colorButton = event.target.closest(".color-choice");
    if (!colorButton || !state.waitingCardId) {
      return;
    }

    const chosenColor = colorButton.dataset.color;
    send("play", { cardId: state.waitingCardId, chosenColor });
    closeColorPicker();
  });

  ui.colorPicker.addEventListener("click", (event) => {
    if (event.target === ui.colorPicker) {
      closeColorPicker();
    }
  });
}

function init() {
  bindEvents();
  connectSocket();
  setStatus("Escolha seu papel para começar.");
}

document.addEventListener("DOMContentLoaded", init);
