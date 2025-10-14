'use strict';
import {
  commands,
  Disposable,
  ExtensionContext,
  languages,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { providers } from './providers/providers';
import { utils } from './utils/utils';

let completionItemProvider: Disposable;
let hoverProvider: Disposable;

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

  completionItemProvider = languages.registerCompletionItemProvider(
    utils.constants.languageId,
    new providers.completionItemsProvider()
  );
  hoverProvider = languages.registerHoverProvider(
    utils.constants.languageId,
    new providers.hoverProvider()
  );
  context.subscriptions.push(completionItemProvider);
  context.subscriptions.push(hoverProvider);
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
  context.subscriptions.push(
    languages.registerDocumentSymbolProvider(
      utils.constants.languageId,
      new providers.documentSymbolProvider()
    )
  );
}

/**
 * Handles configuration changes for the extension.
 *
 * When the extension configuration changes, this function:
 * - Reformats all open GPP documents
 * - Updates internationalization settings
 * - Recreates language feature providers to apply new settings
 */
workspace.onDidChangeConfiguration(() => {
  window.visibleTextEditors.forEach((editor: TextEditor) => {
    editor.document.languageId === utils.constants.languageId
      ? (commands.executeCommand(utils.constants.commands.formatDocument),
        commands.executeCommand('editor.action.formatDocument'))
      : null;
  });

  utils.i18n.update();
  completionItemProvider.dispose();
  hoverProvider.dispose();
  hoverProvider = languages.registerHoverProvider(
    utils.constants.languageId,
    new providers.hoverProvider()
  );
  completionItemProvider = languages.registerCompletionItemProvider(
    utils.constants.languageId,
    new providers.completionItemsProvider()
  );
});

/**
 * Deactivates the VS Code extension.
 *
 * This function is called when the extension is deactivated.
 * Currently, no cleanup is required as VS Code handles provider disposal automatically.
 */
export function deactivate() {}
