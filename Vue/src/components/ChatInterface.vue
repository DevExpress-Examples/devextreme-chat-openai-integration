<template>
  <div class="demo-container">
    <DxChat
      :data-source="dataSource"
      :reload-on-change="false"
      :show-avatar="false"
      :show-day-headers="false"
      :user="user"
      height="710"
      :typing-users="typingUsers"
      :alerts="alerts"
      @message-entered="onMessageEntered"
      message-template="messageTemplate"
    >
      <template #messageTemplate="{ data }">
        <div v-if="data.message.text === regenerationText">
          <span>{{ regenerationText }}</span>
        </div>
        <div v-else>
          <div
            class="dx-chat-messagebubble-text"
            v-html="convertToHtml(data.message)"
          />
          <div class="dx-bubble-button-container">
            <DxButton
              :icon="copyButtonIcon"
              styling-mode="text"
              hint="Copy"
              @click="onCopyButtonClick(data.message)"
            />
            <DxButton
              icon="refresh"
              styling-mode="text"
              hint="Regenerate"
              @click="onRegenerateButtonClick"
            />
          </div>
        </div>
      </template>
    </DxChat>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { DxChat } from 'devextreme-vue/chat';
import { DxButton } from 'devextreme-vue/button';
import { useChatLogic } from '@/helpers/chat.helpers.js';

const {
  dataSource,
  user,
  typingUsers,
  alerts,
  regenerationText,
  copyButtonIcon,
  loadMessage,
  initDataSource,
  convertToHtml,
  onMessageEntered,
  onCopyButtonClick,
  onRegenerateButtonClick
} = useChatLogic();

// Initialize component
onMounted(() => {
  loadMessage();
  initDataSource();
});
</script>

<style scoped>
:deep(.dx-chat) {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}

:deep(.dx-chat-message-list) {
  flex: 1;
}
:deep(.dx-chat-message-content .dx-chat-message-bubble) {
  border-radius: 8px;
}

:deep(.dx-chat-message-bubble.dx-chat-message-bubble-sent) {
  background-color: rgb(227 242 253);
}

:deep(.dx-chat-message-bubble.dx-chat-message-bubble-received) {
  background-color: rgb(241 241 241);
}

:deep(.dx-chat-messagelist-empty-image) {
  display: none;
}

:deep(.dx-chat-messagelist-empty-message) {
  font-size: 16px;
  color: rgb(102 102 102);
  text-align: center;
  padding: 20px;
}

:deep(.dx-bubble-button-container) {
  display: none;
  gap: 8px;
  margin-top: 8px;
}

:deep(.dx-chat-messagegroup-alignment-start:last-child .dx-chat-messagebubble:last-child .dx-bubble-button-container) {
  display: flex;
}

:deep(.dx-button) {
  background: transparent;
  border: none;
  padding: 4px;
  color: rgb(102 102 102);
}

:deep(.dx-button:hover) {
  background: rgb(0 0 0 / 4%);
}

:deep(.dx-chat-messagebubble-text) {
  line-height: 1.5;
}

:deep(.dx-chat-messagebubble-text ol),
:deep(.dx-chat-messagebubble-text ul) {
  padding-left: 20px;
  margin: 8px 0;
}

:deep(.dx-chat-messagebubble-text pre) {
  background: rgb(245 245 245);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

:deep(.dx-chat-messagebubble-text code) {
  font-family: monospace;
  background: rgb(245 245 245);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

:deep(.dx-chat-message-pending) {
  opacity: 0.6;
}
</style>
