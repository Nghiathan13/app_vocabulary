export interface SpacedRepetitionUpdate {
  nextLevel: number;
  nextWrongCount: number;
  daysToAdd: number;
}

export function getDaysForLevel(level: number): number {
  switch (level) {
    case 0:
      return 2;
    case 1:
      return 4;
    case 2:
      return 7;
    case 3:
      return 15;
    case 4:
      return 30;
    case 5:
      return 60;
    case 6:
      return 0;
    default:
      return 60;
  }
}

export function getSpacedRepetitionUpdate(
  currentLevel: number,
  currentWrongCount: number,
  isForgot: boolean,
): SpacedRepetitionUpdate {
  if (isForgot) {
    const nextLevel = Math.max(0, currentLevel - 2);
    const daysToAdd =
      nextLevel === 0 ? 1 : getDaysForLevel(nextLevel - 1);

    return {
      nextLevel,
      nextWrongCount: currentWrongCount + 1,
      daysToAdd,
    };
  }

  return {
    nextLevel: currentLevel + 1,
    nextWrongCount: 0,
    daysToAdd: getDaysForLevel(currentLevel),
  };
}
