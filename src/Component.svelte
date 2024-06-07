<script lang="ts" module>
	import {
		generateVoice,
		getVoiceName,
		getVoices,
		handleTextFormat,
		getAudioFormatType,
		initVoiceName,
	} from "./utils";
	import {
		LANGUAGES,
		LANGS,
		VOICE_FORMAT_MAP,
		VOICE_FORMAT_NAMES,
	} from "./constants";
	import { Platform } from "obsidian";

	export let text: string; // 需要转换的文本
	export let onSave: (url: string) => void;
	export let defaultFilename: string;
	export let plugin;
	let regionCode: string = plugin.settings.regionCode || LANGUAGES[0].region;
	let voices: string[] = getVoices(regionCode) || LANGUAGES[0].voices;
	let voice: string =
		voices.find((vItem) =>
			vItem.includes(getVoiceName(plugin.settings.voiceType)),
		) || voices[0];
	let audioFormat: string =
		plugin.settings.audioFormat || VOICE_FORMAT_NAMES[0];
	let convertedText: string = text;
	let filename: string = "";
	let loading: boolean = false;
	const isMobile: boolean = !Platform.isDesktopApp;
	$: playBtnDisabled = loading || !convertedText.replace(/\s/g, "");
	$: lang = LANGS[plugin.settings.language as "zh" | "en"];
	const handleLangChange = (event: Event) => {
		const selectElement = event.target as HTMLSelectElement;
		regionCode = selectElement.value;
		voices =
			LANGUAGES.find((lang) => lang.region === selectElement.value)
				?.voices || [];
		voice = voices[0];
		// 保存设置
		plugin.saveSettingForPopup({
			regionCode,
			voiceType: initVoiceName(voice),
			languageType: LANGUAGES.find(
				(item) => item.region === regionCode,
			)?.["name-en"],
		});
	};

	const handleVoiceChange = (event: Event) => {
		const selectElement = event.target as HTMLSelectElement;
		voice = selectElement.value;
		plugin.saveSettingForPopup({
			voiceType: initVoiceName(voice),
		});
	};

	const handleAudioFormatChange = (event: Event) => {
		const selectElement = event.target as HTMLSelectElement;
		audioFormat = selectElement.value;
		plugin.saveSettingForPopup({
			audioFormat: selectElement.value,
		});
	};

	const handleVoiceGeneration = async (type: "save" | "play") => {
		loading = true;
		const { textFormatting, enableDeveloperMode } = plugin.settings;
		await generateVoice({
			text: enableDeveloperMode
				? handleTextFormat(convertedText, textFormatting)
				: convertedText,
			filename: filename || defaultFilename,
			regionCode,
			voice: `${regionCode}-${getVoiceName(voice)}`,
			type,
			audioFormatType: getAudioFormatType(audioFormat),
			audioFormat:
				VOICE_FORMAT_MAP[audioFormat as keyof typeof VOICE_FORMAT_MAP],
			settings: plugin.settings,
			callback() {
				loading = false;
			},
		});
	};

	const handlePlay = () => {
		handleVoiceGeneration("play");
	};

	const handleSave = async () => {
		await handleVoiceGeneration("save");
		onSave(
			`${plugin.settings.directory}/${filename || defaultFilename}.${getAudioFormatType(audioFormat)}`,
		);
	};
</script>

<h2 class="ob-t2v-title">
	<img
		alt="icon"
		src="data:image/png;base64,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"
	/>
</h2>

<textarea
	class="ob-t2v-text"
	bind:value={convertedText}
	readonly={loading}
	name="t2v-text"
	rows="10"
	placeholder={lang.textAreaPlaceholder}
></textarea>

<div class="ob-t2v-box">
	<span class="ob-t2v-lang">{lang.langType}</span>
	<select
		disabled={loading}
		on:change={handleLangChange}
		bind:value={regionCode}
		name="ob-t2v-languages"
	>
		{#each LANGUAGES as lang}
			<option value={lang.region}
				>{lang[
					plugin.settings.language === "en" ? "name-en" : "name"
				]}</option
			>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	<span class="ob-t2v-voice">{lang.voiceType}</span>
	<select
		disabled={loading}
		on:change={handleVoiceChange}
		bind:value={voice}
		name="ob-t2v-voices"
	>
		{#each voices as voice}
			<option value={voice}
				>{plugin.settings.language === "en"
					? initVoiceName(voice)
					: voice}</option
			>
		{/each}
	</select>
</div>

{#if !isMobile}
	<div class="ob-t2v-box">
		<span class="ob-t2v-audio-format">{lang.audioFormat}</span>
		<select
			disabled={loading}
			on:change={handleAudioFormatChange}
			bind:value={audioFormat}
			name="ob-t2v-voice-formats"
		>
			{#each VOICE_FORMAT_NAMES as format}
				<option value={format}>{format}</option>
			{/each}
		</select>
	</div>

	<div class="ob-t2v-box">
		<span class="ob-t2v-filename">{lang.filename}</span>
		<input
			type="text"
			placeholder={lang.filenamePlaceholder}
			bind:value={filename}
			readonly={loading}
		/>
	</div>
{/if}

<div class="ob-t2v-footer">
	{#if loading}
		<div class="ob-t2v-loading">
			<span></span><span></span><span></span><span></span><span></span>
		</div>
	{/if}
	<div class="ob-t2v-operation">
		<button disabled={playBtnDisabled} on:click={handlePlay}>
			{lang.play}
		</button>
		{#if !isMobile}
			<button disabled={playBtnDisabled} on:click={handleSave}>
				{lang.save}
			</button>
		{/if}
	</div>
</div>
