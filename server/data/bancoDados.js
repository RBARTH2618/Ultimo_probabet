/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: data/bancoDados.js - Repositório de Estado em Memória (Banco de Dados Mock)
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o banco de dados simulado em memória (RAM) do servidor.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Armazena e gerencia as 4 coleções centrais do sistema (modeladas no ERD do projeto):
 *   1. apostadores: Usuários cadastrados, com nome, CPF e saldo fictício [RF-01, RF-08].
 *   2. partidas: Jogos ao vivo com placar, minuto, status e cotações [RF-02, RF-06].
 *   3. bilhetes: Cupons de aposta submetidos e seus status (ATIVA, GREEN, RED, CASH_OUT) [RF-03, RF-07].
 *   4. transacoesCashout: Histórico de auditoria de encerramentos antecipados [RF-05].
 * 
 * 📍 ONDE É USADO?
 * Consumido por todos os serviços de domínio (servicoUsuario, servicoPartida, servicoAposta, etc).
 * ==============================================================================
 */

const { obterPartidasIniciais, obterApostadoresIniciaisRanking } = require("./dadosIniciais");
const { CONFIGURACOES } = require("../config/constantes");

class BancoDadosEmMemoria {
  constructor() {
    // Coleções em memória utilizando Map para busca O(1) de altíssima performance (< 100 ms)
    this.apostadores = new Map();
    this.partidas = new Map();
    this.bilhetes = new Map();
    this.transacoesCashout = [];
    
    // Contadores sequenciais de IDs de tickets e cash outs
    this.proximoIdBilhete = CONFIGURACOES.TICKET_ID_INICIAL;
    this.proximoIdCashout = CONFIGURACOES.CASHOUT_ID_INICIAL;

    this.inicializar();
  }

  /**
   * Carga inicial dos dados de demonstração
   */
  inicializar() {
    // 1. Carrega partidas esportivas mock
    const partidasPadrao = obterPartidasIniciais();
    partidasPadrao.forEach(p => this.partidas.set(p.id_partida, p));

    // 2. Carrega apostadores pré-cadastrados no ranking
    const apostadoresSeed = obterApostadoresIniciaisRanking();
    apostadoresSeed.forEach(u => {
      this.apostadores.set(u.id, {
        id_apostador: u.id,
        cpf_usuario: "123.456.789-00",
        nome_completo: u.nome,
        saldo_ficticio: Number(u.saldo.toFixed(2)),
        data_cadastro: new Date().toISOString()
      });
    });
  }

  // ============================================================================
  // MÉTODOS DE ACESSO: APOSTADORES (USUÁRIOS)
  // ============================================================================

  obterApostador(idApostador) {
    return this.apostadores.get(idApostador);
  }

  salvarApostador(idApostador, dadosApostador) {
    this.apostadores.set(idApostador, dadosApostador);
  }

  obterTodosApostadores() {
    return Array.from(this.apostadores.values());
  }

  // ============================================================================
  // MÉTODOS DE ACESSO: PARTIDAS ESPORTIVAS
  // ============================================================================

  obterPartida(idPartida) {
    return this.partidas.get(Number(idPartida));
  }

  obterTodasPartidas() {
    return Array.from(this.partidas.values());
  }

  // ============================================================================
  // MÉTODOS DE ACESSO: BILHETES DE APOSTA
  // ============================================================================

  obterBilhete(idBilhete) {
    return this.bilhetes.get(Number(idBilhete));
  }

  salvarBilhete(bilhete) {
    this.bilhetes.set(bilhete.id_aposta, bilhete);
  }

  obterTodosBilhetes() {
    return Array.from(this.bilhetes.values());
  }

  gerarIdBilhete() {
    return this.proximoIdBilhete++;
  }

  // ============================================================================
  // MÉTODOS DE ACESSO: TRANSAÇÕES DE CASH OUT (AUDITORIA)
  // ============================================================================

  adicionarTransacaoCashout(transacao) {
    this.transacoesCashout.push(transacao);
  }

  gerarIdCashout() {
    return this.proximoIdCashout++;
  }

  obterTransacoesCashout() {
    return this.transacoesCashout;
  }

  // ============================================================================
  // MÉTODOS DE COMPATIBILIDADE COM O CÓDIGO ANTERIOR EM INGLÊS
  // ============================================================================
  getUser(userId) { return this.obterApostador(userId); }
  setUser(userId, user) { this.salvarApostador(userId, user); }
  getAllUsers() { return this.obterTodosApostadores(); }
  getMatch(matchId) { return this.obterPartida(matchId); }
  getAllMatches() { return this.obterTodasPartidas(); }
  getBet(betId) { return this.obterBilhete(betId); }
  saveBet(bet) { this.salvarBilhete(bet); }
  getAllBets() { return this.obterTodosBilhetes(); }
  generateBetId() { return this.gerarIdBilhete(); }
  addCashoutTransaction(tx) { this.adicionarTransacaoCashout(tx); }
  generateCashoutId() { return this.gerarIdCashout(); }
  getCashoutTransactions() { return this.obterTransacoesCashout(); }
}

// Instância singleton compartilhada por toda a aplicação
const bancoDados = new BancoDadosEmMemoria();

module.exports = bancoDados;
