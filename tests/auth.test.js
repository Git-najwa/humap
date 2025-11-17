import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/User.js";
import { cleanUpDatabase, disconnectDb } from "./utils.js";

describe("Auth routes", () => {
  jest.setTimeout(30000);
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await cleanUpDatabase();
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test("POST /auth/register should create a user and return a token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        username: "tester",
        email: "tester@example.com",
        password: "Passw0rd!",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body.user).toBeObject();
    expect(res.body.user.email).toEqual("tester@example.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeString();

    const created = await User.findOne({ email: "tester@example.com" });
    expect(created).not.toBeNull();
  });

  test("POST /auth/login should authenticate and return a token", async () => {
    await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "SuperSecure1!",
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "SuperSecure1!" })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.token).toBeString();
    expect(res.body.user.email).toEqual("alice@example.com");
  });

  test("GET /auth/me should return the current user when authenticated", async () => {
    const user = await User.create({
      username: "bob",
      email: "bob@example.com",
      password: "SuperSecure1!",
    });
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "bob@example.com", password: "SuperSecure1!" })
      .expect(200);

    const token = login.body.token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.email).toEqual("bob@example.com");
    expect(res.body.password).toBeUndefined();
    expect(res.body._id).toMatch(/^[0-9a-f]{24}$/);
  });

  test("POST /auth/login should reject invalid credentials", async () => {
    await User.create({
      username: "charlie",
      email: "charlie@example.com",
      password: "SuperSecure1!",
    });

    await request(app)
      .post("/auth/login")
      .send({ email: "charlie@example.com", password: "wrong" })
      .expect(401);
  });
});
