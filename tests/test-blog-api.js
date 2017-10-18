'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closerServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//seed data to test database
function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];
    for (let i=1; i<10; i++) {
      seedData.push(generateFakeBlogPost());
    }
    return BlogPost.insertMany(seedData);
};

//generate fake blog posts
function generateFakeBlogPost() { 
  return {
    author: {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName()
    },
  title: faker.company.catchPhrase(),
  content: faker.lorem.paragraph(3),
  created: faker.date.recent()
  };
};

//teardown test database 
function tearDownDb() {
  console.warn('deleting test database');
  return mongoose.connect.dropDatabase();
};

//test CRUD endpoints 
describe('blog posts API integration tests', function() {
  const expectedKeys = ['id', 'author', 'title', 'content', 'created']

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  beforeEach(function() {
    return seedBlogPostData();
  });
  afterEach(function() {
    return tearDownDb();
  });
  after(function () {
    return closeServer();
  });
  //GET endpoint - return all posts in DB & check for keys 
  describe('GET endpoints', function() {
    it('should return all existing blog posts', function () {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.posts.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        //num of returned posts should equal to num of posts in database
        .then(function(count) {
          res.body.posts.length.should.be.equal(count);
        });
      });
    
    it('should return blog posts with expected keys', function () { 
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          //check res for correct type, status, and if any at all
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('array'); // body vs res? 
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys(expectedKeys);
          })
          //check individual post for correct values 
          .then (function(post) {
            resPost = post.body[0];
            resPost.title.should.equal(post.title);
            resPost.content.should.equal(post.content);
            resPost.author.should.equal(post.authorName);
          });
        });
      });
    //POST end point - make a new entry > check for keys > check for id
    describe('POST endpoint', function() {
      it('should make a new post', function() {
        const newPost = generateFakeBlogPost(); 
        chai.request(app)
          .post('/posts') 
          .send(newPost)
          .then(function(res) {
            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.include.keys(expectedKeys); //will this work? 

            res.body.id.should.not.be.null;
            res.body.author.should.equal(authorName); //why split it like the solution? 
            res.body.title.should.equal(newPost.title);
            res.body.content.should.equal(newPost.content);
            return BlogPost.findById(res.body.id); //retrieve the post
          }) 
          //check to see if the post returned from db matches the one submitted 
          .then(function(post) {
            post.title.should.equal(newPost.title);
            post.content.should.equal(newPost.content);
            post.author.firstName.should.equal(newPost.author.firstName);
            post.author.lastName.should.equal(newPost.author.lastName);
            });
          });
        });