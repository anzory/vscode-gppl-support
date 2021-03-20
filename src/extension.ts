'use strict';
import { commands, ExtensionContext, languages, window } from 'vscode';
import { gpplCompletionItemsProvider } from './providers/completionItemProvider';
import { GpplProceduresTreeProvider } from './providers/GpplProceduresTreeProvider';
// import { GpplTreeStatusProvider } from './providers/GpplTreeStatusProvider';
import { Config } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  Config.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const gpplProceduresTree = new GpplProceduresTreeProvider(context);
  window.registerTreeDataProvider('gppl.gpplProceduresTree', gpplProceduresTree);
  commands.registerCommand(constants.commands.refreshTree, () => { gpplProceduresTree.refresh(true); });
  commands.registerCommand('gppl.gpplProceduresTree.Selection', range => gpplProceduresTree.select(range));
  languages.registerCompletionItemProvider(constants.languageId, gpplCompletionItemsProvider);
}

export function deactivate() {
  StatusBar.dispose();
}