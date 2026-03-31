import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
} from 'vscode';
import { computeFormattedLines } from '../utils/gpplFormatter';
import { getConstants } from '../utils/constants';
import { ILogger } from '../interfaces';

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
  implements DocumentFormattingEditProvider {
  /** Indentation string (spaces or tabs) based on configuration */
  private indent: string;
  private logger: ILogger | undefined;

  /**
   * Creates an instance of GpplDocumentFormattingEditProvider.
   *
   * Initializes the indentation settings based on workspace configuration:
   * - Tab size (default: 2)
   * - Spaces vs tabs preference
   */
  constructor(logger?: ILogger) {
    this.logger = logger;
    // Safely get formatting settings with fallback values
    const formatConfig = getConstants()?.format;
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
      const formatConfig = getConstants()?.format;
      if (!formatConfig?.enable) {
        return [];
      }

      const lines: string[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        lines.push(document.lineAt(i).text);
      }

      const formatted = computeFormattedLines(lines, {
        indent: this.indent,
        applyIndentsToRegions: formatConfig?.applyIndentsToRegions !== false,
      });

      const textEditList: TextEdit[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        textEditList.push(new TextEdit(document.lineAt(i).range, formatted[i]));
      }

      return textEditList;
    } catch (error) {
      this.logger?.error('Error in document formatting:', error);
      return [];
    }
  }
}
