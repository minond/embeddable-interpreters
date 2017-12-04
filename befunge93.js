// https://esolangs.org/wiki/Befunge
// https://github.com/catseye/Befunge-93/blob/master/doc/Befunge-93.markdown
const DEBUG = !!process.env.DEBUG
const NOOP = {}

const { random, floor } = Math

const DIR = {
  RIGHT: 0,
  DOWN: 1,
  LEFT: 2,
  UP: 3,
}

const debug = (args) =>
  DEBUG &&
    process.stdout.write(require('util').format.apply(null, args))

const write = (str) =>
  process.stdout.write((DEBUG ? '\n=> ' : '') + str + (DEBUG ? '\n                ' : ''))

const read = (cb) => {
  const readline = require('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('input: ', (input) => {
    rl.close()
    cb(input)
  })
}

const parse = (rawprog) =>
  rawprog.split('\n').map((line) =>
    line.split(''))

const unparse = (arrprog) =>
  arrprog.map((line) =>
    line.join(''))
      .join('\n')

const integer = (i) =>
  parseInt(i)

const ascii = (c) =>
  c.toString().charCodeAt(0)

const pop = (stack) =>
  stack.pop() || 0

const getAt = ([x, y], prog) =>
  prog.length > y && prog[y].length > x
    ? prog[y][x]
    : NOOP

const setAt = ([x, y], prog, val) =>
  getAt([x, y], prog) !== NOOP
    ? prog[y][x] = val
    : NOOP

const step = ([x, y], dir) => {
  switch (dir) {
  case DIR.RIGHT: return [x + 1, y]
  case DIR.DOWN:  return [x, y + 1]
  case DIR.LEFT:  return [x - 1, y]
  case DIR.UP:    return [x, y - 1]
  }
}

const exec = (rawprog, userHooks) => {
  const cmds = {
    // +   Addition: Pop two values a and b, then push the result of a+b
    '+': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(a + b)
    },

    // -   Subtraction: Pop two values a and b, then push the result of b-a
    '-': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(a - b)
    },

    // *   Multiplication: Pop two values a and b, then push the result of a*b
    '*': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(a * b)
    },

    // /   Integer division: Pop two values a and b, then push the result of
    // b/a, rounded down. According to the specifications, if a is zero, ask
    // the user what result they want.
    '/': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(floor(a / b))
    },

    // %   Modulo: Pop two values a and b, then push the remainder of the
    // integer division of b/a.
    '%': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(a % b)
    },

    // !   Logical NOT: Pop a value. If the value is zero, push 1; otherwise,
    // push zero.
    '!': () =>
      stack.push(pop(stack) === 0 ? 1 : 0),

    // `   Greater than: Pop two values a and b, then push 1 if b>a, otherwise
    // zero.
    '`': () => {
      var a = pop(stack),
        b = pop(stack)

      stack.push(b > a ? 1 : 0)
    },

    // >   PC direction right
    '>': () =>
      direction = DIR.RIGHT,

    // <   PC direction left
    '<': () =>
      direction = DIR.LEFT,

    // ^   PC direction up
    '^': () =>
      direction = DIR.UP,

    // v   PC direction down
    'v': () =>
      direction = DIR.DOWN,

    // ?   Random PC direction
    '?': () =>
      direction = [DIR.RIGHT, DIR.DOWN, DIR.LEFT, DIR.UP][floor(random() * 4)],

    // _   Horizontal IF: pop a value; set direction to right if value=0, set
    // to left otherwise
    '_': () =>
      direction = pop(stack) === 0 ? DIR.RIGHT : DIR.LEFT,

    // |   Vertical IF: pop a value; set direction to down if value=0, set to
    // up otherwise
    '|': () =>
      direction = pop(stack) === 0 ? DIR.DOWN : DIR.UP,

    // "   Toggle stringmode (push each character's ASCII value all the way up
    // to the next ")
    '"': () =>
      stringmode = !stringmode,

    // :   Duplicate top stack value
    ':': () => {
      var a = pop(stack)

      stack.push(a)
      stack.push(a)
    },

    // \   Swap top stack values
    '\\': () => {
      var a = pop(stack)
        b = pop(stack)

      stack.push(a)
      stack.push(b)
    },

    // $   Pop (remove) top stack value and discard
    '$': () =>
      pop(stack),

    // .   Pop top of stack and output as integer
    '.': () =>
      write(pop(stack)),

    // ,   Pop top of stack and output as ASCII character
    ',': () =>
      write(String.fromCharCode(pop(stack))),

    // #   Bridge: jump over next command in the current direction of the
    // current PC
    '#': () =>
      coors = step(coors, direction),

    // g   A "get" call (a way to retrieve data in storage). Pop two values y
    // and x, then push the ASCII value of the character at that position in
    // the program. If (x,y) is out of bounds, push 0
    'g': () => {
      var y = pop(stack),
        x = pop(stack),
        c = getAt([x, y], program)

      stack.push(c === NOOP ? 0 : ascii(c))
    },

    // p   A "put" call (a way to store a value for later use). Pop three
    // values y, x and v, then change the character at the position (x,y) in
    // the program to the character with ASCII value v
    'p': () => {
      var y = pop(stack),
        x = pop(stack),
        v = pop(stack)

      setAt([x, y], program, v)
    },

    // 0 – 9   Push corresponding number onto the stack
    '0': () =>
      stack.push(0),

    '1': () =>
      stack.push(1),

    '2': () =>
      stack.push(2),

    '3': () =>
      stack.push(3),

    '4': () =>
      stack.push(4),

    '5': () =>
      stack.push(5),

    '6': () =>
      stack.push(6),

    '7': () =>
      stack.push(7),

    '8': () =>
      stack.push(8),

    '9': () =>
      stack.push(9),
  }

  var stringmode = false
  var program = parse(rawprog)
  var stack = []
  var direction = DIR.RIGHT

  var coors = [0, 0]
  var cmd
  var steps = 0

  ;(function tick() {
    var cmd = getAt(coors, program)

    var next = () => {
      debug(['Stack:  %O\n', stack])
      debug(['\nProgram:\n%s\n\n', unparse(program)])
      coors = step(coors, direction)
      steps++
      process.nextTick(tick)
    }

    if (cmd === NOOP) {
      return
    }

    debug(['<= %s:  "%s"  ', steps.toString().padStart(5, '0'), cmd])

    if (stringmode && cmd !== '"') {
      stack.push(ascii(cmd))
      next()
    } else if (cmd === '@') {
      // @   End program
      return
    } else if (cmd === '~') {
      // ~   Get character from user and push it
      read((c) => {
        stack.push(ascii(c))
        next()
      })
    } else if (cmd === '&') {
      // &   Get integer from user and push it
      read((i) => {
        stack.push(integer(i))
        next()
      })
    } else if (cmd in cmds) {
      cmds[cmd]()
      next()
    } else {
      // debug(['\n\nWarning: invalid command: "%s"\n\n', cmd])
      next()
    }
  })()
}

