import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
  workspace,
} from 'vscode';
import { utils } from '../utils/utils';

/**
 * Provides document formatting functionality for GPP language files.
 *
 * This provider handles indentation and formatting of GPP code including:
 * - Proper indentation for control structures (if, while, procedures)
 * - Region handling (#region/#endregion)
 * - Comment formatting
 * - Customizable tab size and space preferences
 */
export class GpplDocumentFormattingEditProvider
  implements DocumentFormattingEditProvider
{
  /** Current indentation level for nested structures */
  indentLevel = 0;
  /** Indentation string (spaces or tabs) based on configuration */
  indent: string;

  /**
   * Creates an instance of GpplDocumentFormattingEditProvider.
   *
   * Initializes the indentation settings based on workspace configuration:
   * - Tab size (default: 2)
   * - Spaces vs tabs preference
   */
  constructor() {
    // Безопасное получение настроек форматирования с fallback значениями
    const formatConfig = utils.constants?.format;
    const indentSize = formatConfig?.tabSize || 2;
    const preferSpaces = formatConfig?.preferSpace !== false;

    this.indent = preferSpaces
      ? ' '.repeat(indentSize)
      : '\t'.repeat(indentSize);
  }

  /**
   * Provides formatting edits for the entire document.
   *
   * @param document - The text document to format
   * @param options - Formatting options from VS Code
   * @param token - A cancellation token for the operation
   * @returns An array of text edits to apply for formatting
   */
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    try {
      // Безопасная проверка настроек форматирования
      const formatConfig = utils.constants?.format;
      if (!formatConfig?.enable) {
        return [];
      }

      const textEditList: TextEdit[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const trimmedLine = line.text.trimStart(); // Используем современный метод

        textEditList.push(
          new TextEdit(line.range, this.formatLineWithIndentation(trimmedLine))
        );
      }

      this.indentLevel = 0;
      return textEditList;
    } catch (error) {
      console.error('Error in document formatting:', error);
      return [];
    }
  }

  /**
   * Formats a single line with appropriate indentation.
   *
   * @param text - The text line to format
   * @returns The formatted line with proper indentation
   */
  formatLineWithIndentation(text: string): string {
    try {
      if (!text) {
        return '';
      }

      // Нормализуем регионы
      text = text.replace(/[;\s]*#\s*(end)?region\b/g, ';#$1region');

      // Проверяем, является ли строка комментарием
      if (text.startsWith(';') && !/(;#(end)?region)/.test(text)) {
        return this.createIndent() + text;
      }

      // Восстанавливаем оригинальную логику работы с отступами
      return this.formatLineWithOriginalLogic(text);
    } catch (error) {
      console.error('Error formatting line:', error);
      return text; // Возвращаем оригинальный текст при ошибке
    }
  }

  /**
   * Applies the original formatting logic to a line of text.
   *
   * @private
   * @param text - The text line to format
   * @returns The formatted line with proper indentation and structure
   */
  private formatLineWithOriginalLogic(text: string): string {
    const formatConfig = utils.constants?.format;
    const applyIndentsToRegions = formatConfig?.applyIndentsToRegions !== false;

    // Конструкции, начинающиеся новый блок (отступ увеличивается ПОСЛЕ)
    if (
      /^@\w+/.test(text) || // Определения процедур
      /^\b(i|I)f\b/.test(text) || // Условные операторы
      /^\b(w|W)hile\b/.test(text) || // Циклы
      (applyIndentsToRegions && /#region\b/.test(text))
    ) {
      const formattedText = this.createIndent() + text;
      ++this.indentLevel;
      return formattedText;
    }

    // Конструкции else/elseif (специальная обработка)
    if (/^\b(e|E)lse\b/.test(text) || /^\b(e|E)lse(i|I)f\b/.test(text)) {
      --this.indentLevel;
      const formattedText = this.createIndent() + text;
      ++this.indentLevel;
      return formattedText;
    }

    // Завершающие конструкции (отступ уменьшается ДО)
    if (
      /^\b(e|E)nd(w|p|((i|I)f))\b/.test(text) || // endwhile, endproc, endif
      (applyIndentsToRegions && /#endregion\b/.test(text))
    ) {
      --this.indentLevel;
      return this.createIndent() + text;
    }

    // Обычные строки (текущий отступ)
    if (text !== '') {
      return this.createIndent() + text;
    }

    // Пустые строки
    return text;
  }

  /**
   * Creates an indentation string for the current indent level.
   *
   * @private
   * @returns A string containing the appropriate amount of indentation
   */
  private createIndent(): string {
    return this.indent.repeat(Math.max(0, this.indentLevel));
  }
}
