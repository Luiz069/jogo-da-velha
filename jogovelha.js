/***** 1) CONFIGURE SEU FIREBASE AQUI *****/
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQg25vRING8ArhL9HbTEsamOH1ckV8WGk",
  authDomain: "jogo-cfdce.firebaseapp.com",
  databaseURL: "https://jogo-cfdce-default-rtdb.firebaseio.com",
  projectId: "jogo-cfdce",
  storageBucket: "jogo-cfdce.firebasestorage.app",
  messagingSenderId: "813995028958",
  appId: "1:813995028958:web:6dd4ff0637bd4e97152d4f",
  measurementId: "G-1B4N9HN58Z",
};
/******************************************/

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/** UI refs */
const btnCreate = document.getElementById("createRoom");
const btnJoin = document.getElementById("joinRoom");
const inputCode = document.getElementById("roomCode");
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const resetBtn = document.getElementById("reset");
const youAreEl = document.getElementById("youAre");
const turnEl = document.getElementById("turn");
const statusEl = document.getElementById("status");

/** Estado local */
const myId = cryptoRandomId();
let mySymbol = null; // 'X' ou 'O'
let roomCode = null; // código da sala ex: "ABCD"
let unsub = null; // para parar de escutar quando trocar de sala

/** Helpers */
function cryptoRandomId() {
  // gera um ID simples
  return Math.random().toString(36).slice(2, 9);
}
function newEmptyGame() {
  return {
    board: Array(9).fill(""),
    turn: "X",
    players: { X: null, O: null },
    winner: null,
  };
}
function winLines() {
  return [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
}

/** Renderiza UI */
function render(state) {
  // Tabuleiro
  state.board.forEach((v, i) => (cells[i].textContent = v));

  // Turno
  turnEl.textContent = state.turn ?? "—";

  // Quem sou eu
  youAreEl.textContent = mySymbol ?? "—";

  // Status
  if (state.winner) {
    statusEl.textContent =
      state.winner === "EMPATE"
        ? "Deu velha 🤝"
        : `Vitória de ${state.winner} 🏆`;
  } else if (!state.players.X || !state.players.O) {
    statusEl.textContent = "Esperando os jogadores entrarem…";
  } else {
    statusEl.textContent =
      mySymbol === state.turn ? "Seu turno!" : "Turno do oponente…";
  }

  // Habilita/desabilita jogada
  const podeJogar =
    !state.winner &&
    mySymbol === state.turn &&
    state.players[mySymbol] === myId;
  cells.forEach((c) => (c.disabled = !podeJogar || c.textContent !== ""));
}

/** Cria sala (gera código e inicializa no DB) */
btnCreate.addEventListener("click", async () => {
  const code = Math.random().toString(36).toUpperCase().slice(2, 6);
  const roomRef = db.ref(`rooms/${code}`);

  await roomRef.set(newEmptyGame());
  await roomRef.child("players/X").set(myId); // quem cria entra como X
  mySymbol = "X";
  roomCode = code;
  inputCode.value = code;

  listenRoom(code);
});

/** Entra em sala existente */
btnJoin.addEventListener("click", async () => {
  const code = inputCode.value.trim().toUpperCase();
  if (!code) return alert("Informe o código da sala!");

  const roomRef = db.ref(`rooms/${code}`);
  const snap = await roomRef.get();
  if (!snap.exists()) return alert("Sala não encontrada.");

  const state = snap.val();
  if (!state.players.X) mySymbol = "X";
  else if (!state.players.O) mySymbol = "O";
  else return alert("Sala já está cheia.");

  await roomRef.child(`players/${mySymbol}`).set(myId);
  roomCode = code;

  listenRoom(code);
});

/** Assina atualizações da sala */
function listenRoom(code) {
  if (unsub) unsub(); // para listener antigo
  const roomRef = db.ref(`rooms/${code}`);

  const handler = roomRef.on("value", (snap) => {
    const state = snap.val();
    if (!state) return;

    render(state);
  });

  unsub = () => roomRef.off("value", handler);
}

/** Clique numa célula */
cells.forEach((cell) => {
  cell.addEventListener("click", async () => {
    if (!roomCode || mySymbol == null) return;

    const i = Number(cell.dataset.i);
    const roomRef = db.ref(`rooms/${roomCode}`);

    await roomRef.transaction((state) => {
      if (!state || state.winner) return state;

      // só joga se for meu turno e célula vazia
      const isMyTurn = state.turn === mySymbol;
      if (!isMyTurn || state.board[i]) return state;

      state.board[i] = mySymbol;

      // Verifica vitória
      const won = winLines().some(
        ([a, b, c]) =>
          state.board[a] &&
          state.board[a] === state.board[b] &&
          state.board[a] === state.board[c]
      );
      if (won) {
        state.winner = mySymbol;
      } else if (state.board.every((x) => x)) {
        state.winner = "EMPATE";
      } else {
        state.turn = state.turn === "X" ? "O" : "X";
      }
      return state;
    });
  });
});

/** Reiniciar partida (mesma sala) */
document.getElementById("reset").addEventListener("click", async () => {
  if (!roomCode) return;
  const roomRef = db.ref(`rooms/${roomCode}`);
  await roomRef.child("board").set(Array(9).fill(""));
  await roomRef.child("turn").set("X");
  await roomRef.child("winner").set(null);
});
