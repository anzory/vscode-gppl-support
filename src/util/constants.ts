import { readFileSync } from 'fs';
import { resolve } from 'path';
import { workspace } from 'vscode';

const gppl = JSON.parse(readFileSync(resolve(__dirname, 'package.json')).toString());
const confProp = Object.getOwnPropertyNames(gppl.contributes.configuration.properties);

class GpplConstants {
  public constants = {
    extension: {
      name: gppl.name,
      version: gppl.version,
    },
    commands: {
      refreshTree: gppl.contributes.commands[0].command,
      procedureSelection: gppl.contributes.commands[1].command,
      procedureTitle: gppl.contributes.commands[1].title,
      sortByAZ: gppl.contributes.commands[2].command,
      sortByZA: gppl.contributes.commands[3].command,
      sortByDefault: gppl.contributes.commands[4].command,
      formatDocument: gppl.contributes.commands[5].command,
    },
    urls: {
      changeLog: 'https://github.com/anzory/vscode-gppl-support/blob/master/CHANGELOG.md',
      readme: 'https://github.com/anzory/vscode-gppl-support/blob/master/README.md',
    },
    format: {
      enable: workspace.getConfiguration().get<boolean>(confProp[2]),
      tabSize: workspace.getConfiguration().get<number>(confProp[3]),
      preferSpace: workspace.getConfiguration().get<boolean>(confProp[4]),
      applyIndentsToRegions: workspace.getConfiguration().get<boolean>(confProp[6]),
    },
    languageId: gppl.contributes.languages[0].id,
    proceduresViewId: gppl.contributes.views.gppl[0].id,
    configId: gppl.contributes.languages[0].id,
    copyright: gppl.copyright,
    extensionOutputChannelName: gppl.shortName,
  };
}

workspace.onDidChangeConfiguration(() => {
  constants = new GpplConstants().constants;
});

export let constants = new GpplConstants().constants;
