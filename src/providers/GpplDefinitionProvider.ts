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
import TextParser from '../util/textParser';

export default class GpplDefinitionProvider implements DefinitionProvider {
  private definition: Location | undefined = undefined;
  private textParser = new TextParser();
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
      let locations: Location[];
      if (semanticHelper.isThisUserVariableOrArray(word)) {
        locations = this.textParser.getWordLocationsInDoc(
          this.doc,
          '\\b' + word
        );
        this.definition = locations[0];
      } else if (semanticHelper.isThisProcedureDeclaration(word)) {
        locations = this.textParser.getWordLocationsInDoc(this.doc, word);
        locations.forEach((location: Location) => {
          let line = this.doc?.lineAt(location.range.start.line).text;
          if (line && !/;|(\bcall\b)/.test(line)) {
            this.definition = location;
          }
        });
      }
      return Promise.resolve(this.definition);
    } else {
      return Promise.resolve(undefined);
    }
  }
}
