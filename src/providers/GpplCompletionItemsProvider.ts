import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  MarkdownString,
  ProviderResult,
  SnippetString,
} from 'vscode';
import { gpplComletionsItemsList } from '../util/comletionsItemsList';
import { IGpplVariable, semanticHelper } from '../util/semanticHelper';

class GpplCompletionItemsProvider implements CompletionItemProvider<CompletionItem> {
  private _gpplComletionsItems: CompletionItem[] = [];
  constructor() {
    gpplComletionsItemsList.forEach((item) => {
      let _item: CompletionItem = new CompletionItem(item.label);
      _item.insertText = new SnippetString(item.insertText?.toString());
      _item.documentation = new MarkdownString(item.documentation?.toString());
      _item.commitCharacters = item.commitCharacters;
      _item.detail = item.detail;
      _item.kind = item.kind;

      this._gpplComletionsItems.push(_item);
    });
    semanticHelper.getGpplSystemVariables().forEach((sv: IGpplVariable) => {
      let _item: CompletionItem = new CompletionItem(sv.name);
      _item.insertText = new SnippetString(sv.name);
      _item.documentation = new MarkdownString('`SolidCAM` system variable');
      _item.commitCharacters = new Array<string>(sv.name.split('')[0]);
      _item.detail = '(system variable)';
      _item.kind = CompletionItemKind.Variable;

      this._gpplComletionsItems.push(_item);
    });
  }
  provideCompletionItems(document: any, position: any, token: any, context: any): ProviderResult<CompletionItem[]> {
    return this._gpplComletionsItems;
  }
}
export const gpplCompletionItemsProvider = new GpplCompletionItemsProvider();
