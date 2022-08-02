import { Config } from './types';

export {};

declare global {
  interface Window {
    config: Config;
  }
}
