export function parseKeywords(input) {
  if (!input) return [];
  
  const keywords = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      if (current.trim()) keywords.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    keywords.push(current.trim());
  }
  
  return keywords;
}

export function checkKeywordMatch(messageText, keywordConfig, condition, isCaseSensitive) {
  if (!messageText) return false;
  
  // If the condition is "any", any message passes
  if (condition === 'any' || !condition) return true;
  
  if (!keywordConfig) return false; // If keyword is empty but condition is set, it fails

  const keywords = parseKeywords(keywordConfig);
  const textToSearch = isCaseSensitive ? messageText : messageText.toLowerCase();
  
  if (condition === 'exact') {
    return keywords.some(kw => {
      const searchKw = isCaseSensitive ? kw : kw.toLowerCase();
      return textToSearch === searchKw;
    });
  }
  
  // default: 'keyword' (Contains Keyword)
  return keywords.some(kw => {
    const searchKw = isCaseSensitive ? kw : kw.toLowerCase();
    return textToSearch.includes(searchKw);
  });
}
