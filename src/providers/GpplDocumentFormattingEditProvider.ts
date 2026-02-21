import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
} from 'vscode';
import { Logger } from '../utils/logger';
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
    // Safely get formatting settings with fallback values
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
      // Safely check formatting settings
      const formatConfig = utils.constants?.format;
      if (!formatConfig?.enable) {
        return [];
      }

      const textEditList: TextEdit[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const trimmedLine = line.text.trimStart(); // Use modern method

        textEditList.push(
          new TextEdit(line.range, this.formatLineWithIndentation(trimmedLine))
        );
      }

      this.indentLevel = 0;
      return textEditList;
    } catch (error) {
      Logger.error('Error in document formatting:', error);
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

      // Normalize regions
      text = text.replace(/[;\s]*#\s*(end)?region\b/g, ';#$1region');

      // Check if line is a comment
      if (text.startsWith(';') && !/(;#(end)?region)/.test(text)) {
        return this.createIndent() + text;
      }

      // Apply original indentation logic
      return this.formatLineWithOriginalLogic(text);
    } catch (error) {
      Logger.error('Error formatting line:', error);
      return text; // Return original text on error
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

    // Block-starting constructs (indent increases AFTER)
    if (
      /^@\w+/.test(text) || // Procedure definitions
      /^\b(i|I)f\b/.test(text) || // Conditional statements
      /^\b(w|W)hile\b/.test(text) || // Loops
      (applyIndentsToRegions && /#region\b/.test(text))
    ) {
      const formattedText = this.createIndent() + text;
      ++this.indentLevel;
      return formattedText;
    }

    // else/elseif constructs (special handling)
    if (/^\b(e|E)lse\b/.test(text) || /^\b(e|E)lse(i|I)f\b/.test(text)) {
      --this.indentLevel;
      const formattedText = this.createIndent() + text;
      ++this.indentLevel;
      return formattedText;
    }

    // Block-ending constructs (indent decreases BEFORE)
    if (
      /^\b(e|E)nd(w|p|((i|I)f))\b/.test(text) || // endwhile, endproc, endif
      (applyIndentsToRegions && /#endregion\b/.test(text))
    ) {
      --this.indentLevel;
      return this.createIndent() + text;
    }

    // Regular lines (current indent)
    if (text !== '') {
      return this.createIndent() + text;
    }

    // Empty lines
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
