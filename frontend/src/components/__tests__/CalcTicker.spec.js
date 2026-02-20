import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CalcTicker from '../CalcTicker.vue'

describe('CalcTicker.fetchCalculation', () => {
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
            data: [{ id: 1, expression: '2+2', solution: '4' }],
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

  it('Simulates expression calculation and update to display', async () => {
    const wrapper = mount(CalcTicker)
    wrapper.vm.setExpression('2+2')
    await wrapper.vm.fetchCalculation()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3500/api/ticker',
      expect.objectContaining({ method: 'POST' }),
    )
    //after function runs it replaces the expression in the dispaly with the solution
    expect(wrapper.vm.expression).toBe('4')
  })
})
