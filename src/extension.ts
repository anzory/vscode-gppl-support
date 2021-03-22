'use strict';
import { commands, ExtensionContext, languages, window } from 'vscode';
import { gpplCompletionItemsProvider } from './providers/GpplCompletionItemsProvider';
import { gpplDocumentFormattingEditProvider } from './providers/GpplDocumentFormattingEditProvider';
import { gpplProcedureDefinitionProvider } from './providers/GpplProcedureDefinitionProvider';
import { GpplProceduresTreeProvider } from './providers/GpplProceduresTreeProvider';
import { Config } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  Config.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const gpplProceduresTreeProvider = new GpplProceduresTreeProvider(context);
  window.registerTreeDataProvider(
    constants.proceduresViewId,
    gpplProceduresTreeProvider
  );
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
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      constants.languageId,
      gpplCompletionItemsProvider
    )
  );
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      constants.languageId,
      gpplProcedureDefinitionProvider
    )
  );
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      constants.languageId,
      gpplDocumentFormattingEditProvider
    )
  );
}

export function deactivate() {
  StatusBar.dispose();
}
