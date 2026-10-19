/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: data/db.js - Repositório de Estado em Memória (Database Mock)
 * Responsabilidade Única: Armazenar e prover acesso bruto às coleções de dados.
 * ==============================================================================
 */

const { getInitialMatches, getInitialRankingUsers } = require("./initialData");
const { CONFIG } = require("../config/constants");

class MemoryDatabase {
  constructor() {
    this.apostadores = new Map();
    this.partidas = new Map();
    this.bilhetes = new Map();
    this.transacoesCashout = [];
    
    this.nextBetId = CONFIG.INITIAL_TICKET_ID;
    this.nextCashoutId = CONFIG.INITIAL_CASHOUT_ID;

    this.init();
  }

  init() {
    // Carrega partidas iniciais
    const defaultMatches = getInitialMatches();
    defaultMatches.forEach(m => this.partidas.set(m.id_partida, m));

    // Carrega apostadores do ranking
    const seedUsers = getInitialRankingUsers();
    seedUsers.forEach(u => {
      this.apostadores.set(u.id, {
        id_apostador: u.id,
        cpf_usuario: "123.456.789-00",
        nome_completo: u.nome,
        saldo_ficticio: Number(u.saldo.toFixed(2)),
        data_cadastro: new Date().toISOString()
      });
    });
  }

  // Métodos de Acesso a Apostadores
  getUser(userId) {
    return this.apostadores.get(userId);
  }

  setUser(userId, user) {
    this.apostadores.set(userId, user);
  }

  getAllUsers() {
    return Array.from(this.apostadores.values());
  }

  // Métodos de Acesso a Partidas
  getMatch(matchId) {
    return this.partidas.get(Number(matchId));
  }

  getAllMatches() {
    return Array.from(this.partidas.values());
  }

  // Métodos de Acesso a Bilhetes
  getBet(betId) {
    return this.bilhetes.get(Number(betId));
  }

  saveBet(bet) {
    this.bilhetes.set(bet.id_aposta, bet);
  }

  getAllBets() {
    return Array.from(this.bilhetes.values());
  }

  generateBetId() {
    return this.nextBetId++;
  }

  // Transações de Cash Out
  addCashoutTransaction(tx) {
    this.transacoesCashout.push(tx);
  }

  generateCashoutId() {
    return this.nextCashoutId++;
  }

  getCashoutTransactions() {
    return this.transacoesCashout;
  }
}

// Instância singleton do banco em memória
const db = new MemoryDatabase();

module.exports = db;
