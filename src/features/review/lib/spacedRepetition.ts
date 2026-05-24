export interface SpacedRepetitionUpdate {
  nextReps: number;
  daysToAdd: number;
}

export function getSpacedRepetitionUpdate(
  currentReps: number,
  isForgot: boolean,
): SpacedRepetitionUpdate {
  const nextReps = isForgot ? 0 : currentReps + 1;

  let daysToAdd = 1;
  if (!isForgot) {
    switch (currentReps) {
      case 0:
        daysToAdd = 2;
        break;
      case 1:
        daysToAdd = 4;
        break;
      case 2:
        daysToAdd = 7;
        break;
      case 3:
        daysToAdd = 15;
        break;
      case 4:
        daysToAdd = 30;
        break;
      case 5:
        daysToAdd = 60;
        break;
      case 6:
        daysToAdd = 0;
        break;
      default:
        daysToAdd = 60;
    }
  }

  return { nextReps, daysToAdd };
}
