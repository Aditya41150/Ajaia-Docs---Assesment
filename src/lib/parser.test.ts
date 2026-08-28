import { describe, it, expect } from 'vitest'
import { parseFileToHtml } from './parser'

describe('parseFileToHtml', () => {
  it('should parse markdown file correctly', async () => {
    const file = new File(['# Hello\n\n**bold text**'], 'test.md', { type: 'text/markdown' })
    const html = await parseFileToHtml(file)
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<strong>bold text</strong>')
  })

  it('should parse text file correctly', async () => {
    const file = new File(['First paragraph\n\nSecond paragraph'], 'test.txt', { type: 'text/plain' })
    const html = await parseFileToHtml(file)
    expect(html).toContain('<p>First paragraph</p>')
    expect(html).toContain('<p>Second paragraph</p>')
  })

  it('should throw error for unsupported extension', async () => {
    const file = new File(['some data'], 'test.csv', { type: 'text/csv' })
    await expect(parseFileToHtml(file)).rejects.toThrow('Unsupported file type')
  })
})
