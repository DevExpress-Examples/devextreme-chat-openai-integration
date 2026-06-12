import { Component, ChangeDetectionStrategy } from '@angular/core';
import { type DxChatTypes } from 'devextreme-angular/ui/chat';
import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { loadMessages } from "devextreme/localization";
import { DataSource } from 'devextreme-angular/common/data';
import { DxButtonModule, DxChatModule } from 'devextreme-angular';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [DxButtonModule, DxChatModule, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dataSource: DataSource;

  user: DxChatTypes.User;

  typingUsers$: Observable<DxChatTypes.User[]> ;

  alerts$: Observable<DxChatTypes.Alert[]>;

  copyButtonIcon: string;

  isDisabled = false;

  regenerationText: string;

  constructor(private readonly appService: AppService) {
    loadMessages(this.appService.getDictionary());

    this.dataSource = this.appService.dataSource!;
    this.user = this.appService.user;
    this.alerts$ = this.appService.alerts$;
    this.typingUsers$ = this.appService.typingUsers$;
    this.regenerationText = this.appService.REGENERATION_TEXT;
    this.copyButtonIcon = "copy";
  }
  convertToHtml(message: DxChatTypes.Message): string {
    return this.appService.convertToHtml(message.text || "");
  }


  async onMessageEntered(e: DxChatTypes.MessageEnteredEvent) {
    this.isDisabled = true;
    try {
      await this.appService.onMessageEntered(e);
    } finally {
      this.isDisabled = false;
    }
  }

  onCopyButtonClick(message: DxChatTypes.Message) {
    navigator.clipboard?.writeText(message.text ?? "");

    this.copyButtonIcon = "check";

    setTimeout(() => {
      this.copyButtonIcon = "copy";
    }, 2500);
  }

  async onRegenerateButtonClick() {
    this.appService.updateLastMessage();
    this.appService.toggleDisabledState(true, undefined);
    this.isDisabled = true;

    try {
      await this.appService.regenerate();
    } finally {
      this.appService.toggleDisabledState(false, undefined);
      this.isDisabled = false;
    }
  }
}
