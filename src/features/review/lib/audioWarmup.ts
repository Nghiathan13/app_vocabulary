export const SILENT_WARMUP_SECONDS = 0.2;
export const SILENT_WARMUP_SAMPLE_RATE = 8000;

export const createSilentWarmupUrl = (): string => {
  const sampleCount = Math.ceil(
    SILENT_WARMUP_SAMPLE_RATE * SILENT_WARMUP_SECONDS,
  );
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SILENT_WARMUP_SAMPLE_RATE, true);
  view.setUint32(28, SILENT_WARMUP_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
};
