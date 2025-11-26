/**
 * Escape Markdown special characters to prevent parsing errors
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeMarkdown(text) {
  if (!text) return text;
  // Escape special Markdown characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return String(text)
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Escape usernames in text (preserves @ symbol but escapes underscores)
 * @param {string} text - Text containing usernames
 * @returns {string} Text with escaped usernames
 */
export function escapeUsername(text) {
  if (!text) return text;
  // Replace @username patterns, escaping underscores
  return String(text).replace(/@(\w+)/g, (match, username) => {
    const escapedUsername = username.replace(/_/g, '\\_');
    return `@${escapedUsername}`;
  });
}

/**
 * Safely format text for Markdown by escaping special characters in usernames
 * @param {string} text - Text to format
 * @param {boolean} preserveLinks - Whether to preserve markdown links
 * @returns {string} Safe Markdown text
 */
export function safeMarkdown(text, preserveLinks = false) {
  if (!text) return text;
  
  if (preserveLinks) {
    // Extract links first, then escape, then restore links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let linkIndex = 0;
    let processedText = text.replace(linkPattern, (match, linkText, linkUrl) => {
      links.push({ text: linkText, url: linkUrl });
      return `__LINK_${linkIndex++}__`;
    });
    
    // Escape the text
    processedText = escapeUsername(processedText);
    
    // Restore links
    linkIndex = 0;
    return processedText.replace(/__LINK_(\d+)__/g, () => {
      const link = links[linkIndex++];
      return `[${link.text}](${link.url})`;
    });
  }
  
  return escapeUsername(text);
}



