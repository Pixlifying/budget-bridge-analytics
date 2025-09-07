import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Configuration for HTML sanitization
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'div', 'span', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['style', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    KEEP_CONTENT: true
  };
  
  return String(DOMPurify.sanitize(html, config));
}

/**
 * Escapes HTML special characters to prevent XSS in text content
 * @param text - Plain text to escape
 * @returns HTML-escaped string safe for direct insertion into HTML
 */
export function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * Sanitizes template content and replaces placeholders safely
 * @param content - Template content with placeholders
 * @param placeholderValues - Values to replace placeholders with
 * @returns Sanitized content with escaped placeholder values
 */
export function sanitizeTemplateContent(
  content: string, 
  placeholderValues: Record<string, string>
): string {
  // First sanitize the base content
  let sanitizedContent = sanitizeHtml(content);
  
  // Then replace placeholders with escaped values
  Object.entries(placeholderValues).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const escapedValue = escapeHtml(value);
    sanitizedContent = sanitizedContent.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'), 
      escapedValue
    );
  });
  
  return sanitizedContent;
}