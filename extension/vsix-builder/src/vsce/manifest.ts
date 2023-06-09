export interface Person {
	name: string;
	url?: string;
	email?: string;
}

export interface Translation {
	id: string;
	path: string;
}

export interface Localization {
	languageId: string;
	languageName?: string;
	localizedLanguageName?: string;
	translations: Translation[];
}

export interface Language {
	readonly id: string;
	readonly aliases?: string[];
	readonly extensions?: string[];
}

export interface Grammar {
	readonly language: string;
	readonly scopeName: string;
	readonly path: string;
}

export interface Command {
	readonly command: string;
	readonly title: string;
}

export interface Authentication {
	readonly id: string;
	readonly label: string;
}

export interface CustomEditor {
	readonly viewType: string;
	readonly priority: string;
	readonly selector: readonly {
		readonly filenamePattern?: string;
	}[];
}

export interface View {
	readonly id: string;
	readonly name: string;
}

export interface Contributions {
	readonly localizations?: Localization[];
	readonly languages?: Language[];
	readonly grammars?: Grammar[];
	readonly commands?: Command[];
	readonly authentication?: Authentication[];
	readonly customEditors?: CustomEditor[];
	readonly views?: { [location: string]: View[] };
	readonly [contributionType: string]: any;
}

export type ExtensionKind = 'ui' | 'workspace' | 'web';

export interface Manifest {
	// mandatory (npm)
	name: string;
	version: string;
	engines: { [name: string]: string };

	// vscode
	publisher: string;
	icon?: string;
	contributes?: Contributions;
	activationEvents?: string[];
	extensionDependencies?: string[];
	extensionPack?: string[];
	galleryBanner?: { color?: string; theme?: string };
	preview?: boolean;
	badges?: { url: string; href: string; description: string }[];
	markdown?: 'github' | 'standard';
	_bundling?: { [name: string]: string }[];
	_testing?: string;
	enableProposedApi?: boolean;
	enabledApiProposals?: readonly string[];
	qna?: 'marketplace' | string | false;
	extensionKind?: ExtensionKind | ExtensionKind[];
	sponsor?: { url: string };

	// optional (npm)
	author?: string | Person;
	displayName?: string;
	description?: string;
	keywords?: string[];
	categories?: string[];
	homepage?: string;
	bugs?: string | { url?: string; email?: string };
	license?: string;
	contributors?: string | Person[];
	main?: string;
	browser?: string;
	repository?: string | { type?: string; url?: string };
	scripts?: { [name: string]: string };
	dependencies?: { [name: string]: string };
	devDependencies?: { [name: string]: string };
	private?: boolean;
	pricing?: string;

	// vsce
	vsce?: any;

	// not supported (npm)
	// files?: string[];
	// bin
	// man
	// directories
	// config
	// peerDependencies
	// bundledDependencies
	// optionalDependencies
	// os?: string[];
	// cpu?: string[];
	// preferGlobal
	// publishConfig
}
