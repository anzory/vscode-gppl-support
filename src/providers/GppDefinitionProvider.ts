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
import { semanticHelper } from '../util/semanticHelper';
import { textParser } from '../util/textParser';

class GppDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    let word = document.getText(document.getWordRangeAtPosition(position));
    let res: Location | undefined = undefined;
    let locations: Location[];
    if (semanticHelper.isThisUserVariable(word)) {
      locations = textParser.getWordLocations(document, '\\b' + word);
      res = locations[0];
    } else if (semanticHelper.isThisProcedureDeclaration(word)) {
      locations = textParser.getWordLocations(document, word);
      locations.forEach((location: Location) => {
        if (location.range.start.character === 0) {
          res = location;
        }
      });
    }
    return Promise.resolve(res);
  }
}
export const gppDefinitionProvider = new GppDefinitionProvider();
