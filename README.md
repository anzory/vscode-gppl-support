# GPPL Support for VSCode

Enhance your SolidCAM postprocessor development with full GPPL language support in Visual Studio Code. Enjoy syntax highlighting, code formatting, autocompletion, snippets, and document symbols in the Outline panel — all in one extension!

## Features

- **Document Symbols** in the Outline Window
- **CodeLens** for Document Symbols
- **Syntax Highlighting**: Fully customizable via `settings.json`.
- **Code Formatting**: Simple and reliable document formatting.
- **Go to Definition**: Jump to definitions of procedures and variables with ease.
- **Find All References**: Locate all references to procedures and user variables.
- **Autocompletion**: Smart auto-complete and auto-indentation for faster coding.
- **Hover Hints**: Get helpful hints by hovering over code elements.
- **Function Wrapping**: Highlight a variable, type a function name, and watch it wrap automatically.
- **Internationalization**: Multi-language support for autocompletion.
- **SolidCAM Integration**: Seamless compatibility with the SolidCAM debugger.

---

**Document Symbols**:

Document Symbols in the Outline Window

![Document Symbols in the Outline Window](/images/screens/documentSymbols.gif?raw=true)

> **Tip:** You can now use search and filtering in the Outline panel for quick symbol lookup. Use `Ctrl+Alt+F` in the Outline panel to search and filter items.
>
> **Reminder:** Don't forget to enable breadcrumbs in VSCode (`View -> Appearance -> Breadcrumbs` or setting `Breadcrumbs: Enabled`) for better code structure navigation.

---

**CodeLens**

![CodeLens for Document Symbols](/images/screens/codeLens.gif?raw=true)

---

**Autocompletion**:

![Auto-complete code functionality](/images/screens/auto-complete-functionality.gif?raw=true)

---

**Go to Definition** and **Find All References**:

(by `Ctrl+Click`, or `RightClick -> Go to Definition`, or `F12`)

![Go to Definition](/images/screens/goto-definition.gif?raw=true)

> **Tip:** You can open the definition to the side with `Ctrl+Alt+Click`.

---

**Hover Hints**:

![Displays information](/images/screens/info-when-hover.gif?raw=true)

---

**Internationalization**:

![Internationalization for Completion](/images/screens/internationalization.gif?raw=true)

---

## Installation

1. Open VSCode.
2. Go to Extensions Marketplace.
3. Search for `anzory.vscode-gppl-support` and click Install.

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

### 1.8.0

### Added

- `CodeLens` for Document Symbols

### Improved

- double character output during autocompletion

---

## Plan to implement

It is a good text editor with GPPL language support for SolidCAM postprocessor editing at the moment. But I want even better. The next version will be 2.0.0, and I'll implement in it:

- [LSP](https://code.visualstudio.com/api/language-extensions/overview#language-server-protocol) functionality to improve performance
- a semantic analyzer for the GPPL
- here should be a complete project with a settings file, parsing of all dependent files, deploy functionality and packaging into an archive
- and more ...

---

## Help Make This Project Better

Love this extension? Here’s how you can help:

- ⭐ Leave a star on GitHub.
- 📝 Write a review or share your feedback.
- 🌍 Add language files for your locale — email me at <andrey.a.zorin@gmail.com>!
- 💻 Contribute code or report issues via pull requests.
- [![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/anzory?locale.x=en_EN)

---
