import sdk from "microsoft-cognitiveservices-speech-sdk";
import { Notice, Setting } from "obsidian";
import type {
	ConfigKeys,
	MessageType,
	SettingType,
	SettingInputConfig,
} from "./type";

export const generateVoice = (config: Record<ConfigKeys, string>) => {
	try {
		const notice = generateNotice();
		const { filename, text, key, region, filePath } = config;
		return new Promise((resolve, reject) => {
			const audioFile = `${filePath}${filename}.wav`;
			// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
			const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
			const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

			// The language of the voice that speaks.
			speechConfig.speechSynthesisVoiceName = "ja-JP-ShioriNeural";

			// Create the speech synthesizer.
			let synthesizer: sdk.SpeechSynthesizer | null =
				new sdk.SpeechSynthesizer(speechConfig, audioConfig);

			// Start the synthesizer and wait for a result.
			synthesizer.speakTextAsync(
				text,
				function (result) {
					let success = true;
					if (
						result.reason ===
						sdk.ResultReason.SynthesizingAudioCompleted
					) {
						notice.setMessage(
							generateNoticeText(
								"synthesis finished. File path is " + audioFile,
								"success"
							)
						);
					} else {
						notice.setMessage(
							generateNoticeText(
								`Speech synthesis canceled, ${result.errorDetails}Did you set the speech resource key and region values?`,
								"error"
							)
						);
						success = false;
					}
					synthesizer?.close();
					synthesizer = null;
					success ? resolve(success) : reject(success);
				},
				function (err) {
					notice.setMessage(generateNoticeText(err, "error"));
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

export const generateSettings = (
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
					plugin.settings.key = value;
					await plugin.saveSettings();
				})
		);
};
