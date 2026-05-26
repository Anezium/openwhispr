const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const DEFAULT_STT_MODEL = "scribe_v2";

function parseErrorMessage(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return (
    payload.detail?.message ||
    payload.detail?.status ||
    payload.message ||
    payload.error ||
    JSON.stringify(payload)
  );
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) return "";
  try {
    return parseErrorMessage(JSON.parse(text));
  } catch {
    return text;
  }
}

function resolveText(data) {
  if (data?.text) return data.text;
  if (!data?.transcripts || typeof data.transcripts !== "object") return "";

  return Object.values(data.transcripts)
    .map((entry) => entry?.text)
    .filter(Boolean)
    .join("\n");
}

async function transcribe({
  apiKey,
  audioBuffer,
  model,
  language,
  mimeType = "audio/webm",
  fileName = "audio.webm",
} = {}) {
  const cleanApiKey = String(apiKey || "").trim();
  if (!cleanApiKey) throw new Error("ElevenLabs API key not configured");
  if (!audioBuffer) throw new Error("No audio data provided");

  const formData = new FormData();
  formData.append("file", new Blob([Buffer.from(audioBuffer)], { type: mimeType }), fileName);
  formData.append("model_id", model || DEFAULT_STT_MODEL);
  formData.append("tag_audio_events", "false");
  formData.append("timestamps_granularity", "none");
  if (language && language !== "auto") {
    formData.append("language_code", language);
  }

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": cleanApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await readError(response);
    throw new Error(
      `ElevenLabs API Error: ${response.status}${message ? ` ${message}` : ""}`
    );
  }

  const data = await response.json();
  return {
    ...data,
    text: resolveText(data),
  };
}

module.exports = {
  DEFAULT_STT_MODEL,
  ELEVENLABS_STT_URL,
  transcribe,
};
