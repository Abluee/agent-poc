import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './styles/theme.css'
import App from './App.vue'
import AmountInput from './components/AmountInput.vue'

Vue.use(ElementUI, { size: 'medium' })
Vue.component('AmountInput', AmountInput)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
