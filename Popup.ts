import { App, Modal } from "obsidian";
import Component from "./Component.svelte";
import type Text2Audio from "./main";

export class Popup extends Modal {
	component: Component;
	plugin: Text2Audio;
	constructor(app: App, plugin: Text2Audio) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { key, region, directory } = this.plugin.settings;
		this.component = new Component({
			target: this.contentEl,
			props: {
				text: "",
				key,
				region,
				directory,
			},
		});
	}

	onClose() {
		this.component.$destroy();
	}
}
