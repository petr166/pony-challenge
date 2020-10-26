import axios from 'axios';

import { PONY_API_URL } from './config';
import { DIRECTION, MazeCell } from './mechanics';

/** Axios instance for using PonyChallenge API */
export const ponyApi = axios.create({
  baseURL: PONY_API_URL,
});

export type CreateMazeData = {
  'maze-width': number;
  'maze-height': number;
  'maze-player-name': string;
  difficulty: number;
};
/** Create game maze */
export const createMaze = async (mazeData: CreateMazeData) => {
  const res = await ponyApi.post<{ maze_id: string }>('/maze', mazeData);
  return res.data;
};

/** Get maze print based on `mazeId` */
export const getMazePrint = async (mazeId: string) => {
  const res = await ponyApi.get<string>(`/maze/${mazeId}/print`);
  return res.data;
};

/** Get maze data based on `mazeId` */
export const getMazeData = async (mazeId: string) => {
  const res = await ponyApi.get<MazeRes>(`/maze/${mazeId}`);
  return res.data;
};

/** Create a move on maze matching `mazeId` */
export const createMove = async (mazeId: string, direction: DIRECTION) => {
  const res = await ponyApi.post<MazeRes['game-state']>(`/maze/${mazeId}`, {
    direction,
  });
  return res.data;
};

/** Maze data response */
export type MazeRes = {
  maze_id: string;
  /** current game state */
  'game-state': {
    state: string; // "active" etc.
    'state-result': string; // "Move accepted"
  };
  /** pony position */
  pony: [number];
  /** domokun position */
  domokun: [number];
  /** win position */
  'end-point': [number];
  /** maze dimensions, [width, height]; 15-25 */
  size: [number, number];
  /** game difficulty, 0-10 */
  difficulty: number;
  /** maze cells */
  data: MazeCell[];
};
