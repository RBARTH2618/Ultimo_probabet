/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine.js - Fachada de Compatibilidade (Facade Pattern)
 * ==============================================================================
 * Re-exporta o motor modularizado de engine/matchEngine.js.
 * ==============================================================================
 */

const MatchEngine = require("./engine/matchEngine");

module.exports = MatchEngine;
