# Full SolidCAM GPP Language support for VSCode (formatting, highlighting and more...)

This extension provides Full GPPL language support for VSCode: highlighting, formatting, autocomplete, code snippets, sidebar with procedures tree view & sorting capability.

## Features

- Syntax highlighting with customization capability from `settings.json` file
- Simple Document Formatting functionality
- Procedure tree panel with navigation and sorting capability and auto-refresh the tree
- `Go to Definition` functionality for procedures and variables
- `Go to References` functionality for procedures and user variables
- Auto-complete & auto-indentation code
- Shown hints when hovering
- New auto-complete code functionality: just highlight the variable name and type the name of function - the variable will be wrapped in the function automatically
- Full compatibility with `SolidCAM debugger`

---

New auto-complete code functionality:

![New auto-complete code functionality](https://github.com/anzory/vscode-gppl-support/blob/master/images/screens/auto-complete-functionality.gif?raw=true)

---

Sidebar with procedures tree view & sorting capability:

![Sidebar with procedure tree view](https://github.com/anzory/vscode-gppl-support/blob/master/images/screens/tree-sort.gif?raw=true)

---

`Go To Definition` and `Go To References` functionality for procedures:

(by `Ctrl+Click`, or `RightClick -> Go to Definition`, or `F12`)

![Go to Definition](https://github.com/anzory/vscode-gppl-support/blob/master/images/screens/goto-definition.gif?raw=true)

> **Tip:** You can open the definition to the side with `Ctrl+Alt+Click`.

---

Displays information about variables when the cursor is pointing

![Displays information](https://github.com/anzory/vscode-gppl-support/blob/master/images/screens/info-when-hover.gif?raw=true)

---

## Extension Settings

There are a few settings for this extension:

(File -> Preferenses -> Settins -> Extensions)

- `Editor: Default Formatter`: you must specify _'anzory.vscode-gppl-support'_ to be able to format GPPL documents (by default)
- `Format: Enable`: specifies whether or not the document can be formatted
- `Format: Insert Spaces`: indicates whether or not to replace tabs with spaces
- `Format: Tab Size`: specifies the indent size
- `Files: Encoding`: one of the [common encodings](https://en.wikipedia.org/wiki/Character_encoding#Common_character_encodings)

In addition, the formatting behavior depends on the following settings:

(File -> Preferenses -> Settins -> Text Editor -> Formatting)

- `Format On Save`: defines whether or not the document will be formatted when it is saved

---

## Dependencies

There are no hard dependencies here, but I highly recommend using:

- just as useful extension [alefragnani.bookmarks](https://marketplace.visualstudio.com/items?itemName=alefragnani.bookmarks).

- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono?preview.text_type=custom) font Designed by JetBrains, Philipp Nurullin, Konstantin Bulenkov.

- [Color Highlight](https://marketplace.visualstudio.com/items?itemName=naumovs.color-highlight) if you want to set up a different syntax highlighting.

---

## Known Issues

There are no known issues with this extension.

See a issue? feel free to open the [issues](https://github.com/anzory/vscode-gppl-support/issues/new/choose).

---

## Release Notes

### 1.6.8

- Fixed G-code highlighting.
- Added `Info` section for procedure definition

---

## Plan to implement

It is a good text editor with GPPL language support for SolidCAM postprocessor editing at the moment. But I want even better. The next version will be 2.0.0, and I'll implement in it:

- [LSP](https://code.visualstudio.com/api/language-extensions/overview#language-server-protocol) functionality to improve performance
- a semantic analyzer for the GPPL
- here should be a complete project with a settings file, parsing of all dependent files, deploy functionality and packaging into an archive
- and more ...

---

## How to support the project

You''ll help me greatly if you [write a review and rating](https://marketplace.visualstudio.com/items?itemName=anzory.vscode-gppl-support&ssr=false#review-details)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/anzory?locale.x=en_EN)

It is not necessary, but if you do it, I would appreciate it.

---
