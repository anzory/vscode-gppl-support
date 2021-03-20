import { CompletionItem, CompletionItemProvider, MarkdownString, ProviderResult, SnippetString } from 'vscode';
import { gpplComletionsItems } from './GpplComletionsItems';

class GpplCompletionItemsProvider implements CompletionItemProvider<CompletionItem> {
  provideCompletionItems(document: any, position: any, token: any, context: any): ProviderResult<CompletionItem[]> {
    let _gpplComletionsItems: CompletionItem[] = [];
    gpplComletionsItems.forEach(item => {
      let _item: CompletionItem = new CompletionItem(item.label);
      _item.insertText = new SnippetString(item.insertText?.toString());
      _item.documentation = new MarkdownString(item.documentation?.toString());
      _item.commitCharacters = item.commitCharacters;
      _item.detail = item.detail;
      _item.kind = item.kind;

      _gpplComletionsItems.push(_item);
    });
    return _gpplComletionsItems;
  }
}
export const gpplCompletionItemsProvider = new GpplCompletionItemsProvider();