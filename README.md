# Full GPPL language support for VSCode (formatting, highlighting and more...)

This extension provides Full GPPL language support for VSCode: highlighting, formatting, autocomplete and code snippets.

## Features

- Syntax highlighting with customization capability from `settings.json` file
- Simple Document Formatting functionality
- Procedure tree panel with navigation and sorting capability and auto-refresh the tree
- Go to Definition functionality for procedures and variables
- Go to References functionality for procedures and user variables
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

"`Go to Definition`" functionality for procedures

(by `Ctrl+Click`, or `RightClick -> Go to Definition`, or `F12`)

![Go to Definition](https://github.com/anzory/vscode-gppl-support/blob/master/images/screens/goto-definition.gif?raw=true)

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

- very useful extension [coenraads.bracket-pair-colorizer-2](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer-2)

- just as useful extension [alefragnani.bookmarks](https://marketplace.visualstudio.com/items?itemName=alefragnani.bookmarks)

- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono?preview.text_type=custom) font Designed by JetBrains, Philipp Nurullin, Konstantin Bulenkov

---

## Known Issues

- There are no known issues with this extension.

---

## Release Notes

### 1.5.2

- Added hints on hovering

---

## Plan to implement:

- Add code and variable highlighting in tracing mode

- Add support for `#region` in the procedures tree

---

You''ll help me greatly if you [write a review and rating](https://marketplace.visualstudio.com/items?itemName=anzory.vscode-gppl-support&ssr=false#review-details)

Or even treat me to [coffee](https://paypal.me/anzory?locale.x=en_EN)
😄

---

**`Enjoy!`**
