const assert = require('assert')
const { readFileSync: read } = require('fs')
const { exec: brainfuck } = require('../dist/brainfuck')

const PROG_HELLO_WORLD = read('./test/bf/helloworld.bf').toString()
const PROG_QUINE = read('./test/bf/quine.bf').toString()

const testsOutput = (label, prog, expectedOutput) => {
  var buff = []

  brainfuck(prog, {
    write (str) {
      buff.push(str)
    },

    done () {
      assert(buff.join('') === expectedOutput)
      console.log('%s: ok', label)
    }
  })
}

testsOutput('hello world', PROG_HELLO_WORLD, 'Hello World!\n')
testsOutput('quine', PROG_QUINE, PROG_QUINE.substring(0, 900).replace(/\n/g, ''))
