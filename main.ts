import { App, Editor, MarkdownView, Plugin, PluginSettingTab } from "obsidian";
import { generateSettings } from "./utils";
import { Popup } from "./Popup";
import { SETTINGS } from "./constants";
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

export default class Text2Audio extends Plugin {
	settings: Text2AudioSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// 点击左侧icon，弹出modal，用于输入自定义内容进行转换
		const ribbonIconEl = this.addRibbonIcon(
			"file-audio",
			"Text to Audio",
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
			id: "convert-t2a",
			name: "Convert text to audio",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// 获取选中文本
				const selectedText = editor.getSelection();
				// 打开弹窗
				new Popup(this.app, this, selectedText).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
