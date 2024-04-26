export type ConfigKeys = "text" | "filename" | "key" | "region" | "filePath";
export type MessageType = "success" | "error" | "warning";
export type SettingType = "name" | "desc" | "key";
export type ConfigurationType = "key" | "region" | "directory";
export interface SettingInputConfig {
	placeholder: string;
	callback?: (value: string) => void;
}
