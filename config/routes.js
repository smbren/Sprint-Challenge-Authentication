require('dotenv').config();

const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../database/dbConfig.js');

const { authenticate } = require('./middlewares');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {

  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 16);
  
  creds.password = hash;

  db('users')
    .insert(creds)
    .then(ids => { 
      res.status(201).json(ids);
    })
    .catch(err => res.json(err));

}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
    
  }
  const jwtKey = 'Why can’t banks keep secrets? There are too many tellers!';
  const options = {
    expiresIn: '30m',
  };

  return jwt.sign(payload, jwtKey, options);
}

function login(req, res) {

  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first().then(user => {

      if( user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ message: 'welcome!', token});
      } else {
        res.status(401).json({ message: 'Username or Password is invalid.'});
      }

  })
  .catch(err => res.json(err));

}

function getJokes(req, res) {
  axios
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
