const express = require('express')
const dotenv = require('dotenv')
const app = express()
const nunjucks = require('nunjucks')
const fetch = require('node-fetch')
const http = require('http').Server(app)
const io = require('socket.io')(http)

dotenv.config()

let rockets = []
let nsaData = {}

const dayInMilliseconds = 1000 * 60 * 60 * 24

let today = new Date()
let dd = today.getDate()
let mm = today.getMonth() + 1
let yyyy = today.getFullYear()
let apiKey = process.env.API_KEY

const api = {
  nsaData: function () {
    fetch('https://api.nasa.gov/neo/rest/v1/feed?start_date=' + yyyy + '-' + mm + '-' + dd + '&end_date=' + yyyy + '-' + mm + '-' + dd + '&api_key=' + apiKey)
    .then(function (res) {
      return res.json()
    })
    .then(function (data) {
      nsaData = data.near_earth_objects[Object.keys(data.near_earth_objects)[0]]
      nsaData.forEach(function (data) {
        data.size = data.estimated_diameter.meters.estimated_diameter_max / 5
        data.top = Math.random() * 85 + 5
        data.left = Math.random() * 85 + 5
      })
      console.log(nsaData)
      return nsaData
    })
  }
}

api.nsaData()

app.use(express.static(__dirname + '/sources'))

nunjucks.configure('sources/views', {
  autoescape: true,
  express: app
})

app.get('/', function (req, res){
  res.render('index.html', {
    data: nsaData
  })
})

io.on('connection', function (socket) {
  obj = {
    userId: socket.id
  }
  rockets.push(obj)

  io.to(socket.id).emit('hello', {rocketsArray: rockets, nsaData: nsaData})
  socket.broadcast.emit('userConnection', {userId: socket.id})  

  socket.on('flying', function (data) {
    rockets.forEach(function (userRocket) {
      if (userRocket.userId === socket.id) {
          userRocket.rocketLeft = data.rocketLeft
          userRocket.rocketTop = data.rocketTop
          userRocket.orientation = data.orientation
      }
    }) 
    socket.broadcast.emit('flying', data)
  })

  socket.on('landing', function (data) {
    console.log(data)
    rockets.forEach(function (userRocket) {
      if (userRocket.userId === data.userId) {
          userRocket.neoId = data.neoId
      }
    })
    socket.broadcast.emit('landing', data)
  })

  socket.on('launch', function (data) {
    rockets.forEach(function (userRocket) {
      if (userRocket.userId === data.userId) {
          userRocket.neoId = false
          userRocket.rocketLeft = 0
          userRocket.rocketTop = 0
          userRocket.orientation = 'up'
      }
    })
    socket.broadcast.emit('launch', data)
  })

  socket.on('disconnect', function () {
    rockets.forEach(function (userRocket, i) {
      if (userRocket.userId === socket.id) {
        rockets.splice(i, 1)
      }
    })
    socket.broadcast.emit('disconnection', {userId: socket.id})
  })
})

http.listen(process.env.PORT, function () {
  console.log('listening');
})