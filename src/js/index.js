import add from './add'

let aa = add(1, 1)
aa++

const heading = document.createElement('h1')
heading.textContent = `Interesting: ${aa}`

// Append heading node to the DOM
const app = document.querySelector('#root')
class Game {
  constructor () {
    this.name = 'Violin Charades'
  }
}
const myGame = new Game()
// Create paragraph node
const p = document.createElement('p')
p.textContent = `I like ${myGame.name}.`
app.append(heading, p)
setTimeout(() => {
  console.log('je teste pour vérifier que ma arrow function aura disparu au terme du processus de compilation de webpack.')
}, 500)
