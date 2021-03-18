'use strict';
import { ExtensionContext, OutputChannel, window } from 'vscode';
import { constants } from './constants';

export class Logger {
  static output: OutputChannel | undefined;

  static configure(context: ExtensionContext) {
    this.output = this.output || window.createOutputChannel(constants.extensionOutputChannelName);
  }

  static enable() {
    if (this.output === undefined) { return; }

    this.output.show();
  }

  static log(message: string): void {
    if (this.output !== undefined) {
      this.output.appendLine(message);
    }
  }

  static close() {
    if (this.output !== undefined) {
      this.output.dispose();
      this.output = undefined;
    }
  }
}