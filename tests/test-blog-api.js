'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
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
}

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
}

//teardown test database 
function tearDownDb() {
  console.warn('deleting test database');
  return mongoose.connection.dropDatabase();
}

//test CRUD endpoints 
describe('blog posts API integration tests', function() {
  const expectedKeys = ['id', 'author', 'title', 'content', 'created'];

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
          res.body.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        //num of returned posts should equal to num of posts in database
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });
    
    it('should return blog posts with expected keys', function () { 
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          //check res for correct type, status, and if any at all
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array'); 
          res.body.should.have.length.of.at.least(1);
          //check each res for keys
          res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys(expectedKeys);
          });
          //retrieve individual post & check for correct values 
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {
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
          res.body.should.include.keys(expectedKeys); 
          res.body.id.should.not.be.null;
          res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);  
          res.body.title.should.equal(newPost.title);
          res.body.content.should.equal(newPost.content);
          //return the post as promise
          return BlogPost.findById(res.body.id); 
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
  //get an existing post from db > make PUT request to change content > check that post was updated
  describe('PUT endpoint', function() {
    it('should update an existing blog post', function() {
      const updateData = {
        title: 'title successfully changed',
        content: 'the content has been modified successfully'
      };
        //get a document from database
      return BlogPost.findOne()
        .then(function(post) {
          updateData.id = post.id;
          //make PUT request to send updated data to retrieved post 
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        //retrieve post from db
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        //check post in database to make sure it has updated content
        .then(function(post) {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
        });
    });
  });
  //Delete end point -- remove from db and confirm it is not in db
  describe('DELETE endpoint', function() {
    it('should remove post from database using /posts/:id', function() {
      let postToDelete;
      //retieve a post
      return BlogPost.findOne()
        .then(function(existingPost) {
          postToDelete = existingPost;
          //delete retrieved post
          return chai.request(app)
            .delete(`/posts/${postToDelete}._id`)
          //retrieve id of deleted post
            .then(function(res) {
              res.should.have.status(204);
              return BlogPost.findById(postToDelete.id);
            })
          //confirm that it doesn't exist in database
            .then(function(res) {
              should.not.exist(res);
            });
        });
    });
  });
});