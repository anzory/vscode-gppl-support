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
    let res: Location | undefined;
    let locations: Location[];
    locations = textParser.getWordLocations(document, word);
    if (semanticHelper.isThisUserVariable(word)) {
      res = locations[0];
    } else {
      locations.forEach((location: Location) => {
        let w = document.getText(location.range);
        if (
          semanticHelper.isThisProcedureDeclaration(w) &&
          location.range.start.character === 0
        ) {
          res = location;
        } else {
          res = undefined;
        }
      });
    }
    return Promise.resolve(res);
  }
}
export const gppDefinitionProvider = new GppDefinitionProvider();
