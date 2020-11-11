import { add } from './math'

const additionResult = add(1, 1)

if (module.hot) {
  console.log('module.hot')
}

setTimeout(() => {
  console.log(`the arrow function should disapear and display ${additionResult}`)
}, 500)
