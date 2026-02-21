import {
  CancellationToken,
  Definition,
  DefinitionLink,
  DefinitionProvider,
  Disposable,
  Location,
  Position,
  ProviderResult,
  TextDocument,
  TextEditor,
  window,
} from 'vscode';
import { semanticHelper } from '../utils/semanticHelper';
import { textParser } from '../utils/textParser';

/**
 * Provides "Go to Definition" functionality for GPP language constructs.
 *
 * This provider enables navigation to the definition of:
 * - User-defined variables and arrays
 * - Procedure declarations
 * - Other GPP language elements
 */
export class GpplDefinitionProvider implements DefinitionProvider, Disposable {
  private definition: Location | undefined = undefined;
  private editor: TextEditor | undefined = window.activeTextEditor;
  private doc: TextDocument | undefined = this.editor?.document;
  private disposable: Disposable | undefined;

  /**
   * Creates an instance of GpplDefinitionProvider.
   *
   * Sets up event listener for active editor changes to maintain current document context.
   */
  constructor() {
    this.disposable = window.onDidChangeActiveTextEditor(() =>
      this.onActiveEditorChanged()
    );
  }

  /**
   * Disposes of the provider and cleans up resources.
   */
  dispose(): void {
    this.disposable?.dispose();
  }

  /**
   * Handles active editor change events.
   *
   * Updates the current editor and document references when the active editor changes.
   */
  private onActiveEditorChanged(): void {
    this.editor = window.activeTextEditor;
    this.doc = this.editor?.document;
  }

  /**
   * Provides the definition location for the symbol at the given position.
   *
   * @param document - The text document containing the symbol
   * @param position - The position of the symbol
   * @param token - A cancellation token for the operation
   * @returns A promise that resolves to the definition location or locations
   */
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    // Check for cancellation
    if (token.isCancellationRequested) {
      return undefined;
    }

    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);

    if (semanticHelper.isThisUserVariableOrArray(word)) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const locations = textParser.getWordLocationsInDoc(
        document,
        '\\b' + word
      );
      this.definition = locations[0];
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const locations = textParser.getWordLocationsInDoc(document, word);
      for (const location of locations) {
        if (token.isCancellationRequested) {
          return undefined;
        }
        const line = document.lineAt(location.range.start.line).text;
        if (line && !/;|(\bcall\b)/.test(line)) {
          this.definition = location;
          break;
        }
      }
    }

    return this.definition;
  }
}
