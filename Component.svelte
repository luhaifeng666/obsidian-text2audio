<script lang="ts" module>
	import { generateVoice, generateNotice, generateNoticeText } from "./utils";
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

	// generateVoice(text, key, region, directory)
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

	const handleSave = () => {
		generateNotice().setMessage(
			generateNoticeText(
				`${JSON.stringify({
					text,
					key,
					filename,
					region: regionCode,
					filePath: directory,
					voice: `${region}-${voice}`,
				})}`,
				"success",
			),
		);
		generateVoice({
			text,
			key,
			filename,
			region: regionCode,
			filePath: directory,
			voice: `${region}-${voice}`,
		});
	};
</script>

<h2 class="ob-t2v-title">Text2Video - 文本转语音</h2>

<textarea
	class="ob-t2v-text"
	bind:value={convertedText}
	name="t2v-text"
	rows="10"
	placeholder="请输入需要转换的文本"
></textarea>

<div class="ob-t2v-box">
	语言
	<select on:change={handleLangChange} name="ob-t2v-languages">
		{#each LANGUAGES as lang}
			<option value={lang.region}>{lang.name}</option>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	语音
	<select on:change={handleVoiceChange} name="ob-t2v-voices">
		{#each voices as voice}
			<option value={voice}>{voice}</option>
		{/each}
	</select>
</div>

<div class="ob-t2v-box">
	文件名称
	<input type="text" placeholder="音频文件名称" bind:value={filename} />
</div>

<!-- TODO 添加转换格式 -->
<!-- <div class="ob-t2v-box">
	转换格式
	<select name="" id=""></select>
</div> -->

<div class="ob-t2v-footer">
	<button>播放</button>
	<button on:click={handleSave}>保存</button>
</div>

<style>
	.ob-t2v-title {
		text-align: center;
	}
	.ob-t2v-text {
		width: 100%;
		resize: none;
		margin-top: 10px;
	}
	.ob-t2v-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 10px 0;
	}
	.ob-t2v-box > input,
	.ob-t2v-box > select {
		width: 250px;
	}
	.ob-t2v-footer {
		text-align: right;
		padding-top: 10px;
		border-top: 1px solid #aaa;
		margin-top: 20px;
	}
	.ob-t2v-footer > button {
		color: #fff;
		cursor: pointer;
		width: 80px;
		font-size: 14px;
	}
	.ob-t2v-footer > button::before {
		content: "";
		display: block;
		width: 14px;
		height: 14px;
		background-repeat: no-repeat;
		background-position: center;
		background-size: cover;
		margin-right: 3px;
	}
	.ob-t2v-footer > button:first-child {
		background-color: #52c41a;
	}
	.ob-t2v-footer > button:last-child {
		background-color: #1677ff;
		margin-left: 8px;
	}
	.ob-t2v-footer > button:first-child::before {
		background-image: url(https://github.com/luhaifeng666/pics/assets/9375823/7208eed1-9280-459c-94f0-b9c21bddb073);
	}
	.ob-t2v-footer > button:last-child::before {
		background-image: url(https://github.com/luhaifeng666/pics/assets/9375823/035fd534-362b-4c6e-b895-b5e5aff617ba);
	}
</style>
