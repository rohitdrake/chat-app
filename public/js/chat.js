const socket = io() 

// Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $submitButton = $messageForm.querySelector('#submit-button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#message-box')

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

let { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

function generateDate()
{
    return moment().format('LT')
}

function addMessage(text) 
{
    let rendered = Mustache.render(messageTemplate, { date: generateDate(), message: text})

    $messages.insertAdjacentHTML('beforeend', rendered)
}

function addLocation(locationURL)
{
    let rendered = Mustache.render(locationTemplate, {date: generateDate(), location: locationURL})

    $messages.insertAdjacentHTML('beforeend', rendered)
}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = event.target.elements.message.value
    event.target.elements.message.value = ''
    socket.emit('sendMessage', message, (error) => {
        $submitButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocation.addEventListener('click', (event) => {
    const geo = navigator.geolocation

    
    $sendLocation.disabled = true

    geo.getCurrentPosition((pos) => {
        locationObject = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
        }
        socket.emit('sendLocation', locationObject, (response) => {
            $sendLocation.disabled = false
            console.log(response)
        })
    })
})


socket.emit('/join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})
