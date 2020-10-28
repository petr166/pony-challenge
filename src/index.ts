import { DIFFICULTY, HEIGHT, PONY_NAME, WIDTH } from './config';
import { getAvailableRoute, PonyMove } from './mechanics';
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
  // PLAY callback
  const onPlay = () =>
    startGame()
      .then(() => showAgainPromt())
      // init all over
      .then((again) => again && init())
      .catch(handleGameError);

  // ui
  showGameMenu({
    onPlay,
    onSettingsChange: setMazeData,
    currentSettings: mazeData,
  });
};

/** Do a full game run, ends when game finished (win or die trying) */
const startGame = async () => {
  console.clear();
  console.log('\nLoading..');

  // create maze, using `mazeData`
  const { maze_id } = await createMaze(mazeData);

  // loop exit flag
  let done = false;
  // move counter
  let moveCount = 1;
  // hold route in progress, for reuse if still good or keep going even if domokun is coming
  let ongoingRoute: ReturnType<typeof getAvailableRoute> = false;

  // gameplay looop
  do {
    // load maze data & print
    const mazePromise = getMazeData(maze_id);
    const mazePrintPromise = getMazePrint(maze_id);
    const [maze, mazePrint] = await Promise.all([
      mazePromise,
      mazePrintPromise,
    ]);

    // store variables used for finding a route
    const ponyPos = maze.pony[0];
    const domokunPos = maze.domokun[0];
    const winPos = maze['end-point'][0];
    const mazeWidth = maze.size[0];
    const mazeHeight = maze.size[1];

    let domokunOnPath = false;
    if (ongoingRoute) {
      // slice last step
      ongoingRoute = ongoingRoute.slice(1);
      // domokunPos matches one of ongoingRoute position
      domokunOnPath = ongoingRoute.some(
        (routeMove) => routeMove.position === domokunPos
      );
    }

    let route: ReturnType<typeof getAvailableRoute>;

    // use last route if domokun not in the way for performance
    if (ongoingRoute && !domokunOnPath) {
      route = ongoingRoute;
    } else {
      // calculate route
      route = getAvailableRoute({
        ponyPos,
        domokunPos,
        winPos,
        mazeWidth,
        mazeHeight,
        mazeData: maze.data,
        currentRoute: [],
      });

      // save this route
      if (route) ongoingRoute = route;
    }

    // display maze
    const enchancedPrint = enchanceMazePrint({
      mazePrint,
      mazeWidth,
      route: route || ongoingRoute,
      // show red pin if going straight to domokun
      routeMoji: domokunOnPath ? '📍' : undefined,
    });
    showMaze(enchancedPrint);

    // first try, no avaiable route
    if (!route && !ongoingRoute) {
      // try to find a route ignoring the domokun presence, maybe he misses the path;
      // this actually happens on lower difficulty 😛
      ongoingRoute = getAvailableRoute({
        ponyPos,
        domokunPos: -1,
        winPos,
        mazeWidth,
        mazeHeight,
        mazeData: maze.data,
        currentRoute: [],
      });

      // pony is locked from the beginning
      if (!ongoingRoute) {
        console.log('\n😢 LOST! No available route..\n');
        return;
      }
    }

    // make a move
    // @ts-ignore, one of them is defined u ts bastard
    const move: PonyMove = (route || ongoingRoute)[0];
    console.log(`\nMove ${moveCount}:`, move);
    await new Promise((r) => setTimeout(r, 150));
    const moveRes = await createMove(maze_id, move.direction);
    moveCount += 1; // increment move count

    // update status
    done = moveRes.state !== 'active';

    // check win status
    if (done) {
      const won = moveRes.state === 'won';
      console.log(won ? '\n🎉 WON!!\n' : '\n😢 LOST!\n');
    }
  } while (!done);
};

// startGame().catch(handleGameError);
init();
