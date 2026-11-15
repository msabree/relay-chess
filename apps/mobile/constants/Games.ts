export const TIMER_OPTIONS = [
  {
    time: '5,3',
    type: 'Blitz',
  },
  {
    time: '10,0',
    type: 'Rapid',
  },
  {
    time: '10,3',
    type: 'Rapid',
  },
  {
    time: '0,0',
    type: 'Untimed',
  },
];



// BOARD COLORS (same as web)
export const BOARD_COLOR_SCHEMES = [
  { value: 'slate', label: 'Slate', dark: '#7E95A3', light: '#DCE1E4' },
  { value: 'blue-white', label: 'Blue', dark: '#60688e', light: '#d3d7ec' },
  { value: 'green-white', label: 'Green', dark: '#659f64', light: '#e5eae7' },
  { value: 'red-white', label: 'Red', dark: '#9f2b2b', light: '#d4c3c3' },
];

/** Public and team queues: one timed, one casual, so the small pool isn't split. */
export const QUEUE_TIMER_OPTIONS = [
  { time: '5,5', type: 'Blitz' },
  { time: '0,0', type: 'Casual' },
];

export const timerLabel = (time: string, untimed = 'No clock') =>
  time === '0,0' ? untimed : `${time.split(',')[0]} + ${time.split(',')[1]}`;
