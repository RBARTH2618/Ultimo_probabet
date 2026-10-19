/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: server.js - Servidor HTTP e Ponto de Entrada da Aplicação
 * Autores: Antigravity & João Lucas (Trabalho Acadêmico - UniRV)
 * Disciplina: Desenvolvimento de Software para Web | Prof. Me. Sergio Souza Novak
 * ==============================================================================
 * 
 * Responsabilidade Única: Inicializar servidor HTTP Express e Gateway WebSocket.
 * Toda a lógica de negócio, persistência e motor estão modularizadas em:
 *  - /config     -> Constantes e dicionário de eventos (constants.js)
 *  - /data       -> Repositório de banco em memória (db.js) e seeds (initialData.js)
 *  - /services   -> Usuários, partidas, apostas, cash out e liquidação
 *  - /engine     -> Cálculo de odds (oddsCalculator.js) e motor temporal (matchEngine.js)
 *  - /ws         -> Gateway WebSocket (wsGateway.js) e roteador de eventos (wsRouter.js)
 * ==============================================================================
 */

const http = require("http");
const path = require("path");
const express = require("express");

const wsGateway = require("./ws/wsGateway");
const { handleClientMessage } = require("./ws/wsRouter");
const MatchEngine = require("./engine/matchEngine");
const userService = require("./services/userService");
const matchService = require("./services/matchService");
const cashoutService = require("./services/cashoutService");
const { WS_EVENTS } = require("./config/constants");

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(express.static(publicDir));

// ==============================================================================
// ROTAS HTTP DIDÁTICAS
// ==============================================================================

app.get(["/", "/index.html", "/tela1-odds.html"], (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get(["/betslip", "/betslip.html", "/tela2-betslip.html"], (req, res) => {
  res.sendFile(path.join(publicDir, "betslip.html"));
});

app.get(["/wallet", "/wallet.html", "/tela3-cashout.html"], (req, res) => {
  res.sendFile(path.join(publicDir, "wallet.html"));
});

// Endpoint de diagnóstico
app.get("/api/status", (req, res) => {
  res.json({
    sistema: "PROBABET (Ws2) - UniRV",
    status: "OPERACIONAL",
    arquitetura: "MODULAR (Clean Layered Architecture)",
    clientesConectados: wsGateway.getConnectedCount(),
    partidasAtivas: matchService.getAllMatches().length,
    ranking: userService.getRanking()
  });
});

// Servidor HTTP Compartilhado
const server = http.createServer(app);

// Inicializa WebSocket Gateway sobre o servidor HTTP
const wss = wsGateway.init(server);

// Inicializa o Motor de Partidas com callbacks desacoplados
const engine = new MatchEngine(
  (payload) => wsGateway.broadcast(payload),
  (userId, payload) => wsGateway.notifyUser(userId, payload)
);
engine.start();

// ==============================================================================
// CICLO DE VIDA DAS CONEXÕES WEBSOCKET
// ==============================================================================

wss.on("connection", (ws, req) => {
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const requestedUserId = urlParams.get("userId") || `user_${Math.floor(1000 + Math.random() * 9000)}`;
  const requestedName = urlParams.get("userName") || `Apostador #${requestedUserId.slice(-4)}`;

  // [RF-01] Vincula ou recupera a sessão do apostador
  const user = userService.createOrGetUser(requestedUserId, requestedName, 100.00);
  wsGateway.registerClient(ws, { userId: user.id_apostador, userName: user.nome_completo });

  console.log(`🔌 [WS CONECTADO] Apostador: ${user.nome_completo} (ID: ${user.id_apostador}) | Saldo: R$ ${user.saldo_ficticio.toFixed(2)}`);

  // [RF-01] Handshake inicial
  ws.send(JSON.stringify({
    event: WS_EVENTS.HANDSHAKE_SUCCESS,
    userId: user.id_apostador,
    userName: user.nome_completo,
    balance: user.saldo_ficticio,
    matches: matchService.getAllMatches(),
    bets: cashoutService.getUserBets(user.id_apostador),
    ranking: userService.getRanking(),
    timestamp: new Date().toISOString()
  }));

  // Notifica ranking atualizado
  wsGateway.broadcast({
    event: WS_EVENTS.RANKING_UPDATE,
    ranking: userService.getRanking()
  });

  // Mensagens recebidas
  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());
      handleClientMessage(ws, message, engine);
    } catch (err) {
      console.error("❌ [WS ERRO] Formato JSON inválido:", err.message);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        message: "Formato de mensagem JSON inválido."
      }));
    }
  });

  // Desconexão
  ws.on("close", () => {
    const meta = wsGateway.unregisterClient(ws);
    if (meta) {
      console.log(`👋 [WS DESCONECTADO] Apostador: ${meta.userName} (${meta.userId})`);
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ [WS ERRO NA CONEXÃO]:", err.message);
  });
});

// Inicialização do Servidor
server.listen(PORT, () => {
  console.log(`
  ==============================================================
  🚀 PROBABET - PLATAFORMA DE APOSTAS ESPORTIVAS EM TEMPO REAL
  --------------------------------------------------------------
  🌐 Servidor Web HTTP:  http://localhost:${PORT}
  ⚡ Gateway WebSocket:  ws://localhost:${PORT}
  📚 Trabalho Acadêmico: UniRV - Prof. Me. Sergio Souza Novak
  👥 Desenvolvedores:    João Lucas & Antigravity
  🧩 Arquitetura:        100% Modularizada (SRP & Camadas Limpas)
  ==============================================================
  `);
});

module.exports = { app, server, engine };
