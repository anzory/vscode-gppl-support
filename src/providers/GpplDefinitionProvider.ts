import {
  CancellationToken,
  Definition,
  DefinitionLink,
  DefinitionProvider,
  Location,
  Position,
  ProviderResult,
  TextDocument,
} from 'vscode';
import { ISemanticHelper, ITextParser } from '../interfaces';

/**
 * Provides "Go to Definition" functionality for GPP language constructs.
 *
 * This provider enables navigation to the definition of:
 * - User-defined variables and arrays
 * - Procedure declarations
 * - Other GPP language elements
 */
export class GpplDefinitionProvider implements DefinitionProvider {
  private semanticHelper: ISemanticHelper;
  private textParser: ITextParser;

  constructor(semanticHelper: ISemanticHelper, textParser: ITextParser) {
    this.semanticHelper = semanticHelper;
    this.textParser = textParser;
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
    if (!word) {
      return undefined;
    }

    let definition: Location | undefined;

    if (this.semanticHelper.isThisUserVariableOrArray(word)) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const locations = this.textParser.getWordLocationsForLiteral(document, word);
      definition = locations[0];
    } else if (this.semanticHelper.isThisProcedureDeclaration(word)) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const locations = this.textParser.getWordLocationsForLiteral(document, word);
      for (const location of locations) {
        if (token.isCancellationRequested) {
          return undefined;
        }
        const line = document.lineAt(location.range.start.line).text;
        const codeOnly = line.split(';')[0];
        if (codeOnly && !/\bcall\b/i.test(codeOnly)) {
          definition = location;
          break;
        }
      }
    }

    return definition;
  }
}
