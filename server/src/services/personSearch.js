// Vietnamese person/directory search only. Never changes stored identities or AI text.
const vowels = {
  a: 'aàáạảãâầấậẩẫăằắặẳẵ',
  e: 'eèéẹẻẽêềếệểễ',
  i: 'iìíịỉĩ',
  o: 'oòóọỏõôồốộổỗơờớợởỡ',
  u: 'uùúụủũưừứựửữ',
  y: 'yỳýỵỷỹ',
  d: 'dđ',
};
function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');
}
function pattern(value) {
  const query = normalize(value);
  if (!query) return null;
  const source = Array.from(query, character => {
    if (character === ' ') return '\\s+';
    // Use actual combining-codepoint characters: MongoDB PCRE rejects JS \u escapes.
    if (vowels[character]) return '[' + vowels[character] + '][\u0300-\u036f]*';
    return character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return new RegExp(source, 'i');
}
module.exports = { normalize, pattern };
