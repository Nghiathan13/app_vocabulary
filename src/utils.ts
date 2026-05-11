import { appConfigDir, join } from "@tauri-apps/api/path";

export const getAudioFileName = (word: string): string => {
  return word.toLowerCase().replace(/[\s/\\?%*:|"<>+]+/g, "_") + ".mp3";
};

export const getAudioPath = async (word: string): Promise<string> => {
  const configDir = await appConfigDir();
  const fileName = getAudioFileName(word);
  return await join(configDir, "audio", fileName);
};

/**
 * Returns a date string in YYYY-MM-DD format for local time.
 * @param daysToAdd Optional number of days to add to current date.
 */
export const getLocalDateString = (daysToAdd = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
};

export const formatDisplayDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
};
