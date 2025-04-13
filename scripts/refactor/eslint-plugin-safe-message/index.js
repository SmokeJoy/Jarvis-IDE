/**
 * @fileoverview ESLint plugin per verificare l'uso corretto di createSafeMessage
 * @author ChatMessages Refactoring Team
 */
"use strict";

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').ESLint.Plugin} */
module.exports = {
  rules: {
    "use-safe-message": require("../eslint-rules/safe-message"),
  },
  configs: {
    recommended: {
      plugins: ["safe-message"],
      rules: {
        "safe-message/use-safe-message": "error"
      }
    }
  }
}; 