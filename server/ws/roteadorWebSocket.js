/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: ws/roteadorWebSocket.js - Roteador de Mensagens e Comandos do Cliente
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É a central de controle que recebe os frames JSON enviados pelo navegador e os
 * encaminha para o respectivo serviço de domínio responsável.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Interpreta mensagens do tipo:
 *     1. PLACE_BET: Repassa para servicoAposta.js registrar o cupom [RF-03].
 *     2. CASH_OUT: Repassa para servicoCashout.js executar o resgate [RF-05, RNF-01].
 *     3. GET_WALLET: Devolve saldo e bilhetes do usuário.
 *     4. RESET_BALANCE: Restaura saldo para R$ 100,00 [RF-01].
 *     5. DEMO_TRIGGER_GOAL / DEMO_RESET_MATCH: Dispara ações didáticas de apresentação.
 *  - Envia as respostas diretas para o socket do cliente (confirmações/rejeições)
 *    e notifica os demais usuários via broadcast quando necessário (ex: ranking atualizado).
 * 
 * 📍 ONDE É USADO?
 * Chamado pelo listener de 'message' do WebSocket em servidor.js.
 * ==============================================================================
 */

const gatewayWebSocket = require("./gatewayWebSocket");
const servicoAposta = require("../services/servicoAposta");
const servicoCashout = require("../services/servicoCashout");
const servicoUsuario = require("../services/servicoUsuario");
const { EVENTOS_WS } = require("../config/constantes");

/**
 * Processa um frame JSON recebido de um cliente conectado.
 * 
 * @param {WebSocket} ws - Conexão WebSocket de origem
 * @param {object} mensagem - Objeto JSON enviado pelo cliente
 * @param {MotorPartida} motor - Instância ativa do motor de simulação
 */
