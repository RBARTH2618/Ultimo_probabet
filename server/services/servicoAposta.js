/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/servicoAposta.js - Submissão e Validação Atômica de Apostas
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o serviço central de processamento e validação financeira de apostas esportivas.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Implementa o requisito [RF-03]: Recebe o frame PLACE_BET contendo ID do jogo, mercado, seleção, odd e valor.
 *  - Implementa o requisito [RNF-02]: Garante saldo não negativo por verificação e débito atômico imediato.
 *  - Valida se o mercado está aberto (não suspenso por gol ou lance perigoso).
 *  - Gera o bilhete único numerado (#Ticket ID) e calcula o Retorno Potencial (Valor × Odd).
 * 
 * 📍 ONDE É USADO?
 * Chamado pelo roteador WebSocket (roteadorWebSocket.js) ao receber a mensagem PLACE_BET.
 * ==============================================================================
 */

const bancoDados = require("../data/bancoDados");
const servicoUsuario = require("./servicoUsuario");
const servicoPartida = require("./servicoPartida");
const { STATUS_PARTIDA, STATUS_APOSTA } = require("../config/constantes");

/**
 * [RF-03 e RNF-02] Processa a submissão de uma aposta com validação financeira síncrona.
 * 
 * @param {string} idApostador - Identificador do apostador (sessão)
 * @param {object} dadosAposta - Payload recebido do cliente (Listing 1 do documento UniRV)
 *   - matchId: ID da partida (ex: 15)
 *   - mercadoId: Código do mercado (ex: "VENCEDOR_1X2")
 *   - selecao: "CASA", "EMPATE" ou "FORA"
 *   - odd: Cotação aceita pelo usuário
 *   - valor: Quantia em reais a ser apostada
 */
function efetuarAposta(idApostador, dadosAposta) {
  const { matchId, mercadoId = "VENCEDOR_1X2", selecao, odd, valor } = dadosAposta;
  const apostador = servicoUsuario.obterApostador(idApostador);

  // 1. Validação do apostador
  if (!apostador) {
    return {
      sucesso: false,
      success: false,
      codigo: "USUARIO_NAO_ENCONTRADO",
      code: "USER_NOT_FOUND",
      mensagem: "Apostador não autenticado na sessão."
    };
  }

  // 2. Validação da quantia apostada
  const quantiaApostada = Number(Number(valor).toFixed(2));
  if (isNaN(quantiaApostada) || quantiaApostada <= 0) {
    return {
      sucesso: false,
      success: false,
      codigo: "VALOR_INVALIDO",
      code: "INVALID_AMOUNT",
      mensagem: "O valor da aposta deve ser numérico e maior que zero."
    };
  }

  // 3. [RNF-02] Garantia de Saldo Não Negativo: Rejeita se saldo for menor que a aposta
  if (apostador.saldo_ficticio < quantiaApostada) {
    return {
      sucesso: false,
      success: false,
      codigo: "SALDO_INSUFICIENTE",
      code: "INSUFFICIENT_FUNDS",
      mensagem: "Saldo insuficiente — Faça um depósito fictício para continuar apostando."
    };
  }

  // 4. Validação da partida
  const partida = servicoPartida.obterPartidaPorId(matchId);
  if (!partida) {
    return {
      sucesso: false,
      success: false,
      codigo: "PARTIDA_NAO_ENCONTRADA",
      code: "MATCH_NOT_FOUND",
      mensagem: "Partida esportiva não encontrada."
    };
  }

  // 5. Validação de integridade: Partida suspensa (Gol/VAR em andamento) ou encerrada
  if (partida.status_partida === STATUS_PARTIDA.SUSPENSA) {
    return {
      sucesso: false,
      success: false,
      codigo: "MERCADO_SUSPENSO",
      code: "MARKET_SUSPENDED",
      mensagem: `Mercado Temporariamente Suspenso! Lance em andamento (${partida.lock_motivo || "Aguarde"}).`
    };
  }

  if (partida.status_partida === STATUS_PARTIDA.ENCERRADA) {
    return {
      sucesso: false,
      success: false,
      codigo: "PARTIDA_ENCERRADA",
      code: "MATCH_CLOSED",
      mensagem: "Esta partida já foi encerrada."
    };
  }

  // 6. Validação da cotação
  const mercadoAtual = partida.odds[mercadoId];
  const cotacaoAtualServidor = mercadoAtual ? mercadoAtual[selecao] : null;

  if (!cotacaoAtualServidor) {
    return {
      sucesso: false,
      success: false,
      codigo: "SELECAO_INVALIDA",
      code: "INVALID_SELECTION",
      mensagem: "Seleção ou mercado inválido para esta partida."
    };
  }

  // 7. [RNF-02] DÉBITO ATÔMICO NO MESMO CICLO DO EVENT LOOP
  const novoSaldo = servicoUsuario.debitarSaldoApostador(idApostador, quantiaApostada);

  // 8. Registro do bilhete (Entidade BILHETE_APOSTA do diagrama ERD)
  const idBilhete = bancoDados.gerarIdBilhete();
  const cotacaoFinal = Number(Number(odd || cotacaoAtualServidor).toFixed(2));
  const retornoPotencial = Number((quantiaApostada * cotacaoFinal).toFixed(2));

  const novoBilhete = {
    id_aposta: idBilhete,
    id_apostador: idApostador,
    id_partida: partida.id_partida,
    time_casa: partida.time_casa,
    time_fora: partida.time_fora,
    id_mercado: mercadoId,
    selecao: selecao,
    valor_apostado: quantiaApostada,
    odd_momento: cotacaoFinal,
    retorno_potencial: retornoPotencial,
    status_aposta: STATUS_APOSTA.ATIVA,
    data_hora_aposta: new Date().toISOString(),
    currentCashOut: quantiaApostada * 0.95
  };

  bancoDados.salvarBilhete(novoBilhete);

  return {
    sucesso: true,
    success: true,
    numeroBilhete: idBilhete,
    ticketId: idBilhete,
    bilhete: novoBilhete,
    bet: novoBilhete,
    novoSaldo: novoSaldo,
    newBalance: novoSaldo,
    timestamp: novoBilhete.data_hora_aposta
  };
}

/**
 * Busca um bilhete de aposta pelo ID.
 */
function obterBilhetePorId(idBilhete) {
  return bancoDados.obterBilhete(idBilhete);
}

module.exports = {
  efetuarAposta,
  obterBilhetePorId,
  // Aliases para compatibilidade retroativa
  placeBet: efetuarAposta,
  getBetById: obterBilhetePorId
};
