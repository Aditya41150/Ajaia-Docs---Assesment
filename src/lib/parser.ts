import { marked } from 'marked'

export async function parseFileToHtml(file: File): Promise<string> {
  const text = await file.text()
  
  if (file.name.endsWith('.md')) {
    return marked.parse(text)
  }
  
  if (file.name.endsWith('.txt')) {
    return text.split('\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join('')
  }
  
  throw new Error('Unsupported file type')
}
