import { ref } from 'vue';
import { OpenAI } from 'openai';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { loadMessages } from 'devextreme/localization';
import TextArea from 'devextreme/ui/text_area';

const ALERT_TIMEOUT = 10000;
const OpenAIConfig = {
  dangerouslyAllowBrowser: true,
  apiKey: 'OPEN_AI_KEY',
  deployment: 'gpt-4o-mini'
};

export function useChatLogic() {
  // Состояние
  const dataSource = ref(null);
  const user = ref({ id: 'user' });
  const assistant = ref({ id: 'assistant', name: 'Virtual Assistant' });
  const typingUsers = ref([]);
  const alerts = ref([]);
  const regenerationText = ref('Regeneration...');
  const copyButtonIcon = ref('copy');
  const isDisabled = ref(false);
  const store = ref([]);
  const messages = ref([]);
  const chatService = new OpenAI(OpenAIConfig);

  const loadMessage = () => {
    loadMessages({
      en: {
        'dxChat-emptyListMessage': 'Chat is Empty',
        'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
        'dxChat-textareaPlaceholder': 'Ask AI Assistant...'
      }
    });
  };

  const initDataSource = () => {
    const customStore = new CustomStore({
      key: 'id',
      load: () => Promise.resolve([...store.value]),
      insert: (message) => {
        store.value.push(message);
        return Promise.resolve(message);
      }
    });

    dataSource.value = new DataSource({ store: customStore, paginate: false });
  };

  const getAIResponse = async(messages) => {
    const params = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: OpenAIConfig.deployment
    };

    const response = await chatService.chat.completions.create(params);
    return response.choices[0].message?.content;
  };

  const processMessageSending = async() => {
    toggleDisabledState(true);
    typingUsers.value = [assistant.value];

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
    } finally {
      toggleDisabledState(false);
    }
  };

  const updateLastMessage = (text) => {
    let items = dataSource.value?.items();
    const lastMessage = items?.at(-1);
    const data = {
      text: text ?? 'Regeneration...'
    };

    dataSource.value?.store().push([{
      type: 'update',
      key: lastMessage.id,
      data: data
    }]);
  };

  const renderAssistantMessage = (text) => {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: assistant.value,
      text
    };

    dataSource.value?.store().push([{ type: 'insert', data: message }]);
  };

  const alertLimitReached = () => {
    setAlerts([{ message: 'Request limit reached, try again in a minute.' }]);
    setTimeout(() => setAlerts([]), ALERT_TIMEOUT);
  };

  const setAlerts = (newAlerts) => {
    alerts.value = newAlerts;
  };

  const regenerate = async() => {
    try {
      const aiResponse = await getAIResponse(messages.value.slice(0, -1));
      updateLastMessage(aiResponse);
      const lastMsg = messages.value.at(-1);
      if (lastMsg) {
        lastMsg.content = aiResponse ?? '';
        messages.value = [...messages.value];
      }
    } catch {
      const lastMsg = messages.value.at(-1);
      if (lastMsg) updateLastMessage(lastMsg.content);
      alertLimitReached();
    }
  };

  const convertToHtml = (message) => {
    return unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(message.text || '')
      .toString();
  };

  const toggleDisabledState = (disabled) => {
    let element = document.querySelector('.dx-chat-messagebox-textarea');
    let textAreaInstance = element ? TextArea.getInstance(element) : null;

    textAreaInstance?.option({ disabled });

    if (!disabled) {
      textAreaInstance?.focus();
    }
  };

  const onMessageEntered = async({ message }) => {
    dataSource.value?.store().push([{
      type: 'insert',
      data: { id: Date.now(), ...message }
    }]);

    messages.value.push({ role: 'user', content: message?.text ?? '' });
    await processMessageSending();
  };

  const onCopyButtonClick = (message) => {
    navigator.clipboard?.writeText(message.text ?? '');
    copyButtonIcon.value = 'check';
    setTimeout(() => copyButtonIcon.value = 'copy', 2500);
  };

  const onRegenerateButtonClick = async() => {
    updateLastMessage();
    toggleDisabledState(true);
    try {
      await regenerate();
    } finally {
      toggleDisabledState(false);
    }
  };

  return {
    dataSource,
    user,
    typingUsers,
    alerts,
    regenerationText,
    copyButtonIcon,
    isDisabled,
    loadMessage,
    initDataSource,
    convertToHtml,
    onMessageEntered,
    onCopyButtonClick,
    onRegenerateButtonClick
  };
}
