<template>
  <el-input
    ref="inputRef"
    :value="displayValue"
    v-bind="$attrs"
    v-on="$listeners"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @keydown.native="handleKeydown"
    @paste.native="handlePaste"
  />
</template>

<script>
const MAX_INTEGER_DIGITS = 13
const MAX_DECIMAL_DIGITS = 2
const MAX_AMOUNT = '9999999999999.99'

export default {
  name: 'AmountInput',
  props: {
    value: {
      type: [Number, String],
      default: ''
    }
  },
  data() {
    return {
      isFocused: false,
      inputValue: '',
      lastSelection: {
        start: 0,
        end: 0
      }
    }
  },
  computed: {
    displayValue() {
      if (this.isFocused) {
        // 聚焦时显示原始数字
        return this.inputValue
      }
      // 失焦时显示千分位
      return this.formatNumber(this.inputValue)
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.inputValue = val === '' || val === null || val === undefined ? '' : String(val)
      }
    }
  },
  mounted() {
    this.bindBeforeInput()
  },
  methods: {
    bindBeforeInput() {
      this.$nextTick(() => {
        const input = this.getNativeInput()
        if (input) {
          input.addEventListener('beforeinput', this.handleBeforeInput)
        }
      })
    },
    getNativeInput() {
      return this.$refs.inputRef && this.$refs.inputRef.$el
        ? this.$refs.inputRef.$el.querySelector('input')
        : null
    },
    rememberSelection() {
      const input = this.getNativeInput()
      if (!input) return
      this.lastSelection = {
        start: input.selectionStart || 0,
        end: input.selectionEnd || 0
      }
    },
    handleInput(val) {
      const cleaned = this.normalizeAmount(val)
      this.inputValue = cleaned
      this.$emit('input', cleaned)
      // 立即同步 DOM，阻止用户敲入多余字符
      this.$nextTick(() => {
        const input = this.$refs.inputRef.$el.querySelector('input')
        if (input) {
          input.value = this.isFocused ? cleaned : this.formatNumber(cleaned)
        }
      })
    },
    handleFocus() {
      this.isFocused = true
      this.$nextTick(() => {
        const input = this.getNativeInput()
        if (input) {
          input.value = this.inputValue
          input.setSelectionRange(input.value.length, input.value.length)
        }
      })
    },
    handleBlur() {
      this.isFocused = false
      if (this.inputValue !== '') {
        const normalized = this.normalizeAmount(this.inputValue, { keepTrailingDot: false })
        const num = Number(normalized)
        if (!isNaN(num)) {
          this.inputValue = num.toFixed(MAX_DECIMAL_DIGITS)
          this.$emit('input', this.inputValue)
        }
      }
    },
    handleKeydown(event) {
      this.rememberSelection()

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End'
      ]

      if (allowedKeys.includes(event.key)) {
        return
      }

      if (event.key.length !== 1) {
        return
      }

      if (!this.canApplyInsertion(event.key)) {
        event.preventDefault()
      }
    },
    handleBeforeInput(event) {
      if (event.inputType && event.inputType.startsWith('delete')) {
        this.rememberSelection()
        return
      }

      const text = event.data || ''
      if (!text) {
        return
      }

      this.rememberSelection()
      if (!this.canApplyInsertion(text)) {
        event.preventDefault()
      }
    },
    handlePaste(event) {
      this.rememberSelection()
      const text = event.clipboardData ? event.clipboardData.getData('text') : ''
      if (!this.canApplyInsertion(text)) {
        event.preventDefault()
      }
    },
    canApplyInsertion(text) {
      const input = this.getNativeInput()
      const currentValue = input ? input.value : this.inputValue
      const start = input ? (input.selectionStart || 0) : this.lastSelection.start
      const end = input ? (input.selectionEnd || 0) : this.lastSelection.end
      const nextValue = `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`

      return this.isPotentiallyValidAmount(nextValue)
    },
    isPotentiallyValidAmount(val) {
      if (val === '') {
        return true
      }

      if (!/^\d*\.?\d*$/.test(val)) {
        return false
      }

      const parts = val.split('.')
      if (parts.length > 2) {
        return false
      }

      const [intPart = '', decPart = ''] = parts

      if (intPart.length > MAX_INTEGER_DIGITS) {
        return false
      }

      if (decPart.length > MAX_DECIMAL_DIGITS) {
        return false
      }

      const normalized = this.normalizeAmount(val)
      return this.compareAmountStrings(normalized || '0', MAX_AMOUNT) <= 0
    },
    normalizeAmount(val, options = {}) {
      const { keepTrailingDot = true } = options

      if (val === '' || val === null || val === undefined) {
        return ''
      }

      let raw = String(val).replace(/[^\d.]/g, '')
      if (!raw) {
        return ''
      }

      const firstDotIndex = raw.indexOf('.')
      if (firstDotIndex !== -1) {
        raw =
          raw.slice(0, firstDotIndex + 1) +
          raw.slice(firstDotIndex + 1).replace(/\./g, '')
      }

      let [intPart = '', decPart = ''] = raw.split('.')
      const hasDot = firstDotIndex !== -1

      intPart = intPart.slice(0, MAX_INTEGER_DIGITS)
      decPart = decPart.slice(0, MAX_DECIMAL_DIGITS)

      const normalizedInt = intPart.replace(/^0+(?=\d)/, '') || (intPart ? '0' : '')
      let normalized = hasDot ? `${normalizedInt}.${decPart}` : normalizedInt

      if (this.compareAmountStrings(normalized, MAX_AMOUNT) > 0) {
        normalized = MAX_AMOUNT
      }

      if (!keepTrailingDot && normalized.endsWith('.')) {
        normalized = normalized.slice(0, -1)
      }

      return normalized
    },
    compareAmountStrings(a, b) {
      const [aInt = '', aDec = ''] = String(a || '').split('.')
      const [bInt = '', bDec = ''] = String(b || '').split('.')

      if (aInt.length !== bInt.length) {
        return aInt.length > bInt.length ? 1 : -1
      }

      if (aInt !== bInt) {
        return aInt > bInt ? 1 : -1
      }

      const paddedADec = aDec.padEnd(MAX_DECIMAL_DIGITS, '0')
      const paddedBDec = bDec.padEnd(MAX_DECIMAL_DIGITS, '0')

      if (paddedADec === paddedBDec) {
        return 0
      }

      return paddedADec > paddedBDec ? 1 : -1
    },
    formatNumber(val) {
      if (val === '' || val === null || val === undefined) return ''
      const num = Number(val)
      if (isNaN(num)) return ''
      // 失焦时始终保留两位小数
      const formatted = num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      return formatted
    }
  },
  beforeDestroy() {
    const input = this.getNativeInput()
    if (input) {
      input.removeEventListener('beforeinput', this.handleBeforeInput)
    }
  }
}
</script>
