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
        data.forEach(function (dataItem) {
          if (dataItem.userId !== socket.io.id) { 
            rocket.create(dataItem)
            if (dataItem.rocketTop || dataItem.rocketLeft) {
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
    }
  }

  const move = {
    init: function () {
      let self = this
      window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
      
      socket.emit('flying', {rocketLeft: rocket.left + '%', rocketTop: rocket.top + '%', orientation: rocket.orientation, userId: socket.io.id})

      rocket.position(rocket.top + '%', rocket.left + '%', rocket.orientation)
      
    }
  }

  const rocket = {
    speed: 1,
    selectEl: document.querySelector('.rocket'),
    top: 0,
    left: 0,
    orientation: 'up',
    width: document.querySelector('.rocket').getBoundingClientRect().width,
    height: document.querySelector('.rocket').getBoundingClientRect().height,
    position: function (top, left, orientation, user) {
      if (user) {
        let selectUserEl = document.querySelector('[data-user="' + user + '"]')
        selectUserEl.style.top = top
        selectUserEl.style.left = left
        selectUserEl.dataset.orientation = orientation
      } else {
        this.selectEl.style.top = top
        this.selectEl.style.left = left
        this.selectEl.dataset.orientation = orientation
      }
    },
    create: function (data) {
      newRocket = document.createElement('div')
      newRocket.classList.add('rocket')
      newRocket.dataset.user = data.userId
      space.selectEl.appendChild(newRocket)
    },
    delete: function (data) {
      let selectUserEl = document.querySelector('[data-user="' + data.userId + '"]')
      if (selectUserEl) {
        selectUserEl.remove()
      }
    } 
  }

  const astroid = {
    create: function (nsaData) {
      console.log(nsaData)
    }
  }

  const space = {
    selectEl: document.querySelector('.space'),
    height: document.querySelector('.space').getBoundingClientRect().height,
    width: document.querySelector('.space').getBoundingClientRect().width
  }

  app.init()
}) ()