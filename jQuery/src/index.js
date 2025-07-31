/** OpenAI integration */
/** doc: https://github.com/openai/openai-node?tab=readme-ov-file#usage */
import { user, apiKey, REGENERATION_TEXT } from './data.js';
import {
  loadMessages, processMessageSending, convertToHtml, updateLastMessage, regenerate,
} from './helpers.js';

$(() => {
  const messageStore = [];
  const messages = [];

  loadMessages();

  const chatService = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey,
  });

  const customStore = new DevExpress.data.CustomStore({
    key: 'id',
    load: () => {
      const d = $.Deferred();

      setTimeout(() => {
        d.resolve([...messageStore]);
      });

      return d.promise();
    },
    insert: (message) => {
      const d = $.Deferred();

      setTimeout(() => {
        messageStore.push(message);
        d.resolve();
      });

      return d.promise();
    },
  });

  const instance = $('#dx-ai-chat').dxChat({
    dataSource: customStore,
    reloadOnChange: false,
    showAvatar: false,
    showDayHeaders: false,
    user,
    height: 710,
    onMessageEntered: (e) => {
      const { message } = e;

      customStore.push([{ type: 'insert', data: { id: Date.now(), ...message } }]);
      messages.push({ role: 'user', content: message.text });

      processMessageSending(instance, messages, customStore, chatService);
    },
    messageTemplate: (data, element) => {
      const { message } = data;

      if (message.text === REGENERATION_TEXT) {
        element.text(REGENERATION_TEXT);
        return;
      }

      const $textElement = $('<div>')
        .addClass('dx-chat-messagebubble-text')
        .html(convertToHtml(message.text))
        .appendTo(element);

      const $buttonContainer = $('<div>')
        .addClass('dx-bubble-button-container');

      $('<div>')
        .dxButton({
          icon: 'copy',
          stylingMode: 'text',
          hint: 'Copy',
          onClick: ({ component }) => {
            navigator.clipboard.writeText($textElement.text());
            component.option({ icon: 'check' });
            setTimeout(() => {
              component.option({ icon: 'copy' });
            }, 5000);
          },
        })
        .appendTo($buttonContainer);

      $('<div>')
        .dxButton({
          icon: 'refresh',
          stylingMode: 'text',
          hint: 'Regenerate',
          onClick: () => {
            updateLastMessage('', instance, customStore);
            regenerate(instance, messages, chatService, customStore);
          },
        })
        .appendTo($buttonContainer);

      $buttonContainer.appendTo(element);
    },
  }).dxChat('instance');
});
