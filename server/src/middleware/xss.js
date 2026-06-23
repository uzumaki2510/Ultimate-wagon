const sanitize = require('express-mongo-sanitize');

/**
 * Basic XSS Sanitizer Middleware
 * Escapes < and > tags from body, query, and params to prevent basic XSS
 */
const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, (tag) => {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#x27;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
};

const sanitizeObj = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = escapeHTML(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObj(obj[key]);
    }
  }
  return obj;
};

const xss = (req, res, next) => {
  if (req.body) req.body = sanitizeObj(req.body);
  if (req.query) req.query = sanitizeObj(req.query);
  if (req.params) req.params = sanitizeObj(req.params);
  next();
};

module.exports = xss;
