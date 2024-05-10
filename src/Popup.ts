/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2024-05-01 03:05:47
 * @LastEditors: luhaifeng666 youzui@hotmail.com
 * @LastEditTime: 2024-05-10 00:52:14
 * @Description:
 */
import { App, Modal } from "obsidian";
import Component from "./Component.svelte";
import type Text2Audio from "./main";

export class Popup extends Modal {
	component: Component | null = null;
	plugin: Text2Audio;
	text: string;
	onSave: (url: string) => void;
	constructor(
		app: App,
		plugin: Text2Audio,
		selectedText = "",
		onSave: (url: string) => void
	) {
		super(app);
		this.plugin = plugin;
		this.text = selectedText;
		this.onSave = onSave;
	}

	onOpen() {
		const { key, region, directory, language } = this.plugin.settings;
		this.component = new Component({
			target: this.contentEl,
			props: {
				text: this.text,
				key,
				regionCode: region,
				directory,
				language,
				onSave: this.onSave,
			},
		});
	}

	onClose() {
		this.component?.$destroy();
	}
}
