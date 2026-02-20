<template>
  <div
    ref="container"
    class="text-sm font-digital uppercase text-gray-800 rounded-md p-0 text-center m-0 my-1 h-[20px] relative overflow-hidden"
    style="
      -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 10%,
        black 90%,
        transparent 100%
      );
      mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
    "
  >
    <div
      ref="track"
      class="flex items-center text-sm font-digital uppercase text-gray-800 rounded-md p-0 text-left m-0 my-0 absolute w-fit whitespace-nowrap top-0 left-0 transition-opacity duration-1000 will-change-transform will-change-opacity"
      :style="{ transform: `translateX(${-offset}px)`, opacity: opacity }"
    >
      <div
        v-for="n in copies"
        :key="n"
        class="px-0 w-fit whitespace-nowrap font-digital text-md tracking-wider text-black"
        :ref="n === 1 ? 'copy' : null"
      >
        <button
          v-for="log in logs"
          :key="log.id"
          class="inline-flex items-center p-0 pl-3 pr-3 m-0 mr-2 rounded-md text-sm hover:bg-red-500 hover:text-white tracking-widest relative group"
          @mouseenter="pauseTicker"
          @mouseleave="resumeTicker"
          @click="buttonClick(log.id)"
        >
          <span class="select-none"> {{ log.expression }} = {{ log.solution }} </span>
        </button>
      </div>
    </div>
  </div>
  <div class="flex flex-row mb-1 text-xs">
    <div class="w-3/4 text-orange-500 bg-gray-600 rounded-md p-0.5 px-2 text-left mr-1">
      <span class="text-gray-800 mr-2">Status:</span> {{ tickerStatus }}
    </div>
    <button
      class="w-1/4 text-orange-500 bg-gray-600 rounded-md p-0.5 px-2 text-center hover:bg-red-500 hover:text-white"
      @click="buttonDeleteAll"
    >
      Delete All
    </button>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue'

const copies = ref(2)
const loading = ref(false)
const error = ref(null)
const offset = ref(0)
const copy = ref(null)
const rafId = ref(null)
let last = 0
let copyWidth = 0
const speed = 40
let containerWidth = 0
const container = ref(null)
const logs = ref([])
let paused = false
const tickerStatus = ref('Loading...')
const opacity = ref(0)

async function fadeOut() {
  opacity.value = 0
  await wait(1000)
}

async function fadeIn() {
  opacity.value = 1
  await wait(1000)
}

defineExpose({
  reloadTickerData,
  fetchTickerData,
  deleteTickerItem,
  deleteAllTickerItems,
  logs,
})

async function buttonClick(id) {
  pauseTicker()
  await fadeOut()
  await deleteTickerItem(id)
}

async function buttonDeleteAll() {
  pauseTicker()
  await fadeOut()
  await deleteAllTickerItems()
}

function pauseTicker() {
  paused = true
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }
}

function resumeTicker() {
  if (!paused) return
  paused = false
  last = 0
  rafId.value = requestAnimationFrame(tick)
}

async function measureAndSetCopies() {
  await nextTick()
  containerWidth = container.value?.clientWidth || 0
  const el = Array.isArray(copy.value) ? copy.value[0] : copy.value
  copyWidth = el?.offsetWidth || 0
  if (!copyWidth) {
    copies.value = 2
    return
  }
  const copiesValue = Math.max(2, Math.ceil(containerWidth / copyWidth) + 2)
  copies.value = copiesValue
}

function tick(ts) {
  if (paused) {
    return
  }
  if (!last) last = ts
  const dt = (ts - last) / 1000
  last = ts
  const newIncrement = speed * dt
  let newOffset = offset.value + newIncrement
  newOffset = newOffset % copyWidth
  if (copyWidth > 0) {
    offset.value = newOffset
  }
  rafId.value = requestAnimationFrame(tick)
}

async function start() {
  stop()
  last = 0
  rafId.value = requestAnimationFrame(tick)
  await fadeIn()
  resumeTicker()
}

function stop() {
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
  }
  rafId.value = null
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function restart() {
  await fadeOut()
  stop()
  offset.value = 0
  await measureAndSetCopies()
  start()
}

async function onResize() {
  await restart()
}

async function deleteTickerItem(id) {
  loading.value = true
  error.value = null
  tickerStatus.value = 'Deleting item...'

  try {
    const res = await fetch(`http://localhost:3500/api/ticker/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      console.error('!res.ok: Error response from server:', res.status, await res.text())
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()

    if (data.error) {
      console.error('API error:', data.error)
      throw new Error(data.error)
    }
    logs.value = logs.value.filter((log) => log.id !== id)
    await restart()
    tickerStatus.value = 'Item deleted'
  } catch (err) {
    console.error('Error block: Error fetching calculation:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function deleteAllTickerItems() {
  loading.value = true
  error.value = null
  tickerStatus.value = 'Deleting all items...'

  try {
    const res = await fetch(`http://localhost:3500/api/ticker/all`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      console.error('!res.ok: Error response from server:', res.status, await res.text())
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    if (data.error) {
      console.error('API error:', data.error)
      throw new Error(data.error)
    }
    logs.value = []
    await restart()
    tickerStatus.value = 'All items deleted'
  } catch (err) {
    console.error('Error block: Error fetching calculation:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}
async function fetchTickerData() {
  loading.value = true
  error.value = null
  tickerStatus.value = 'Loading...'
  try {
    const res = await fetch('http://localhost:3500/api/ticker/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      console.error('!res.ok: Error response from server:', res.status, await res.text())
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    if (data.error) {
      console.error('API error:', data.error)
      throw new Error(data.error)
    }
    const logData = data.data
    if (!Array.isArray(logData)) {
      console.error('Unexpected data format: expected an array', logData)
      throw new Error('Unexpected data format')
    }
    if (logData.length === 0) {
      tickerStatus.value = 'No items to display'
      logs.value = []
      return
    }
    if (logData.length === logs.value.length) {
      return
    }
    logs.value = logData
    tickerStatus.value = `Loaded ${logs.value.length} items`
  } catch (err) {
    console.error('Error block: Error fetching calculation:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}
async function reloadTickerData() {
  await fetchTickerData()
  await restart()
}

onMounted(() => {
  reloadTickerData()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', onResize)
})

watch(logs, async () => {
  await restart()
})
</script>
