/**
 * @param {string} keyValuePairsStr
 */
module.exports = function parseKeyValuePairs(keyValuePairsStr) {
  /** @type {[string, string][]} */
  const pairs = [];
  
  const regexp = /\s*([^:,\s]+)\s*:\s*([^:,\s]+)\s*(,|$)|\s*,|\s+/g;
  
  /** @type {RegExpExecArray | null} */
  let match;
  let curIndex = 0;
  while ((match = regexp.exec(keyValuePairsStr))) {
    if (match.index !== curIndex) {
      return {errIndex: curIndex};
    }
    
    const key = match[1];
    const val = match[2];
    
    if (key) {
      pairs.push([key, val]);
    }
    
    curIndex += match[0].length;
  }
  
  if (curIndex !== keyValuePairsStr.length) {
    return {errIndex: curIndex};
  }
  
  return {pairs};
};