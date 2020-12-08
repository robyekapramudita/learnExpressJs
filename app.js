const { query } = require('express');
const express = require('express');
const Joi = require('joi');
const mysql = require('mysql');
const app = express();
require('dotenv').config();

app.use(express.json());

const courses =[
  { id: 1, name:'course 1'},
  { id: 2, name:'course 2'},
  { id: 3, name:'course 3'}
];

function createConnection() {
  let con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "lelangin_user",
    password: "P@ssword",
    database: 'lelangin_user_db'
  })
  return con;
}

function createPool() {
  return pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });
}

app.get('/', (req, res)=>{
  res.send('Hello World!!');
});

app.get('/api/courses', (req, res)=>{
  try{
    con = createConnection();
    con.connect((err) => {
      if(err){
        reject(err);    
      }
    });

    let sql = `SELECT * FROM role`;

    new Promise((resolve, reject) => { con.query(sql, (err, result) => {
      if(err){
        reject(err);
      }
      let resultList = result.map(x=>x.name);
      con.destroy();
      resolve(resultList);
    })}).then(resolve => {
      res.send(resolve);
    }).catch(reject=> {
      res.send(reject);
    })
  } catch(e){
    res.send(e);
  }
});

app.get('/api/courses/:id', (req, res)=>{
    const course = courses.find(c => c.id === parseInt(req.params.id))
  if(!course) return res.status(404).send(`The course with id ${req.params.id} doesn't exist.`);
  res.send(course);
});

app.post('/api/courses', (req, res) => {
  const {error} = validateCourse(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  const course = {
    id: courses.length + 1,
    name: req.body.name
  };
  courses.push(course);
  res.send(course);
});

app.put('/api/courses/:id', (req, res)=>{
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if(!course) return res.status(404).send(`The course with id ${req.params.id} doesn't exist.`);

  const {error} = validateCourse(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  
  course.name = req.body.name;
  res.send(course);
});

function validateCourse(course){
  const schema = {
    name: Joi.string().min(3).required(),
  };

  return Joi.validate(course, schema);
}

app.delete('/api/courses/:id', (req, res)=>{
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if(!course) return res.status(404).send(`The course with id ${req.params.id} doesn't exist.`);
  
  const index = courses.indexOf(course);
  courses.splice(index, 1);

  res.send(course);
});

app.get('/api/getData/:id', (req, res) => {
  try{
    pool = createPool();

    pool.query(`SELECT * from user WHERE id=${req.params.id}`, (err, result) => {
      if(err){
        res.send(err);
        res.end();
      }
      if(result.length > 0){
        res.send(result.pop());
      } else {
        res.send(`There is no data with id ${req.params.id}`)
      }
      res.end();
    })
  }catch(err) {
    res.send(err.code);
  }
});

app.post('/api/postData', (req, res) => {
  try{
    pool = createPool();    
    new Promise((resolve, reject) => {
      pool.query(`SELECT * from user ORDER BY id DESC LIMIT 1`, (err, result) => {
        if(err){
          reject(err);
        }
        resolve(result.pop());
      })
    }).then(resolve => {
      let id;
      if(resolve.id>0){
        return Number(resolve.id) + 1;
      }
      else{
        return 0;
      }
    }).then(resolve => {
      let sql = `INSERT INTO user (id, email, fullname, ktp_number, password, username) VALUES (${resolve}, '${req.body.email}', '${req.body.fullname}', ${req.body.ktp}, '${req.body.password}', '${req.body.username}');`

      pool.query(sql, (err, result) => {
        if(err){
          throw new Error(err);
        }
      })
    }).then(resolve => {
      pool.query(`SELECT * from user WHERE email=${req.body.email}`, (err, result)=> {
        res.send(result);
      })
    })
    .catch(reject => {
      throw new Error(reject);
    })
  } catch(e) {
    return res.send(e);
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on Port ${port}`));