
const bancoDados = require("../data/bancoDados");
const servicoUsuario = require("./servicoUsuario");
const servicoPartida = require("./servicoPartida");
const { STATUS_PARTIDA, STATUS_APOSTA } = require("../config/constantes");

/**
 * [RF-07] Liquida todas as apostas ativas vinculadas a uma partida recém-finalizada.
 * 
 * @param {number} idPartida - ID da partida terminada
 * @returns {Array} Lista de liquidações efetuadas para notificação dos apostadores
 */
function liquidarApostasDaPartida(idPartida) {
  const partida = servicoPartida.obterPartidaPorId(idPartida);
  if (!partida) return [];

  // Apuração do vencedor da partida (1X2)
  let resultadoFinal = "EMPATE";
  if (partida.placar_casa > partida.placar_fora) resultadoFinal = "CASA";
  else if (partida.placar_fora > partida.placar_casa) resultadoFinal = "FORA";

  const liquidacoesRealizadas = [];

  for (const bilhete of bancoDados.obterTodosBilhetes()) {
    if (bilhete.id_partida === idPartida && bilhete.status_aposta === STATUS_APOSTA.ATIVA) {
      const apostador = servicoUsuario.obterApostador(bilhete.id_apostador);
      const acertouPalpite = (bilhete.selecao === resultadoFinal);

      if (acertouPalpite) {
        // [GREEN]: Pagamento integral do retorno potencial
        bilhete.status_aposta = STATUS_APOSTA.GREEN;
        if (apostador) {
          servicoUsuario.creditarSaldoApostador(bilhete.id_apostador, bilhete.retorno_potencial);
        }
      } else {
        // [RED]: Aposta não premiada
        bilhete.status_aposta = STATUS_APOSTA.RED;
      }

      liquidacoesRealizadas.push({
        idBilhete: bilhete.id_aposta,
        betId: bilhete.id_aposta,
        idApostador: bilhete.id_apostador,
        userId: bilhete.id_apostador,
        status: bilhete.status_aposta,
        retorno: acertouPalpite ? bilhete.retorno_potencial : 0,
        novoSaldo: apostador ? apostador.saldo_ficticio : 0,
        newBalance: apostador ? apostador.saldo_ficticio : 0
      });
    }
  }

  // Atualiza a partida para estado ENCERRADA
  partida.status_partida = STATUS_PARTIDA.ENCERRADA;
  return liquidacoesRealizadas;
}

module.exports = {
  liquidarApostasDaPartida
};
