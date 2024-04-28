<h1 align="center" ><img width="100" src="./assets/icon.png" ali /></h1>

This is a Text to Audio for [Obsidian](https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

## Prerequisites

Before you start using this plug-in, you need to [apply for Microsoft's text-to-speech service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-text-to-speech).

## Settings

You can config the plugin by following steps.

- Open **Preferences** in Obsidian.
- In the side menu, click **Text2Audio**.
- Fill in `Speech key`, `Speech Region` and `Directory` content.Among them, you can refer to [this document](https://learn.microsoft.com/en-us/azure/ai-services/multi-service-resource?pivots=azportal&tabs=macos#get-the-keys-for-your-resource) to obtain `Speech key` and `Speech Region`.

## How to use

### Use directly

- Click the `Text to Audio` icon in the left side menu, or click the command icon in the left side menu and select the command named **Text2Audio: Open t2a modal** to open the modal.
- Enter the text and select the language that you wanna convert to.
- Click the play or save button.

### Convert the selected text

This plugin also supports convert the selected text.

### Set hotkeys

You can also set hotkey for the **Translator: translate** command.

- Open **Preferences** in Obsidian.
- Click the **Community plugins** in the side menu.
- Click the **Hotkeys icon** next to the information of the **Text2Audio** plugin.
