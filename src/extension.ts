'use strict';
import {
  commands, ExtensionContext, languages, window
} from 'vscode';
import { gpplCompletionItemsProvider } from './providers/GpplCompletionItemsProvider';
import { gpplDefinitionProvider } from './providers/GpplDefinitionProvider';
import { GpplProceduresTreeProvider } from './providers/GpplProceduresTreeProvider';
import { Config } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';

export async function activate(context: ExtensionContext) {
  Config.configure(context);
  StatusBar.configure(context);
  StatusBar.show();
  const gpplProceduresTreeProvider = new GpplProceduresTreeProvider(context);
  window.registerTreeDataProvider(constants.proceduresViewId, gpplProceduresTreeProvider);
  commands.registerCommand(constants.commands.refreshTree, () => { gpplProceduresTreeProvider.refresh(); });
  commands.registerCommand(constants.commands.procedureSelection, range => gpplProceduresTreeProvider.select(range));
  commands.registerCommand(constants.commands.sortByAZ, () => gpplProceduresTreeProvider.sortByAZ());
  commands.registerCommand(constants.commands.sortByZA, () => gpplProceduresTreeProvider.sortByZA());
  commands.registerCommand(constants.commands.sortByDefault, () => gpplProceduresTreeProvider.sortByDefault());
  languages.registerCompletionItemProvider(constants.languageId, gpplCompletionItemsProvider);
  languages.registerDefinitionProvider(constants.languageId, gpplDefinitionProvider);
}

export function deactivate() {
  StatusBar.dispose();
}