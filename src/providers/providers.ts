import { GpplCompletionItemsProvider } from './GpplCompletionItemsProvider';
import { GpplCodeLensProvider } from './GpplCodeLensProvider';
import { GpplDefinitionProvider } from './GpplDefinitionProvider';
import { GpplDocumentFormattingEditProvider } from './GpplDocumentFormattingEditProvider';
import { GpplDocumentSymbolProvider } from './GpplDocumentSymbolProvider';
import { GpplHoverProvider } from './GpplHoverProvider';
import { GpplReferenceProvider } from './GpplReferenceProvider';

/**
 * Interface for base provider with common methods.
 */
export interface IBaseProvider {
  /**
   * Refreshes the provider's data or state.
   */
  refresh?(): void;
  /**
   * Disposes of the provider and cleans up resources.
   */
  dispose?(): void;
}

/**
 * Collection of all GPP language service providers.
 *
 * This object contains instances of all provider classes used by the extension:
 * - completionItemsProvider: Provides autocompletion suggestions
 * - definitionProvider: Enables "Go to Definition" functionality
 * - documentSymbolProvider: Provides document outline/symbols
 * - formattingProvider: Handles document formatting
 * - hoverProvider: Shows information on hover
 * - referenceProvider: Enables "Find All References" functionality
 */
export const providers = {
  completionItemsProvider: GpplCompletionItemsProvider,
  codeLensProvider: GpplCodeLensProvider,
  definitionProvider: GpplDefinitionProvider,
  documentSymbolProvider: GpplDocumentSymbolProvider,
  formattingProvider: GpplDocumentFormattingEditProvider,
  hoverProvider: GpplHoverProvider,
  referenceProvider: GpplReferenceProvider,
};
