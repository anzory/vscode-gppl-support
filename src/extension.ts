import {
  commands,
  Disposable,
  ExtensionContext,
  languages,
  Location,
  Position,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { GpplCodeLensProvider } from './providers/GpplCodeLensProvider';
import { GpplCompletionItemsProvider } from './providers/GpplCompletionItemsProvider';
import { GpplDefinitionProvider } from './providers/GpplDefinitionProvider';
import { GpplDocumentFormattingEditProvider } from './providers/GpplDocumentFormattingEditProvider';
import { GpplDocumentSymbolProvider } from './providers/GpplDocumentSymbolProvider';
import { GpplHoverProvider } from './providers/GpplHoverProvider';
import { GpplReferenceProvider } from './providers/GpplReferenceProvider';
import { Config } from './utils/config';
import { getConstants, initializeConstants } from './utils/constants';
import { i18n } from './utils/i18n';
import { Logger } from './utils/logger';
import { semanticHelper } from './utils/semanticHelper';
import { textParser } from './utils/textParser';

/** Disposables for language-feature providers managed by the config-change listener. */
let providerDisposables: Disposable[] = [];

/**
 * Registers all language-feature providers and returns their disposables.
 */
function registerProviders(): Disposable[] {
  const langId = getConstants().languageId;
  return [
    languages.registerCompletionItemProvider(
      langId,
      new GpplCompletionItemsProvider(i18n)
    ),
    languages.registerHoverProvider(langId, new GpplHoverProvider(semanticHelper, i18n)),
    languages.registerCodeLensProvider(langId, new GpplCodeLensProvider(semanticHelper, i18n, textParser)),
    languages.registerDocumentSymbolProvider(
      langId,
      new GpplDocumentSymbolProvider(textParser, i18n)
    ),
    languages.registerDefinitionProvider(
      langId,
      new GpplDefinitionProvider(semanticHelper, textParser)
    ),
    languages.registerReferenceProvider(
      langId,
      new GpplReferenceProvider(semanticHelper, textParser)
    ),
    languages.registerDocumentFormattingEditProvider(
      langId,
      new GpplDocumentFormattingEditProvider()
    ),
  ];
}

/**
 * Activates the VS Code extension for SolidCAM GPP language support.
 *
 * This function is called when the extension is activated. It sets up:
 * - Configuration management
 * - Document formatting command
 * - Language feature providers (completion, hover, definition, reference, formatting, symbols)
 *
 * @param context - The extension context provided by VS Code
 */
export async function activate(context: ExtensionContext) {
  // Initialize Logger first
  Logger.configure(context);

  // Initialize constants with proper subscription management
  initializeConstants(context.subscriptions);

  new Config().configure(context);

  const constants = getConstants();

  context.subscriptions.push(
    commands.registerCommand(
      constants.commands.formatDocument,
      async () => {
        const activeEditor = window.activeTextEditor;
        const docUri: Uri | undefined = activeEditor?.document.uri;
        const textEdits: TextEdit[] | undefined =
          await commands.executeCommand(
            'vscode.executeFormatDocumentProvider',
            docUri
          );
        if (textEdits && docUri) {
          const edit = new WorkspaceEdit();
          for (const textEdit of textEdits) {
            edit.replace(docUri, textEdit.range, textEdit.newText);
          }
          await workspace.applyEdit(edit);
        }
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      constants.commands.showProcedureReferences,
      async (documentUri: Uri, position: Position, locations: Location[]) => {
        await commands.executeCommand(
          'editor.action.showReferences',
          documentUri,
          position,
          locations
        );
      }
    )
  );

  // Initialize semanticHelper (subscribe to events + initial parse)
  semanticHelper.initialize();
  // Register semanticHelper for proper disposal
  context.subscriptions.push(semanticHelper);

  // Register initial providers
  providerDisposables = registerProviders();

  // Register configuration change listener
  registerConfigurationChangeListener(context);
}

/**
 * Handles configuration changes for the extension.
 *
 * When the GPP extension configuration changes, this function:
 * - Reformats all open GPP documents
 * - Updates internationalization settings
 * - Recreates language feature providers to apply new settings
 *
 * @param context - The extension context for managing subscriptions
 */
function registerConfigurationChangeListener(context: ExtensionContext): void {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      // Only react to GPP-related configuration changes
      if (!e.affectsConfiguration('gpp')) {
        return;
      }

      // Format all open GPP documents
      window.visibleTextEditors.forEach((editor: TextEditor) => {
        if (editor.document.languageId === getConstants().languageId) {
          commands.executeCommand('editor.action.formatDocument').then(undefined, err => Logger.error('Error formatting document on config change:', err));
        }
      });

      // Update internationalization settings
      i18n.update();

      // Dispose old providers (without touching context.subscriptions)
      for (const d of providerDisposables) {
        d.dispose();
      }

      // Recreate providers with new settings
      providerDisposables = registerProviders();
    })
  );
}

/**
 * Deactivates the VS Code extension.
 *
 * This function is called when the extension is deactivated.
 * Cleans up Logger resources and provider disposables.
 */
export function deactivate() {
  for (const d of providerDisposables) {
    d.dispose();
  }
  providerDisposables = [];
  textParser.clearCache();
  Logger.close();
}
