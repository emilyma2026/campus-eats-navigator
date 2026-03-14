export interface ClassBlock {
  name: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  color: string;
  campus: string;
  campusCoords: [number, number];
}

// All classes anchored at Fudan Handan / Guanyuan Campus
const FUDAN: [number, number] = [121.5132, 31.2995];

export const CLASSES: ClassBlock[] = [
  {
    name: '计量经济学',
    startHour: 9,  startMin: 0,
    endHour:   11, endMin:   0,
    color: 'hsl(48 100% 50%)',
    campus: '复旦·邯郸',
    campusCoords: FUDAN,
  },
  {
    name: '市场营销',
    startHour: 11, startMin: 0,
    endHour:   12, endMin:   30,
    color: 'hsl(27 100% 50%)',
    campus: '复旦·管院',
    campusCoords: FUDAN,
  },
  {
    name: '公司金融',
    startHour: 14, startMin: 0,
    endHour:   15, endMin:   50,
    color: 'hsl(48 80% 45%)',
    campus: '复旦·邯郸',
    campusCoords: FUDAN,
  },
];

// ── Real-time clock (updates on every call) ──────────────────────────────────
function curMins(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// ── Basic helpers ─────────────────────────────────────────────────────────────

export function getActiveClass(): ClassBlock | undefined {
  const cur = curMins();
  return CLASSES.find(
    (c) => c.startHour * 60 + c.startMin <= cur && cur < c.endHour * 60 + c.endMin,
  );
}

export function getNextClass(): ClassBlock | undefined {
  const cur = curMins();
  return CLASSES.find((c) => c.startHour * 60 + c.startMin > cur);
}

export function minsUntilEnd(cls: ClassBlock): number {
  return cls.endHour * 60 + cls.endMin - curMins();
}

export function minsUntilStart(cls: ClassBlock): number {
  return cls.startHour * 60 + cls.startMin - curMins();
}

// ── Rich class-status for dynamic copy ───────────────────────────────────────

export type ClassStatusType = 'in_class' | 'next_class' | 'done';

export interface ClassStatus {
  type: ClassStatusType;
  courseName?: string;
  /** Minutes remaining until class ends (in_class only) */
  timeLeft?: number;
  /** Minutes until next class starts (next_class only) */
  timeUntil?: number;
}

/**
 * Returns the current schedule state based on real system time.
 *
 * in_class  → "当前 [name] 还有 [N] 分钟下课"
 * next_class → "下一节 [name] 还有 [N] 分钟上课"
 * done       → "今日课程已结束"
 */
export function getClassStatus(): ClassStatus {
  const cur = curMins();

  const active = CLASSES.find(
    (c) => c.startHour * 60 + c.startMin <= cur && cur < c.endHour * 60 + c.endMin,
  );
  if (active) {
    return {
      type: 'in_class',
      courseName: active.name,
      timeLeft: active.endHour * 60 + active.endMin - cur,
    };
  }

  const next = CLASSES.find((c) => c.startHour * 60 + c.startMin > cur);
  if (next) {
    return {
      type: 'next_class',
      courseName: next.name,
      timeUntil: next.startHour * 60 + next.startMin - cur,
    };
  }

  return { type: 'done' };
}
