export type ConfigKeys =
	| "text"
	| "filename"
	| "key"
	| "region"
	| "filePath"
	| "voice"
	| "audioFormat"
	| "audioFormatType"
	| "regionCode"
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
	type: "text" | "select" | "toggle" | "textArea" | "slider";
	options?: Record<string, string>;
	isPassword?: boolean;
};
export interface Text2AudioSettings {
	keyHide: boolean;
	key: string;
	region: string;
	directory: string;
	interposition: boolean;
	readBeforeOrAfter: "off" | "before" | "after";
	autoStop: boolean;
	textFormatting: string;
	speed: number;
	language: "zh" | "en";
}
