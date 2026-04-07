<template>
  <div id="app">
    <TransferForm />
  </div>
</template>

<script>
import TransferForm from './views/TransferForm.vue'

export default {
  name: 'App',
  components: {
    TransferForm
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f3f6fb;
  color: #1f2a44;
}

button,
input,
select {
  font: inherit;
}
</style>
