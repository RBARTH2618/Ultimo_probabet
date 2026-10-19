/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine.js - Fachada de Compatibilidade (Facade Pattern)
 * ==============================================================================
 * Re-exporta o motor modularizado de engine/motorPartida.js.
 * ==============================================================================
 */

const MotorPartida = require("./engine/motorPartida");

module.exports = MotorPartida;
