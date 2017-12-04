const assert = require('assert')
const { readFileSync: read } = require('fs')
const { exec: brainloller } = require('../dist/brainloller')

const PROG_HELLO_WORLD = JSON.parse(read('./test/bl/helloworld.bl').toString())

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
