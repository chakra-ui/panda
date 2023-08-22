// Taken from https://github.com/frenic/csstype/blob/46694defae2cf3386218d0000490b0d0ac385aa6/typings/mdn-data.d.ts
declare namespace MDN {
    interface Property {
      syntax: string;
      media: string;
      inherited: boolean;
      animationType: string;
      percentages: string;
      groups: string[];
      initial: string;
      appliesto: string;
      computed: string | string[];
      order: string;
      status: string;
      mdn_url?: string;
    }

    interface Properties {
      [property: string]: Property;
    }

    interface Syntax {
      syntax: string;
    }

    interface Syntaxes {
      [property: string]: Syntax;
    }

    interface Selector {
      syntax: string;
      groups: string[];
      status: string;
    }

    interface Selectors {
      [selector: string]: Selector;
    }

    interface Types {
      [name: string]: any;
    }

    interface Descriptor {
      syntax: string;
      media: string;
      percentages: string | string[];
      initial: string | string[];
      computed: string | string[];
      order: string;
    }

    interface Descriptors {
      [descriptor: string]: Descriptor;
    }

    interface AtRule {
      syntax: string;
      interfaces: string[];
      groups: string[];
      descriptors: Descriptors;
      status: string;
    }

    interface AtRules {
      [name: string]: AtRule;
    }

    interface L10N {
      [key: string]: {
        'en-US': string;
      };
    }
  }

  declare module 'mdn-data/css/properties.json' {
    var properties: MDN.Properties;
    export = properties;
  }

  declare module 'mdn-data/css/syntaxes.json' {
    var syntaxes: MDN.Syntaxes;
    export = syntaxes;
  }

  declare module 'mdn-data/css/selectors.json' {
    var selectors: MDN.Selectors;
    export = selectors;
  }

  declare module 'mdn-data/css/types.json' {
    var types: MDN.Types;
    export = types;
  }

  declare module 'mdn-data/css/at-rules.json' {
    var atRules: MDN.AtRules;
    export = atRules;
  }

  declare module 'mdn-data/l10n/css.json' {
    var l10n: MDN.L10N;
    export = l10n;
  }
