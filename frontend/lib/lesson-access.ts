export function isLessonUnlocked(
  ids: string[],
  completed: string[],
  id: string,
): boolean {
  const index = ids.indexOf(id);
  return (
    index >= 0 &&
    ids.slice(0, index).every((previous) => completed.includes(previous))
  );
}
