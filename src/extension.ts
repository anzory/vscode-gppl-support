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
import { gppCompletionItemsProvider } from './providers/GppCompletionItemsProvider';
import { gppDefinitionProvider } from './providers/GppDefinitionProvider';
import { gppDocumentFormattingEditProvider } from './providers/GppDocumentFormattingEditProvider';
import { GppProceduresTreeProvider } from './providers/GppProceduresTreeProvider';
import { gppReferenceProvider } from './providers/GppReferenceProvider';
import { configuration } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  configuration.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const editor: TextEditor | undefined = window.activeTextEditor;

  const gppProceduresTreeProvider = new GppProceduresTreeProvider(context);
  window.registerTreeDataProvider(
    constants.proceduresViewId,
    gppProceduresTreeProvider
  );
  commands.registerCommand(constants.commands.refreshTree, () => {
    gppProceduresTreeProvider.refresh();
  });
  commands.registerCommand(constants.commands.procedureSelection, (range) =>
    gppProceduresTreeProvider.select(range)
  );
  commands.registerCommand(constants.commands.sortByAZ, () =>
    gppProceduresTreeProvider.sortByAZ()
  );
  commands.registerCommand(constants.commands.sortByZA, () =>
    gppProceduresTreeProvider.sortByZA()
  );
  commands.registerCommand(constants.commands.sortByDefault, () =>
    gppProceduresTreeProvider.sortByDefault()
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
    languages.registerCompletionItemProvider(
      constants.languageId,
      gppCompletionItemsProvider
    )
  );
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      constants.languageId,
      gppDefinitionProvider
    )
  );
  context.subscriptions.push(
    languages.registerReferenceProvider(
      constants.languageId,
      gppReferenceProvider
    )
  );
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      constants.languageId,
      gppDocumentFormattingEditProvider
    )
  );
}

export function deactivate() {
  StatusBar.dispose();
}
