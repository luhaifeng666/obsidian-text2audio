<script lang="ts" module>
	import { generateVoice } from "./utils";
	import { LANGUAGES } from "./constants";

	export let directory: string;
	export let text: string; // 需要转换的文本
	export let key: string;
	export let regionCode: string;
	let region: string = LANGUAGES[0].region;
	let voices: string[] = LANGUAGES[0].voices;
	let voice: string = getVoiceName(voices[0]);
	let convertedText: string = text;
	let filename: string = "";
	let loading: boolean = false;
	$: playBtnDisabled = loading || !convertedText.replace(/\s/g, "");
	$: saveBtnDisabled = playBtnDisabled || !filename;

	function getVoiceName(voice: string) {
		return voice.replace(/\(.*\)/g, "");
	}

	const handleLangChange = (data) => {
		region = data.target.value;
		voices =
			LANGUAGES.find((lang) => lang.region === data.target.value)
				?.voices || [];
		voice = getVoiceName(voices[0]);
	};

	const handleVoiceChange = (data) => {
		voice = getVoiceName(data.target.value);
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
	placeholder="请输入需要转换的文本"
></textarea>

<div class="ob-t2v-box">
	语言种类
	<select
		disabled={loading}
		on:change={handleLangChange}
		name="ob-t2v-languages"
	>
		{#each LANGUAGES as lang}
			<option value={lang.region}>{lang.name}</option>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	语音类型
	<select
		disabled={loading}
		on:change={handleVoiceChange}
		name="ob-t2v-voices"
	>
		{#each voices as voice}
			<option value={voice}>{voice}</option>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	文件名称
	<input
		type="text"
		placeholder="音频文件名称，保存时必填"
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
		<button disabled={playBtnDisabled} on:click={handlePlay}>播放</button>
		<button disabled={saveBtnDisabled} on:click={handleSave}>保存</button>
	</div>
</div>
