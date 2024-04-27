import sdk from "microsoft-cognitiveservices-speech-sdk";
import path from "path"
import { Notice, Setting } from "obsidian";
import type {
	ConfigKeys,
	MessageType,
	SettingType,
	SettingInputConfig,
} from "./type";

export const generateVoice = (config: Record<ConfigKeys, string> & {
	callback?: () => void
}) => {
	try {
		const { filename, text, key, region, filePath, voice, type, callback } = config;
		return new Promise((resolve, reject) => {
			const audioFile = path.resolve(filePath, `${filename}.wav`);
			const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
			let audioConfig;
			if (type === "save") sdk.AudioConfig.fromAudioFileOutput(audioFile);

			// The language of the voice that speaks.
			speechConfig.speechSynthesisVoiceName = voice;

			// Create the speech synthesizer.
			let synthesizer: sdk.SpeechSynthesizer | null =
				new sdk.SpeechSynthesizer(speechConfig, ...(type === "save" ? [audioConfig] : []));

			// Start the synthesizer and wait for a result.
			synthesizer.speakTextAsync(
				text,
				function (result) {
					if (
						result.reason ===
						sdk.ResultReason.SynthesizingAudioCompleted
					) {
						generateNotice().setMessage(
							generateNoticeText(
								`Synthesis finished. ${type === "save" ? "File path is " + audioFile : ""}`,
								"success"
							)
						);
						callback && callback()
						resolve(type === "save" ? true : result.audioData)
					} else {
						generateNotice().setMessage(
							generateNoticeText(
								`Speech synthesis canceled, ${result.errorDetails}Did you set the speech resource key and region values?`,
								"error"
							)
						);
						reject(false)
					}
					synthesizer?.close();
					synthesizer = null;
				},
				function (err) {
					generateNotice().setMessage(generateNoticeText(err, "error"));
					synthesizer?.close();
					synthesizer = null;
					reject(false);
				}
			);
		});
	} catch (e) {
		console.error(e);
	}
};

/**
 * 提示对象
 * @param message
 * @returns
 */
export const generateNotice = (message?: string | DocumentFragment) =>
	new Notice(message || "");

/**
 * 生成提示信息
 * @param message
 * @param messageType
 * @returns
 */
export const generateNoticeText = (
	message: string,
	messageType: MessageType
): DocumentFragment => {
	const MESSAGE_COLOR: Record<MessageType, string> = {
		success: "#52c41a",
		error: "#ff4d4f",
		warning: "#faad14",
	};
	const fragment = new DocumentFragment();
	const spanDom = document.createElement("span");
	spanDom.innerHTML = message;
	spanDom.style.color = MESSAGE_COLOR[messageType];
	fragment.appendChild(spanDom);
	return fragment;
};

export const generateSettings = async (
	container: HTMLElement,
	plugin: any,
	config: Record<SettingType, string> & {
		inputConfig: SettingInputConfig;
	}
) => {
	const { inputConfig, desc, name, key } = config;
	const { placeholder, callback } = inputConfig || {};
	new Setting(container)
		.setName(name)
		.setDesc(desc)
		.addText((text) =>
			text
				.setPlaceholder(placeholder)
				.setValue(plugin.settings[key])
				.onChange(async (value) => {
					callback && callback(value);
					plugin.settings[key] = value;
					await plugin.saveSettings();
				})
		);
};
