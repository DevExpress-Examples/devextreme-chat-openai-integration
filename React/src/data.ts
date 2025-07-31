import { type ChatTypes } from 'devextreme-react/chat';

export const OpenAIConfig = {
    dangerouslyAllowBrowser: true,
    apiKey: 'OPEN_AI_KEY',
    deployment: 'gpt-4o-mini',
};

export const ALERT_TIMEOUT = 10000;

export const CHAT_DISABLED_CLASS = 'chat-disabled';

export const user: ChatTypes.User = {
    id: 'user',
};

export const assistant: ChatTypes.User = {
    id: 'assistant',
    name: 'Virtual Assistant',
};
