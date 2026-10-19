/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/userService.js - Gestão de Apostadores, Saldo e Ranking
 * Responsabilidade Única: Operações de conta, saldo e classificação dos apostadores.
 * ==============================================================================
 */

const db = require("../data/db");
const { CONFIG } = require("../config/constants");

function createOrGetUser(userId, nome = "Apostador", saldoInicial = CONFIG.INITIAL_BALANCE) {
  let user = db.getUser(userId);
  if (!user) {
    user = {
      id_apostador: userId,
      cpf_usuario: "123.456.789-00",
      nome_completo: nome,
      saldo_ficticio: Number(saldoInicial.toFixed(2)),
      data_cadastro: new Date().toISOString()
    };
    db.setUser(userId, user);
  }
  return user;
}

function getUser(userId) {
  return db.getUser(userId);
}

function debitUser(userId, amount) {
  const user = getUser(userId);
  if (!user) return false;
  user.saldo_ficticio = Number((user.saldo_ficticio - amount).toFixed(2));
  return user.saldo_ficticio;
}

function creditUser(userId, amount) {
  const user = getUser(userId);
  if (!user) return false;
  user.saldo_ficticio = Number((user.saldo_ficticio + amount).toFixed(2));
  return user.saldo_ficticio;
}

function resetUserBalance(userId, valor = CONFIG.INITIAL_BALANCE) {
  const user = createOrGetUser(userId);
  user.saldo_ficticio = Number(valor.toFixed(2));
  return user.saldo_ficticio;
}

function getRanking() {
  const lista = db.getAllUsers().map(u => ({
    nome: u.nome_completo,
    saldo: u.saldo_ficticio,
    id: u.id_apostador
  }));
  // Ordena decrescente por saldo
  lista.sort((a, b) => b.saldo - a.saldo);
  return lista.slice(0, 10);
}

module.exports = {
  createOrGetUser,
  getUser,
  debitUser,
  creditUser,
  resetUserBalance,
  getRanking
};
