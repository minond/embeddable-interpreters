[![Build Status](https://travis-ci.org/minond/embeddable-interpreters.svg?branch=master)](https://travis-ci.org/minond/embeddable-interpreters)

Embeddable interpreters. The idea is that you could take one of these
interpreters and embed them into web apps. You'll mostly find esoteric
programming languages.

Resources for Brainfuck:
  - https://esolangs.org/wiki/Brainfuck
  - https://en.wikipedia.org/wiki/Brainfuck


Building and testing:

```bash
make install build test
```


Execute code or start repl:

```bash
./main brainfuck
./main brainfuck test/bf/helloworld.bf
```
