import { type ChatTypes } from 'devextreme-react/chat';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';
import { OpenAI } from 'openai';
import { BehaviorSubject, Observable } from 'rxjs';
import { ALERT_TIMEOUT, assistant, OpenAIConfig } from './data.ts';
import DevExpress from "devextreme";
import DxEvent = DevExpress.events.DxEvent;

class AppService {
  chatService: OpenAI;

  store: ChatTypes.Message[] = [];

  messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

  alerts: ChatTypes.Alert[] = [];

  customStore?: CustomStore;

  dataSource?: DataSource;

  private readonly typingUsersSubject: BehaviorSubject<ChatTypes.User[]> = new BehaviorSubject<ChatTypes.User[]>([]);

  private readonly alertsSubject: BehaviorSubject<ChatTypes.Alert[]> = new BehaviorSubject<ChatTypes.Alert[]>([]);

  constructor() {
    this.chatService = new OpenAI(OpenAIConfig);
    this.initDataSource();
    this.typingUsersSubject.next([]);
    this.alertsSubject.next([]);
  }

  get typingUsers$(): Observable<ChatTypes.User[]> {
    return this.typingUsersSubject.asObservable();
  }

  get alerts$(): Observable<ChatTypes.Alert[]> {
    return this.alertsSubject.asObservable();
  }

  getDictionary(): object {
    return {
      en: {
        'dxChat-emptyListMessage': 'Chat is Empty',
        'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
        'dxChat-textareaPlaceholder': 'Ask AI Assistant...',
      },
    };
  }

  initDataSource(): void {
    this.customStore = new CustomStore({
      key: 'id',
      load: () => new Promise((resolve): void => {
        setTimeout(() => {
          resolve([...this.store]);
        }, 0);
      }),
      insert: (message: ChatTypes.Message) => new Promise((resolve): void => {
        setTimeout(() => {
          this.store.push(message);
          resolve(message);
        });
      }),
    });

    this.dataSource = new DataSource({
      store: this.customStore,
      paginate: false,
    });
  }

  async getAIResponse(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<any> {
    const params = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: OpenAIConfig.deployment,
    };

    const response = await this.chatService.chat.completions.create(params);
    const data = { choices: response.choices };
    return data.choices[0].message?.content;
  }

  async processMessageSending(setDisabled: Function, event: DxEvent<KeyboardEvent | PointerEvent | MouseEvent | TouchEvent> | undefined): Promise<void> {
    setDisabled(true);
    (event?.target as HTMLElement).blur();
    this.typingUsersSubject.next([assistant]);

    try {
      const aiResponse = await this.getAIResponse(this.messages);
      setTimeout(() => {
        this.typingUsersSubject.next([]);
        this.messages.push({ role: 'assistant', content: aiResponse ?? '' });
        this.renderAssistantMessage(aiResponse ?? '');
      }, 200);
    } catch {
      (event?.target as HTMLElement).focus();
      this.typingUsersSubject.next([]);
      this.alertLimitReached();
    } finally {
      (event?.target as HTMLElement).focus();
      setDisabled(false);
    }
  }

  updateLastMessage(text?: string | null | undefined): void {
    const items = this.dataSource?.items();
    const lastMessage = items?.at(-1);
    const data = {
      text: text ?? 'Regeneration...',
    };

    this.dataSource?.store().push([{ type: 'remove', key: lastMessage.id }]);
    this.dataSource?.store().push([
      {
        type: 'insert',
        data: { ...lastMessage, ...data },
      },
    ]);
  }

  renderAssistantMessage(text: string | null): void {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: assistant,
      text,
    };

    this.dataSource?.store().push([{ type: 'insert', data: message }]);
  }

  alertLimitReached(): void {
    this.setAlerts([
      {
        message: 'Request limit reached, try again in a minute.',
      },
    ]);

    setTimeout((): void => {
      this.setAlerts([]);
    }, ALERT_TIMEOUT);
  }

  setAlerts(alerts: ChatTypes.Alert[]): void {
    this.alerts = alerts;
    this.alertsSubject.next(alerts);
  }

  async regenerate(): Promise<void> {
    try {
      const aiResponse = await this.getAIResponse(this.messages.slice(0, -1));
      this.updateLastMessage(aiResponse);
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
        lastMsg.content = aiResponse ?? '';
        this.messages = [...this.messages];
      }
    } catch {
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
        this.updateLastMessage(lastMsg.content);
      }
      this.alertLimitReached();
    }
  }

  onMessageEntered(event: ChatTypes.MessageEnteredEvent, setDisabled: Function): void {
    let { message } = event;
    this.dataSource
      ?.store()
      .push([{ type: 'insert', data: { id: Date.now(), ...message } }]);

    this.messages.push({ role: 'user', content: message?.text ?? '' });
    void this.processMessageSending(setDisabled, event.event);
  }
}

export const appService = new AppService();
