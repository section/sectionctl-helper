const express = require('express')
const bodyParser = require('body-parser')

const port = process.env.PORT || 8080
const app = express()
const distDir = 'replaceme'

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(__dirname + '/' + distDir))

app.listen(port)
console.log(`Server listening at http://localhost:${port}`)
