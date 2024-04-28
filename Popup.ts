import { App, Modal } from "obsidian";
import Component from "./Component.svelte";
import type Text2Audio from "./main";

export class Popup extends Modal {
	component: Component | null = null;
	plugin: Text2Audio;
	text: string;
	constructor(app: App, plugin: Text2Audio, selectedText = "") {
		super(app);
		this.plugin = plugin;
		this.text = selectedText;
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
			},
		});
	}

	onClose() {
		this.component?.$destroy();
	}
}
