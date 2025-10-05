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
} from 'vscode';
import { semanticHelper } from '../utils/semanticHelper';
import { textParser } from '../utils/textParser';

export class GpplDefinitionProvider implements DefinitionProvider {
  private definition: Location | undefined = undefined;
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
    const wordRange = document.getWordRangeAtPosition(position);
    const word = document.getText(wordRange);

    if (semanticHelper.isThisUserVariableOrArray(word)) {
      const locations = textParser.getWordLocationsInDoc(
        document,
        '\\b' + word
      );
      this.definition = locations[0];
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      const locations = textParser.getWordLocationsInDoc(document, word);
      locations.forEach((location: Location) => {
        const line = document.lineAt(location.range.start.line).text;
        if (line && !/;|(\bcall\b)/.test(line)) {
          this.definition = location;
        }
      });
    }

    return Promise.resolve(this.definition);
  }
}
