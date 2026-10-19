/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/state/sessao.js - Gerenciador de Sessão e Persistência Local
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo que cuida da persistência de dados no navegador do apostador.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Salva e recupera o ID e o Nome do Apostador usando `localStorage` para que a
 *    sessão se mantenha ao recarregar a página.
 *  - Salva a cotação selecionada no `sessionStorage` para permitir navegar da Tela 1
 *    (Lobby) para a Tela 2 (Bet Slip) sem perder o palpite escolhido.
 * 
 * 📍 ONDE É USADO?
 * Chamado na inicialização da aplicação (principal.js) e ao clicar numa odd no Lobby.
 * ==============================================================================
 */

import { EstadoApp } from "./estadoAplicacao.js";

const CHAVES_STORAGE = {
  ID_APOSTADOR: "probabet_userId",
  NOME_APOSTADOR: "probabet_userName",
  CUPOM_SELECIONADO: "probabet_selected_slip"
};

/**
 * Recupera ou gera um ID e nome de apostador salvo no navegador.
 */
export function inicializarSessao() {
  let idSalvo = localStorage.getItem(CHAVES_STORAGE.ID_APOSTADOR);
  let nomeSalvo = localStorage.getItem(CHAVES_STORAGE.NOME_APOSTADOR);

  if (!idSalvo) {
    idSalvo = "usr_" + Math.floor(1000 + Math.random() * 9000);
    nomeSalvo = "Apostador " + idSalvo.slice(-4);
    localStorage.setItem(CHAVES_STORAGE.ID_APOSTADOR, idSalvo);
    localStorage.setItem(CHAVES_STORAGE.NOME_APOSTADOR, nomeSalvo);
  }

  EstadoApp.idApostador = idSalvo;
  EstadoApp.nomeApostador = nomeSalvo;

  // Recupera seleção do Bet Slip salva na navegação
  const cupomSalvo = sessionStorage.getItem(CHAVES_STORAGE.CUPOM_SELECIONADO);
  if (cupomSalvo) {
    try {
      EstadoApp.cupomSelecionado = JSON.parse(cupomSalvo);
    } catch (e) {
      EstadoApp.cupomSelecionado = null;
    }
  }
}

/**
 * Salva ou remove o palpite selecionado no sessionStorage.
 */
export function salvarCupomSelecionado(cupom) {
  EstadoApp.cupomSelecionado = cupom;
  if (cupom) {
    sessionStorage.setItem(CHAVES_STORAGE.CUPOM_SELECIONADO, JSON.stringify(cupom));
  } else {
    sessionStorage.removeItem(CHAVES_STORAGE.CUPOM_SELECIONADO);
  }
}

/**
 * Atualiza o nome do usuário no ranking e persiste no localStorage.
 */
export function atualizarNomeApostador(novoNome) {
  EstadoApp.nomeApostador = novoNome;
  localStorage.setItem(CHAVES_STORAGE.NOME_APOSTADOR, novoNome);
}

// Aliases para compatibilidade retroativa
export const initSession = inicializarSessao;
export const saveSelectedSlip = salvarCupomSelecionado;
export const updateSavedUserName = atualizarNomeApostador;
