import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CalcTicker from '@/components/CalcTicker.vue'

const TickerBarStub = {
  name: 'TickerBar',
  template: '<div />',
  methods: {
    reloadTickerData: vi.fn(),
  },
}

function mountCalcTicker() {
  return mount(CalcTicker, {
    global: {
      stubs: {
        TickerBar: TickerBarStub,
      },
    },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  // clean up fetch
  delete globalThis.fetch
})

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

  it('sanitizes input on @input', async () => {
    const wrapper = mountCalcTicker()
    const input = wrapper.find('input')

    await input.setValue('1+a@2sqrtB') // has letters + invalid @
    await input.trigger('input') // calls sanitize()

    // letters removed (except sqrt), invalid chars removed
    expect(input.element.value).toBe('1+2')
  })

  it('clear button sets expression to 0 and clears error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })
    const wrapper = mountCalcTicker()
    const input = wrapper.find('input')
    await input.setValue('123')
    const equalsBtn = wrapper.findAll('button').find((b) => b.text() === '=')
    await equalsBtn.trigger('click')
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/HTTP 400/i)

    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'C')
    await clearBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(input.element.value).toBe('0')
    expect(wrapper.text()).not.toMatch(/HTTP 400/i)
  })

  it('buttonClick converts x to * and q to sqrt, and prevents duplicate operators', async () => {
    const wrapper = mountCalcTicker()
    const buttons = wrapper.findAll('button')

    // Helpers: find buttons by their displayed text
    const btn = (label) => buttons.find((b) => b.text() === label)

    // Start from 0: clicking a number should replace 0
    await btn('7').trigger('click')
    expect(wrapper.find('input').element.value).toBe('7')

    // Add operator + then another operator (should prevent duplicate operator append)
    await btn('+').trigger('click')
    await btn('-').trigger('click') // duplicate operator case (lastChar operator and val operator)
    expect(wrapper.find('input').element.value).toBe('7+') // '-' should NOT append

    // x becomes *
    await btn('x').trigger('click')
    // last char is '+', '*' is operator -> still operator/operator, should NOT append
    expect(wrapper.find('input').element.value).toBe('7+')

    // Add number then x (now allowed)
    await btn('8').trigger('click')
    await btn('x').trigger('click')
    expect(wrapper.find('input').element.value).toBe('7+8*')

    // q displays sqrt, appends "sqrt"
    await btn('sqrt').trigger('click')
    expect(wrapper.find('input').element.value).toBe('7+8*sqrt')
  })
  it('fetchCalculation sets error when server returns non-OK', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'nope',
    })

    const wrapper = mountCalcTicker()
    wrapper.vm.setExpression('4+4')

    // click "=" (last button in grid)
    const eq = wrapper.findAll('button').at(-1)
    await eq.trigger('click')

    // wait a tick for async to settle
    await Promise.resolve()

    expect(wrapper.text()).toMatch(/HTTP 500/)
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })
  //
  it('fetchCalculation sets error when API returns data.error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, error: 'Invalid expression' }),
    })

    const wrapper = mountCalcTicker()
    wrapper.vm.setExpression('1+a')

    const eq = wrapper.findAll('button').at(-1)
    await eq.trigger('click')
    await Promise.resolve()

    expect(wrapper.text()).toMatch(/Invalid expression/)
  })
  // //
  it('fetchCalculation updates expression and calls ticker reload on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { solution: '8' }, error: null }),
    })

    const wrapper = mountCalcTicker()
    wrapper.vm.setExpression('4+4')

    const tickerVm = wrapper.findComponent({ name: 'TickerBar' }).vm
    const reloadSpy = vi.spyOn(tickerVm, 'reloadTickerData')

    const eq = wrapper.findAll('button').at(-1)
    await eq.trigger('click')

    await Promise.resolve()
    await Promise.resolve()

    expect(wrapper.find('input').element.value).toBe('8')
    expect(reloadSpy).toHaveBeenCalled()
  })
  it('replaces initial 0 when a digit button is pressed', async () => {
    const wrapper = mountCalcTicker()
    const input = wrapper.find('input')

    // initial value should be empty string (but clear() sets it to '0')
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'C')
    await clearBtn.trigger('click')
    expect(input.element.value).toBe('0')

    // press a digit, should remove the leading 0 and start fresh
    const sevenBtn = wrapper.findAll('button').find((b) => b.text() === '7')
    await sevenBtn.trigger('click')

    expect(input.element.value).toBe('7')
  })
})
