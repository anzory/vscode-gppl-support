import {
  CompletionItem,
  CompletionItemProvider,
  MarkdownString,
  ProviderResult,
  SnippetString,
} from 'vscode';
import { gpplComletionsItemsList } from '../util/comletionsItemsList';
import { i18n } from '../util/i18n';

export default class GpplCompletionItemsProvider
  implements CompletionItemProvider<CompletionItem>
{
  private _gpplComletionsItems: CompletionItem[] = [];
  constructor() {
    gpplComletionsItemsList.forEach((item) => {
      let _item: CompletionItem = new CompletionItem(item.label);
      _item.insertText = new SnippetString(item.insertText?.toString());
      _item.commitCharacters = item.commitCharacters;
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
  provideCompletionItems(
    document: any,
    position: any,
    token: any,
    context: any
  ): ProviderResult<CompletionItem[]> {
    return this._gpplComletionsItems;
  }
}
