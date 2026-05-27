import {
  assistant,
  CHAT_MESSAGEBOX_BUTTON_CLASS,
  CHAT_MESSAGEBOX_TEXTAREA_CLASS,
  deployment,
  REGENERATION_TEXT,
} from './data.js';

export function loadMessages() {
  DevExpress.localization.loadMessages({
    'en': {
      'dxChat-emptyListMessage': 'Chat is Empty',
      'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
      'dxChat-textareaPlaceholder': 'Ask AI Assistant...',
    },
  });
}
function alertLimitReached(chatInstance) {
  chatInstance.option({
    alerts: [{
      message: 'Request limit reached, try again in a minute.',
    }],
  });

  setTimeout(() => {
    chatInstance.option({ alerts: [] });
  }, 10000);
}

function toggleDisabledState(disabled, chatInstance) {
  const $button = chatInstance.element().find(`.${CHAT_MESSAGEBOX_BUTTON_CLASS}`);
  const $textArea = chatInstance.element().find(`.${CHAT_MESSAGEBOX_TEXTAREA_CLASS}`);
  const buttonInstance = $button.dxButton('instance');
  const textAreaInstance = $textArea.dxTextArea('instance');

  buttonInstance.option({ disabled });
  textAreaInstance.option({ disabled });

  if (!disabled) {
    textAreaInstance.focus();
  }
}

export async function processMessageSending(chatInstance, messages, customStore, chatService) {
  toggleDisabledState(true, chatInstance);

  chatInstance.option({ typingUsers: [assistant] });

  try {
    const aiResponse = await getAIResponse(messages, chatService);

    setTimeout(() => {
      chatInstance.option({ typingUsers: [] });

      messages.push({ role: 'assistant', content: aiResponse });

      renderMessage(aiResponse, customStore);
    }, 200);
  } catch {
    chatInstance.option({ typingUsers: [] });
    alertLimitReached(chatInstance);
  } finally {
    toggleDisabledState(false, chatInstance);
  }
}
function renderMessage(text, customStore) {
  const message = {
    id: Date.now(),
    timestamp: new Date(),
    author: assistant,
    text,
  };

  customStore.push([{ type: 'insert', data: message }]);
}
export async function regenerate(chatInstance, messages, chatService, customStore) {
  toggleDisabledState(true, chatInstance);

  try {
    const aiResponse = await getAIResponse(messages.slice(0, -1), chatService);

    updateLastMessage(aiResponse, chatInstance, customStore);
    messages.at(-1).content = aiResponse;
  } catch {
    updateLastMessage(messages.at(-1).content);
    alertLimitReached();
  } finally {
    toggleDisabledState(false, chatInstance);
  }
}
export function updateLastMessage(text, chatInstance, customStore) {
  const { items } = chatInstance.option();
  const lastMessage = items.at(-1);
  const data = {
    text: text || REGENERATION_TEXT,
  };

  customStore.push([{
    type: 'update',
    key: lastMessage.id,
    data,
  }]);
}

async function getAIResponse(messagesAI, chatService) {
  const params = {
    messages: messagesAI || '',
    model: deployment,
  };

  const response = await chatService.chat.completions.create(params);
  const data = { choices: response.choices };

  return data.choices[0].message?.content;
}

export function convertToHtml(value) {
  return unified()
    .use(remarkParse)
    // eslint-disable-next-line spellcheck/spell-checker
    .use(remarkRehype)
    // eslint-disable-next-line spellcheck/spell-checker
    .use(rehypeStringify)
    .processSync(value)
    .toString();
}
