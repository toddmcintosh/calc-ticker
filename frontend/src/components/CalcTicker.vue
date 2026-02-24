<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-400 p-4">
    <div class="w-124">
      <div
        class="text-[30px] font-thin tracking-[20px] uppercase text-orange-500 bg-gray-600 rounded-md p-2 text-center"
      >
        Calc.Ticker
      </div>
      <TickerBar ref="tickerRef" />
      <div class="w-full rounded-md p-8 bg-gray-600 mt-0">
        <input
          :class="displayClass"
          type="text"
          v-model="expression"
          @input="sanitize"
          placeholder="0"
        />
        <div class="grid grid-cols-4 gap-1">
          <button :class="clearClass" @click="clear" :disabled="loading">C</button>
          <button v-for="btn in buttons" :key="btn" :class="buttonClass" @click="buttonClick(btn)">
            {{ btn == 'q' ? 'sqrt' : btn }}
          </button>
          <button :class="equalsClass" @click="fetchCalculation" :disabled="loading">=</button>
        </div>
        <p
          v-if="error"
          class="text-red-500 text-right bg-gray-700 rounded-md mt-2 p-1 px-2 text-sm"
        >
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import TickerBar from './TickerBar.vue'

const tickerRef = ref(null)
const chars = 'q^+789-456x123/0()'
const buttons = chars.split('')
const buttonBase = 'text-white p-2 rounded-md text-sm border border-gray-700'
const buttonClass = buttonBase + ' hover:bg-gray-500'
const equalsClass = buttonBase + ' bg-gray-700 hover:bg-green-600'
const clearClass = buttonBase + ' bg-orange-500 hover:bg-red-600'
const displayClass =
  'font-digital border-2 border-gray-500 rounded-md p-0 px-2 mb-4 text-right text-4xl text-black bg-orange-200'
const loading = ref(false)
const error = ref(null)
const expression = ref('')

defineExpose({
  fetchCalculation,
  setExpression: (v) => (expression.value = v),
})

onMounted(() => {})
onBeforeUnmount(() => {})

//utils---------------------------------
async function reloadTickerData() {
  await tickerRef.value?.reloadTickerData()
}

function sanitize() {
  expression.value = expression.value
    .replace(/(?!sqrt)[a-z]/gi, '')
    .replace(/[^0-9+\-*/^().\s]/g, '')
}

function clear() {
  expression.value = '0'
  error.value = null
}

function buttonClick(btn) {
  let val = ''
  let eVal = expression.value
  if (eVal === '0') {
    expression.value = ''
    val = ''
  }
  switch (btn) {
    case 'x':
      val = '*'
      break
    case 'q':
      val = 'sqrt'
      break
    default:
      val = btn
  }
  let lastChar = eVal.at(-1)
  //prevent duplicate operators
  if (lastChar == undefined) {
    expression.value += val
    return
  }
  if (!(isOperator(lastChar) && isOperator(val))) {
    expression.value += val
  }
}

function isOperator(char) {
  return ['+', '-', '*', '/', '^'].includes(char)
}

//data fetching---------------------------------
async function fetchCalculation() {
  loading.value = true
  error.value = null

  const payload = {
    expression: expression.value,
  }

  try {
    const res = await fetch('http://localhost:3500/api/ticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    if (data.error) {
      throw new Error(data.error)
    }
    expression.value = data.data.solution
    await reloadTickerData()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
