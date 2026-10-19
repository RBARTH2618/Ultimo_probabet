/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/servicoCashout.js - Cálculo e Encerramento Antecipado (Cash Out)
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o serviço financeiro de encerramento antecipado de bilhetes ao vivo.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Implementa [RF-04]: Algoritmo de recálculo contínuo do valor de resgate (Cash Out)
 *    conforme o placar, o minuto do jogo e a probabilidade instantânea do evento.
 *  - Implementa [RF-05]: Executa a liquidação imediata da aposta e credita o valor acordado.
 *  - Implementa [RNF-01]: Prevenção de Race Condition e Trava Atômica. Se um gol acabou
 *    de ocorrer e o mercado estiver suspenso, a tentativa de Cash Out é sumariamente
 *    rejeitada para impedir inconsistências e perdas da casa de apostas.
 * 
 * 📍 ONDE É USADO?
 * Pelo motor de partidas (no heartbeat de cálculo), no roteador WS e na Tela 3 (Carteira).
 * ==============================================================================
 */

const bancoDados = require("../data/bancoDados");
const servicoUsuario = require("./servicoUsuario");
const servicoPartida = require("./servicoPartida");
const { STATUS_PARTIDA, STATUS_APOSTA, CONFIGURACOES } = require("../config/constantes");

/**
 * [RF-04] Algoritmo Didático de Recálculo do Valor de Cash Out.
 * 
 * Lógica matemática:
 *  - Se o mercado estiver suspenso (ex: gol acontecendo), o valor congela.
 *  - Se a aposta estiver ganhando: o valor sobe gradualmente em direção ao retorno total.
 *  - Se o jogo estiver empatado: mantém entre 60% e 80% do valor apostado.
 *  - Se a aposta estiver perdendo: o valor diminui progressivamente com o tempo.
 */
function calcularValorCashOut(bilhete, partida) {
  if (bilhete.status_aposta !== STATUS_APOSTA.ATIVA) return 0;
  if (!partida || partida.status_partida === STATUS_PARTIDA.ENCERRADA) return 0;

  const { placar_casa, placar_fora, minuto_jogo, status_partida } = partida;

  // Mercado suspenso: mantém a última cotação calculada sem permitir valor novo
  if (status_partida === STATUS_PARTIDA.SUSPENSA) {
    return bilhete.currentCashOut || bilhete.valor_apostado;
  }

  let statusFavoravel = false;
  const empate = (placar_casa === placar_fora);

  if (bilhete.selecao === "CASA" && placar_casa > placar_fora) statusFavoravel = true;
  if (bilhete.selecao === "FORA" && placar_fora > placar_casa) statusFavoravel = true;
  if (bilhete.selecao === "EMPATE" && empate) statusFavoravel = true;

  const progressoTempo = Math.min(minuto_jogo / 90, 0.98);
  let valorEstimado = bilhete.valor_apostado;

  if (statusFavoravel) {
    // Cenário favorável: ganho proporcional ao tempo decorrido
    const lucroMaximo = bilhete.retorno_potencial - bilhete.valor_apostado;
    valorEstimado = bilhete.valor_apostado + (lucroMaximo * progressoTempo * CONFIGURACOES.MARGEM_CASA);
  } else if (empate && bilhete.selecao !== "EMPATE") {
    // Cenário de empate: desvalorização branda
    valorEstimado = bilhete.valor_apostado * (1 - (progressoTempo * 0.45));
  } else {
    // Cenário desfavorável: desvalorização acentuada com piso mínimo de segurança
    valorEstimado = Math.max(bilhete.valor_apostado * (1 - (progressoTempo * 0.85)), 1.50);
  }

  const cashOutFinal = Number(Math.min(valorEstimado, bilhete.retorno_potencial * 0.98).toFixed(2));
  bilhete.currentCashOut = cashOutFinal;
  return cashOutFinal;
}

/**
 * [RF-05 e RNF-01] Execução do Cash Out com Trava Atômica Anti-Concorrência (Race Condition).
 */
