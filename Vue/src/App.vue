<script setup lang="ts">
import Chat from '@/components/ChatInterface.vue';
import 'devextreme/dist/css/dx.fluent.blue.light.css';
</script>

<template>
  <div class="app-container">
    <div class="chat-wrapper">
      <Chat/>
    </div>
  </div>
</template>
<style scoped>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: rgb(245 245 245);
  padding: 20px;
  box-sizing: border-box;
}

.chat-wrapper {
  width: 100%;
  max-width: 900px;
  height: 710px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

:deep(.chat-disabled .dx-chat-messagebox) {
  opacity: 0.5;
  pointer-events: none;
}
</style>
