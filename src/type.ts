export type ConfigKeys =
	| "text"
	| "filename"
	| "key"
	| "region"
	| "filePath"
	| "voice"
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
	type: "text" | "select";
	options?: Record<string, string>;
};