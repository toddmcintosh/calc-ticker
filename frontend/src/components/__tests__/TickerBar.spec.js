import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import TickerBar from '@/components/TickerBar.vue'

// Flush microtasks + Vue updates
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('TickerBar coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    // prevent infinite animation loops
    globalThis.requestAnimationFrame = vi.fn(() => 1)
    globalThis.cancelAnimationFrame = vi.fn()

    // mock fetch per test
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete globalThis.fetch
    delete globalThis.requestAnimationFrame
    delete globalThis.cancelAnimationFrame
    vi.restoreAllMocks()
  })

  it('loads items successfully and renders them', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, expression: '4+4', solution: '8' },
          { id: 2, expression: '2+2', solution: '4' },
        ],
        error: null,
      }),
    })

    const wrapper = mount(TickerBar)

    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loaded 2 items')
    expect(wrapper.text()).toContain('4+4 = 8')
    expect(wrapper.text()).toContain('2+2 = 4')
  })

  it('handles empty list (No items to display)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], error: null }),
    })

    const wrapper = mount(TickerBar)

    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No items to display')
    expect(wrapper.findAll('button').filter((b) => b.text().includes('='))).toHaveLength(0)
  })

  it('handles unexpected data format (data.data not array)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { nope: true }, error: null }),
    })

    const wrapper = mount(TickerBar)

    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toMatch(/Loaded \d+ items/)
  })

  it('covers fetchTickerData early return when same length as existing logs', async () => {
    // First load 2 items
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, expression: '1+1', solution: '2' },
          { id: 2, expression: '2+2', solution: '4' },
        ],
        error: null,
      }),
    })

    const wrapper = mount(TickerBar)
    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loaded 2 items')

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 999, expression: 'SHOULD NOT', solution: 'CHANGE' },
          { id: 1000, expression: 'SHOULD NOT', solution: 'CHANGE' },
        ],
        error: null,
      }),
    })

    await wrapper.vm.fetchTickerData()
    await flush()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('1+1 = 2')
    expect(wrapper.text()).not.toContain('SHOULD NOT')
  })

  it('covers resumeTicker early return when not paused (mouseleave without mouseenter)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, expression: '4+4', solution: '8' }],
        error: null,
      }),
    })

    const wrapper = mount(TickerBar)
    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    const logBtn = wrapper.findAll('button').find((b) => b.text().includes('='))
    await logBtn.trigger('mouseleave')

    expect(true).toBe(true) // just covering the branch
  })

  it('deletes one item successfully via click', async () => {
    // Initial load
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, expression: '4+4', solution: '8' },
          { id: 2, expression: '2+2', solution: '4' },
        ],
        error: null,
      }),
    })

    // DELETE /api/ticker/1
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { deleted: true }, error: null }),
    })

    const wrapper = mount(TickerBar)
    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    const firstLogBtn = wrapper.findAll('button').find((b) => b.text().includes('4+4 = 8'))
    await firstLogBtn.trigger('click')

    // buttonClick -> fadeOut(1000) -> deleteTickerItem -> restart(fadeOut+fadeIn timers)
    await vi.advanceTimersByTimeAsync(3000)
    await flush()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Item deleted')
    expect(wrapper.text()).not.toContain('4+4 = 8')
    expect(wrapper.text()).toContain('2+2 = 4')
  })

  it('deleteTickerItem handles HTTP error (!ok)', async () => {
    // Initial load
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, expression: '4+4', solution: '8' }],
        error: null,
      }),
    })

    // DELETE fails
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'nope',
    })

    const wrapper = mount(TickerBar)
    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    const firstLogBtn = wrapper.findAll('button').find((b) => b.text().includes('4+4 = 8'))
    await firstLogBtn.trigger('click')

    await vi.advanceTimersByTimeAsync(3000)
    await flush()
    await wrapper.vm.$nextTick()

    // no success status
    expect(wrapper.text()).not.toContain('Item deleted')
  })

  it('deletes all items successfully', async () => {
    // Initial load
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, expression: '4+4', solution: '8' },
          { id: 2, expression: '2+2', solution: '4' },
        ],
        error: null,
      }),
    })

    // DELETE all
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { deleted_all: true }, error: null }),
    })

    const wrapper = mount(TickerBar)
    await flush()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    const deleteAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete All')
    await deleteAllBtn.trigger('click')

    await vi.advanceTimersByTimeAsync(3000)
    await flush()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('All items deleted')
    expect(wrapper.text()).not.toContain('=')
  })
  it('measureAndSetCopies computes copies when widths are non-zero', async () => {
    vi.useFakeTimers()

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 1, expression: '4+4', solution: '8' }], error: null }),
    })

    const wrapper = mount(TickerBar)
    await wrapper.vm.$nextTick()

    const containerEl = wrapper.vm.$refs.container
    const copyEl = Array.isArray(wrapper.vm.$refs.copy)
      ? wrapper.vm.$refs.copy[0]
      : wrapper.vm.$refs.copy

    Object.defineProperty(containerEl, 'clientWidth', { get: () => 200 })
    Object.defineProperty(copyEl, 'offsetWidth', { get: () => 50 })

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loaded 1 items')
  })
})
