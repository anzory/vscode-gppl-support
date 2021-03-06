'use strict';
import { commands, ExtensionContext, window } from 'vscode';
import { Config, configuration } from './util/config';
import { constants } from './util/constants';
import { StatusBar } from './util/statusBar';
import { GpplProceduresTreeProvider } from './providers/GpplProceduresTreeProvider';
import { GpplTreeStatusProvider } from './providers/GpplTreeStatusProvider';




export async function activate(context: ExtensionContext) {

    
    const start = process.hrtime();

    Config.configure(context);

    StatusBar.configure(context);



    const gpplProceduresTree = new GpplProceduresTreeProvider(context);

    window.registerTreeDataProvider('gppl.gpplProceduresTree', gpplProceduresTree);

    commands.registerCommand('gppl.gpplProceduresTree.RefreshTree', () => {


        if (window.activeTextEditor?.document.languageId === constants.langId) {
            commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', true);
        }

        gpplProceduresTree.refresh();
    });
    commands.registerCommand('gppl.gpplProceduresTree.Selection', range => gpplProceduresTree.select(range));

    

    const gpplStatus = new GpplTreeStatusProvider(context);
    window.registerTreeDataProvider('gppl.gpplStatus', gpplStatus);

    commands.registerCommand('gppl.gpplStatus.RefreshStatus', () => {
        if (window.activeTextEditor?.document.languageId === constants.langId) {
            commands.executeCommand('setContext', 'gpplStatusViewEnabled', true);
        }
        gpplStatus.refresh();
    });
    commands.registerCommand('gppl.gpplStatus.enable', () => {
        configuration.setParam('status.enable', true);

        }
    );
}

export function deactivate() {
    StatusBar.dispose();
    
}