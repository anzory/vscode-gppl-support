import { ExtensionContext, ExtensionMode, OutputChannel, window } from 'vscode';
import { constants } from './constants';

/**
 * Log levels for the Logger.
 */
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * Provides logging functionality for the GPP extension.
 *
 * This class manages:
 * - VS Code output channel for extension logs
 * - Log message formatting and output
 * - Output channel lifecycle management
 * - Log level filtering based on extension mode
 */
export class Logger {
  static output: OutputChannel | undefined;
  static currentLogLevel: LogLevel = LogLevel.ERROR;

  /**
   * Configures the logger with an output channel.
   *
   * @param context - The extension context
   */
  static configure(context: ExtensionContext) {
    this.output = this.output || window.createOutputChannel(constants.extensionOutputChannelName);
    
    // Set log level based on extension mode
    if (context.extensionMode === ExtensionMode.Development) {
      this.currentLogLevel = LogLevel.TRACE;
      this.output.show();
    } else {
      this.currentLogLevel = LogLevel.ERROR;
    }
  }

  /**
   * Shows the output channel in VS Code.
   */
  static enable() {
    if (this.output === undefined) { return; }

    this.output.show();
  }

  /**
   * Logs a trace message (most verbose, development mode only).
   *
   * @param message - The message to log
   */
  static trace(message: string): void {
    if (this.output !== undefined && this.currentLogLevel >= LogLevel.TRACE) {
      this.output.appendLine(`[TRACE] ${message}`);
    }
  }

  /**
   * Logs a debug message (development mode only).
   *
   * @param message - The message to log
   */
  static debug(message: string): void {
    if (this.output !== undefined && this.currentLogLevel >= LogLevel.DEBUG) {
      this.output.appendLine(`[DEBUG] ${message}`);
    }
  }

  /**
   * Logs an informational message to the output channel.
   *
   * @param message - The message to log
   */
  static log(message: string): void {
    if (this.output !== undefined && this.currentLogLevel >= LogLevel.INFO) {
      this.output.appendLine(`[INFO] ${message}`);
    }
  }

  /**
   * Logs a warning message to the output channel.
   *
   * @param message - The warning message to log
   */
  static warn(message: string): void {
    if (this.output !== undefined && this.currentLogLevel >= LogLevel.WARN) {
      this.output.appendLine(`[WARN] ${message}`);
    }
  }

  /**
   * Logs an error message to the output channel.
   *
   * @param message - The error message or Error object
   * @param error - Optional error object for additional context
   */
  static error(message: string | Error, error?: unknown): void {
    if (this.output !== undefined && this.currentLogLevel >= LogLevel.ERROR) {
      const errorMessage = message instanceof Error 
        ? message.message 
        : message;
      const errorStack = message instanceof Error 
        ? message.stack 
        : error instanceof Error 
          ? error.stack 
          : String(error);
      
      this.output.appendLine(`[ERROR] ${errorMessage}`);
      if (errorStack && errorStack !== String(error)) {
        this.output.appendLine(`  Stack: ${errorStack}`);
      }
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