export function renderMarkdown(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.*?)`/g, "<code class='bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-400'>$1</code>");
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (_match, label: string, rawUrl: string) => {
    const decodedUrl = rawUrl.replace(/&amp;/g, "&");
    try {
      const url = new URL(decodedUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return label;
      const safeUrl = url.href
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-500 underline hover:text-indigo-400">${label}</a>`;
    } catch {
      return label;
    }
  });
  
  return html;
}
