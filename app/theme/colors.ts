// Haven palette — calm, paper-feeling. Mirrors tailwind.config.js.
export const colors = {
  cream: '#F6F1E8',
  cream2: '#FAF6EE',
  paper: '#FFFFFF',
  ink: '#1A1A17',
  ink2: '#3A372F',
  muted: '#8B847A',
  muted2: '#B5AFA3',
  line: 'rgba(26,26,23,0.08)',
  line2: 'rgba(26,26,23,0.14)',

  sage: '#2E6859',
  sage2: '#3D7A6B',
  sageTint: '#E4ECE6',
  sageTint2: '#D2DFD7',

  terra: '#C97B5C',
  terraTint: '#F4E4D9',

  brick: '#B8463A',
  brick2: '#9E3A30',
  brickTint: '#F4DDD8',
  brickDeep: '#5C211C',

  amber: '#C89647',
  amberTint: '#F4E7CC',
  amberInk: '#7E5E1F',

  success: '#6A8E5A',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;