function executarCashOut(idApostador, idBilhete, idPartida, valorSolicitado) {
  const apostador = servicoUsuario.obterApostador(idApostador);
  if (!apostador) {
    return {
      sucesso: false,
      success: false,
      codigo: "USUARIO_NAO_ENCONTRADO",
      code: "USER_NOT_FOUND",
      mensagem: "Apostador não encontrado."
    };
  }

  const bilhete = bancoDados.obterBilhete(Number(idBilhete));
  if (!bilhete) {
    return {
      sucesso: false,
      success: false,
      codigo: "BILHETE_NAO_ENCONTRADO",
      code: "BET_NOT_FOUND",
      mensagem: "Bilhete de aposta não encontrado."
    };
  }

  // Validação de titularidade do bilhete
  if (bilhete.id_apostador !== idApostador) {
    return {
      sucesso: false,
      success: false,
      codigo: "ACESSO_NEGADO",
      code: "FORBIDDEN",
      mensagem: "Este bilhete não pertence à sua sessão."
    };
  }

  if (bilhete.status_aposta !== STATUS_APOSTA.ATIVA) {
    return {
      sucesso: false,
      success: false,
      codigo: "BILHETE_JA_ENCERRADO",
      code: "ALREADY_SETTLED",
      mensagem: `Este bilhete já está ${bilhete.status_aposta}.`
    };
  }

  const partida = servicoPartida.obterPartidaPorId(idPartida || bilhete.id_partida);
  if (!partida) {
    return {
      sucesso: false,
      success: false,
      codigo: "PARTIDA_NAO_ENCONTRADA",
      code: "MATCH_NOT_FOUND",
      mensagem: "Partida associada ao bilhete não encontrada."
    };
  }

  // [RNF-01] TRAVA ATÔMICA CRÍTICA: Se o mercado estiver suspenso no exato milissegundo do clique
  if (partida.status_partida === STATUS_PARTIDA.SUSPENSA) {
    return {
      sucesso: false,
      success: false,
      codigo: "CONCORRENCIA_GOL_DETECTADA",
      code: "RACE_CONDITION_DETECTED",
      mensagem: "Proposta expirada — Placar alterado / Mercado temporariamente suspenso!"
    };
  }

  // Recalcula o valor justo do resgate no momento da recepção do frame TCP
  const valorOferecidoAtual = calcularValorCashOut(bilhete, partida);

  // Verificação de tolerância para oscilações rápidas de cotação
  const reqVal = Number(valorSolicitado);
  if (!isNaN(reqVal) && Math.abs(reqVal - valorOferecidoAtual) > (valorOferecidoAtual * 0.15 + 1.0)) {
    return {
      sucesso: false,
      success: false,
      codigo: "COTACAO_ALTERADA",
      code: "ODD_CHANGED",
      mensagem: `Proposta expirada — O valor de resgate foi alterado para R$ ${valorOferecidoAtual.toFixed(2)}.`,
      novoValorOferecido: valorOferecidoAtual,
      newOfferedValue: valorOferecidoAtual
    };
  }

  // Efetivação do encerramento antecipado
  const valorFinalResgate = valorOferecidoAtual;
  bilhete.status_aposta = STATUS_APOSTA.CASH_OUT;
  bilhete.valor_resgatado = valorFinalResgate;

  // Credita o valor resgatado diretamente na carteira do apostador
  const novoSaldo = servicoUsuario.creditarSaldoApostador(idApostador, valorFinalResgate);

  // Registra no livro de auditoria (Entidade TRANSACAO_CASHOUT do diagrama ERD)
  const transacaoAuditoria = {
    id_cashout: bancoDados.gerarIdCashout(),
    id_aposta: bilhete.id_aposta,
    valor_resgate_oferecido: valorOferecidoAtual,
    valor_resgatado: valorFinalResgate,
    timestamp_efetivacao: new Date().toISOString()
  };
  bancoDados.adicionarTransacaoCashout(transacaoAuditoria);

  return {
    sucesso: true,
    success: true,
    idBilhete: bilhete.id_aposta,
    betId: bilhete.id_aposta,
    valorResgatado: valorFinalResgate,
    amount: valorFinalResgate,
    novoSaldo: novoSaldo,
    newBalance: novoSaldo,
    timestamp: transacaoAuditoria.timestamp_efetivacao
  };
}

/**
 * Retorna todos os bilhetes de um apostador, com valores de Cash Out atualizados em tempo real.
 */
function obterBilhetesDoApostador(idApostador) {
  const lista = [];
  for (const bilhete of bancoDados.obterTodosBilhetes()) {
    if (bilhete.id_apostador === idApostador) {
      const partida = servicoPartida.obterPartidaPorId(bilhete.id_partida);
      if (bilhete.status_aposta === STATUS_APOSTA.ATIVA && partida) {
        bilhete.currentCashOut = calcularValorCashOut(bilhete, partida);
      }
      lista.push({ ...bilhete });
    }
  }
  return lista.reverse(); // Bilhetes mais recentes primeiro
}

module.exports = {
  calcularValorCashOut,
  executarCashOut,
  obterBilhetesDoApostador,
  // Aliases para compatibilidade retroativa
  calculateCashOutValue: calcularValorCashOut,
  executeCashOut: executarCashOut,
  getUserBets: obterBilhetesDoApostador
};
