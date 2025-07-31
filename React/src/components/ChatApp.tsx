import { useState, useEffect, useCallback } from 'react';
import { loadMessages } from 'devextreme/localization';
import Chat, { type ChatTypes } from 'devextreme-react/chat';
import { appService } from '../ChatService';
import MessageTemplate from './MessageTemplate';

export default function ChatApp(): JSX.Element {
  const user = appService.user;
  const [typingUsers, setTypingUsers] = useState<ChatTypes.User[]>([]);
  const [alerts, setAlerts] = useState<ChatTypes.Alert[]>([]);

  useEffect(() => {
    const typingSubscription = appService.typingUsers$.subscribe(setTypingUsers);
    const alertsSubscription = appService.alerts$.subscribe(setAlerts);
    return (): void => {
      typingSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, []);

  const onMessageEntered = useCallback((e: ChatTypes.MessageEnteredEvent): void => {
    appService.onMessageEntered(e);
  }, []);

  const onRegenerateButtonClick = useCallback(async (): Promise<void> => {
    appService.updateLastMessage();
    appService.toggleDisabledState(true);

    try {
      await appService.regenerate();
    } finally {
      appService.toggleDisabledState(false);
    }
  }, []);

  const messageRender = useCallback(
    ({ message }: { message: ChatTypes.Message }) => <MessageTemplate text={message.text ?? ''} onRegenerateButtonClick={onRegenerateButtonClick} />,
    [onRegenerateButtonClick],
  );

  return (
    <div className="demo-container">
      <Chat
        dataSource={appService.dataSource}
        reloadOnChange={false}
        showAvatar={false}
        showDayHeaders={false}
        user={user}
        height={710}
        typingUsers={typingUsers}
        alerts={alerts}
        onMessageEntered={onMessageEntered}
        messageRender={messageRender}
      />
    </div>
  );
}

loadMessages(appService.getDictionary());
