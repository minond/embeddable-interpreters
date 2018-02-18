const assert = require('assert')
const { readFileSync: read } = require('fs')
const { exec: brainfuck } = require('../dist/brainfuck')
const { ReadBuffer } = require('../dist/common')

const PROG_HELLO_WORLD = read('./test/bf/helloworld.bf').toString()
const PROG_QUINE = read('./test/bf/quine.bf').toString()
const PROG_CAT_1 = read('./test/bf/cat1.bf').toString()
const PROG_CAT_2 = read('./test/bf/cat2.bf').toString()

const testsOutput = (label, prog, expectedOutput, readBuffer) => {
  var buff = []

  brainfuck(prog, {
    write (str) {
      buff.push(str)
    },

    done () {
      assert(buff.join('') === expectedOutput)
      console.log('  - %s: ok', label)
    }
  }, readBuffer)
}

testsOutput('hello world', PROG_HELLO_WORLD, 'Hello World!\n')
testsOutput('quine', PROG_QUINE, PROG_QUINE.substring(0, 900).replace(/\n/g, ''))
testsOutput('cat1', PROG_CAT_1, "abc", new ReadBuffer("abc"))
testsOutput('cat2', PROG_CAT_2, "xyz", new ReadBuffer("xyz"))
