[![Build Status](https://travis-ci.org/minond/embeddable-interpreters.svg?branch=master)](https://travis-ci.org/minond/embeddable-interpreters)

Embeddable interpreters. The idea is that you could take one of these
interpreters and embed them into web apps. You'll mostly find esoteric
programming languages. Resources:

  - https://esolangs.org/wiki/Brainfuck
  - https://esolangs.org/wiki/Brainloller


Execute `make install build test` to build and run tests. A repl is also
included and is used like so: `./repl [mode] <file-to-load-and-run>`:

```bash
./main brainfuck
./main brainfuck test/bf/helloworld.bf
```
