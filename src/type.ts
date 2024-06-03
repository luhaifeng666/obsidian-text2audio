export type ConfigKeys =
	| "text"
	| "filename"
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
	range?: Array<number>;
	step?: number;
};
export interface Text2AudioSettings {
	keyHide: boolean;
	key: string;
	region: string;
	directory: string;
	interposition: boolean;
	readBeforeOrAfter: "off" | "before" | "after";
	autoStop: boolean;
	autoPause: boolean;
	textFormatting: string;
	speed: number;
	language: "zh" | "en";
	style: string;
	// role: string;
	intensity: number;
	volume: number;
}
