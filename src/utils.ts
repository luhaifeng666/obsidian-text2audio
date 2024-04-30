import sdk from "microsoft-cognitiveservices-speech-sdk";
import { Notice, Setting } from "obsidian";
import type { ConfigKeys, MessageType, SettingConfig } from "./type";

export const generateVoice = async (
  config: Record<ConfigKeys, string> & {
    callback?: () => void;
    type: "save" | "play";
  }
) => {
  return new Promise((resolve, reject) => {
    const { filename, text, key, region, filePath, voice, type, callback } =
      config;
    let synthesizer: sdk.SpeechSynthesizer | null = null;

    const synthesizerClear = () => {
      synthesizer?.close();
      synthesizer = null;
      callback && callback();
    };

    try {
      const audioFile = `${filePath}/${filename}.wav`;
      const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      let audioConfig;
      if (type === "save")
        audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

      // The language of the voice that speaks.
      speechConfig.speechSynthesisVoiceName = voice;

      // Create the speech synthesizer.
      synthesizer = new sdk.SpeechSynthesizer(
        speechConfig,
        ...(type === "save" ? [audioConfig] : [])
      );

      // Start the synthesizer and wait for a result.
      synthesizer.speakTextAsync(
        text,
        function (result) {
          let res = true;
          if (
            result.reason ===
            sdk.ResultReason.SynthesizingAudioCompleted
          ) {
            generateNotice().setMessage(
              generateNoticeText(
                `Synthesis finished. ${type === "save"
                  ? "File path is " + audioFile
                  : ""
                }`,
                "success"
              )
            );
          } else {
            generateNotice().setMessage(
              generateNoticeText(
                `Speech synthesis canceled, ${result.errorDetails}Did you set the speech resource key and region values?`,
                "error"
              )
            );
            res = false;
          }
          synthesizerClear();
          res ? resolve(res) : reject(res);
        },
        function (err) {
          generateNotice().setMessage(
            generateNoticeText(err, "error")
          );
          synthesizerClear();
          reject(false);
        }
      );
    } catch (e) {
      generateNotice().setMessage(generateNoticeText(`${e}`, "error"));
      synthesizerClear();
      reject(false);
    }
  });
};

/**
 * 提示对象
 * @param message
 * @returns
 */
export const generateNotice = (message?: string | DocumentFragment) =>
  new Notice(message || "");

/**
 * 生成提示信息
 * @param message
 * @param messageType
 * @returns
 */
export const generateNoticeText = (
  message: string,
  messageType: MessageType
): DocumentFragment => {
  const fragment = new DocumentFragment();
  const spanDom = document.createElement("span");
  spanDom.appendText(message);
  spanDom.className = `ob-t2v-${messageType}`;
  fragment.appendChild(spanDom);
  return fragment;
};

export const generateSettings = async (
  container: HTMLElement,
  plugin: any,
  config: SettingConfig
) => {
  const { inputConfig, desc, name, key, type, options } = config;
  const { placeholder, callback } = inputConfig || {};
  const settingEl = new Setting(container).setName(name).setDesc(desc);
  switch (type) {
    case "text":
      settingEl.addText((text) =>
        text
          .setPlaceholder(placeholder || "")
          .setValue(plugin.settings[key])
          .onChange(async (value) => {
            callback && callback(value);
            plugin.settings[key] = value;
            await plugin.saveSettings();
          })
      );
      break;

    case "select":
      settingEl.addDropdown((dp) =>
        dp
          .addOptions(options || {})
          .setValue(plugin.settings[key])
          .onChange(async (value) => {
            plugin.settings[key] = value;
            await plugin.saveSettings();
          })
      );
      break;

    default:
      break;
  }
};
