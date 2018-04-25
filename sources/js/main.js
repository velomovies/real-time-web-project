(function () {
  const app = {
    init: function () {
      socket.handleDataEvents()
      move.init() 
    }
  }

  const socket = {
    io: io(),
    emit: function (emitting, data) {
      this.io.emit(emitting, data)
    },
    handleDataEvents: function () {
      this.io.on('hello', function (data) {
        astroid.nsaData = data.nsaData
        astroid.init()
        data.rocketsArray.forEach(function (dataItem) {
          if (dataItem.userId !== socket.io.id) {
            console.log(dataItem) 
            rocket.create(dataItem)
            if (dataItem.rocketTop || dataItem.rocketLeft) {
              if(dataItem.neoId) {
                rocket.land(dataItem)
              }
              rocket.position(dataItem.rocketTop, dataItem.rocketLeft, dataItem.orientation, dataItem.userId)
            }
          }  
        })
      })
      this.io.on('disconnection', function (data) {
        rocket.delete(data)
      })
      this.io.on('userConnection', function (data) {
          rocket.create(data)
      })
      this.io.on('flying', function (data) {
        let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
        if (!selectUserEl) {
          rocket.create(data)
        } else {
          rocket.position(data.rocketTop, data.rocketLeft, data.orientation, data.userId)
        }        
      })
      this.io.on('landing', function (data) {
        rocket.land(data)
      })
      this.io.on('launch', function (data) {
        console.log(data)
        let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
        let selectAstroid = document.querySelector('[data-id="' + data.neoId + '"]')
        let selectAstroidFlag = selectAstroid.querySelector('.flag')
        selectAstroidFlag.parentNode.removeChild(selectAstroidFlag)
        selectUserEl.classList.remove('land')
        selectUserEl.style.top = 0
        selectUserEl.style.left = 0
        selectUserEl.dataset.orientation = 'up'
      })
    }
  }

  const move = {
    init: function () {
      let self = this
      window.addEventListener('keydown', function (e) {
        if (!detaiPage.open && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          self.fly(e.key)
        }
      })
    },
    fly: function (clickedKey) {
      switch(clickedKey) {
        case 'ArrowLeft':
          if (rocket.left > 0) {
            rocket.left = rocket.left - rocket.speed
            rocket.orientation = 'left'
          }
        break
        case 'ArrowRight':
          if (rocket.left < 100) {
            rocket.left = rocket.left + rocket.speed
            rocket.orientation = 'right'
          }
        break
        case 'ArrowUp':
         if (rocket.top > 0) {
            rocket.top = rocket.top - rocket.speed
            rocket.orientation = 'up'
         }
        break
        case 'ArrowDown':
        if (rocket.top < 100) {
          rocket.top = rocket.top + rocket.speed
          rocket.orientation = 'down'
        }    
        break
      }
      
      socket.emit('flying', {rocketLeft: rocket.left, rocketTop: rocket.top, orientation: rocket.orientation, userId: socket.io.id})

      rocket.position(rocket.top, rocket.left, rocket.orientation)
      
    }
  }

  const rocket = {
    speed: 1,
    easing: 10,
    selectEl: document.querySelector('.🚀.client'),
    top: 0,
    left: 0,
    orientation: 'up',
    width: document.querySelector('.🚀').getBoundingClientRect().width,
    height: document.querySelector('.🚀').getBoundingClientRect().height,
    position: function (top, left, orientation, user) {
      if (user) {
        let selectUserEl = document.querySelector('[data-user="' + user + '"]')
        selectUserEl.style.top = top + '%'
        selectUserEl.style.left = left + '%'
        selectUserEl.dataset.orientation = orientation
      } else {
        rocket.checkLand(top, left)
        this.selectEl.style.top = top + '%'
        this.selectEl.style.left = left + '%'
        this.selectEl.dataset.orientation = orientation
      }
    },
    create: function (data) {
      let newRocket = document.createElement('div')
      let newRocketImage = document.createElement('div')
      newRocket.classList.add('🚀')
      newRocketImage.classList.add('image')
      newRocket.dataset.user = data.userId
      newRocket.appendChild(newRocketImage)
      space.selectEl.appendChild(newRocket)
    },
    delete: function (data) {
      let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
      if (selectUserEl) {
        selectUserEl.remove()
      }
    },
    checkLand: function (top, left) {
      let selectRocket = document.querySelector('.🚀.client').getBoundingClientRect()
      if(astroid.nsaData) {
        astroid.nsaData.forEach(function (data) {
          if (selectRocket.top + selectRocket.height / 2 < data.middle.y + rocket.easing 
            && selectRocket.top + selectRocket.height / 2 > data.middle.y - rocket.easing 
            && selectRocket.left + selectRocket.width / 2 < data.middle.x + rocket.easing 
            && selectRocket.left + selectRocket.width / 2 > data.middle.x - rocket.easing) {
              detaiPage.open = true
              socket.emit('landing', {neoId: data.neo_reference_id, userId: socket.io.id})
              detaiPage.render(data.neo_reference_id)
          }
        })
      }
    },
    land: function (data) {
      let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
      let selectAstroid = document.querySelector('[data-id="' + data.neoId + '"]')
      selectUserEl.classList.add('land')

      let newFlag = document.createElement('div')
      newFlag.classList.add('flag')

      selectAstroid.appendChild(newFlag)
    },
    launch: function (id) {
      detaiPage.open = false
      let article = document.querySelector('article')
      let astroidSelect = document.querySelector('[data-id="' + id + '"]')
      let landedRocket = document.querySelector('.landing')
      landedRocket.classList.add('launch')
      landedRocket.classList.remove('landing')
      astroidSelect.classList.add('animationCloseAstroid')

      this.selectEl.style.top = 0
      rocket.top = 0
      this.selectEl.style.left = 0
      rocket.left = 0
      this.selectEl.dataset.orientation = 'up'

      setTimeout(function () {
        astroidSelect.classList.remove('animationCloseAstroid')
        astroidSelect.classList.remove('animationOpenAstroid')
        landedRocket.parentNode.removeChild(landedRocket)
        article.parentNode.removeChild(article)
      }, 2500)

      socket.emit('launch', {neoId: id, userId: socket.io.id})

      console.log('launch')
    } 
  }

  const astroid = {
    init: function () {
      astroid.create()
    },
    detai: function (e) {
      console.log(e.target.dataset.name)
    },
    create: function () {
      astroid.nsaData.forEach(function (data) {
        let newAstroid = document.createElement('div')
        let newAstroidText = document.createTextNode(data.name)
  
        newAstroid.classList.add('🌠')
        newAstroid.dataset.id = data.neo_reference_id

        newAstroid.style.left = data.left + '%'
        newAstroid.style.top = data.top + '%'
        newAstroid.style.width = data.size + 'px'
        newAstroid.style.height = data.size + 'px'

        newAstroid.appendChild(newAstroidText)
        space.selectEl.appendChild(newAstroid)

        data.middle = {
          x: newAstroid.getBoundingClientRect().left + newAstroid.getBoundingClientRect().width / 2,
          y: newAstroid.getBoundingClientRect().top + newAstroid.getBoundingClientRect().height / 2
        }

      })
    }
  }

  const space = {
    selectEl: document.querySelector('.🌌'),
    height: document.querySelector('.🌌').getBoundingClientRect().height,
    width: document.querySelector('.🌌').getBoundingClientRect().width
  }

  const detaiPage = {
    open: false,
    render: function (id) {
      let astroidSelect = document.querySelector('[data-id="' + id + '"]')

      let landingRocket = document.createElement('div')
      let landingRocketImage = document.createElement('div')
      landingRocket.classList.add('client')
      landingRocket.classList.add('landing')
      landingRocketImage.classList.add('image')

      let infoAstroid = document.createElement('article')
      let pAstroid = document.createElement('p')
      let button = document.createElement('button')
      let buttonText = document.createTextNode('Launch')

      button.appendChild(buttonText)

      button.addEventListener('click', function (e) {
        rocket.launch(id)
      })

      landingRocket.appendChild(landingRocketImage)
      astroidSelect.appendChild(landingRocket)

      infoAstroid.appendChild(pAstroid)
      infoAstroid.appendChild(button)
      astroidSelect.appendChild(infoAstroid)

      astroidSelect.classList.add('animationOpenAstroid')
    }
  }

  app.init()
}) ()