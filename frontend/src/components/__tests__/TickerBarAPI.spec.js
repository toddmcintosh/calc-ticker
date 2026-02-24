import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import TickerBar from '@/components/TickerBar.vue'

describe('TickerBar.fetchTickerData', () => {
  let fetchMock
  beforeEach(() => {
    fetchMock = vi.fn(async (url, opts) => {
      if (url === 'http://localhost:3500/api/ticker' && opts?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            data: { id: 1, expression: '2+2', solution: '4' },
            error: null,
          }),
        }
      }
      if (url === 'http://localhost:3500/api/ticker/data' && opts?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            data: [
              { id: 1, expression: '2+2', solution: '4' },
              { id: 2, expression: '3+3', solution: '6' },
            ],
            error: null,
          }),
        }
      }
      if (url.startsWith('http://localhost:3500/api/ticker/') && opts?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({
            data: { id: 1 },
            error: null,
          }),
        }
      }
      if (url.startsWith('http://localhost:3500/api/ticker/all') && opts?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({
            error: null,
          }),
        }
      }
      throw new Error(`Unexpected fetch: ${url} ${opts?.method}`)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Fetches ticker data and updates logs', async () => {
    const wrapper = mount(TickerBar)
    await wrapper.vm.fetchTickerData()
    await wrapper.vm.$nextTick()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3500/api/ticker/data',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(wrapper.vm.logs).toEqual([
      { id: 1, expression: '2+2', solution: '4' },
      { id: 2, expression: '3+3', solution: '6' },
    ])
  })

  it('Delete one ticker item and update logs', async () => {
    const wrapper = mount(TickerBar)
    await wrapper.vm.deleteTickerItem('1')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3500/api/ticker/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('Delete all ticker items and update logs', async () => {
    const wrapper = mount(TickerBar)
    await wrapper.vm.deleteAllTickerItems()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3500/api/ticker/all',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
