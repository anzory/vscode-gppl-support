import {
  CancellationToken, Definition, DefinitionLink, DefinitionProvider,
  Position, ProviderResult, TextDocument
} from 'vscode';
import { textParser } from '../util/textParser';


class GpplProcedureDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    return Promise.resolve(
      textParser.getProcedureLocation(document, position)
    );
  }
}
export const gpplProcedureDefinitionProvider = new GpplProcedureDefinitionProvider();