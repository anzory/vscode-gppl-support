import { I18n, TranslateOptions } from 'i18n';
import { resolve } from 'path';
import { workspace } from 'vscode';
import { II18n } from '../interfaces';
import { getConstants } from './constants';

/**
 * Provides internationalization functionality for the GPP extension.
 *
 * This class handles:
 * - Translation of UI strings and messages
 * - Locale management
 * - Dynamic locale switching
 */
class _i18n implements II18n {
  private lcl: string | undefined;
  private i18n: I18n | undefined;

  /**
   * Creates an instance of _i18n.
   * Initialization is deferred to first use or explicit initialize() call.
   */
  constructor() { }

  /**
   * Ensures the i18n engine is initialized. Called lazily on first translation.
   */
  private ensureInitialized(): void {
    if (this.i18n) {
      return;
    }
    this.lcl = workspace
      .getConfiguration('gpp.localization')
      .get<string>('defaultLocale');
    this.i18n = new I18n({
      locales: getConstants().localesEnum,
      defaultLocale: this.lcl,
      directory: resolve(__dirname, 'i18n'),
    });
  }

  /**
   * Translates a phrase or options using the current locale.
   *
   * @param phraseOrOptions - The phrase to translate or translation options
   * @returns The translated string
   */
  public t(phraseOrOptions: string | TranslateOptions): string {
    this.ensureInitialized();
    return this.i18n!.__(phraseOrOptions);
  }

  /**
   * Updates the current locale and reinitializes the i18n system.
   */
  public update(): void {
    this.lcl = workspace
      .getConfiguration('gpp.localization')
      .get<string>('defaultLocale');
    this.i18n = new I18n({
      locales: getConstants().localesEnum,
      defaultLocale: this.lcl,
      directory: resolve(__dirname, 'i18n'),
    });
  }
}

/**
 * Global instance of the internationalization helper.
 *
 * This singleton instance provides translation functionality
 * for the extension.
 */
export const i18n = new _i18n();
