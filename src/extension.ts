'use strict';
import {
  commands,
  ExtensionContext,
  languages,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { gpplCompletionItemsProvider } from './providers/GpplCompletionItemsProvider';
import { gpplDefinitionProvider } from './providers/GpplDefinitionProvider';
import { gpplDocumentFormattingEditProvider } from './providers/GpplDocumentFormattingEditProvider';
import { gpplHoverProvider } from './providers/GpplHoverProvider';
import { GpplProceduresTreeProvider } from './providers/GpplProceduresTreeProvider';
import { gpplReferenceProvider } from './providers/GpplReferenceProvider';
import { configuration } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  configuration.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const editor: TextEditor | undefined = window.activeTextEditor;

  const gpplProceduresTreeProvider = new GpplProceduresTreeProvider(context);
  commands.registerCommand(constants.commands.refreshTree, () => {
    gpplProceduresTreeProvider.refresh();
  });
  commands.registerCommand(constants.commands.procedureSelection, (range) => gpplProceduresTreeProvider.select(range));
  commands.registerCommand(constants.commands.sortByAZ, () => gpplProceduresTreeProvider.sortByAZ());
  commands.registerCommand(constants.commands.sortByZA, () => gpplProceduresTreeProvider.sortByZA());
  commands.registerCommand(constants.commands.sortByDefault, () => gpplProceduresTreeProvider.sortByDefault());
  commands.registerCommand(constants.commands.formatDocument, async () => {
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
  });
  context.subscriptions.push(window.registerTreeDataProvider(constants.proceduresViewId, gpplProceduresTreeProvider));
  context.subscriptions.push(
    languages.registerCompletionItemProvider(constants.languageId, gpplCompletionItemsProvider)
  );
  context.subscriptions.push(languages.registerDefinitionProvider(constants.languageId, gpplDefinitionProvider));
  context.subscriptions.push(languages.registerReferenceProvider(constants.languageId, gpplReferenceProvider));
  context.subscriptions.push(languages.registerHoverProvider(constants.languageId, gpplHoverProvider));
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(constants.languageId, gpplDocumentFormattingEditProvider)
  );
}
workspace.onDidChangeConfiguration(() => {
  window.visibleTextEditors.forEach((editor: TextEditor) => {
    editor.document.languageId === constants.languageId
      ? (commands.executeCommand(constants.commands.formatDocument),
        commands.executeCommand('editor.action.formatDocument'))
      : null;
  });
});
export function deactivate() {
  StatusBar.dispose();
}
