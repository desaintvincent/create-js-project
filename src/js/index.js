import { add } from './math'

const additionResult = add(1, 1)

setTimeout(() => {
  console.log(`the arrow function should disapear and display ${additionResult}`)
}, 500)
