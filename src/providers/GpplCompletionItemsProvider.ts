import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  MarkdownString,
  ProviderResult,
  SnippetString,
} from 'vscode';
import { gpplComletionsItemsList } from '../util/comletionsItemsList';
import { semanticHelper } from '../util/semanticHelper';

export default class GpplCompletionItemsProvider
  implements CompletionItemProvider<CompletionItem>
{
  private _gpplComletionsItems: CompletionItem[] = [];
  constructor() {
    gpplComletionsItemsList.forEach((item) => {
      let _item: CompletionItem = new CompletionItem(item.label);
      _item.insertText = new SnippetString(item.insertText?.toString());
      _item.commitCharacters = item.commitCharacters;
      _item.detail = item.detail;
      _item.kind = item.kind;

      if (semanticHelper.isThisSystemVariable(item.label.toString())) {
        _item.documentation = new MarkdownString('`SolidCAM` system variable');
        _item.detail = '(system variable)';
      } else {
        _item.documentation = new MarkdownString(
          item.documentation?.toString()
        );
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
