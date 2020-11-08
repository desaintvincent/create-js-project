import { add } from '../math'

describe('math', () => {
  describe('add', () => {
    it('shoud make an addition', () => {
      expect(add(1, 1)).toBe(2)
    })
  })
})
