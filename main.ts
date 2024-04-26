import { App, Editor, MarkdownView, Plugin, PluginSettingTab } from "obsidian";
import { generateNotice, generateNoticeText, generateSettings } from "./utils";
import { Popup } from "./Popup";
import type { ConfigurationType } from "./type";
interface Text2AudioSettings {
	key: string;
	region: string;
	directory: string;
}

const DEFAULT_SETTINGS: Record<ConfigurationType, string> = {
	key: "",
	region: "",
	directory: "",
};

const SETTINGS = [
	{
		name: "Speech Key",
		key: "key",
		desc: "Your Azure AI services API's secret key.",
		inputConfig: {
			placeholder: "Enter your secret key",
		},
	},
	{
		name: "Speech Region",
		key: "region",
		desc: "Your Azure AI services API's region.",
		inputConfig: {
			placeholder: "Enter your region",
		},
	},
	{
		name: "Directory",
		key: "directory",
		desc: "Save the audio file to this directory.",
		inputConfig: {
			placeholder: "Full path",
		},
	},
];

export default class Text2Audio extends Plugin {
	settings: Text2AudioSettings = DEFAULT_SETTINGS;
	notice = generateNotice();

	async onload() {
		await this.loadSettings();

		// 点击左侧icon，弹出modal，用于输入自定义内容进行转换
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Popup(this.app, this).open();
			}
		);

		// TODO: 在底部状态栏添加转换中的提示
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// 通过命令打开弹窗
		this.addCommand({
			id: "open-t2a-modal",
			name: "Open t2a modal",
			callback: () => {
				new Popup(this.app, this).open();
			},
		});
		// 将选中的内容填入弹窗中，进行转换
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// 获取选中文本
				const selectedText = editor.getSelection();
				// 打开弹窗
				new Popup(this.app, this).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
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
}

// 添加设置面板
class SampleSettingTab extends PluginSettingTab {
	plugin: Text2Audio;

	constructor(app: App, plugin: Text2Audio) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		SETTINGS.forEach((setting) => {
			generateSettings(containerEl, this.plugin, setting);
		});
	}
}
