import {
  CancellationToken,
  Definition,
  DefinitionLink,
  DefinitionProvider,
  Location,
  Position,
  ProviderResult,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { semanticHelper } from '../util/semanticHelper';
import { textParser } from '../util/textParser';

class GpplDefinitionProvider implements DefinitionProvider {
  private editor: TextEditor | undefined = window.activeTextEditor;
  private doc: TextDocument | undefined = this.editor?.document;

  constructor() {
    window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
  }

  private onActiveEditorChanged(): void {
    this.editor = window.activeTextEditor;
    this.doc = this.editor?.document;
  }

  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    if (this.doc) {
      let word = this.doc.getText(this.doc.getWordRangeAtPosition(position));
      let res: Location | undefined = undefined;
      let locations: Location[];
      if (semanticHelper.isThisUserVariable(word)) {
        locations = textParser.getWordLocationsInDoc(this.doc, '\\b' + word);
        res = locations[0];
      } else if (semanticHelper.isThisProcedureDeclaration(word)) {
        locations = textParser.getWordLocationsInDoc(this.doc, word);
        locations.forEach((location: Location) => {
          let line = this.doc?.lineAt(location.range.start.line).text;
          if (line && !/;|(\bcall\b)/.test(line)) {
            res = location;
          }
        });
      }
      return Promise.resolve(res);
    } else {
      return Promise.resolve(undefined);
    }
  }
}

export let gpplDefinitionProvider = new GpplDefinitionProvider();

workspace.onDidChangeTextDocument(() => {
  gpplDefinitionProvider = new GpplDefinitionProvider();
});
window.onDidChangeActiveTextEditor(() => {
  gpplDefinitionProvider = new GpplDefinitionProvider();
});
