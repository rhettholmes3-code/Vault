/**
 * Safely formats numbers into localized financial format e.g., "1,234.50".
 */
export function formatAmount(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0.00';
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calculates percentage changes for period-over-period statistics.
 */
export function getPercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

/**
 * Safely evaluates a simple mathematical expression containing numbers, decimals, and +, -, *, / operators.
 * Completely immune to XSS and eval() compiler limits since it relies on pure tokenizer passes.
 * Returns the computed number, or 0 if the expression is invalid.
 */
export function evaluateExpression(expr: string): number {
  // Sanitize the expression: only allow numbers, decimals, and standard operators
  const sanitized = expr.replace(/[^0-9.+\-*/]/g, '');
  
  if (!sanitized) return 0;
  
  try {
    const tokens: (string | number)[] = [];
    let currentNum = '';
    
    // Parse characters into structured tokens
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (/[0-9.]/.test(char)) {
        currentNum += char;
      } else {
        if (currentNum !== '') {
          tokens.push(parseFloat(currentNum));
          currentNum = '';
        }
        tokens.push(char);
      }
    }
    if (currentNum !== '') {
      tokens.push(parseFloat(currentNum));
    }
    
    // Clean up trailing operators if expression ended abruptly (e.g. "3+5-")
    while (tokens.length > 0 && typeof tokens[tokens.length - 1] === 'string') {
      tokens.pop();
    }
    
    if (tokens.length === 0) return 0;
    
    // Pass 1: Solve multiplication and division (*, /)
    const pass1: (string | number)[] = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prev = pass1.pop();
        const next = tokens[i + 1];
        if (typeof prev === 'number' && typeof next === 'number') {
          const res = token === '*' ? prev * next : (next !== 0 ? prev / next : 0);
          pass1.push(res);
          i += 2;
        } else {
          if (typeof prev === 'number') pass1.push(prev);
          i++;
        }
      } else {
        pass1.push(token);
        i++;
      }
    }
    
    // Pass 2: Solve addition and subtraction (+, -)
    if (pass1.length === 0) return 0;
    let result = typeof pass1[0] === 'number' ? pass1[0] : 0;
    let j = 1;
    while (j < pass1.length) {
      const op = pass1[j];
      const next = pass1[j + 1];
      if (typeof next === 'number') {
        if (op === '+') {
          result += next;
        } else if (op === '-') {
          result -= next;
        }
      }
      j += 2;
    }
    
    return isNaN(result) || !isFinite(result) ? 0 : result;
  } catch (e) {
    return 0;
  }
}
