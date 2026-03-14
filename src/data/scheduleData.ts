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

export const CLASSES: ClassBlock[] = [
  {
    name: '计量经济学',
    startHour: 9,  startMin: 0,
    endHour: 11,   endMin: 0,
    color: 'hsl(48 100% 50%)',
    campus: '复旦·北区',
    campusCoords: [121.502, 31.303],
  },
  {
    name: '市场营销',
    startHour: 11, startMin: 0,
    endHour: 12,   endMin: 30,
    color: 'hsl(27 100% 50%)',
    campus: '复旦·管院',
    campusCoords: [121.513, 31.301],
  },
  {
    name: '公司金融',
    startHour: 14, startMin: 0,
    endHour: 15,   endMin: 50,
    color: 'hsl(48 80% 45%)',
    campus: '上财·武东路',
    campusCoords: [121.503, 31.294],
  },
];

export const CURRENT_HOUR = 12;
export const CURRENT_MIN  = 15;

const curMins = () => CURRENT_HOUR * 60 + CURRENT_MIN;

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
