<<<<<<< HEAD:npm_i.bat

rmdir /s /q node_modules

del package-lock.json

npm i -D @types/glob @types/mocha @types/node @types/vscode @types/webpack @typescript-eslint/eslint-plugin @typescript-eslint/parser @vscode/test-electron @vscode/vsce copy-webpack-plugin eslint fs glob mocha ts-loader ts-node typescript webpack webpack-cli 
=======
del package-lock.json && rd node_modules /q /s && npm i -D @types/glob @types/mocha @types/node @types/vscode @types/webpack @typescript-eslint/eslint-plugin @typescript-eslint/parser @vscode/test-electron @vscode/vsce copy-webpack-plugin eslint fs glob mocha ts-loader ts-node typescript webpack webpack-cli i18n @types/i18n
>>>>>>> 1fa0ebc8307440e9a803d9d2d9a03f6d1666fb48:npm_i_D.bat
