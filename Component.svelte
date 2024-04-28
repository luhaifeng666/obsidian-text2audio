<script lang="ts" module>
	import { generateVoice } from "./utils";
	import { LANGUAGES, LANGS } from "./constants";

	export let directory: string;
	export let text: string; // 需要转换的文本
	export let key: string;
	export let regionCode: string;
	export let language: "zh" | "en";
	let region: string = LANGUAGES[0].region;
	let voices: string[] = LANGUAGES[0].voices;
	let voice: string = getVoiceName(voices[0]);
	let convertedText: string = text;
	let filename: string = "";
	let loading: boolean = false;
	$: playBtnDisabled = loading || !convertedText.replace(/\s/g, "");
	$: saveBtnDisabled = playBtnDisabled || !filename;
	$: lang = LANGS[language];

	function getVoiceName(voice: string) {
		return voice.replace(/\(.*\)/g, "");
	}

	const handleLangChange = (event: Event) => {
		const selectElement = event.target as HTMLSelectElement;
		region = selectElement.value;
		voices =
			LANGUAGES.find((lang) => lang.region === selectElement.value)
				?.voices || [];
		voice = getVoiceName(voices[0]);
	};

	const handleVoiceChange = (event: Event) => {
		const selectElement = event.target as HTMLSelectElement;
		voice = getVoiceName(selectElement.value);
	};

	const handleVoiceGeneration = async (type: "save" | "play") => {
		loading = true;
		await generateVoice({
			text: convertedText,
			key,
			filename,
			region: regionCode,
			filePath: directory,
			voice: `${region}-${voice}`,
			type,
			callback() {
				loading = false;
			},
		});
	};

	const handlePlay = () => {
		handleVoiceGeneration("play");
	};

	const handleSave = () => {
		handleVoiceGeneration("save");
	};
</script>

<h2 class="ob-t2v-title">
	<img
		src="https://raw.githubusercontent.com/luhaifeng666/pics/main/icon.png"
		alt="t2a-icon"
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
		name="ob-t2v-languages"
	>
		{#each LANGUAGES as lang}
			<option value={lang.region}
				>{lang[language === "en" ? "name-en" : "name"]}</option
			>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	<span class="ob-t2v-voice">{lang.voiceType}</span>
	<select
		disabled={loading}
		on:change={handleVoiceChange}
		name="ob-t2v-voices"
	>
		{#each voices as voice}
			<option value={voice}
				>{language === "en"
					? voice
							.replace(/男[性]*/g, "Male")
							.replace(/女[性]*/g, "Female")
							.replace(/儿童/g, "Child")
					: voice}</option
			>
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

<!-- TODO 添加转换格式 -->
<!-- <div class="ob-t2v-box">
	转换格式
	<select name="" id=""></select>
</div> -->

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
		<button disabled={saveBtnDisabled} on:click={handleSave}>
			{lang.save}
		</button>
	</div>
</div>
