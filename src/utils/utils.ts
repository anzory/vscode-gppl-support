import { gpplComletionsItemsList } from './comletionsItemsList';
import { Config } from './config';
import { constants } from './constants';
import { i18n } from './i18n';
import { Logger } from './logger';
import { semanticHelper, IVariable, IProcedure } from './semanticHelper';
import textParser from './textParser';

export const utils = {
  gpplComletionsItemsList,
  config: Config,
  constants,
  i18n,
  logger: Logger,
  semanticHelper,
  textParser,
};

export interface IGpplVariable extends IVariable {}
export interface IGpplProcedure extends IProcedure {}
