import {
  CompletionItem,
  CompletionItemProvider,
  MarkdownString,
  ProviderResult,
  Range,
  SnippetString,
} from 'vscode';
import { gpplComletionsItemsList } from '../utils/comletionsItemsList';
import { i18n } from '../utils/i18n';

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
  private _gpplComletionsItems: CompletionItem[] = [];

  /**
   * Creates an instance of GpplCompletionItemsProvider.
   *
   * Initializes completion items from the predefined list, setting up:
   * - Insert text as snippets
   * - Commit characters for quick completion
   * - Documentation in the user's preferred language
   * - Appropriate completion item kinds
   */
  constructor() {
    gpplComletionsItemsList.forEach((item) => {
      let _item: CompletionItem = new CompletionItem(item.label);
      _item.insertText = new SnippetString(item.insertText?.toString());
      _item.commitCharacters = undefined;
      _item.kind = item.kind;
      if (item.documentation) {
        _item.documentation = new MarkdownString(
          i18n.t(item.documentation.toString())
        );
      }
      if (item.detail) {
        _item.detail = i18n.t(item.detail.toString());
      }
      this._gpplComletionsItems.push(_item);
    });
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
    document: any,
    position: any,
    token: any,
    context: any
  ): ProviderResult<CompletionItem[]> {
    const wordRange = document.getWordRangeAtPosition(
      position,
      /[@A-Za-z_][\w@]*/
    );
    const replaceRange = wordRange ?? new Range(position, position);
    this._gpplComletionsItems.forEach((item) => {
      item.range = replaceRange;
    });
    return this._gpplComletionsItems;
  }
}
