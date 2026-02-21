import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  MarkdownString,
  Position,
  ProviderResult,
  Range,
  SnippetString,
  TextDocument,
} from 'vscode';
import { gpplComletionsItemsList } from '../utils/completionsItemsList';
import { i18n } from '../utils/i18n';

/**
 * Interface for completion item template data.
 */
interface CompletionItemTemplate {
  label: string;
  insertText: string;
  kind: CompletionItem['kind'];
  documentation?: string;
  detail?: string;
}

/**
 * Provides completion items for GPP language support in VS Code.
 *
 * This provider offers autocompletion functionality including:
 * - Code snippets for common GPP constructs
 * - Keywords and operators
 * - System variables and functions
 * - User-defined variables and procedures
 */
export class GpplCompletionItemsProvider
  implements CompletionItemProvider<CompletionItem>
{
  /**
   * Templates for completion items.
   * These are used to create new CompletionItem instances for each request,
   * avoiding mutation of shared state.
   */
  private _itemTemplates: CompletionItemTemplate[] = [];

  /**
   * Creates an instance of GpplCompletionItemsProvider.
   *
   * Initializes completion item templates from the predefined list.
   */
  constructor() {
    gpplComletionsItemsList.forEach((item) => {
      this._itemTemplates.push({
        label: item.label as string,
        insertText: item.insertText?.toString() || '',
        kind: item.kind,
        documentation: item.documentation?.toString(),
        detail: item.detail?.toString(),
      });
    });
  }

  /**
   * Creates a new CompletionItem from a template with the specified range.
   *
   * @param template - The template to create the item from
   * @param range - The range to apply to the item
   * @returns A new CompletionItem instance
   */
  private createCompletionItem(
    template: CompletionItemTemplate,
    range: Range
  ): CompletionItem {
    const item = new CompletionItem(template.label);
    item.insertText = new SnippetString(template.insertText);
    item.kind = template.kind;
    item.range = range;

    if (template.documentation) {
      item.documentation = new MarkdownString(i18n.t(template.documentation));
    }
    if (template.detail) {
      item.detail = i18n.t(template.detail);
    }

    return item;
  }

  /**
   * Provides completion items for the given position in the document.
   *
   * @param document - The text document in which completion is requested
   * @param position - The position at which completion is requested
   * @param token - A cancellation token that can be used to cancel the operation
   * @param context - Additional context information about the completion request
   * @returns A promise that resolves to an array of completion items
   */
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): ProviderResult<CompletionItem[]> {
    // Check for cancellation
    if (token.isCancellationRequested) {
      return undefined;
    }

    const wordRange = document.getWordRangeAtPosition(
      position,
      /[@A-Za-z_][\w@]*/
    );
    const replaceRange = wordRange ?? new Range(position, position);

    // Create new CompletionItem instances for each request to avoid mutation
    return this._itemTemplates.map((template) =>
      this.createCompletionItem(template, replaceRange)
    );
  }
}
