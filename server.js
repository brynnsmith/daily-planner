// Use express by requiring it
const express = require('express');
const bodyParser = require('body-parser');
const { response, request } = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
let PORT;
// Not currently working -- have to bug fix to switch port
    if (process.env.STATUS === 'production') {
        PORT = process.env.PROD_PORT
    }
    PORT = process.env.DEV_PORT;

const dotenv = require('dotenv')
dotenv.config()

let db;
let dbConnectionString = process.env.DB_STRING;
let dbName = 'todoList'
let todoList

// Connect to MongoDB
MongoClient.connect(dbConnectionString, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName)
        todoList = db.collection('todoList')
        console.log(`Connected to ${dbName} database`)
        })


// Set ejs as the templating language
app.set('view engine', 'ejs');

// Place body-parser before your CRUD handlers
app.use(bodyParser.urlencoded({ extended: true}))

// Tell Express to make the public folder accessible by using express.static
app.use(express.static('public'))

app.use(express.json())

// Create a get request for To Do List database (read)
app.get('/', async (req, res) => {
    const todoItems = await db.collection('todoList').find().toArray()
    const itemsLeft = await db.collection('todoList').countDocuments({ completed: false })
    res.render('index.ejs', { items: todoItems, left: itemsLeft })
})

// Create a post request for new To Do Item (create)
app.post('/addTodo', (req, res) => {
    todoList.insertOne({ thing: req.body.todoItem, completed: false })
        .then(result => {
            console.log('To Do Item Added')
            res.redirect('/')
        })
        .catch(error => console.error(error))
})

// Update a To Do Item to Completed
app.put('/markComplete', (req, res) => {
    db.collection('todoList').updateOne({thing: req.body.itemFromJS},{
        $set: {
            completed: true
          }
    },{
        sort: {_id: -1},
        upsert: false
    })
    .then(result => {
        console.log('Marked Complete')
        result.json('Marked Complete')
        res.redirect('/')
    })
    .catch(error => console.error(error))
})

// Update a To Do Item to Uncompleted
app.put('/markUnComplete', (req, res) => {
    db.collection('todoList').updateOne({thing: req.body.itemFromJS},{
        $set: {
            completed: false
          }
    },{
        sort: {_id: -1},
        upsert: false
    })
    .then(result => {
        console.log('Marked Complete')
        result.json('Marked Complete')
        res.redirect('/')
    })
    .catch(error => console.error(error))

})

// Delete a To Do Item 
app.delete('/deleteItem', (req, res) => {
    db.collection('todoList').deleteOne({ thing: req.body.itemFromJS })
    .then(result => {
        console.log('Todo Deleted')
        result.json('Todo Deleted')
        res.redirect('/')
    })
    .catch(error => console.error(error))

})

// Create a server for browser to connect to using Express's listen method
app.listen(process.env.PROD_PORT || PORT, () => {
    console.log(`Server in ${process.env.STATUS} mode, listening on *:${process.env.PROD_PORT}`)
})