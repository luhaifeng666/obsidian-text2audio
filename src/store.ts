import { AudioConfig } from "microsoft-cognitiveservices-speech-sdk";

let audioConfig: AudioConfig | null;

const actions = {
	setAudioConfig: (config: AudioConfig) => {
		audioConfig = config;
	},
	clearAudioConfig: () => {
		audioConfig = null;
	},
	pause() {
		audioConfig && audioConfig.privDestination.privAudio.pause();
	},
	play() {
		audioConfig && audioConfig.privDestination.privAudio.play();
	},
};

export { audioConfig, actions };
