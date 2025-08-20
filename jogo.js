// Importa as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Sua configuração do Firebase
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -----------------------------
// Exemplos de uso do Realtime Database
// -----------------------------

// 1. Criar uma sala com um ID e salvar jogador
function criarSala(codigoSala, jogadorNome) {
  set(ref(db, "salas/" + codigoSala), {
    jogador1: jogadorNome,
    placar1: 0,
    jogador2: null,
    placar2: 0,
  });
}

// 2. Entrar em uma sala existente
function entrarSala(codigoSala, jogadorNome) {
  set(ref(db, "salas/" + codigoSala + "/jogador2"), jogadorNome);
  set(ref(db, "salas/" + codigoSala + "/placar2"), 0);
}

// 3. Ler dados em tempo real
function ouvirSala(codigoSala) {
  const salaRef = ref(db, "salas/" + codigoSala);
  onValue(salaRef, (snapshot) => {
    const dados = snapshot.val();
    console.log("Atualização da sala:", dados);
  });
}
