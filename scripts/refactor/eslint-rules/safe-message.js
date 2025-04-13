/**
 * @fileoverview Regola per garantire l'uso corretto di createSafeMessage
 * @author ChatMessages Refactoring Team
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce proper usage of createSafeMessage",
      category: "Type Safety",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      nestedCall: "Chiamata nidificata a createSafeMessage. Rimuovi le chiamate annidate.",
      missingProperties: "L'oggetto passato a createSafeMessage deve avere le proprietà 'role' e 'content'.",
      rawMessageObject: "Oggetto message raw. Usa createSafeMessage({role, content}).",
      nonObjectArg: "createSafeMessage richiede un oggetto come argomento.",
    },
  },

  create(context) {
    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------
    
    /**
     * Verifica se un nodo è un oggetto con proprietà role e content
     * @param {Object} node - Nodo AST
     * @return {boolean} true se sembra un ChatMessage raw
     */
    function isRawMessageObject(node) {
      if (node.type !== "ObjectExpression") return false;
      
      const properties = node.properties || [];
      const hasRole = properties.some(prop => 
        prop.type === "Property" && 
        prop.key.name === "role"
      );
      
      const hasContent = properties.some(prop => 
        prop.type === "Property" && 
        prop.key.name === "content"
      );
      
      return hasRole && hasContent;
    }
    
    /**
     * Verifica se l'argomento di createSafeMessage è corretto
     * @param {Object} arg - Argomento della chiamata
     * @return {Object|null} Oggetto con informazioni sull'errore o null se valido
     */
    function validateSafeMessageArg(arg) {
      // Se è una chiamata nidificata a createSafeMessage
      if (arg.type === "CallExpression" && 
          arg.callee.type === "Identifier" && 
          arg.callee.name === "createSafeMessage") {
        return { 
          message: "nestedCall",
          fix: (fixer) => {
            // Sostituisci la chiamata nidificata con l'argomento interno
            if (arg.arguments.length > 0) {
              return fixer.replaceText(arg, context.getSourceCode().getText(arg.arguments[0]));
            }
            return null;
          }
        };
      }
      
      // Se non è un oggetto
      if (arg.type !== "ObjectExpression") {
        return { message: "nonObjectArg" };
      }
      
      // Se è un oggetto ma mancano role o content
      const properties = arg.properties || [];
      const hasRole = properties.some(prop => 
        prop.type === "Property" && 
        prop.key.name === "role"
      );
      
      const hasContent = properties.some(prop => 
        prop.type === "Property" && 
        prop.key.name === "content"
      );
      
      if (!hasRole || !hasContent) {
        return { message: "missingProperties" };
      }
      
      return null;
    }
    
    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------
    
    return {
      // Identifica chiamate a createSafeMessage
      CallExpression(node) {
        if (node.callee.type === "Identifier" && 
            node.callee.name === "createSafeMessage") {
          
          // Verifica gli argomenti
          if (node.arguments.length === 0) {
            context.report({
              node,
              messageId: "nonObjectArg",
            });
            return;
          }
          
          const arg = node.arguments[0];
          const error = validateSafeMessageArg(arg);
          
          if (error) {
            context.report({
              node,
              messageId: error.message,
              fix: error.fix,
            });
          }
        }
      },
      
      // Identifica oggetti message raw che dovrebbero usare createSafeMessage
      ObjectExpression(node) {
        // Salta se è già un argomento di createSafeMessage
        const parent = node.parent;
        if (parent && 
            parent.type === "CallExpression" && 
            parent.callee.type === "Identifier" && 
            parent.callee.name === "createSafeMessage") {
          return;
        }
        
        // Se sembra un ChatMessage raw, segnala
        if (isRawMessageObject(node)) {
          context.report({
            node,
            messageId: "rawMessageObject",
            fix: (fixer) => {
              const sourceCode = context.getSourceCode();
              const nodeText = sourceCode.getText(node);
              return fixer.replaceText(node, `createSafeMessage(${nodeText})`);
            }
          });
        }
      }
    };
  },
}; 