import {
  CancellationToken,
  Location,
  Position,
  ProviderResult,
  ReferenceContext,
  ReferenceProvider,
  TextDocument,
} from 'vscode';
import { semanticHelper } from '../util/semanticHelper';
import { textParser } from '../util/textParser';

class GppReferenceProvider implements ReferenceProvider {
  provideReferences(
    document: TextDocument,
    position: Position,
    context: ReferenceContext,
    token: CancellationToken
  ): ProviderResult<Location[]> {
    let res: Location[] | undefined = undefined;

    let wordRange = document.getWordRangeAtPosition(position);
    let word = document.getText(wordRange);
    let locations: Location[];
    if (semanticHelper.isThisUserVariable(word)) {
      locations = textParser.getWordLocations(document, '\\b' + word);
      res = locations;
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      locations = textParser.getWordLocations(document, /*'\\b' +*/ word);
      res = locations;
    }
    return Promise.resolve(res);
  }
}

export const gppReferenceProvider = new GppReferenceProvider();
