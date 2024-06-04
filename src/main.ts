import {
	App,
	Editor,
	Plugin,
	PluginSettingTab,
	Platform,
	Notice,
} from "obsidian";
import {
	renderSettings,
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
import { LANGUAGES, LANGS, SETTINGS_GROUP } from "./constants";
import type { SettingConfig, Text2AudioSettings } from "./type";
import { actions } from "./store";

const DEFAULT_SETTINGS: Text2AudioSettings = {
	keyHide: true,
	key: "",
	region: "",
	directory: "",
	interposition: false,
	readBeforeOrAfter: "off",
	autoStop: false,
	autoPause: false,
	textFormatting: "",
	speed: 1,
	intensity: 100,
	style: "advertisement_upbeat",
	// role: "Boy",
	language: "zh",
	volume: 50,
	enableDeveloperMode: false,
};

let notice: Notice;

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
							`${selectedText}<audio controls src="${Platform.resourcePathPrefix
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
					defaultFilename: `${this.app.workspace.getActiveFile()?.basename
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
					this.settings.readBeforeOrAfter,
					editor
				);
				selectedText && this.play(selectedText);
			},
		});

		this.addCommand({
			id: "t2a-controller",
			name: "Pause or resume the audio",
			callback() {
				actions.isPaused() ? actions.play() : actions.pause();
			},
		});

		this.addCommand({
			id: "t2a-stop",
			name: "Stop conversion",
			callback: () => {
				this.stop();
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, _, markdownView) => {
				const selectedText = getSelectedText(
					this.settings.readBeforeOrAfter,
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
				this.settings.autoPause && actions.pause();
				this.settings.autoStop && this.stop();
			})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Text2AudioSettingTab(this.app, this));
	}

	onunload() { }

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

	stop() {
		notice && notice.hide();
		actions.clearsynthesizer();
		this.convertting = false;
	}

	async play(text: string) {
		// 阅读文本
		if (!this.convertting) {
			this.convertting = true;
			const { textFormatting, language, enableDeveloperMode } = this.settings;
			const regionCode: string =
				getLocalData("region") || LANGUAGES[0].region;
			const voices: string[] =
				getVoices(regionCode) || LANGUAGES[0].voices;
			const voice: string = getLocalData("voice") || voices[0];
			notice = generateNotice(
				generateNoticeText(LANGS[language].convertting, "warning"),
				0
			);
			await generateVoice({
				type: "play",
				text: enableDeveloperMode ? handleTextFormat(text, textFormatting) : text,
				regionCode,
				voice: `${regionCode}-${getVoiceName(voice)}`,
				settings: this.settings,
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
		renderSettings(
			this.containerEl,
			this.plugin
		);
	}
}
