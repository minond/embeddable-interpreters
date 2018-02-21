const assert = require('assert')
const { readFileSync: read } = require('fs')
const { exec: brainloller } = require('../dist/brainloller')

const PROG_HELLO_WORLD = JSON.parse(read('./test/bl/helloworld.json').toString())
const PROG_FIB = JSON.parse(read('./test/bl/fibonacci.json').toString())

const testsOutput = (label, prog, expectedOutput) => {
  var buff = []

  brainloller(prog, {
    write (str) {
      buff.push(str)
    },

    done () {
      assert(buff.join('') === expectedOutput)
      console.log('  - %s: ok', label)
    }
  })
}

testsOutput('hello world', PROG_HELLO_WORLD, 'Hello World!')
testsOutput('fibonacci', PROG_FIB, '1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 121, 98, 219, ...')
