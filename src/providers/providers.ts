import { GpplCompletionItemsProvider } from './GpplCompletionItemsProvider';
import { GpplDefinitionProvider } from './GpplDefinitionProvider';
import { GpplDocumentFormattingEditProvider } from './GpplDocumentFormattingEditProvider';
import { GpplHoverProvider } from './GpplHoverProvider';
import { GpplProceduresTreeProvider } from './GpplProceduresTreeProvider';
import { GpplReferenceProvider } from './GpplReferenceProvider';

// Интерфейс для базового провайдера с общими методами
export interface IBaseProvider {
  refresh?(): void;
  dispose?(): void;
}

export const providers = {
  completionItemsProvider: GpplCompletionItemsProvider,
  definitionProvider: GpplDefinitionProvider,
  formattingProvider: GpplDocumentFormattingEditProvider,
  hoverProvider: GpplHoverProvider,
  proceduresTreeProvider: GpplProceduresTreeProvider,
  referenceProvider: GpplReferenceProvider,
};
