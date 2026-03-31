import {
  CancellationToken,
  Location,
  Position,
  ProviderResult,
  ReferenceContext,
  ReferenceProvider,
  TextDocument,
} from 'vscode';
import { ISemanticHelper, ITextParser } from '../interfaces';

/**
 * Provides "Find All References" functionality for GPP language constructs.
 *
 * This provider enables finding all references to:
 * - User-defined variables and arrays
 * - Procedure declarations
 * - Other GPP language elements
 */
export class GpplReferenceProvider implements ReferenceProvider {
  private semanticHelper: ISemanticHelper;
  private textParser: ITextParser;

  constructor(semanticHelper: ISemanticHelper, textParser: ITextParser) {
    this.semanticHelper = semanticHelper;
    this.textParser = textParser;
  }

  /**
   * Provides all reference locations for the symbol at the given position.
   *
   * @param document - The text document containing the symbol
   * @param position - The position of the symbol
   * @param context - Context information about the reference request
   * @param token - A cancellation token for the operation
   * @returns A promise that resolves to an array of reference locations
   */
  provideReferences(
    document: TextDocument,
    position: Position,
    context: ReferenceContext,
    token: CancellationToken
  ): ProviderResult<Location[]> {
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

    if (token.isCancellationRequested) {
      return undefined;
    }

    if (
      this.semanticHelper.isThisUserVariableOrArray(word) ||
      this.semanticHelper.isThisProcedureDeclaration(word)
    ) {
      return this.textParser.getWordLocationsForLiteral(document, word);
    }

    return undefined;
  }
}
