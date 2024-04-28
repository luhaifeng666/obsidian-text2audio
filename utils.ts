import sdk from "microsoft-cognitiveservices-speech-sdk";
import path from "path";
import { Notice, Setting } from "obsidian";
import type { ConfigKeys, MessageType, SettingConfig } from "./type";

export const generateVoice = async (
	config: Record<ConfigKeys, string> & {
		callback?: () => void;
	}
) => {
	return new Promise((resolve, reject) => {
		try {
			const {
				filename,
				text,
				key,
				region,
				filePath,
				voice,
				type,
				callback,
			} = config;
			const audioFile = path.resolve(filePath, `${filename}.wav`);
			const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
			let audioConfig;
			if (type === "save")
				audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

			// The language of the voice that speaks.
			speechConfig.speechSynthesisVoiceName = voice;

			// Create the speech synthesizer.
			let synthesizer: sdk.SpeechSynthesizer | null =
				new sdk.SpeechSynthesizer(
					speechConfig,
					...(type === "save" ? [audioConfig] : [])
				);

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
								`Synthesis finished. ${
									type === "save"
										? "File path is " + audioFile
										: ""
								}`,
								"success"
							)
						);
						callback && callback();
						resolve(true);
					} else {
						generateNotice().setMessage(
							generateNoticeText(
								`Speech synthesis canceled, ${result.errorDetails}Did you set the speech resource key and region values?`,
								"error"
							)
						);
						reject(false);
					}
					synthesizer?.close();
					synthesizer = null;
				},
				function (err) {
					generateNotice().setMessage(
						generateNoticeText(err, "error")
					);
					synthesizer?.close();
					synthesizer = null;
					reject(false);
				}
			);
		} catch (e) {
			generateNotice().setMessage(generateNoticeText(`${e}`, "error"));
			reject(false);
		}
	});
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
	config: SettingConfig
) => {
	const { inputConfig, desc, name, key, type, options } = config;
	const { placeholder, callback } = inputConfig || {};
	const settingEl = new Setting(container).setName(name).setDesc(desc);
	switch (type) {
		case "text":
			settingEl.addText((text) =>
				text
					.setPlaceholder(placeholder || "")
					.setValue(plugin.settings[key])
					.onChange(async (value) => {
						callback && callback(value);
						plugin.settings[key] = value;
						await plugin.saveSettings();
					})
			);
			break;

		case "select":
			settingEl.addDropdown((dp) =>
				dp
					.addOptions(options || {})
					.setValue(plugin.settings[key])
					.onChange(async (value) => {
						plugin.settings[key] = value;
						await plugin.saveSettings();
					})
			);
			break;

		default:
			break;
	}
};
