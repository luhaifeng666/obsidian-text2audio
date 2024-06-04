import sdk, {
	SpeechSynthesisOutputFormat,
} from "microsoft-cognitiveservices-speech-sdk";
import {
	Notice,
	Setting,
	Editor,
	Platform,
	type ButtonComponent,
	type TextComponent,
} from "obsidian";
import type {
	ConfigKeys,
	MessageType,
	SettingConfig,
	Text2AudioSettings,
} from "./type";
import { LANGUAGES, LANGS, SETTINGS_GROUP } from "./constants";
import { actions } from "./store";

export const getDefaultFiletime = () => {
	const formatTimeNumber = (number: number) =>
		number > 9 ? number : `0${number}`;
	const date = new Date();
	const year = date.getFullYear();
	const month = formatTimeNumber(date.getMonth() + 1);
	const day = formatTimeNumber(date.getDate());
	const hour = formatTimeNumber(date.getHours());
	const minutes = formatTimeNumber(date.getMinutes());
	const seconds = formatTimeNumber(date.getSeconds());
	return `${year}${month}${day}${hour}${minutes}${seconds}`;
};

export const generateVoice = async (
	config: Partial<Record<ConfigKeys, string>> & {
		callback?: (audioConfig?: sdk.AudioConfig) => void;
		type: "save" | "play";
		settings: Text2AudioSettings;
	}
) => {
	return new Promise((resolve, reject) => {
		const {
			filename,
			text,
			voice,
			type,
			callback,
			audioFormat,
			audioFormatType,
			regionCode,
			settings,
		} = config;
		let synthesizer: sdk.SpeechSynthesizer | null = null;
		const {
			key,
			region,
			language,
			speed,
			directory,
			style,
			// role,
			volume,
			intensity,
		} = settings;

		const synthesizerClear = () => {
			actions.clearsynthesizer();
			callback && callback();
		};
		const langSettings = LANGS[language];

		// 生成时停止播放，并清除 sdk.AudioConfig 缓存
		actions.pause();
		actions.clearAudioConfig();

		try {
			const audioFile = `${directory}/${filename}.${audioFormatType}`;
			const speechConfig = sdk.SpeechConfig.fromSubscription(
				key || "",
				region || ""
			);
			let audioConfig = sdk.AudioConfig.fromSpeakerOutput();
			if (type === "save") {
				audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
			} else {
				actions.setAudioConfig(audioConfig);
			}

			// The language of the voice that speaks.
			speechConfig.speechSynthesisVoiceName = voice || "";
			speechConfig.speechSynthesisOutputFormat =
				audioFormat as unknown as SpeechSynthesisOutputFormat;

			// Create the speech synthesizer.
			synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

			actions.setSpeechSynthesizer(synthesizer);

			// SSML content
			const ssmlContent = text
				? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${regionCode}">
				<voice name="${voice}">
					<mstts:express-as style="${style}" styledegree="${intensity / 100}">
						<prosody rate="${speed}" volume="${volume}">
							${text || ""}
						</prosody>
					</mstts:express-as>
				</voice>
			</speak>`
				: "";

			// Start the synthesizer and wait for a result.
			ssmlContent &&
				synthesizer.speakSsmlAsync(
					ssmlContent,
					function (result) {
						let res = true;
						if (
							result.reason ===
							sdk.ResultReason.SynthesizingAudioCompleted
						) {
							generateNotice().setMessage(
								generateNoticeText(
									`${langSettings.tipMessage.success
										.synthesis
									}. ${type === "save"
										? `${langSettings.tipMessage.success.save} ` +
										audioFile
										: ""
									}`,
									"success"
								)
							);
						} else {
							generateNotice().setMessage(
								generateNoticeText(
									`${langSettings.tipMessage.error.synthesis}`,
									"error"
								)
							);
							res = false;
						}
						res ? resolve(res) : reject(res);
						synthesizerClear();
					},
					function (err) {
						generateNotice().setMessage(
							generateNoticeText(err, "error")
						);
						synthesizerClear();
						reject(false);
					}
				);
		} catch (e) {
			generateNotice().setMessage(generateNoticeText(`${e}`, "error"));
			synthesizerClear();
			reject(false);
		}
	});
};

/**
 * 提示对象
 * @param message
 * @returns
 */
export const generateNotice = (
	message?: string | DocumentFragment,
	duration?: number
) => new Notice(message || "", duration);

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
	const fragment = new DocumentFragment();
	const spanDom = document.createElement("span");
	spanDom.appendText(message);
	spanDom.className = `ob-t2v-${messageType}`;
	fragment.appendChild(spanDom);
	return fragment;
};

const generateSettings = async (
	container: HTMLElement,
	plugin: any,
	config: SettingConfig
) => {
	const {
		inputConfig,
		desc,
		name,
		key,
		type,
		options,
		isPassword,
		range,
		step,
	} = config;
	const { placeholder, callback } = inputConfig || {};
	const settingEl = new Setting(container).setName(name).setDesc(desc);
	let textEl: TextComponent;
	const handleIconSwitch = (btn: ButtonComponent) => {
		btn.setIcon(plugin.settings.keyHide ? "eye" : "eye-off");
		return btn;
	};
	const handleInputTypeSwitch = (textEl: TextComponent) => {
		textEl &&
			textEl.inputEl.setAttribute(
				"type",
				plugin.settings.keyHide ? "password" : "text"
			);
	};
	const handleSettingSave = async (
		key: string,
		value: boolean | string | number
	) => {
		plugin.settings[key] = value;
		await plugin.saveSettings();
	};
	switch (type) {
		case "text":
		case "textArea":
			settingEl[type === "text" ? "addText" : "addTextArea"]((text) => {
				text.setPlaceholder(placeholder || "")
					.setValue(plugin.settings[key])
					.onChange(async (value) => {
						callback && callback(value);
						handleSettingSave(key, value);
					});
				if (isPassword) {
					textEl = text as TextComponent;
					handleInputTypeSwitch(textEl);
				}
			});
			type === "textArea" &&
				settingEl.setClass("ob-t2v-setting-textarea");
			isPassword &&
				settingEl.addButton((btn) =>
					handleIconSwitch(btn).onClick(async () => {
						plugin.settings.keyHide = !plugin.settings.keyHide;
						await plugin.saveSettings();
						handleIconSwitch(btn);
						handleInputTypeSwitch(textEl);
					})
				);
			break;

		case "select":
			settingEl.addDropdown((dp) =>
				dp
					.addOptions(options || {})
					.setValue(plugin.settings[key])
					.onChange(async (value) => {
						handleSettingSave(key, value);
					})
			);
			break;

		case "toggle":
			settingEl.addToggle((tg) => {
				tg.setValue(plugin.settings[key]).onChange(async (value) => {
					handleSettingSave(key, value);
					key === "enableDeveloperMode" && renderSettings(container, plugin);
				});
			});
			break;

		case "slider":
			settingEl.addSlider((slider) =>
				slider
					.setLimits(
						(range as number[])[0],
						(range as number[])[1],
						step as number
					)
					.setValue(plugin.settings[key])
					.onChange((value) => {
						handleSettingSave(key, value);
					})
					.setDynamicTooltip()
			);
			break;

		default:
			break;
	}
};

export const renderSettings = async (
	container: HTMLElement,
	plugin: any
) => {
	container.empty();

	SETTINGS_GROUP.forEach((setting) => {
		const { title, desc, settings } = setting;
		container.createDiv("settings-banner", (banner) => {
			banner.createEl("h3", {
				text: title,
			});
			desc && banner.createEl("p", {
				cls: "setting-item-description",
				text: desc,
			});
		});

		const _settings = title === "Developer Settings" ? settings.slice(0, plugin.settings.enableDeveloperMode ? settings.length : 1) : settings;

		_settings.filter((item) =>
			Platform.isDesktopApp
				? !!item
				: !["interposition", "directory"].includes(item.key)
		).forEach((item) => {
			generateSettings(
				container,
				plugin,
				item,
			);
		});
	})
}

export const getVoiceName = (voice: string) => {
	return voice.replace(/\(.*\)/g, "");
};

export const setLocalData = (key: string, value: string) => {
	localStorage.setItem(key, value);
};

export const getLocalData = (key: string) => {
	return localStorage.getItem(key) || "";
};

export const getVoices = (region: string) => {
	return LANGUAGES.find((lang) => lang.region === region)?.voices || null;
};

export const handleTextFormat = (text: string, rule: string) => {
	return text && rule
		? text.replace(
			new RegExp(rule.replace(/^\/(.*)\/.*/g, "$1"), "gi"),
			" "
		)
		: text;
};

export const getAudioFormatType = (audioFormat: string) =>
	audioFormat.replace(/(.*-)/g, "").toLowerCase() === "mp3" ? "mp3" : "wav";

export const getSelectedText = (
	readBeforeOrAfter: Text2AudioSettings["readBeforeOrAfter"],
	editor?: Editor
): string => {
	if (editor) {
		let content = editor.getSelection();
		if (readBeforeOrAfter !== "off") {
			let from = { line: 0, ch: 0 },
				to = editor.getCursor();
			if (readBeforeOrAfter === "after") {
				const lastLineNumber = editor.lastLine();
				const defaultToValue = {
					line: lastLineNumber,
					ch: editor.getLine(lastLineNumber).length,
				};
				const lastWordPosition = editor.wordAt(defaultToValue);
				from = editor.getCursor();
				to = lastWordPosition?.to || defaultToValue;
			}
			content = content || editor.getRange(from, to);
		}
		return content.trim();
	}
	return "";
};
