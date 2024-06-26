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
			role,
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
					<mstts:express-as role="${role}" style="${style}" styledegree="${
						intensity / 100
				  }">
						<prosody rate="${speed}" volume="${volume}">
							${cleanMarkup(text) || ""}
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
									`${
										langSettings.tipMessage.success
											.synthesis
									}. ${
										type === "save"
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
					.addOptions(
						(typeof options === "function"
							? options(plugin.settings.regionCode)
							: options) || {}
					)
					.setValue(plugin.settings[key])
					.onChange(async (value) => {
						handleSettingSave(key, value);
						// 当在配置中修改 Language type 时
						if (key === "languageType") {
							const regionData = LANGUAGES.find(
								(lang) => lang["name-en"] === value
							);
							// 设置regionCode
							await handleSettingSave(
								"regionCode",
								regionData?.region || ""
							);
							// 设置默认 Voice type
							await handleSettingSave(
								"voiceType",
								initVoiceName(regionData?.voices[0] || "")
							);
							// 刷新配置页面
							renderSettings(container, plugin);
						}
					})
			);
			break;

		case "toggle":
			settingEl.addToggle((tg) => {
				tg.setValue(plugin.settings[key]).onChange(async (value) => {
					handleSettingSave(key, value);
					key === "enableDeveloperMode" &&
						renderSettings(container, plugin);
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

export const renderSettings = async (container: HTMLElement, plugin: any) => {
	container.empty();

	SETTINGS_GROUP.forEach((setting) => {
		const { title, desc, settings } = setting;
		container.createDiv("settings-banner", (banner) => {
			banner.createEl("h3", {
				text: title,
			});
			desc &&
				banner.createEl("p", {
					cls: "setting-item-description",
					text: desc,
				});
		});

		const _settings =
			title === "Developer Settings"
				? settings.slice(
						0,
						plugin.settings.enableDeveloperMode
							? settings.length
							: 1
				  )
				: settings;

		_settings
			.filter((item) =>
				Platform.isDesktopApp
					? !!item
					: !["interposition", "directory"].includes(item.key)
			)
			.forEach((item) => {
				generateSettings(container, plugin, item);
			});
	});
};

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
	audioFormat.replace(/.*\(\.(.*)\)/g, "$1").toLowerCase() === "mp3"
		? "mp3"
		: "wav";

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

export const initVoiceName = (voiceName: string) =>
	voiceName
		.replace(/男[性]*/g, "Male")
		.replace(/女[性]*/g, "Female")
		.replace(/儿童/g, "Child")
		.replace(/中性/g, "Neutral");

export const cleanMarkup = (md: string) => {
	let output = md || "";

	// Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
	output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*/gm, "");

	output = output
		// Remove HTML tags
		.replace(/<[^>]*>/g, "");

	output = output
		// Remove HTML tags
		.replace(/<[^>]*>/g, "")
		// Remove setext-style headers
		.replace(/^[=-]{2,}\s*$/g, "")
		// Remove footnotes?
		.replace(/\[\^.+?\](: .*?$)?/g, "")
		.replace(/\s{0,2}\[.*?\]: .*?$/g, "")
		// Remove images
		.replace(/!\[(.*?)\][[(].*?[\])]/g, "$1")
		// Remove inline links
		.replace(/\[([^\]]*?)\][[(].*?[\])]/g, "$1")
		// Remove blockquotes
		.replace(/^(\n)?\s{0,3}>\s?/gm, "$1")
		// .replace(/(^|\n)\s{0,3}>\s?/g, '\n\n')
		// Remove reference-style links?
		.replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "")
		// Remove atx-style headers
		.replace(
			/^(\n)?\s{0,}#{1,6}\s*( (.+))? +#+$|^(\n)?\s{0,}#{1,6}\s*( (.+))?$/gm,
			"$1$3$4$6"
		)
		// Remove * emphasis
		.replace(/([*]+)(\S)(.*?\S)??\1/g, "$2$3")
		// Remove _ emphasis. Unlike *, _ emphasis gets rendered only if
		//   1. Either there is a whitespace character before opening _ and after closing _.
		//   2. Or _ is at the start/end of the string.
		.replace(/(^|\W)([_]+)(\S)(.*?\S)??\2($|\W)/g, "$1$3$4$5")
		// Remove code blocks
		.replace(/^```\w*$\n?/gm, "")
		// Remove inline code
		.replace(/`(.+?)`/g, "$1")
		// Replace strike through
		.replace(/~(.*?)~/g, "$1")
		// remove better bibtex citekeys
		.replace(/\[\s*@[\w,\s]+\s*\]/g, "")
		// remove criticmarkup comments
		.replace(/\{>>.*?<<\}/g, "");

	return output;
};
