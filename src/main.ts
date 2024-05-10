/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2024-05-01 03:05:47
 * @LastEditors: luhaifeng666 youzui@hotmail.com
 * @LastEditTime: 2024-05-10 01:27:52
 * @Description:
 */
import { App, Editor, Plugin, PluginSettingTab } from "obsidian";
import { generateSettings } from "./utils";
import { Popup } from "./Popup";
import { SETTINGS } from "./constants";
import type { SettingConfig } from "./type";
interface Text2AudioSettings {
	key: string;
	region: string;
	directory: string;
	interposition: boolean;
	language: "zh" | "en";
}

const DEFAULT_SETTINGS: Text2AudioSettings = {
	key: "",
	region: "",
	directory: "",
	interposition: false,
	language: "zh",
};

export default class Text2Audio extends Plugin {
	settings: Text2AudioSettings = DEFAULT_SETTINGS;

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
							`${selectedText}<audio controls src="file:///${encodeURIComponent(
								url
							)}" />`
						);
					editor.setCursor(lastLine + 1, 0);
				};
				// 打开弹窗
				new Popup(this.app, this, selectedText, onSave).open();
			},
		});

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

		SETTINGS.forEach((setting) => {
			generateSettings(
				containerEl,
				this.plugin,
				setting as SettingConfig
			);
		});
	}
}
