import { promisify } from 'util';
import { parseString } from 'xml2js';

function createXMLParser<T>(): (raw: string) => Promise<T> {
	return promisify<string, T>(parseString);
}

export type XMLManifest = {
	PackageManifest: {
		$: { Version: string; xmlns: string; 'xmlns:d': string };
		Metadata: {
			Description: { _: string }[];
			DisplayName: string[];
			Identity: { $: { Id: string; Version: string; Publisher: string; TargetPlatform?: string } }[];
			Tags: string[];
			GalleryFlags: string[];
			License: string[];
			Icon: string[];
			Properties: { Property: { $: { Id: string; Value: string } }[] }[];
			Categories: string[];
			Badges: { Badge: { $: { Link: string; ImgUri: string; Description: string } }[] }[];
		}[];
		Installation: { InstallationTarget: { $: { Id: string } }[] }[];
		Dependencies: string[];
		Assets: { Asset: { $: { Type: string; Path: string } }[] }[];
	};
};

export type ContentTypes = {
	Types: {
		Default: { $: { Extension: string; ContentType: string } }[];
	};
};

export const parseXmlManifest = createXMLParser<XMLManifest>();
export const parseContentTypes = createXMLParser<ContentTypes>();
