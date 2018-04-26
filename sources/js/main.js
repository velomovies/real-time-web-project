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
        if (!space.isOffline) {
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
        }        
      })
      this.io.on('disconnection', function (data) {
        rocket.delete(data)
        let selectAstroidFlag = document.querySelector('.' + data.userId)
        if(selectAstroidFlag) {
          selectAstroidFlag.parentNode.removeChild(selectAstroidFlag)
        }
      })
      this.io.on('userConnection', function (data) {
          rocket.create(data)
      })
      this.io.on('flying', function (data) {
        let dataNumber = data.userId
        let dataString = dataNumber.toString()
        let selectUserEl = document.querySelector('[data-user="' + dataString + '"]')
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
        let selectAstroidFlag = selectAstroid.querySelector('.' + data.userId)
        selectAstroidFlag.parentNode.removeChild(selectAstroidFlag)
        selectUserEl.classList.remove('land')
        selectUserEl.style.top = 0
        selectUserEl.style.left = 0
        selectUserEl.dataset.orientation = 'up'
      })
      this.io.on('connect_error', function () {
        let errorMessage = document.querySelector('.error')
        errorMessage.classList.add('show')
        space.isOffline = true
      })
      this.io.on('connect', function () {
        if (space.isOffline) {
          socket.countDown()
        }
      })
    },
    countDown: function () {
      let timeleft = 10
      let countdownTimer = setInterval(function() {

        timeleft--

        let errorMessage = document.querySelector('.error p')
        errorMessage.innerHTML = 'De pagina wordt over ' + timeleft + ' seconden herladen'

        if (timeleft <= 0) {
          location.reload()
          clearInterval(countdownTimer)
        }
      }, 1000);
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
              detaiPage.render(data)
          }
        })
      }
    },
    land: function (data) {
      let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
      let selectAstroid = document.querySelector('[data-id="' + data.neoId + '"]')
      selectUserEl.classList.add('land')

      let newFlagDiv = document.createElement('div')
      let newFlag = document.createElement('div')
      newFlagDiv.classList.add('flag')
      newFlag.classList.add(data.userId)

      newFlag.appendChild(newFlagDiv)
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
    nsaData: {},
    init: function () {
      astroid.create()
    },
    detai: function (e) {
      console.log(e.target.dataset.name)
    },
    create: function () {
      astroid.nsaData.forEach(function (data) {
        let newAstroid = document.createElement('div')
        let newAstroidp = document.createElement('p')
        let newAstroidText = document.createTextNode(data.name)
  
        newAstroid.classList.add('🌠')
        newAstroid.dataset.id = data.neo_reference_id

        newAstroid.style.left = data.left + '%'
        newAstroid.style.top = data.top + '%'
        newAstroid.style.width = data.size + 'px'
        newAstroid.style.height = data.size + 'px'

        newAstroidp.appendChild(newAstroidText)
        newAstroid.appendChild(newAstroidp)
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
    render: function (data) {
      let astroidSelect = document.querySelector('[data-id="' + data.neo_reference_id + '"]')

      let landingRocket = document.createElement('div')
      let landingRocketImage = document.createElement('div')
      landingRocket.classList.add('client')
      landingRocket.classList.add('landing')
      landingRocketImage.classList.add('image')

      let infoAstroid = document.createElement('article')
      let button = document.createElement('button')
      let buttonText = document.createTextNode('Launch')

      button.appendChild(buttonText)

      button.addEventListener('click', function (e) {
        rocket.launch(data.neo_reference_id)
      })

      landingRocket.appendChild(landingRocketImage)
      astroidSelect.appendChild(landingRocket)

      detaiPage.fillText(data, infoAstroid)

      infoAstroid.appendChild(button)
      astroidSelect.appendChild(infoAstroid)

      astroidSelect.classList.add('animationOpenAstroid')
    },
    fillText: function (data, infoAstroid) {
      console.log(data)
      let text = `
      <h1>This is ${data.name}</h1>
      <p>This asteroid is orbiting ${data.close_approach_data[0].orbiting_body} and is going ${data.close_approach_data[0].relative_velocity.kilometers_per_hour} km/h.
      <p>Its estimated diameter is between ${Math.floor(Number(data.estimated_diameter.meters.estimated_diameter_min))}m and ${Math.floor(Number(data.estimated_diameter.meters.estimated_diameter_max))}m. It is probable not a circle, hence the numbers can differ so much.</p>
      <p>Today it will be as close as ${data.close_approach_data[0].miss_distance.kilometers} kilometers to earth.</p>

      <a href="${data.nasa_jpl_url}" target="_blank">Read more about this asteroid</a>
      `

      infoAstroid.insertAdjacentHTML('afterbegin', text)
    }
  }

  app.init()
}) ()