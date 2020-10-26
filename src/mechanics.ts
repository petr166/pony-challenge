type IsGoingBackParams = { route: PonyMove[]; direction: DIRECTION };
/** Check if `direction` is the opposite of last move direction, aka will go back */
export const isGoingBack = ({
  route,
  direction,
}: IsGoingBackParams): boolean => {
  if (!route.length) return false;

  // last move went opposite of current `direction`
  return route[route.length - 1].direction === oppositeDirections[direction];
};

type GetNextPonyPositionParams = {
  /** current pony position */
  currentPosition: number;
  /** move direction */
  direction: DIRECTION;
  mazeWidth: number;
};
/** Calculate next pony position, based on currentPosition & move direction */
export const getNextPonyPosition = ({
  currentPosition,
  direction,
  mazeWidth,
}: GetNextPonyPositionParams): number => {
  switch (direction) {
    case DIRECTION.NORTH:
      return currentPosition - mazeWidth;
    case DIRECTION.EAST:
      return currentPosition + 1;
    case DIRECTION.SOUTH:
      return currentPosition + mazeWidth;
    case DIRECTION.WEST:
      return currentPosition - 1;
    default:
      return currentPosition;
  }
};

type GetAvailableRouteParams = {
  /** pony position */
  ponyPos: number;
  /** domokun position */
  domokunPos: number;
  /** winner/end position */
  winPos: number;
  mazeWidth: number;
  mazeHeight: number;
  /** maze cell data array */
  mazeData: MazeCell[];
  currentRoute: PonyMove[];
};
export const getAvailableRoute = ({
  ponyPos,
  winPos,
  domokunPos,
  mazeWidth,
  mazeHeight,
  mazeData,
  currentRoute,
}: GetAvailableRouteParams): PonyMove[] | false => {
  // console.count('computed route');
  // won!!
  if (ponyPos === winPos) return currentRoute;
  // lost, aka hit domokun
  if (ponyPos === domokunPos) return false;

  // map for checking each direction
  const availableDirections: { [key in DIRECTION]: () => boolean } = {
    [DIRECTION.NORTH]: () =>
      mazeData[ponyPos] &&
      !mazeData[ponyPos].includes(DIRECTION.NORTH) &&
      // restrict going back, to prevent infinite loop;
      // route recalculation happens after every move anyway,
      // so if going back makes for a new available route, it's a go
      !isGoingBack({ route: currentRoute, direction: DIRECTION.NORTH }),
    [DIRECTION.EAST]: () =>
      mazeData[ponyPos + 1] &&
      !mazeData[ponyPos + 1].includes(DIRECTION.WEST) &&
      !isGoingBack({ route: currentRoute, direction: DIRECTION.EAST }),
    [DIRECTION.SOUTH]: () =>
      mazeData[ponyPos + mazeWidth] &&
      !mazeData[ponyPos + mazeWidth].includes(DIRECTION.NORTH) &&
      !isGoingBack({ route: currentRoute, direction: DIRECTION.SOUTH }),
    [DIRECTION.WEST]: () =>
      mazeData[ponyPos] &&
      !mazeData[ponyPos]?.includes(DIRECTION.WEST) &&
      !isGoingBack({ route: currentRoute, direction: DIRECTION.WEST }),
  };

  // return value
  let availableRoute: PonyMove[] | false = false;

  // run the check for each direction, until finding one available
  Object.entries(availableDirections).some(([directionStr, isAvailable]) => {
    if (!isAvailable()) return false;
    const direction = directionStr as DIRECTION;

    // prep next move
    const nextMove: PonyMove = {
      direction,
      position: getNextPonyPosition({
        currentPosition: ponyPos,
        direction,
        mazeWidth,
      }),
    };

    // recursive call, with the updated `ponyPos` and saved move
    availableRoute = getAvailableRoute({
      ponyPos: nextMove.position,
      winPos,
      domokunPos,
      mazeWidth,
      mazeHeight,
      mazeData,
      currentRoute: [...currentRoute, nextMove],
    });

    // exit directions check loop
    return availableRoute;
  });

  return availableRoute;
};

///////////// TYPES /////////////

/** Maze `data` entry, provides cell walls */
export type MazeCell = Array<DIRECTION.WEST | DIRECTION.NORTH>;

/** Available move directions */
export enum DIRECTION {
  NORTH = 'north',
  EAST = 'east',
  SOUTH = 'south',
  WEST = 'west',
}

// TODO: maybe look into a way to achieve this without duplication
/** Map of opposite move directions */
const oppositeDirections = {
  [DIRECTION.NORTH]: DIRECTION.SOUTH,
  [DIRECTION.SOUTH]: DIRECTION.NORTH,
  [DIRECTION.EAST]: DIRECTION.WEST,
  [DIRECTION.WEST]: DIRECTION.EAST,
};

/** Moving route entry */
export type PonyMove = {
  direction: DIRECTION;
  /** resulting cell position */
  position: number;
};
