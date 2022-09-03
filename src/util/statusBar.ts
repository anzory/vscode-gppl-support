'use strict';

import {
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  window,
} from 'vscode';

export class StatusBar {
  static statusBar: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Right,
    500
  );

  static configure(context: ExtensionContext) {
    context.subscriptions.push(this.statusBar);
  }

  static update(message: string): void {
    if (this.statusBar !== undefined) {
      this.statusBar.text = message;
      this.statusBar.show();
    }
  }

  static show(): void {
    if (this.statusBar !== undefined) {
      this.statusBar.show();
    }
  }

  static hide(): void {
    if (this.statusBar !== undefined) {
      this.statusBar.hide();
    }
  }

  static dispose(): void {
    if (this.statusBar !== undefined) {
      this.statusBar.dispose();
    }
  }
}
