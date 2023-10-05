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
import GpplCompletionItemsProvider from './providers/GpplCompletionItemsProvider';
import GpplDefinitionProvider from './providers/GpplDefinitionProvider';
import GpplDocumentFormattingEditProvider from './providers/GpplDocumentFormattingEditProvider';
import GpplHoverProvider from './providers/GpplHoverProvider';
import GpplProceduresTreeProvider from './providers/GpplProceduresTreeProvider';
import GpplReferenceProvider from './providers/GpplReferenceProvider';
import Config from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';
import { i18n } from './util/i18n';

let completionItemProvider: Disposable;
let hoverProvider: Disposable;

export async function activate(context: ExtensionContext) {
  new Config().configure(context);
  StatusBar.configure(context);
  StatusBar.show();

  const editor: TextEditor | undefined = window.activeTextEditor;
  const gpplProceduresTreeProvider = new GpplProceduresTreeProvider(context);
  commands.registerCommand(constants.commands.refreshTree, () => {
    gpplProceduresTreeProvider.refresh();
  });
  commands.registerCommand(constants.commands.procedureSelection, (range) =>
    gpplProceduresTreeProvider.select(range)
  );
  commands.registerCommand(constants.commands.sortByAZ, () =>
    gpplProceduresTreeProvider.sortByAZ()
  );
  commands.registerCommand(constants.commands.sortByZA, () =>
    gpplProceduresTreeProvider.sortByZA()
  );
  commands.registerCommand(constants.commands.sortByDefault, () =>
    gpplProceduresTreeProvider.sortByDefault()
  );
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
  context.subscriptions.push(
    window.registerTreeDataProvider(
      constants.proceduresViewId,
      gpplProceduresTreeProvider
    )
  );

  completionItemProvider = languages.registerCompletionItemProvider(
    constants.languageId,
    new GpplCompletionItemsProvider()
  );
  hoverProvider = languages.registerHoverProvider(
    constants.languageId,
    new GpplHoverProvider()
  );
  context.subscriptions.push(completionItemProvider);
  context.subscriptions.push(hoverProvider);
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      constants.languageId,
      new GpplDefinitionProvider()
    )
  );
  context.subscriptions.push(
    languages.registerReferenceProvider(
      constants.languageId,
      new GpplReferenceProvider()
    )
  );

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      constants.languageId,
      new GpplDocumentFormattingEditProvider()
    )
  );
}

workspace.onDidChangeConfiguration(() => {
  window.visibleTextEditors.forEach((editor: TextEditor) => {
    editor.document.languageId === constants.languageId
      ? (commands.executeCommand(constants.commands.formatDocument),
        commands.executeCommand('editor.action.formatDocument'))
      : null;
  });

  i18n.update();
  completionItemProvider.dispose();
  hoverProvider.dispose();
  hoverProvider = languages.registerHoverProvider(
    constants.languageId,
    new GpplHoverProvider()
  );
  completionItemProvider = languages.registerCompletionItemProvider(
    constants.languageId,
    new GpplCompletionItemsProvider()
  );
});

export function deactivate() {
  StatusBar.dispose();
}
