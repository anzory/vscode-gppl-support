'use strict';
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
import { Logger } from './utils/logger';
import { utils } from './utils/utils';

let completionItemProvider: Disposable;
let hoverProvider: Disposable;
let codeLensProvider: Disposable;
let documentSymbolProvider: Disposable;

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
  
  new utils.config().configure(context);

  const editor: TextEditor | undefined = window.activeTextEditor;
  commands.registerCommand(
    utils.constants.commands.formatDocument,
    async () => {
      const docUri: Uri | undefined = editor?.document.uri;
      const textEdits: TextEdit[] | undefined = await commands.executeCommand(
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
  );

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
  );

  completionItemProvider = languages.registerCompletionItemProvider(
    utils.constants.languageId,
    new providers.completionItemsProvider()
  );
  hoverProvider = languages.registerHoverProvider(
    utils.constants.languageId,
    new providers.hoverProvider()
  );
  codeLensProvider = languages.registerCodeLensProvider(
    utils.constants.languageId,
    new providers.codeLensProvider()
  );
  context.subscriptions.push(completionItemProvider);
  context.subscriptions.push(hoverProvider);
  context.subscriptions.push(codeLensProvider);
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      utils.constants.languageId,
      new providers.definitionProvider()
    )
  );
  context.subscriptions.push(
    languages.registerReferenceProvider(
      utils.constants.languageId,
      new providers.referenceProvider()
    )
  );

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      utils.constants.languageId,
      new providers.formattingProvider()
    )
  );
  documentSymbolProvider = languages.registerDocumentSymbolProvider(
    utils.constants.languageId,
    new providers.documentSymbolProvider()
  );
  context.subscriptions.push(documentSymbolProvider);

  // Register configuration change listener
  registerConfigurationChangeListener(context);
}

/**
 * Handles configuration changes for the extension.
 *
 * When the extension configuration changes, this function:
 * - Reformats all open GPP documents
 * - Updates internationalization settings
 * - Recreates language feature providers to apply new settings
 *
 * @param context - The extension context for managing subscriptions
 */
function registerConfigurationChangeListener(context: ExtensionContext): void {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(() => {
      // Format all open GPP documents
      window.visibleTextEditors.forEach((editor: TextEditor) => {
        if (editor.document.languageId === utils.constants.languageId) {
          commands.executeCommand('editor.action.formatDocument');
        }
      });

      // Update internationalization settings
      utils.i18n.update();

      // Dispose old providers
      completionItemProvider.dispose();
      hoverProvider.dispose();
      codeLensProvider.dispose();
      documentSymbolProvider.dispose();

      // Recreate providers with new settings
      completionItemProvider = languages.registerCompletionItemProvider(
        utils.constants.languageId,
        new providers.completionItemsProvider()
      );
      hoverProvider = languages.registerHoverProvider(
        utils.constants.languageId,
        new providers.hoverProvider()
      );
      codeLensProvider = languages.registerCodeLensProvider(
        utils.constants.languageId,
        new providers.codeLensProvider()
      );
      documentSymbolProvider = languages.registerDocumentSymbolProvider(
        utils.constants.languageId,
        new providers.documentSymbolProvider()
      );

      // Add new providers to subscriptions
      context.subscriptions.push(completionItemProvider);
      context.subscriptions.push(hoverProvider);
      context.subscriptions.push(codeLensProvider);
      context.subscriptions.push(documentSymbolProvider);
    })
  );
}

/**
 * Deactivates the VS Code extension.
 *
 * This function is called when the extension is deactivated.
 * Cleans up Logger resources.
 */
export function deactivate() {
  Logger.close();
}
