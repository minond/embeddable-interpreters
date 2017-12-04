// > Brainloller is Brainfuck but represented as an image. If you're not
// familiar with Brainfuck already, go checkout http://minond.xyz/brainfuck/.
// Brainloller gives you the eight commands that you have in Brainfuck with two
// additional commands for rotating the direction in which the program is
// evaluated.

// - https://esolangs.org/wiki/Brainloller
import { StringInput, read, write, isset, call, pass } from "./common";

export { exec, DIR }
process.env.DEBUG='1' // XXX

const enum OPT {
  PLUS = '[0,255,0]',
  MINUS = '[0,128,0]',
  GT = '[255,0,0]',
  LT = '[128,0,0]',
  COMMA = '[0,0,128]',
  PERIOD = '[0,0,255]',
  OBRACKET = '[255,255,0]',
  CBRACKET = '[128,128,0]',
  ROTPOS90 = '[0,255,255]',
  ROTNEG90 = '[0,128,128]',
  NOOP = '[0,0,0]'
}

const enum DIR {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

type Pixel = {
  r: number
  g: number
  b: number
}

type State = {
  direction: DIR
  coor: [number, number]
  memory: number[]
  pointer: number
}

type Hooks = {
  read: (str: StringInput) => void
  write: (str: string) => void
  done: () => void

  tick: (
    internalTick: () => void,
    internalUpdate: (state: State) => void,
    internalState: State & { steps: number }
  ) => void
}

const pixel = (opt: OPT): Pixel => {
  var [r, g, b] = JSON.parse(opt)
  return {r, g, b}
}

const optcode = (cell: Pixel): OPT =>
  !cell
    ? OPT.NOOP
    : JSON.stringify([cell.r, cell.g, cell.b]) as OPT

const exec = (prog: Pixel[][], userHooks?: Hooks) => {
  var steps = 0
  var cmd: OPT

  var coor: [number, number] = [0, 0]
  var direction = DIR.RIGHT

  var jumps: [number, number][] = []
  var memory: number[] = []
  var pointer = 0

  const curr = () =>
    memory[pointer] || 0

  const save = (val: number) =>
    memory[pointer] = val

  const moveRight = () =>
    coor = [coor[0] + 1, coor[1]]

  const moveDown = () =>
    coor = [coor[0], coor[1] + 1]

  const moveLeft = () =>
    coor = [coor[0] - 1, coor[1]]

  const moveUp = () =>
    coor = [coor[0], coor[1] - 1]

  const dump = (cmd: string) =>
    console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', steps, coor, cmd,
      pointer, curr(), JSON.stringify(memory))

  const findEnd = (coor: [number, number]) => {
    // XXX find the matching CBRACKET while following ROTPOS90 and ROTNEG90
    // updates but ignoring everything else.
    return coor
  }

  const internalUpdate = (state: State) => {
    direction = isset(state.direction) ? state.direction : direction
    memory = isset(state.memory) ? state.memory : memory
    pointer = isset(state.pointer) ? state.pointer : pointer
    coor = isset(state.coor) ? state.coor : coor
  }

  // Moves on to the next command. Checks that we still have commands left to
  // read and also show debugging information. In a `process.nextTick` (or one
  // of its siblings) to prevent call stack overflows.
  const internalTick = () => {
    if (process.env.DEBUG) {
      dump(cmd)
    }

    steps++

    switch (direction) {
    case DIR.RIGHT:
      moveRight()
      break

    case DIR.DOWN:
      moveDown()
      break

    case DIR.LEFT:
      moveLeft()
      break

    case DIR.UP:
      moveUp()
      break

    default:
      throw new Error(`Invalid direction: ${direction}`)
    }

    if (!prog[coor[1]] || !prog[coor[1]][coor[0]]) {
      hooks.done()
    } else {
      process.nextTick(run, 0)
    }
  }

  const tick = () =>
    hooks.tick(internalTick, internalUpdate, {
      steps,
      direction,
      coor,
      pointer,
      memory: memory.slice(0) })

  const hooks: Hooks = Object.assign({ read, write, tick: call, done: pass },
    userHooks)

  const ops: { [index: string]: () => void } = {
    [OPT.PLUS]: () => save((curr() === 255 ? 0 : curr() + 1)),
    [OPT.MINUS]: () => save((curr() || 256) - 1),
    [OPT.LT]: () => --pointer,
    [OPT.GT]: () => ++pointer,
    [OPT.PERIOD]: () => hooks.write(String.fromCharCode(curr())),

    [OPT.OBRACKET]: () => {
      if (curr() === 0) {
        coor = findEnd(coor)
      } else {
        jumps.push(coor)
      }
    },

    [OPT.CBRACKET]: () => {
      if (curr() !== 0) {
        coor = jumps[jumps.length - 1]
      } else {
        jumps.pop()
      }
    },

    [OPT.ROTPOS90]: () => {
      switch (direction) {
      case DIR.RIGHT:
        direction = DIR.DOWN
        break

      case DIR.DOWN:
        direction = DIR.LEFT
        break

      case DIR.LEFT:
        direction = DIR.UP
        break

      case DIR.UP:
        direction = DIR.RIGHT
        break
      }
    },

    [OPT.ROTNEG90]: () => {
      switch (direction) {
      case DIR.RIGHT:
        direction = DIR.UP
        break

      case DIR.UP:
        direction = DIR.LEFT
        break

      case DIR.LEFT:
        direction = DIR.DOWN
        break

      case DIR.DOWN:
        direction = DIR.RIGHT
        break
      }
    },
  }

  const run = () => {
    cmd = optcode(prog[coor[1]][coor[0]])

    if (cmd in ops) {
      ops[cmd]()
      tick()
    } else if (cmd === OPT.COMMA) {
      hooks.read((input: string) => {
        save(input.charCodeAt(0))
        tick()
      })
    } else {
      tick()
    }
  }

  run()
}

// exec([
//   [ { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 0, b: 255 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 128, b: 128 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 255 } ],
//   [ { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 255 } ],
// ])

exec([
  [pixel(OPT.PLUS),     pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
  [pixel(OPT.ROTNEG90), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.PLUS), pixel(OPT.ROTPOS90)],
])
