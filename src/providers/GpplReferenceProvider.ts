import {
  CancellationToken,
  Location,
  Position,
  ProviderResult,
  ReferenceContext,
  ReferenceProvider,
  TextDocument,
} from 'vscode';
import { semanticHelper } from '../utils/semanticHelper';
import { textParser } from '../utils/textParser';

/**
 * Provides "Find All References" functionality for GPP language constructs.
 *
 * This provider enables finding all references to:
 * - User-defined variables and arrays
 * - Procedure declarations
 * - Other GPP language elements
 */
export class GpplReferenceProvider implements ReferenceProvider {
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

    if (token.isCancellationRequested) {
      return undefined;
    }

    if (semanticHelper.isThisUserVariableOrArray(word)) {
      const locations = textParser.getWordLocationsInDoc(document, '\\b' + word);
      return locations;
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      const locations = textParser.getWordLocationsInDoc(document, word);
      return locations;
    }

    return undefined;
  }
}
