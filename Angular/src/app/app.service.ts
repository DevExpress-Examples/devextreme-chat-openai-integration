import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { OpenAI } from "openai";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { type DxChatTypes } from 'devextreme-angular/ui/chat';
import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import TextArea from 'devextreme/ui/text_area';
@Injectable({
  providedIn: "root",
})
export class AppService {
  chatService: OpenAI;

  OpenAIConfig = {
    dangerouslyAllowBrowser: true,
    apiKey: "OPENAI_API_KEY",
    deployment: "gpt-4o-mini",
  };

  REGENERATION_TEXT = "Regeneration...";
  ALERT_TIMEOUT = 10000;

  user: DxChatTypes.User = {
    id: "user",
  };

  assistant: DxChatTypes.User = {
    id: "assistant",
    name: "Virtual Assistant",
  };

  store: Array<{ id: number; timestamp: Date; author: DxChatTypes.User; text: string }> = [];
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
  alerts: DxChatTypes.Alert[] = [];

  customStore: CustomStore | undefined;

  dataSource: DataSource | undefined;

  typingUsersSubject: BehaviorSubject<DxChatTypes.User[]> = new BehaviorSubject<DxChatTypes.User[]>([]);

  alertsSubject: BehaviorSubject<DxChatTypes.Alert[]> = new BehaviorSubject<DxChatTypes.Alert[]>([]);

  constructor() {
    this.chatService = new OpenAI(this.OpenAIConfig);
    this.initDataSource();
    this.typingUsersSubject.next([]);
    this.alertsSubject.next([]);
  }

  get typingUsers$(): Observable<DxChatTypes.User[]> {
    return this.typingUsersSubject.asObservable();
  }

  get alerts$(): Observable<DxChatTypes.Alert[]> {
    return this.alertsSubject.asObservable();
  }

  getDictionary() {
    return {
      en: {
        "dxChat-emptyListMessage": "Chat is Empty",
        "dxChat-emptyListPrompt":
          "AI Assistant is ready to answer your questions.",
        "dxChat-textareaPlaceholder": "Ask AI Assistant...",
      },
    };
  }
  toggleDisabledState(disabled: boolean, event?: { target?: EventTarget } | undefined) {
    const element = event?.target as HTMLElement;

    if (element) {
      if (disabled) {
        element.blur();
      } else {
        element.focus();
      }
    }
  }
  initDataSource() {
    this.customStore = new CustomStore({
      key: "id",
      load: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([...this.store]);
          }, 0);
        });
      },
      insert: (message) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.store.push(message);
            resolve(message);
          });
        });
      },
    });

    this.dataSource = new DataSource({
      store: this.customStore,
      paginate: false,
    });
  }

  async getAIResponse(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) {
    const params = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: this.OpenAIConfig.deployment,
    };

    const response = await this.chatService.chat.completions.create(params);

    const data = { choices: response.choices };

    return data.choices[0].message?.content;
  }

  async processMessageSending(e: DxChatTypes.MessageEnteredEvent) {
    this.toggleDisabledState(true, e.event);

    this.typingUsersSubject.next([this.assistant]);
    try {
      const aiResponse = await this.getAIResponse(this.messages);
      setTimeout(() => {
        this.typingUsersSubject.next([]);
        this.messages.push({ role: "assistant", content: aiResponse ?? "" });
        this.renderAssistantMessage(aiResponse ?? "");
      }, 200);
    } catch {
      this.typingUsersSubject.next([]);
      this.alertLimitReached();
    } finally {
      console.log('hi')
      this.toggleDisabledState(false, e.event);
    }
  }

  updateLastMessage(text?: string | null | undefined) {
    const items = this.dataSource?.items();
    const lastMessage = items?.at(-1);
    const data = {
      text: text ?? "Regeneration..."
    }
    this.dataSource?.store().push([
      {
        type: "update",
        key: lastMessage.id,
        data: data,
      },
    ]);
  }

  renderAssistantMessage(text: string | null) {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: this.assistant,
      text,
    };

    this.dataSource?.store().push([{ type: "insert", data: message }]);
  }

  alertLimitReached() {
    this.setAlerts([
      {
        message: "Request limit reached, try again in a minute.",
      },
    ]);

    setTimeout(() => {
      this.setAlerts([]);
    }, this.ALERT_TIMEOUT);
  }

  setAlerts(alerts: DxChatTypes.Alert[]) {
    this.alerts = alerts;
    this.alertsSubject.next(alerts);
  }

  async regenerate() {
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

  convertToHtml(value: string) {
    const result = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(value)
      .toString();

    return result;
  }

  async onMessageEntered(event: DxChatTypes.MessageEnteredEvent) {
    let { message } = event;
    this.dataSource
      ?.store()
      .push([{ type: "insert", data: { id: Date.now(), ...message } }]);

    this.messages.push({ role: "user", content: message?.text ?? "" });
    await this.processMessageSending(event);
  }
}
