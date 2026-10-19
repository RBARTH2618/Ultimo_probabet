
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
}

// Instância singleton compartilhada por toda a aplicação
const bancoDados = new BancoDadosEmMemoria();

module.exports = bancoDados;
