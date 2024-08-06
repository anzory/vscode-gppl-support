import { I18n, TranslateOptions } from 'i18n';
import { resolve } from 'path';
import { workspace } from 'vscode';
import { constants } from './constants';

// eslint-disable-next-line @typescript-eslint/naming-convention
class _i18n {
  private lcl = workspace
    .getConfiguration('gpp.localization')
    .get<string>('defaultLocale');

  constructor() {}

  private i18n = new I18n({
    locales: constants.localesEnum,
    defaultLocale: this.lcl,
    directory: resolve(__dirname, 'i18n'),
  });

  public t(phraseOrOptions: string | TranslateOptions): string {
    return this.i18n.__(phraseOrOptions);
  }
  public update(): void {
    this.lcl = workspace
      .getConfiguration('gpp.localization')
      .get<string>('defaultLocale');
    this.i18n.configure({
      locales: constants.localesEnum,
      defaultLocale: this.lcl,
      directory: resolve(__dirname, 'i18n'),
    });
  }
}

export const i18n = new _i18n();
