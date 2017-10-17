'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('...models';)
const {app, runServer, closerServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//seed data to test db
function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];
    for (let i=1; i<10; i++) {
      seedData.push(generateFakeBlogPost)
    }
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

