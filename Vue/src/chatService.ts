import { ref } from 'vue';
import { OpenAI } from 'openai';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export const REGENERATION_TEXT = 'Regeneration...';
export const ALERT_TIMEOUT = 10000;

export const user = { id: 'user', name: 'You' };
export const assistant = { id: 'assistant', name: 'Virtual Assistant' };

const OpenAIConfig = {
  dangerouslyAllowBrowser: true,
  apiKey: 'sk-REPLACE_ME', // <-- Replace with your OpenAI key
  deployment: 'gpt-4o-mini',
};

const chatService = new OpenAI(OpenAIConfig);

const store = ref<any[]>([]);
const messages = ref<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([]);
const alerts = ref<{ message: string }[]>([]);
const typingUsers = ref<any[]>([]);
const isDisabled = ref(false);
const copyButtonIcon = ref('copy');

const customStore = new CustomStore({
  key: 'id',
  load: () => Promise.resolve([...store.value]),
  insert: (message: any) => {
    store.value.push(message);
    return Promise.resolve(message);
  },
});

const dataSource = new DataSource({ store: customStore, paginate: false });

function setAlerts(newAlerts: { message: string }[]) {
  alerts.value = newAlerts;
  if (newAlerts.length) {
    setTimeout(() => alerts.value = [], ALERT_TIMEOUT);
  }
}

function alertLimitReached() {
  setAlerts([{ message: 'Request limit reached, try again in a minute.' }]);
}

function convertToHtml(value: string) {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(value)
    .toString();
}

async function getAIResponse(msgs: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  const params = {
    messages: msgs.map(msg => ({ role: msg.role, content: msg.content })),
    model: OpenAIConfig.deployment,
  };
  const response = await chatService.chat.completions.create(params);
  return response.choices[0].message?.content;
}

async function processMessageSending() {
  typingUsers.value = [assistant];
  try {
    const aiResponse = await getAIResponse(messages.value);
    setTimeout(() => {
      typingUsers.value = [];
      messages.value.push({ role: 'assistant', content: aiResponse ?? '' });
      renderAssistantMessage(aiResponse ?? '');
    }, 200);
  } catch {
    typingUsers.value = [];
    alertLimitReached();
  }
}

function renderAssistantMessage(text: string | null) {
  const message = {
    id: Date.now(),
    timestamp: new Date(),
    author: assistant,
    text,
  };
  dataSource.store().push([{ type: 'insert', data: message }]);
}

function updateLastMessage(text?: string | null) {
  const items = dataSource.items();
  const lastMessage = items.at(-1);
  if (lastMessage) {
    dataSource.store().push([
      { type: 'update', key: lastMessage.id, data: { text } },
    ]);
  }
}

async function regenerate() {
  try {
    const aiResponse = await getAIResponse(messages.value.slice(0, -1));
    updateLastMessage(aiResponse);
    const lastMsg = messages.value.at(-1);
    if (lastMsg) lastMsg.content = aiResponse ?? '';
  } catch {
    const lastMsg = messages.value.at(-1);
    if (lastMsg) updateLastMessage(lastMsg.content);
    alertLimitReached();
  }
}

async function onMessageEntered(message: { text: string }) {
  dataSource.store().push([{ type: 'insert', data: { id: Date.now(), timestamp: new Date(), author: user, text: message.text } }]);
  messages.value.push({ role: 'user', content: message.text });
  await processMessageSending();
}

function onCopyButtonClick(message: { text: string }) {
  navigator.clipboard?.writeText(message.text ?? '');
  copyButtonIcon.value = 'check';
  setTimeout(() => {
    copyButtonIcon.value = 'copy';
  }, 2500);
}

export function useChatService() {
  return {
    dataSource,
    user,
    assistant,
    typingUsers,
    alerts,
    isDisabled,
    copyButtonIcon,
    REGENERATION_TEXT,
    convertToHtml,
    onMessageEntered,
    regenerate,
    updateLastMessage,
    onCopyButtonClick,
  };
}
