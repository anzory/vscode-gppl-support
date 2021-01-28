'use strict';
 import * as path from 'path';
import { extensions } from 'vscode';

 const publisher = 'anzory';
 const extensionId = 'vscode-gppl-syntax';
 const extensionQualifiedID = publisher + '.' + extensionId;
 
 const gppl = extensions.getExtension(extensionQualifiedID);

 export const constants = {
    configId: gppl?.packageJSON.contributes.languages[0].id,
    copyright: gppl?.packageJSON.copyright,
    extension: {
        name: gppl?.packageJSON.displayName,
        version: gppl?.packageJSON.version,
        shortname: gppl?.packageJSON.shortName,
    },
    extensionOutputChannelName: gppl?.packageJSON.shortName,
    iconsPath: path.join(__dirname, "..", "..", "resources", "icons"),
    langId: gppl?.packageJSON.contributes.languages[0].id,
    urls: {
        changeLog: 'https://github.com/anzory/vscode-gppl-syntax/blob/master/CHANGELOG.md',
        readme: 'https://github.com/anzory/vscode-gppl-syntax/blob/master/README.md',
    },
 };