/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/servicoUsuario.js - Gestão de Apostadores, Saldo e Ranking
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o serviço de domínio responsável pelos usuários (apostadores) e suas carteiras financeiras.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Cria ou recupera a sessão do apostador vinculando o saldo inicial de R$ 100,00 [RF-01].
 *  - Executa débitos atômicos para submissão de apostas [RNF-02].
 *  - Executa créditos atômicos para recebimento de prêmios ou cash out [RF-05, RF-07].
 *  - Gera a tabela de classificação (Ranking) ordenada por maior saldo [RF-08].
 *  - Permite redefinir o saldo para R$ 100,00 para fins didáticos.
 * 
 * 📍 ONDE É USADO?
 * Usado pelo gateway WebSocket (no handshake), pelo roteador de eventos e na finalização de jogos.
 * ==============================================================================
 */

const bancoDados = require("../data/bancoDados");
const { CONFIGURACOES } = require("../config/constantes");

/**
 * [RF-01] Localiza o apostador ou cria um novo registro com saldo de R$ 100,00.
 * @param {string} idApostador - Identificador único de sessão
 * @param {string} nome - Nome exibido no ranking
 * @param {number} saldoInicial - Saldo concedido (padrão: R$ 100,00)
 */
function obterOuCriarApostador(idApostador, nome = "Apostador", saldoInicial = CONFIGURACOES.SALDO_INICIAL) {
  let apostador = bancoDados.obterApostador(idApostador);
  if (!apostador) {
    apostador = {
      id_apostador: idApostador,
      cpf_usuario: "123.456.789-00",
      nome_completo: nome,
      saldo_ficticio: Number(saldoInicial.toFixed(2)),
      data_cadastro: new Date().toISOString()
    };
    bancoDados.salvarApostador(idApostador, apostador);
  }
  return apostador;
}

/**
 * Busca os dados de um apostador pelo ID.
 */
function obterApostador(idApostador) {
  return bancoDados.obterApostador(idApostador);
}

/**
 * [RNF-02] Deduz um valor do saldo do apostador de forma síncrona/atômica.
 * Retorna o novo saldo ou false se o apostador não existir.
 */
function debitarSaldoApostador(idApostador, valor) {
  const apostador = obterApostador(idApostador);
  if (!apostador) return false;
  apostador.saldo_ficticio = Number((apostador.saldo_ficticio - valor).toFixed(2));
  return apostador.saldo_ficticio;
}

/**
 * Adiciona um valor (prêmio de aposta ou resgate de cash out) ao saldo.
 */
function creditarSaldoApostador(idApostador, valor) {
  const apostador = obterApostador(idApostador);
  if (!apostador) return false;
  apostador.saldo_ficticio = Number((apostador.saldo_ficticio + valor).toFixed(2));
  return apostador.saldo_ficticio;
}

/**
 * Restaura o saldo do apostador para o valor padrão (R$ 100,00).
 */
function redefinirSaldoApostador(idApostador, valor = CONFIGURACOES.SALDO_INICIAL) {
  const apostador = obterOuCriarApostador(idApostador);
  apostador.saldo_ficticio = Number(valor.toFixed(2));
  return apostador.saldo_ficticio;
}

/**
 * [RF-08] Retorna o ranking dos 10 maiores saldos da sessão em ordem decrescente.
 */
function obterClassificacaoRanking() {
  const lista = bancoDados.obterTodosApostadores().map(u => ({
    id: u.id_apostador,
    nome: u.nome_completo,
    saldo: u.saldo_ficticio
  }));

  // Ordena decrescente pelo saldo fictício
  lista.sort((a, b) => b.saldo - a.saldo);
  return lista.slice(0, 10);
}

module.exports = {
  obterOuCriarApostador,
  obterApostador,
  debitarSaldoApostador,
  creditarSaldoApostador,
  redefinirSaldoApostador,
  obterClassificacaoRanking,
  // Aliases para compatibilidade retroativa
  createOrGetUser: obterOuCriarApostador,
  getUser: obterApostador,
  debitUser: debitarSaldoApostador,
  creditUser: creditarSaldoApostador,
  resetUserBalance: redefinirSaldoApostador,
  getRanking: obterClassificacaoRanking
};
