'use strict';
import { ExtensionContext, OutputChannel, window } from 'vscode';
import { constants } from './constants';

/**
 * Provides logging functionality for the GPP extension.
 *
 * This class manages:
 * - VS Code output channel for extension logs
 * - Log message formatting and output
 * - Output channel lifecycle management
 */
export class Logger {
  static output: OutputChannel | undefined;

  /**
   * Configures the logger with an output channel.
   *
   * @param context - The extension context
   */
  static configure(context: ExtensionContext) {
    this.output = this.output || window.createOutputChannel(constants.extensionOutputChannelName);
  }

  /**
   * Shows the output channel in VS Code.
   */
  static enable() {
    if (this.output === undefined) { return; }

    this.output.show();
  }

  /**
   * Logs a message to the output channel.
   *
   * @param message - The message to log
   */
  static log(message: string): void {
    if (this.output !== undefined) {
      this.output.appendLine(message);
    }
  }

  /**
   * Closes and disposes of the output channel.
   */
  static close() {
    if (this.output !== undefined) {
      this.output.dispose();
      this.output = undefined;
    }
  }
}