import { gpplComletionsItemsList } from './comletionsItemsList';
import { Config } from './config';
import { constants } from './constants';
import { i18n } from './i18n';
import { Logger } from './logger';
import { semanticHelper, IVariable, IProcedure } from './semanticHelper';
import textParser from './textParser';

/**
 * Central utilities collection for the GPP language extension.
 *
 * This object provides access to all utility modules and classes:
 * - gpplComletionsItemsList: Predefined completion items for autocompletion
 * - config: Configuration management
 * - constants: Application constants and settings
 * - i18n: Internationalization support
 * - logger: Logging functionality
 * - semanticHelper: Semantic analysis utilities
 * - textParser: Text parsing utilities
 */
export const utils = {
  gpplComletionsItemsList,
  config: Config,
  constants,
  i18n,
  logger: Logger,
  semanticHelper,
  textParser,
};

/**
 * Interface for GPP variables extending the base variable interface.
 */
export interface IGpplVariable extends IVariable {}

/**
 * Interface for GPP procedures extending the base procedure interface.
 */
export interface IGpplProcedure extends IProcedure {}
