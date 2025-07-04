import { vi } from 'vitest'

class MockCanvasRenderingContext2D {
  clearRect = vi.fn()
  setLineDash = vi.fn()
  beginPath = vi.fn()
  moveTo = vi.fn()
  lineTo = vi.fn()
  closePath = vi.fn()
  stroke = vi.fn()
  arc = vi.fn()
  fill = vi.fn()
  save = vi.fn()
  translate = vi.fn()
  rotate = vi.fn()
  drawImage = vi.fn()
  restore = vi.fn()
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => new MockCanvasRenderingContext2D())
