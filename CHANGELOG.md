# Change Log

## [Unreleased]

- rewrite the extension code using the [LSP](https://code.visualstudio.com/api/language-extensions/overview#language-server-protocol)

- implement the semantic analyzer of the `GPP Language` on the Language Server

- and more ...

## [1.7.13] - 2025-10-14

### Added

- Search and filtering functionality in the Outline panel for quick symbol lookup
- Keyboard shortcuts documentation for Outline panel features

### Improved

- Updated README.md with tips for using Outline panel search and breadcrumbs navigation

---

## [1.7.12] - 2025-10-14

### Removed

- Custom Procedures Tree View panel (replaced with standard Outline panel for document symbols)

### Improved

- Simplified extension architecture by removing custom tree view implementation
- Document symbols now displayed in standard VSCode Outline panel

---

## [1.7.11] - 2025-10-05

### Added

- Document Symbols to the Outline window

### Improved

- parsing algorithm

---

## [1.7.10] - 2025-10-05

### Updated

- to the latest versions of VSCode and other libraries

---

## [1.7.4] - 2024-05-10

### Removed

- Status Bar

---

## [1.7.3] - 2024-03-19

### Fixed

- Tooltips for procedure with parameters were not displayed on mouse-over.

---

## [1.7.2] - 2023-10-12

### Fixed

- Syntax highlighting changes when choosing a theme other than `Default Dark+`.
- The size of icons on the toolbar.

---

## [1.7.0] - 2023-01-12

### Added

- Added `Internationalization` support for `Completion`

---

## [1.6.8] - 2022-12-24

### Updated

- Fixed G-code highlighting
- Added `Info` section for procedure definition

---

## [1.6.7] - 2022-12-08

### Updated

- Upgrade to the latest versions of the libraries used.
- VSCode engine version updated to 1.74.0.

---

## [1.6.6] - 2022-09-06

### Updated

- VSCode engine version.

---

## [1.6.5] - 2022-09-03

### Added

- support for array parsing.

---

## [1.6.3] - 2022-03-12

### Fixed

- SolidCAM `GPP Debugger` compatibility recovered.

---

## [1.6.1] - 2021-09-25

### Added

- grouping procedures in the Tree View using a comment of a special type `;#region REGION_NAME` ... `;#endregion`. Nested regions and sorting are supported.

---

## [1.5.5] - 2021-09-04

### Added

- The list of SolidCAM GPPL global system variables has been updated and completed to highlight.

---

## [1.5.3] - 2021-09-02

### Fixed

- bug: The information section is not updated when cursor is pointing

---

## [1.5.0] - 2021-04-13

### Added

- hints on hovering

---

## [1.4.2] - 2021-04-11

### Added

- customization capability of syntax highlighting from `settings.json` file

- "`Go to Definition`" functionality for user variables

- "`Go to References`" functionality for procedures and variables

- full compatibility with `SolidCAM debugger`

---

## [1.3.2] - 2021-03-29

### Fixed

- bug: formatting does not work when capital letters are used

---

## [1.3.1] - 2021-03-25

### Fixed

- bug: the last line of the gppl-file is not formatted
- bug: comments shouldn't be involved in formatting

---

## [1.3.0] - 2021-03-23

### Added

- simple `Document Formatting` functionality
- several settings for extension

---

## [1.2.2] - 2021-03-22

### Fixed

- a bug when the `Go To Definition` opened a new tab every time

---

## [1.2.1] - 2021-03-21

### Added

- "`Goto Definition`" functionality for procedures.

---

## [1.1.1] - 2021-03-20

### Added

- Sort feature to the procedures tree.

---

## [1.1.0] - 2021-03-20

### Added

- New auto-complete code functionality.

---

## [1.0.3] - 2021-03-18

### Fixed

- color scheme of syntax highlighting.
- comment highlighting.
- auto-indentation.

---

## [1.0.1] - 2021-01-29

### Fixed

- some improvements in the project structure and README file

---

## [1.0.0] - 2021-01-28

### Added

- Syntax highlighting
- Autocomplete code
- Sidebar with procedure tree view
