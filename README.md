[![Build Status](https://travis-ci.org/minond/embeddable-interpreters.svg?branch=master)](https://travis-ci.org/minond/embeddable-interpreters)

Embeddable interpreters. The idea is that you could take one of these
interpreters and embed them into web apps. You'll mostly find esoteric
programming languages. Languages include
[Brainfuck](https://esolangs.org/wiki/Brainfuck) and
[Brainloller](https://esolangs.org/wiki/Brainloller). To build and run tests,
execute `make install build test`. A repl is also included and is used like so:

```bash
# Usage: ./repl [mode] <file-to-load-and-run>
./repl brainfuck
./repl brainfuck test/bf/helloworld.bf
```
