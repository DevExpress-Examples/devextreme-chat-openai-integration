import {
  assistant,
  CHAT_SEND_BUTTON_SELECTOR,
  CHAT_TEXTAREA_CLASS,
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
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

let alertTimeoutId;

function alertError(message, chatInstance) {
  clearTimeout(alertTimeoutId);

  chatInstance.option({
    alerts: [{
      message,
    }],
  });

  alertTimeoutId = setTimeout(() => {
    chatInstance.option({ alerts: [] });
  }, 10000);
}

function toggleDisabledState(disabled, chatInstance) {
  const $button = chatInstance.element().find(CHAT_SEND_BUTTON_SELECTOR);
  const $textArea = chatInstance.element().find(`.${CHAT_TEXTAREA_CLASS}`);
  const $input = $textArea.find('.dx-texteditor-input');
  const buttonInstance = $button.dxButton('instance');

  buttonInstance.option({ disabled: disabled || !$input.val().trim() });
  $textArea.toggleClass('dx-state-disabled', disabled);
  $input.prop('disabled', disabled);

  if (!disabled) {
    $input.trigger('focus');
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
  } catch (error) {
    chatInstance.option({ typingUsers: [] });
    alertError(getErrorMessage(error), chatInstance);
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
  chatInstance.option({ alerts: [] });
  toggleDisabledState(true, chatInstance);

  try {
    const aiResponse = await getAIResponse(messages.slice(0, -1), chatService);

    updateLastMessage(aiResponse, chatInstance, customStore);
    messages.at(-1).content = aiResponse;
  } catch (error) {
    updateLastMessage(messages.at(-1).content, chatInstance, customStore);
    alertError(getErrorMessage(error), chatInstance);
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

  const response = await chatService.chat.completions.create(params, { maxRetries: 0 });
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
