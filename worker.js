self.addEventListener('message', e => {
  self.postMessage({
    mark: 'child',
    data: {
      name: 'child'
    }
  })
})