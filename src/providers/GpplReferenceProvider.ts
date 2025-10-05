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

export class GpplReferenceProvider implements ReferenceProvider {
  provideReferences(
    document: TextDocument,
    position: Position,
    context: ReferenceContext,
    token: CancellationToken
  ): ProviderResult<Location[]> {
    const wordRange = document.getWordRangeAtPosition(position);
    const word = document.getText(wordRange);
    let locations: Location[];

    if (semanticHelper.isThisUserVariableOrArray(word)) {
      locations = textParser.getWordLocationsInDoc(document, '\\b' + word);
      return Promise.resolve(locations);
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      locations = textParser.getWordLocationsInDoc(document, word);
      return Promise.resolve(locations);
    }

    return Promise.resolve(undefined);
  }
}
