export const POINT_OPTIONS = [1, 2, 3, 5, 8, 13] as const;

export type PointValue = (typeof POINT_OPTIONS)[number];

export function isPointValue(value: unknown): value is PointValue {
  return (
    typeof value === "number" &&
    (POINT_OPTIONS as readonly number[]).includes(value)
  );
}
