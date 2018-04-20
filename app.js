const express = require('express')
const app = express()
const nunjucks = require('nunjucks')
const fetch = require('node-fetch')
const http = require('http').Server(app)
const io = require('socket.io')(http)

const rockets = []

const dayInMilliseconds = 1000 * 60 * 60 * 24

let today = new Date()
let dd = today.getDate()
let mm = today.getMonth() + 1
let yyyy = today.getFullYear()
let apiKey = 'Demo_Key'

const api = {
  nsaData: function () {
    fetch('https://api.nasa.gov/neo/rest/v1/feed?start_date=' + yyyy + '-' + mm + '-' + dd + '&end_date=' + yyyy + '-' + mm + '-' + dd + '&api_key=' + apiKey)
    .then(function (res) {
      return res.json()
    })
    .then(function (data) {
      nsaData = data.near_earth_objects[Object.keys(data.near_earth_objects)[0]]
      console.log(nsaData)
    })
  }, 
  interval: function () {
    setInterval(function () { 
      today = new Date()
      dd = today.getDate()
      mm = today.getMonth() + 1
      yyyy = today.getFullYear()
    
      console.log('interval')

      api.nsaData()
    
     }, dayInMilliseconds)
  }
}

api.nsaData()
api.interval()

app.use(express.static(__dirname + '/sources'))

nunjucks.configure('sources/views', {
  autoescape: true,
  express: app
})

app.get('/', function (req, res){
  res.render('index.html')
})

io.on('connection', function (socket) {
  obj = {
    userId: socket.id
  }
  rockets.push(obj)

  io.to(socket.id).emit('hello', rockets)
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

  socket.on('disconnect', function () {
    rockets.forEach(function (userRocket, i) {
      if (userRocket.userId === socket.id) {
        rockets.splice(i, 1)
      }
    })
    socket.broadcast.emit('disconnection', {userId: socket.id})
  })
})

http.listen(process.env.PORT || 3000, function () {
  console.log('listening');
})
    