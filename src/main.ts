/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2024-05-01 03:05:47
 * @LastEditors: luhaifeng666 youzui@hotmail.com
 * @LastEditTime: 2024-05-16 23:54:46
 * @Description:
 */
import { App, Editor, Plugin, PluginSettingTab, Platform } from "obsidian";
import {
	generateSettings,
	generateVoice,
	getVoiceName,
	getLocalData,
	getVoices,
	generateNotice,
	generateNoticeText,
	handleTextFormat,
	getDefaultFiletime,
	getSelectedText,
} from "./utils";
import { Popup } from "./Popup";
import { SETTINGS, LANGUAGES, LANGS } from "./constants";
import type { SettingConfig, Text2AudioSettings } from "./type";
import { actions } from "./store";

const DEFAULT_SETTINGS: Text2AudioSettings = {
	key: "",
	region: "",
	directory: "",
	interposition: false,
	readPrevious: false,
	autoStop: false,
	textFormatting: "",
	language: "zh",
};

export default class Text2Audio extends Plugin {
	settings: Text2AudioSettings = DEFAULT_SETTINGS;
	convertting = false;

	async onload() {
		await this.loadSettings();

		// 点击左侧icon，弹出modal，用于输入自定义内容进行转换
		this.addRibbonIcon("file-audio", "Text to Audio", () => {
			// @ts-ignore
			this.app.commands.executeCommandById("text2audio:convert-t2a");
		});

		// 将选中的内容填入弹窗中，进行转换
		this.addCommand({
			id: "convert-t2a",
			name: "Convert text to audio",
			editorCallback: (editor: Editor) => {
				// 获取选中文本
				const selectedText = editor.getSelection();
				// 将保存的音频插入光标所在位置
				const onSave = (url: string) => {
					const lastLine = editor.lastLine();
					this.settings.interposition &&
						editor.replaceSelection(
							`${selectedText}<audio controls src="${
								Platform.resourcePathPrefix
							}${encodeURIComponent(url)}" />`
						);
					editor.setCursor(lastLine + 1, 0);
				};
				// 打开弹窗
				new Popup({
					app: this.app,
					plugin: this,
					selectedText,
					onSave,
					defaultFilename: `${
						this.app.workspace.getActiveFile()?.basename
					}_${getDefaultFiletime()}`,
				}).open();
			},
		});

		this.addCommand({
			id: "convert-t2s",
			name: "Convert text to speech",
			editorCallback: (editor: Editor) => {
				// 获取选中文本
				const selectedText = getSelectedText(
					this.settings.readPrevious,
					editor
				);
				selectedText && this.play(selectedText);
			},
		});

		this.addCommand({
			id: "t2a-pause",
			name: "Pause the audio",
			callback() {
				actions.pause();
			},
		});

		this.addCommand({
			id: "t2a-resume",
			name: "Resume the audio",
			callback() {
				actions.play();
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, _, markdownView) => {
				const selectedText = getSelectedText(
					this.settings.readPrevious,
					markdownView?.editor
				);
				selectedText.toString().replace(/\s/g, "").length > 0 &&
					menu.addItem((item) => {
						item.setTitle("Read the selected text")
							.setIcon("audio-file")
							.onClick(() => {
								selectedText && this.play(selectedText);
							});
					});
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				if (this.settings.autoStop) {
					actions.pause();
					actions.clearAudioConfig();
				}
			})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Text2AudioSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async play(text: string) {
		// 阅读文本
		if (!this.convertting) {
			this.convertting = true;
			const { key, region, textFormatting, language } = this.settings;
			const regionCode: string =
				getLocalData("region") || LANGUAGES[0].region;
			const voices: string[] =
				getVoices(regionCode) || LANGUAGES[0].voices;
			const voice: string = getLocalData("voice") || voices[0];
			const notice = generateNotice().setMessage(
				generateNoticeText(LANGS[language].convertting, "warning")
			);
			generateVoice({
				type: "play",
				text: handleTextFormat(text, textFormatting),
				key,
				region,
				lang: language,
				voice: `${regionCode}-${getVoiceName(voice)}`,
				callback: () => {
					notice.hide();
					this.convertting = false;
				},
			});
		}
	}
}

// 添加设置面板
class Text2AudioSettingTab extends PluginSettingTab {
	plugin: Text2Audio;

	constructor(app: App, plugin: Text2Audio) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		SETTINGS.filter((setting) =>
			Platform.isDesktopApp
				? !!setting
				: !["interposition", "directory"].includes(setting.key)
		).forEach((setting) => {
			generateSettings(
				containerEl,
				this.plugin,
				setting as SettingConfig
			);
		});
	}
}
