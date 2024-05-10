import { readFileSync } from 'fs';
import { resolve } from 'path';
import { workspace } from 'vscode';

const gpp = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json')).toString()
);
const configurationProperties = Object.getOwnPropertyNames(
  gpp.contributes.configuration.properties
);

class GpplConstants {
  public constants = {
    extension: {
      name: gpp.name,
      version: gpp.version,
    },
    commands: {
      refreshTree: gpp.contributes.commands[0].command,
      procedureSelection: gpp.contributes.commands[1].command,
      procedureTitle: gpp.contributes.commands[1].title,
      sortByAZ: gpp.contributes.commands[2].command,
      sortByZA: gpp.contributes.commands[3].command,
      sortByDefault: gpp.contributes.commands[4].command,
      formatDocument: gpp.contributes.commands[5].command,
    },
    urls: {
      changeLog:
        'https://github.com/anzory/vscode-gppl-support/blob/master/CHANGELOG.md',
      readme:
        'https://github.com/anzory/vscode-gppl-support/blob/master/README.md',
    },
    format: {
      enable: workspace
        .getConfiguration()
        .get<boolean>(configurationProperties[2]),
      tabSize: workspace
        .getConfiguration()
        .get<number>(configurationProperties[3]),
      preferSpace: workspace
        .getConfiguration()
        .get<boolean>(configurationProperties[4]),
      applyIndentsToRegions: workspace
        .getConfiguration()
        .get<boolean>(configurationProperties[6]),
    },
    localesEnum:
      gpp.contributes.configuration.properties['gpp.localization.defaultLocale']
        .enum,
    languageId: gpp.contributes.languages[0].id,
    proceduresViewId: gpp.contributes.views.gpp[0].id,
    configId: gpp.contributes.languages[0].id,
    copyright: gpp.copyright,
    extensionOutputChannelName: gpp.shortName,
  };
}

export let constants = new GpplConstants().constants;

workspace.onDidChangeConfiguration(() => {
  constants = new GpplConstants().constants;
});
