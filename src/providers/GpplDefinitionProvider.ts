import {
  CancellationToken, Definition, DefinitionLink, DefinitionProvider,
  Position, ProviderResult, TextDocument
} from 'vscode';
import { gpplTextParser } from './GpplTextParser';


class GpplDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {

    return Promise.resolve(
      gpplTextParser.getProcedureLocation(document, position)
    );
  }
}

export const gpplDefinitionProvider = new GpplDefinitionProvider();