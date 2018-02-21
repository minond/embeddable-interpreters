// > Brainloller is Brainfuck but represented as an image. If you're not
// familiar with Brainfuck already, go checkout http://minond.xyz/brainfuck/.
// Brainloller gives you the eight commands that you have in Brainfuck with two
// additional commands for rotating the direction in which the program is
// evaluated.

// - https://esolangs.org/wiki/Brainloller
import { ReadBuffer, StringInput, read, write, isset, call, pass } from "./common";

export { exec, DIR }

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

type Coordinate = [
  number,
  number
]

type Pixel = {
  r: number
  g: number
  b: number
}

type State = {
  direction: DIR
  coor: Coordinate
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

const exec = (prog: Pixel[][], userHooks?: Hooks, buff?: ReadBuffer) => {
  var steps = 0
  var cmd: OPT

  var coor: Coordinate = [0, 0]
  var direction = DIR.RIGHT

  var jumps: [Coordinate, DIR][] = []
  var memory: number[] = []
  var pointer = 0

  const curr = () =>
    memory[pointer] || 0

  const save = (val: number) =>
    memory[pointer] = val

  const dump = (cmd: string) =>
    console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', steps, coor, cmd,
      pointer, curr(), JSON.stringify(memory))

  // Find the matching CBRACKET while following ROTPOS90 and ROTNEG90 updates
  // but ignoring everything else.
  const findEnd = (coor: Coordinate): [Coordinate, DIR] => {
    var peekDir = direction
    var peekCoor = nextCoor(coor, direction)
    var peekJump = 1

    while (prog[peekCoor[1]] && prog[peekCoor[1]][peekCoor[0]]) {
      switch (optcode(prog[peekCoor[1]][peekCoor[0]])) {
      case OPT.OBRACKET:
        peekJump++
        break

      case OPT.CBRACKET:
        peekJump--

        if (peekJump === 0) {
          return [peekCoor as Coordinate, peekDir]
        }

        break

      case OPT.ROTPOS90:
        peekDir = nextRotation(peekDir)
        break

      case OPT.ROTNEG90:
        peekDir = prevRotation(peekDir)
        break
      }

      peekCoor = nextCoor(peekCoor, peekDir)
    }

    throw new Error('Found OBRACKET but no CBRACKET')
  }

  const nextRotation = (dir: DIR) => {
    switch (dir) {
    case DIR.RIGHT: return DIR.DOWN
    case DIR.DOWN:  return DIR.LEFT
    case DIR.LEFT:  return DIR.UP
    case DIR.UP:    return DIR.RIGHT
    default:        throw new Error(`Invalid direction: ${dir}`)
    }
  }

  const prevRotation = (dir: DIR) => {
    switch (dir) {
    case DIR.RIGHT: return DIR.UP
    case DIR.UP:    return DIR.LEFT
    case DIR.LEFT:  return DIR.DOWN
    case DIR.DOWN:  return DIR.RIGHT
    default:        throw new Error(`Invalid direction: ${dir}`)
    }
  }

  const nextCoor = (coor: Coordinate, dir: DIR): Coordinate => {
    switch (dir) {
    case DIR.RIGHT: return moveRight(coor)
    case DIR.DOWN:  return moveDown(coor)
    case DIR.LEFT:  return moveLeft(coor)
    case DIR.UP:    return moveUp(coor)
    default:        throw new Error(`Invalid direction: ${direction}`)
    }
  }

  const moveRight = (coor: Coordinate): Coordinate =>
    [coor[0] + 1, coor[1]]

  const moveDown = (coor: Coordinate): Coordinate =>
    [coor[0], coor[1] + 1]

  const moveLeft = (coor: Coordinate): Coordinate =>
    [coor[0] - 1, coor[1]]

  const moveUp = (coor: Coordinate): Coordinate =>
    [coor[0], coor[1] - 1]

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
    coor = nextCoor(coor, direction)

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

  const readBuff = (cb: StringInput) =>
    read(cb, buff || new ReadBuffer())

  const hooks: Hooks = Object.assign({ read: readBuff, write, tick: call, done: pass },
    userHooks)

  const ops: { [index: string]: () => void } = {
    [OPT.PLUS]: () => save((curr() === 255 ? 0 : curr() + 1)),
    [OPT.MINUS]: () => save((curr() || 256) - 1),
    [OPT.LT]: () => --pointer,
    [OPT.GT]: () => ++pointer,
    [OPT.PERIOD]: () => hooks.write(String.fromCharCode(curr())),

    [OPT.OBRACKET]: () => {
      if (curr() === 0) {
        [coor, direction] = findEnd(coor)
      } else {
        jumps.push([coor, direction])
      }
    },

    [OPT.CBRACKET]: () => {
      if (curr() !== 0) {
        [coor, direction] = jumps[jumps.length - 1]
      } else {
        jumps.pop()
      }
    },

    [OPT.ROTPOS90]: () => {
      direction = nextRotation(direction)
    },

    [OPT.ROTNEG90]: () => {
      direction = prevRotation(direction)
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
