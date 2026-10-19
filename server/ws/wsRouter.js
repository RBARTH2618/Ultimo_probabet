/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: ws/wsRouter.js - Roteador de Mensagens do Cliente WebSocket
 * Responsabilidade Única: Despachar comandos do cliente para os serviços de domínio.
 * ==============================================================================
 */

const wsGateway = require("./wsGateway");
const bettingService = require("../services/bettingService");
const cashoutService = require("../services/cashoutService");
const userService = require("../services/userService");
const { WS_EVENTS } = require("../config/constants");

function handleClientMessage(ws, message, engine) {
  const meta = wsGateway.getClientMeta(ws);
  if (!meta) return;

  const { userId } = meta;

  switch (message.type) {
    // [RF-03] SUBMISSÃO DE APOSTA
    case WS_EVENTS.PLACE_BET: {
      console.log(`📝 [RECEBIDO PLACE_BET] Usuário: ${userId} | Valor: R$ ${message.valor} | Odd: ${message.odd} | Jogo: ${message.matchId}`);

      const result = bettingService.placeBet(userId, message);

      if (!result.success) {
        ws.send(JSON.stringify({
          type: WS_EVENTS.BET_REJECTED,
          code: result.code,
          message: result.message,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      ws.send(JSON.stringify({
        type: WS_EVENTS.BET_CONFIRMED,
        ticketId: result.ticketId,
        bet: result.bet,
        newBalance: result.newBalance,
        timestamp: result.timestamp
      }));

      ws.send(JSON.stringify({
        event: WS_EVENTS.BALANCE_UPDATE,
        balance: result.newBalance,
        timestamp: result.timestamp
      }));

      wsGateway.broadcast({
        event: WS_EVENTS.RANKING_UPDATE,
        ranking: userService.getRanking()
      });
      break;
    }

    // [RF-05 & RNF-01] CASH OUT
    case WS_EVENTS.CASH_OUT: {
      console.log(`💰 [RECEBIDO CASH_OUT] Bilhete #${message.betId} | Valor Solicitado: R$ ${message.requestedValue}`);

      const result = cashoutService.executeCashOut(
        userId,
        message.betId,
        message.matchId,
        message.requestedValue
      );

      if (!result.success) {
        console.warn(`⛔ [CASH_OUT RECUSADO] Motivo: ${result.message}`);
        ws.send(JSON.stringify({
          type: WS_EVENTS.CASH_OUT_REJECTED,
          betId: message.betId,
          code: result.code,
          reason: result.message,
          newOfferedValue: result.newOfferedValue || null,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      ws.send(JSON.stringify({
        type: WS_EVENTS.CASH_OUT_CONFIRMED,
        betId: result.betId,
        amount: result.amount,
        newBalance: result.newBalance,
        timestamp: result.timestamp
      }));

      ws.send(JSON.stringify({
        event: WS_EVENTS.BALANCE_UPDATE,
        balance: result.newBalance,
        timestamp: result.timestamp
      }));

      wsGateway.broadcast({
        event: WS_EVENTS.RANKING_UPDATE,
        ranking: userService.getRanking()
      });
      break;
    }

    // CONSULTA DA CARTEIRA
    case WS_EVENTS.GET_WALLET: {
      const user = userService.getUser(userId);
      const bets = cashoutService.getUserBets(userId);
      ws.send(JSON.stringify({
        type: WS_EVENTS.WALLET_INFO,
        balance: user ? user.saldo_ficticio : 0,
        bets: bets,
        timestamp: new Date().toISOString()
      }));
      break;
    }

    // DEMO: RESET DE SALDO
    case WS_EVENTS.RESET_BALANCE: {
      const novoSaldo = userService.resetUserBalance(userId, 100.00);
      ws.send(JSON.stringify({
        event: WS_EVENTS.BALANCE_UPDATE,
        balance: novoSaldo,
        message: "Saldo fictício redefinido para R$ 100,00 com sucesso!"
      }));
      wsGateway.broadcast({
        event: WS_EVENTS.RANKING_UPDATE,
        ranking: userService.getRanking()
      });
      break;
    }

    // DEMO: DISPARO MANUAL DE GOL
    case WS_EVENTS.DEMO_TRIGGER_GOAL: {
      const matchId = Number(message.matchId || 15);
      const team = message.team || "CASA";
      console.log(`🎯 [DEMO ACADÊMICA] Disparo manual de Gol solicitado para partida #${matchId} (${team})`);
      engine.triggerGoal(matchId, team, "Gol demonstrado ao vivo pelo apresentador!");
      break;
    }

    // DEMO: REINICIAR PARTIDA
    case WS_EVENTS.DEMO_RESET_MATCH: {
      const matchId = Number(message.matchId || 15);
      engine.resetMatch(matchId);
      break;
    }

    default:
      console.warn(`❓ [WS TIPO DESCONHECIDO]: ${message.type}`);
  }
}

module.exports = {
  handleClientMessage
};
