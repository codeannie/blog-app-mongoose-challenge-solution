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

//generate blog posts
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

//teardown database 
function tearDownDb() {
  console.warn('deleting test database');
  return mongoose.connect.dropDatabase();
};

//test CRUD endpoints 
describe('blog posts API integration tests', function() {
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
  describe('GET endpoints', function () {
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
        .then(function(count) {
          res.body.posts.length.should.be.equal(count);
        });
      });
    
    it('should return posts with expected keys', function () { //?
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {

        })
  })
})

