const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const path = require('path')
const { Server } = require('socket.io')
const io = new Server(server)
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const  { generateMessage, generateLocationMessage } = require('./utils/messages')


app.use(express.static(path.join(__dirname, '../public')))


io.on('connection', (socket) => {

    socket.on('/join', (options, callback) => {
        let {error, user} = addUser({ id: socket.id, ...options})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat.`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (recievedMsg, callback) => {
        let user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, recievedMsg))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})



const port = process.env.PORT || 3000

server.listen(port, () => console.log(`server is listening on port ${port}`))