function processarMensagemCliente(ws, mensagem, motor) {
  const metadados = gatewayWebSocket.obterMetadadosCliente(ws);
  if (!metadados) return;

  const idApostador = metadados.idApostador || metadados.userId;

  switch (mensagem.type) {
    // ==========================================================================
    // [RF-03] SUBMISSÃO DE BILHETE DE APOSTA
    // ==========================================================================
    case EVENTOS_WS.PLACE_BET: {
      console.log(`📝 [RECEBIDO PLACE_BET] Apostador: ${idApostador} | Valor: R$ ${mensagem.valor} | Odd: ${mensagem.odd} | Jogo: ${mensagem.matchId}`);

      const resultado = servicoAposta.efetuarAposta(idApostador, mensagem);

      if (!resultado.sucesso) {
        ws.send(JSON.stringify({
          type: EVENTOS_WS.BET_REJECTED,
          code: resultado.codigo || resultado.code,
          message: resultado.mensagem || resultado.message,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // Emite comprovante de bilhete com #Ticket ID
      ws.send(JSON.stringify({
        type: EVENTOS_WS.BET_CONFIRMED,
        ticketId: resultado.ticketId || resultado.numeroBilhete,
        bet: resultado.bilhete || resultado.bet,
        newBalance: resultado.novoSaldo || resultado.newBalance,
        timestamp: resultado.timestamp
      }));

      // Atualiza o saldo localmente
      ws.send(JSON.stringify({
        event: EVENTOS_WS.BALANCE_UPDATE,
        balance: resultado.novoSaldo || resultado.newBalance,
        timestamp: resultado.timestamp
      }));

      // Transmite novo ranking para toda a turma
      gatewayWebSocket.transmitirParaTodos({
        event: EVENTOS_WS.RANKING_UPDATE,
        ranking: servicoUsuario.obterClassificacaoRanking()
      });
      break;
    }

    // ==========================================================================
    // [RF-05 e RNF-01] SOLICITAÇÃO DE ENCERRAMENTO ANTECIPADO (CASH OUT)
    // ==========================================================================
    case EVENTOS_WS.CASH_OUT: {
      console.log(`💰 [RECEBIDO CASH_OUT] Bilhete #${mensagem.betId} | Valor Solicitado: R$ ${mensagem.requestedValue}`);

      const resultado = servicoCashout.executarCashOut(
        idApostador,
        mensagem.betId,
        mensagem.matchId,
        mensagem.requestedValue
      );

      if (!resultado.sucesso) {
        console.warn(`⛔ [CASH_OUT RECUSADO] Motivo: ${resultado.mensagem || resultado.message}`);
        ws.send(JSON.stringify({
          type: EVENTOS_WS.CASH_OUT_REJECTED,
          betId: mensagem.betId,
          code: resultado.codigo || resultado.code,
          reason: resultado.mensagem || resultado.message,
          newOfferedValue: resultado.novoValorOferecido || resultado.newOfferedValue || null,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // Confirmação do Cash Out com valor creditado
      ws.send(JSON.stringify({
        type: EVENTOS_WS.CASH_OUT_CONFIRMED,
        betId: resultado.betId || resultado.idBilhete,
        amount: resultado.valorResgatado || resultado.amount,
        newBalance: resultado.novoSaldo || resultado.newBalance,
        timestamp: resultado.timestamp
      }));

      // Notificação de novo saldo
      ws.send(JSON.stringify({
        event: EVENTOS_WS.BALANCE_UPDATE,
        balance: resultado.novoSaldo || resultado.newBalance,
        timestamp: resultado.timestamp
      }));

      // Transmite novo ranking para toda a turma
      gatewayWebSocket.transmitirParaTodos({
        event: EVENTOS_WS.RANKING_UPDATE,
        ranking: servicoUsuario.obterClassificacaoRanking()
      });
      break;
    }

    // ==========================================================================
    // CONSULTA DA CARTEIRA & HISTÓRICO DE BILHETES
    // ==========================================================================
    case EVENTOS_WS.GET_WALLET: {
      const apostador = servicoUsuario.obterApostador(idApostador);
      const bilhetes = servicoCashout.obterBilhetesDoApostador(idApostador);
      ws.send(JSON.stringify({
        type: EVENTOS_WS.WALLET_INFO,
        balance: apostador ? apostador.saldo_ficticio : 0,
        bets: bilhetes,
        timestamp: new Date().toISOString()
      }));
      break;
    }

    // ==========================================================================
    // DEMO DIDÁTICA: REDEFINIR SALDO PARA R$ 100,00
    // ==========================================================================
    case EVENTOS_WS.RESET_BALANCE: {
      const novoSaldo = servicoUsuario.redefinirSaldoApostador(idApostador, 100.00);
      ws.send(JSON.stringify({
        event: EVENTOS_WS.BALANCE_UPDATE,
        balance: novoSaldo,
        message: "Saldo fictício redefinido para R$ 100,00 com sucesso!"
      }));
      gatewayWebSocket.transmitirParaTodos({
        event: EVENTOS_WS.RANKING_UPDATE,
        ranking: servicoUsuario.obterClassificacaoRanking()
      });
      break;
    }

    // ==========================================================================
    // DEMO DIDÁTICA: DISPARO MANUAL DE GOL (TESTAR RNF-01 AO VIVO)
    // ==========================================================================
    case EVENTOS_WS.DEMO_TRIGGER_GOAL: {
      const idPartida = Number(mensagem.matchId || 15);
      const time = mensagem.team || "CASA";
      console.log(`🎯 [DEMO ACADÊMICA] Disparo manual de Gol para partida #${idPartida} (${time})`);
      motor.dispararGol(idPartida, time, "Gol demonstrado ao vivo pelo apresentador!");
      break;
    }

    // ==========================================================================
    // ATUALIZAÇÃO DO NOME DO APOSTADOR (PERFIL / RANKING)
    // ==========================================================================
    case EVENTOS_WS.UPDATE_USER_NAME: {
      const novoNome = (mensagem.userName || mensagem.nome || "").trim();
      if (novoNome) {
        servicoUsuario.atualizarNomeApostador(idApostador, novoNome);
        metadados.nomeApostador = novoNome;
        metadados.userName = novoNome;

        console.log(`👤 [PERFIL ATUALIZADO] Apostador ${idApostador} alterou nome para: "${novoNome}"`);

        // Confirma para o cliente solicitante
        ws.send(JSON.stringify({
          event: "USER_NAME_UPDATED",
          userName: novoNome,
          message: `Nome atualizado para "${novoNome}" com sucesso!`
        }));

        // Transmite imediatamente para todos o ranking com o novo nome
        gatewayWebSocket.transmitirParaTodos({
          event: EVENTOS_WS.RANKING_UPDATE,
          ranking: servicoUsuario.obterClassificacaoRanking()
        });
      }
      break;
    }

    // ==========================================================================
    // DEMO DIDÁTICA: REINICIAR PARTIDAS DE DEMONSTRAÇÃO
    // ==========================================================================
    case EVENTOS_WS.DEMO_RESET_MATCH: {
      const matchId = mensagem.matchId || "TODAS";
      motor.reiniciarPartida(matchId);
      break;
    }

    default:
      console.warn(`❓ [WS TIPO DESCONHECIDO]: ${mensagem.type}`);
  }
}

module.exports = {
  processarMensagemCliente,
  // Alias de compatibilidade retroativa
  handleClientMessage: processarMensagemCliente
};
