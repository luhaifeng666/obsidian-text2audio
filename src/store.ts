import {
	AudioConfig,
	SpeechSynthesizer,
} from "microsoft-cognitiveservices-speech-sdk";

let audioConfig:
	| (AudioConfig & {
			privDestination?: any;
	  })
	| null;
let synthesizer: SpeechSynthesizer | null = null;

const actions = {
	setAudioConfig: (config: AudioConfig) => {
		audioConfig = config;
	},
	setSpeechSynthesizer: (data: SpeechSynthesizer | null) => {
		synthesizer = data;
	},
	clearAudioConfig: () => {
		audioConfig = null;
	},
	clearsynthesizer: () => {
		if (synthesizer) {
			synthesizer?.close();
			synthesizer = null;
		}
	},
	pause() {
		audioConfig && audioConfig.privDestination.privAudio.pause();
	},
	play() {
		audioConfig && audioConfig.privDestination.privAudio.play();
	},
	isPaused() {
		return audioConfig?.privDestination.privAudio.paused;
	},
};

export { audioConfig, actions };