const helloworld = `64+"!dlroW ,olleH">:#,_@`
const infiniteloop = `>v\n^<`
const factorial = `&>:1-:v v *_$.@
 ^    _$>\:^`
const cat = `~:1+!#@_,`

const dna = ` >78*vD
v$_#>vN
7#!@  A
3 :v??v
9,-""""
4+1ACGT
+,,""""
>^^<<<<`

const quine = `01->1# +# :# 0# g# ,# :# 5# 8# *# 4# +# -# _@`

const lessormore =
`vv  <      <
    2
    ^  v<
 v1<?>3v4
    ^   ^
>  >?>  ?>5^
    v   v
 v9<?>7v6
    v  v<
    8
    >  >   ^
 vv  <      <
     2
     ^  v<
  v1<?>3v4
     ^   ^
 >  >?>  ?>5^
     v   v      v          ,*25         <<
  v9<?>7v6                              ,,
     v  v<                              ""
     8                                  ><
     >  >   ^                           ""v
  >*:.>0"!rebmun tupnI">:#,_$25*,:&:99p\`|^<       _0"!niw uoY">:#,_$25*,@
      ^         <                       >:99g01-*+^`

const rockpaperscissors = `v                       >  v
>a"3 no"4k,1.0"1 peels"#^=$>2.0"1 peels"#v=$v
          v                              <  <
v,k3"rock"?"srossics"7k,v
          "
          r
          e
          p
          a
          p
          "
          4
          k
          ,                                             @
          v             <                          >'y-#^_a,0by-8-0ay-x
>         >0"2 peels"#v=$>a," ?niaga yalp"ack,>~:a-|
                      >  ^                    ^ $  <
Rock Scissors Paper, on 3`

const simpleupdate = '300p00'
exec('1 2 + 5 *')
