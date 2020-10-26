import { DIFFICULTY, HEIGHT, PONY_NAME, WIDTH } from './config';
import { getAvailableRoute } from './mechanics';
import {
  createMaze,
  CreateMazeData,
  createMove,
  getMazeData,
  getMazePrint,
} from './ponyApi';
import {
  enchanceMazePrint,
  showAgainPromt,
  showGameMenu,
  showMaze,
} from './ui';

/** hold maze data, for startGame() */
let mazeData: CreateMazeData = {
  'maze-width': WIDTH,
  'maze-height': HEIGHT,
  'maze-player-name': PONY_NAME,
  difficulty: DIFFICULTY,
};

/** Update maze data for next play */
const setMazeData = (nextMazeData: CreateMazeData) => {
  mazeData = { ...mazeData, ...nextMazeData };
  return mazeData;
};

/** Game erro handler */
const handleGameError = (err: any) => {
  if (err.isAxiosError) {
    console.error('API error:', err.message, '-', `"${err.response?.data}"`);
  } else {
    console.error('Error', err);
  }
};

/** Shows game menu */
const init = () => {
  const onPlay = () =>
    startGame()
      .then(() => showAgainPromt())
      // init all over
      .then((again) => again && init())
      .catch(handleGameError);

  showGameMenu({
    onPlay,
    onSettingsChange: setMazeData,
    currentSettings: mazeData,
  });
};

const startGame = async () => {
  console.clear();
  console.log('\nLoading..');

  // create maze, using `mazeData`
  const { maze_id } = await createMaze(mazeData);

  // status flags
  let done = false;
  let won = false;
  // hold prevRoute for playtolose case
  let prevAvailableRoute: ReturnType<typeof getAvailableRoute> = false;

  do {
    // load mazePrint & mazeData
    const mazePrintPromise = getMazePrint(maze_id);
    const mazeDataPromise = getMazeData(maze_id);
    const [mazePrint, mazeData] = await Promise.all([
      mazePrintPromise,
      mazeDataPromise,
    ]);

    const { pony, domokun, data, size } = mazeData;

    // calculate route
    const availableRoute = getAvailableRoute({
      ponyPos: pony[0],
      domokunPos: domokun[0],
      mazeWidth: size[0],
      mazeHeight: size[1],
      mazeData: data,
      currentRoute: [],
      winPos: mazeData['end-point'][0],
    });

    // save prevRoute
    if (availableRoute) prevAvailableRoute = availableRoute;

    // display maze
    const enchancedPrint = enchanceMazePrint({
      mazePrint,
      mazeWidth: size[0],
      route: availableRoute || prevAvailableRoute,
    });
    showMaze(enchancedPrint);

    // game kaput
    if (!availableRoute) {
      if (!prevAvailableRoute) {
        console.log('\n😢 LOST! No available route..\n');
        return;
      }

      // we followed a route, but the domobastard is gonna catch us
      // go to predictable death
      const enchanced = enchanceMazePrint({
        mazePrint,
        mazeWidth: size[0],
        // remaining route in red moji
        route: prevAvailableRoute.slice(1),
        routeMoji: '📍',
      });
      showMaze(enchanced);

      console.log('\n😢 LOST! Will keep playing until caught..');
      await new Promise((r) => setTimeout(r, 2000));

      // do route moves until caught
      for (let i = 1; i < prevAvailableRoute.length; i++) {
        const move = prevAvailableRoute[i];
        console.log(`\nMove:`, move);

        await new Promise((r) => setTimeout(r, 100));
        // make a move
        const moveRes = await createMove(maze_id, move.direction);

        // update done status
        done = moveRes.state !== 'active';

        const print = await getMazePrint(maze_id);
        const enchancedP = enchanceMazePrint({
          mazePrint: print,
          mazeWidth: size[0],
          route: prevAvailableRoute.slice(i + 1),
          routeMoji: '📍',
        });
        showMaze(enchancedP);

        console.log('\n😢 LOST!');
        if (done) return;
      }

      return;
    }

    // still going good
    console.log(`\nMove:`, availableRoute[0]);
    await new Promise((r) => setTimeout(r, 120));

    // make a move
    const moveRes = await createMove(maze_id, availableRoute[0].direction);

    // update status
    done = moveRes.state !== 'active';
    won = done && moveRes['state-result'] !== 'Move accepted';
  } while (!done);

  console.log(won ? '\n🎉 WON!!\n' : '\n😢 LOST!\n');
};

// start().catch(handleGameError);
init();
