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
import { providers } from './providers/providers';
import { initializeConstants } from './utils/constants';
import { Logger } from './utils/logger';
import { utils } from './utils/utils';

/** Disposables for language-feature providers managed by the config-change listener. */
let providerDisposables: Disposable[] = [];

/**
 * Registers all language-feature providers and returns their disposables.
 */
function registerProviders(): Disposable[] {
  const langId = utils.constants.languageId;
  return [
    languages.registerCompletionItemProvider(
      langId,
      new providers.completionItemsProvider()
    ),
    languages.registerHoverProvider(langId, new providers.hoverProvider()),
    languages.registerCodeLensProvider(langId, new providers.codeLensProvider()),
    languages.registerDocumentSymbolProvider(
      langId,
      new providers.documentSymbolProvider()
    ),
    languages.registerDefinitionProvider(
      langId,
      new providers.definitionProvider()
    ),
    languages.registerReferenceProvider(
      langId,
      new providers.referenceProvider()
    ),
    languages.registerDocumentFormattingEditProvider(
      langId,
      new providers.formattingProvider()
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

  new utils.config().configure(context);

  context.subscriptions.push(
    commands.registerCommand(
      utils.constants.commands.formatDocument,
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
      utils.constants.commands.showProcedureReferences,
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
        if (editor.document.languageId === utils.constants.languageId) {
          commands.executeCommand('editor.action.formatDocument');
        }
      });

      // Update internationalization settings
      utils.i18n.update();

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
  Logger.close();
}
