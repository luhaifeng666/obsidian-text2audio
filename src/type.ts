export type ConfigKeys =
	| "text"
	| "filename"
	| "key"
	| "region"
	| "filePath"
	| "voice"
	| "audioFormat"
	| "audioFormatType"
	| "type";
export type MessageType = "success" | "error" | "warning";
export type SettingType = "name" | "desc" | "key";
export type ConfigurationType = "key" | "region" | "directory" | "language";
export interface SettingInputConfig {
	placeholder: string;
	callback?: (value: string) => void;
}
export type SettingConfig = Record<SettingType, string> & {
	inputConfig?: SettingInputConfig;
	type: "text" | "select" | "toggle";
	options?: Record<string, string>;
};
export interface Text2AudioSettings {
	key: string;
	region: string;
	directory: string;
	interposition: boolean;
	readPrevious: boolean;
	textFormatting: string;
	language: "zh" | "en";
}
