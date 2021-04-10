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
    let locations = textParser.getWordLocations(document, position);
    if (semanticHelper.isThisUserVariable(word)) {
      res = locations[0];
    }
    locations.forEach((location: Location) => {
      let w = document.getText(location.range);
      if (w.includes('@', 0) && location.range.start.character === 0) {
        res = location;
      }
    });
    return Promise.resolve(res);
  }
}
export const gppDefinitionProvider = new GppDefinitionProvider();
