export type StringInput = (str: string) => void

const inBrowser = typeof window !== 'undefined'
const inputPrompt = 'input: '

export class ReadBuffer {
  protected pos: number
  protected buff: string

  constructor(buff: string = "") {
    this.buff = buff
    this.pos = 0
  }

  ready() {
    return this.buff.length !== 0
  }

  next() {
    return this.buff.charAt(this.pos++) || String.fromCharCode(0)
  }
}

export const read = (cb: StringInput, buff: ReadBuffer) =>
  buff.ready() ? cb(buff.next()) :
    (inBrowser ? browserRead(cb) : nodeRead(cb))

export const write = (str: string) =>
  inBrowser ? browserWrite(str) : nodeWrite(str)

export const isset = (val: any) =>
  val !== null && val !== undefined

export const call = (fn: () => void) =>
  fn()

export const pass = (x: any) =>
  x

const nodeWrite = (str: string) =>
  process.stdout.write(str)

const browserWrite = (str: string) =>
  console.log(str)

const nodeRead = (cb: StringInput) => {
  const readline = require('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(inputPrompt, (input: string) => {
    rl.close()
    cb(input)
  })
}

const browserRead = (cb: StringInput) =>
  cb(window.prompt(inputPrompt) || String.fromCharCode(0))
