'use strict';
import { commands, ExtensionContext, languages, window } from 'vscode';
import { gppCompletionItemsProvider } from './providers/GppCompletionItemsProvider';
import { gppDocumentFormattingEditProvider } from './providers/GppDocumentFormattingEditProvider';
import { gppProcedureDefinitionProvider } from './providers/GppProcedureDefinitionProvider';
import { GppProceduresTreeProvider } from './providers/GppProceduresTreeProvider';
import { Config } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  Config.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const editor = window.activeTextEditor;
  const document = editor?.document;
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
  commands.registerCommand(constants.commands.formatDocument, () => {
    commands.executeCommand(
      'vscode.executeFormatDocumentProvider',
      editor?.document.uri,
      { insertSpaces: true, tabSize: 2 }
    );
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
      gppProcedureDefinitionProvider
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
