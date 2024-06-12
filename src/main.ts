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
	initVoiceName,
	getAudioFormatType,
} from "./utils";
import { Popup } from "./Popup";
import {
	LANGUAGES,
	LANGS,
	VOICE_FORMAT_NAMES,
	VOICE_FORMAT_MAP,
} from "./constants";
import type { Text2AudioSettings } from "./type";
import { actions } from "./store";

const DEFAULT_LANGUAGE_TYPE = getLocalData("region") || LANGUAGES[0].region;
const DEFAULT_SETTINGS: Text2AudioSettings = {
	keyHide: true,
	key: "",
	region: "",
	regionCode: "",
	directory: "",
	interposition: false,
	readBeforeOrAfter: "off",
	autoStop: false,
	autoPause: false,
	textFormatting: "",
	speed: 1,
	intensity: 100,
	style: "advertisement_upbeat",
	role: "Boy",
	language: "zh",
	volume: 50,
	enableDeveloperMode: false,
	languageType:
		LANGUAGES.find((lang) => lang.region === DEFAULT_LANGUAGE_TYPE)?.[
			"name-en"
		] || "",
	voiceType: initVoiceName(
		getLocalData("voice") ||
			(getVoices(DEFAULT_LANGUAGE_TYPE) || LANGUAGES[0].voices)[0]
	),
	audioFormat: getLocalData("audioFormat") || VOICE_FORMAT_NAMES[0],
};

let notice: Notice;

export default class Text2Audio extends Plugin {
	settings: Text2AudioSettings = DEFAULT_SETTINGS;
	convertting = false;
	filename = "";

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
				// 打开弹窗
				new Popup({
					app: this.app,
					plugin: this,
					selectedText,
					onSave: (url: string) => {
						this.onSave(editor, selectedText, url);
					},
					defaultFilename: this.getDefaultFileName(),
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

		this.addCommand({
			id: "save-t2a",
			name: "Convert text to speech and save it",
			editorCallback: async (editor: Editor) => {
				const { directory, audioFormat } = this.settings;
				// 获取选中文本
				const selectedText = getSelectedText(
					this.settings.readBeforeOrAfter,
					editor
				);
				if (selectedText) {
					await this.play(selectedText, "save");
					this.onSave(
						editor,
						selectedText,
						`${directory}/${this.filename}.${getAudioFormatType(
							audioFormat
						)}`
					);
					this.filename = "";
				}
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

	onunload() {}

	// 将保存的音频插入光标所在位置
	onSave(editor: Editor, selectedText: string, url: string) {
		const lastLine = editor.lastLine();
		this.settings.interposition &&
			editor.replaceSelection(
				`${
					editor.getSelection() ? selectedText : "" // 选中文本之后才做替换
				}<audio controls src="${
					Platform.resourcePathPrefix
				}${encodeURIComponent(url)}" />`
			);
		editor.setCursor(lastLine + 1, 0);
	}

	getDefaultFileName() {
		return `${
			this.app.workspace.getActiveFile()?.basename
		}_${getDefaultFiletime()}`;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	saveSettingForPopup(config: Partial<Text2AudioSettings>) {
		this.settings = {
			...this.settings,
			...config,
		};
		this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	stop() {
		notice && notice.hide();
		actions.clearsynthesizer();
		this.convertting = false;
	}

	async play(text: string, type: "play" | "save" = "play") {
		// 阅读文本
		if (!this.convertting) {
			this.filename = this.getDefaultFileName();
			this.convertting = true;
			const {
				textFormatting,
				language,
				enableDeveloperMode,
				regionCode,
				voiceType,
				audioFormat,
			} = this.settings;
			const voices: string[] =
				getVoices(regionCode) || LANGUAGES[0].voices;
			const voice: string = voiceType || voices[0];
			notice = generateNotice(
				generateNoticeText(LANGS[language].convertting, "warning"),
				0
			);
			await generateVoice({
				type,
				text: enableDeveloperMode
					? handleTextFormat(text, textFormatting)
					: text,
				regionCode: regionCode || LANGUAGES[0].region,
				voice: `${regionCode}-${getVoiceName(voice)}`,
				settings: this.settings,
				filename: this.filename,
				audioFormatType: getAudioFormatType(audioFormat),
				audioFormat:
					VOICE_FORMAT_MAP[
						audioFormat as keyof typeof VOICE_FORMAT_MAP
					],
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
		renderSettings(this.containerEl, this.plugin);
	}
}
