export interface RegexToken {
  token: string;
  description: string;
}

export function explainRegex(pattern: string): RegexToken[] {
  if (!pattern) return [];
  const tokens: RegexToken[] = [];
  let i = 0;

  const DESCRIPTIONS: Record<string, string> = {
    '.': 'Any character except newline',
    '^': 'Start of string/line',
    '$': 'End of string/line',
    '*': 'Zero or more of the preceding',
    '+': 'One or more of the preceding',
    '?': 'Zero or one of the preceding (optional)',
    '|': 'Alternation (OR)',
    '\\d': 'Any digit (0–9)',
    '\\D': 'Any non-digit',
    '\\w': 'Any word character (a-z, A-Z, 0-9, _)',
    '\\W': 'Any non-word character',
    '\\s': 'Any whitespace character',
    '\\S': 'Any non-whitespace character',
    '\\b': 'Word boundary',
    '\\B': 'Non-word boundary',
    '\\n': 'Newline',
    '\\t': 'Tab',
    '\\r': 'Carriage return',
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === '\\' && i + 1 < pattern.length) {
      const seq = pattern.slice(i, i + 2);
      tokens.push({ token: seq, description: DESCRIPTIONS[seq] || `Escaped character: ${seq[1]}` });
      i += 2;
      continue;
    }

    if (ch === '[') {
      let j = i + 1;
      if (j < pattern.length && pattern[j] === '^') j++;
      while (j < pattern.length && pattern[j] !== ']') {
        if (pattern[j] === '\\') j++;
        j++;
      }
      const cls = pattern.slice(i, j + 1);
      const negated = cls[1] === '^';
      tokens.push({ token: cls, description: negated ? `Any character NOT in: ${cls.slice(2, -1)}` : `Any character in: ${cls.slice(1, -1)}` });
      i = j + 1;
      continue;
    }

    if (ch === '(') {
      let desc = 'Capturing group';
      if (pattern.slice(i, i + 3) === '(?:') desc = 'Non-capturing group';
      else if (pattern.slice(i, i + 3) === '(?=') desc = 'Positive lookahead';
      else if (pattern.slice(i, i + 3) === '(?!') desc = 'Negative lookahead';
      else if (pattern.slice(i, i + 4) === '(?<=') desc = 'Positive lookbehind';
      else if (pattern.slice(i, i + 4) === '(?<!') desc = 'Negative lookbehind';
      else if (pattern.slice(i, i + 3) === '(?<') desc = 'Named capturing group';
      tokens.push({ token: '(', description: desc });
      i++;
      continue;
    }

    if (ch === ')') { tokens.push({ token: ')', description: 'End of group' }); i++; continue; }

    if (ch === '{') {
      const end = pattern.indexOf('}', i);
      if (end !== -1) {
        const quant = pattern.slice(i, end + 1);
        const inner = quant.slice(1, -1);
        const parts = inner.split(',');
        let desc = '';
        if (parts.length === 1) desc = `Exactly ${parts[0]} times`;
        else if (parts[1] === '') desc = `${parts[0]} or more times`;
        else desc = `Between ${parts[0]} and ${parts[1]} times`;
        tokens.push({ token: quant, description: desc });
        i = end + 1;
        continue;
      }
    }

    if (DESCRIPTIONS[ch]) {
      tokens.push({ token: ch, description: DESCRIPTIONS[ch] });
    } else if (ch !== ')') {
      tokens.push({ token: ch, description: `Literal character: "${ch}"` });
    }
    i++;
  }

  return tokens;
}
