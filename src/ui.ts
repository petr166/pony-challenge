import inquirer, { QuestionCollection } from 'inquirer';
import { DIFFICULTY, HEIGHT, PONY_NAME, WIDTH } from './config';

import { getAvailableRoute } from './mechanics';
import { CreateMazeData } from './ponyApi';

const CELL_CHAR_COUNT = 4;

/** Calculate maze print char index for given cell position, e.g. where 'P' would sit
 * @param pos - cell position
 * @param mazeWidth - maze width
 * @returns char index
 */
const getMazeCharIndexForPos = (pos: number, mazeWidth: number): number => {
  const lineCharCount = CELL_CHAR_COUNT * (mazeWidth + 1);
  const rowIndex = Math.floor(pos / mazeWidth);
  const res =
    CELL_CHAR_COUNT * (mazeWidth + pos + 1) + rowIndex * lineCharCount;

  return res;
};

type EnchanceMazePrintParams = {
  /** Maze print from API */
  mazePrint: string;
  /** Pony's route to display */
  route?: ReturnType<typeof getAvailableRoute>;
  /** Custom emoji for route cells */
  routeMoji?: string;
  mazeWidth: number;
};
/** Replace boring characters + optionally show pony's route on a API maze print */
export const enchanceMazePrint = ({
  mazePrint,
  route,
  mazeWidth,
  routeMoji = '✨',
}: EnchanceMazePrintParams) => {
  let formattedPrint = mazePrint;

  // display route
  if (route) {
    // split maze string in characters array
    const chars = formattedPrint.split('');

    route.forEach((move) => {
      // get char index for move position
      const index = getMazeCharIndexForPos(move.position, mazeWidth);

      // if not game indicator, replace char with route emoji
      if (!['E', 'P', 'D'].includes(chars[index])) {
        chars[index] = routeMoji;
        // remove next char, as emojis take space for 2ish
        chars[index + 1] = '';
      }
    });

    // recreate string
    formattedPrint = chars.join('');
  }

  // replace hot positions' indicators with emojis
  return formattedPrint
    .replace('D ', '😈')
    .replace('P ', '🦄')
    .replace('E ', '⛳️');
};

/** Print game header */
export const showHeader = () => {
  console.clear();
  console.log('\n\n🦄✨ Welcome to my Pony Challenge solution\n');
};

type ShowGameMenuParams = {
  /** play option callback */
  onPlay: () => any;
  /** settings option callback, pull changes */
  onSettingsChange: (data: CreateMazeData) => any;
  /** settings to display */
  currentSettings: CreateMazeData;
};
/** Print game Menu */
export const showGameMenu = async ({
  onPlay,
  onSettingsChange,
  currentSettings,
}: ShowGameMenuParams) => {
  showHeader();
  console.log('Current settings:', currentSettings, '\n');

  const questions: QuestionCollection = [
    {
      type: 'list',
      name: 'menu',
      message: 'Choose',
      choices: [
        { name: '🚀 Play', value: 'play' },
        { name: '🛠  Settings', value: 'settings' },
        { name: '🚪 Exit', value: 'exit' },
      ],
    },
  ];

  const answers = await inquirer.prompt(questions);

  switch (answers.menu) {
    case 'play':
      onPlay();
      break;
    case 'settings':
      showSettings()
        // update settings
        .then(onSettingsChange)
        .then((nextSettings) =>
          // show menu again
          showGameMenu({
            onPlay,
            onSettingsChange,
            currentSettings: nextSettings,
          })
        );
      break;
    default:
      console.log('\n👋 Bye!\n');
      process.exit();
  }
};

/** Print Settings prompt  */
export const showSettings = async (): Promise<CreateMazeData> => {
  showHeader();
  console.log('🛠  Settings\n');

  const questions: QuestionCollection = [
    {
      type: 'list',
      name: 'maze-player-name',
      message: 'Choose your pony name',
      default: PONY_NAME,
      choices: [
        PONY_NAME,
        'Twilight Sparkle',
        'Applejack',
        'Rainbow Dash',
        'Rarity',
      ],
    },
    {
      type: 'input',
      name: 'maze-width',
      message: 'Maze width (15-25)',
      default: WIDTH,
      validate: (value: number) => {
        const valid = !isNaN(value) && value >= 15 && value <= 25;
        return valid || 'Please enter a valid width';
      },
      filter: Number,
    },
    {
      type: 'input',
      name: 'maze-height',
      message: 'Maze height (15-25)',
      default: HEIGHT,
      validate: (value: number) => {
        const valid = !isNaN(value) && value >= 15 && value <= 25;
        return valid || 'Please enter a valid height';
      },
      filter: Number,
    },
    {
      type: 'input',
      name: 'difficulty',
      message: 'Difficulty (0-10)',
      default: DIFFICULTY,
      validate: (value: number) => {
        const valid = !isNaN(value) && value >= 0 && value <= 10;
        return valid || 'Please enter a valid difficulty';
      },
      filter: Number,
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers as CreateMazeData;
};

/** Print "Again?" prompt  */
export const showAgainPromt = async () => {
  const questions: QuestionCollection = [
    {
      type: 'confirm',
      name: 'again',
      message: 'Again?',
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers.again;
};

/** Print maze */
export const showMaze = (print: string) => {
  console.clear();
  console.log(`\n${print}`);
};
