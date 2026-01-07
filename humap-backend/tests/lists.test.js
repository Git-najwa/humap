import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Activity from "../src/models/Activity.js";
import UserActivityList from "../src/models/UserActivityList.js";
import { cleanUpDatabase, disconnectDb, generateTokenFor } from "./utils.js";

describe("List routes", () => {
  jest.setTimeout(30000);
  let mongoServer;
  let user;
  let token;
  let otherUser;
  let otherToken;
  let activity;
  let activity2;

  beforeAll(async () => {
    // Déconnecter si déjà connecté (quand les tests tournent ensemble)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await cleanUpDatabase();

    // Créer deux utilisateurs
    user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "SecurePass1!",
    });
    token = await generateTokenFor(user);

    otherUser = await User.create({
      username: "bob",
      email: "bob@example.com",
      password: "SecurePass1!",
    });
    otherToken = await generateTokenFor(otherUser);

    // Créer des activités
    activity = await Activity.create({
      title: "Test Activity",
      location: "Lausanne",
      coordinates: { type: "Point", coordinates: [6.6323, 46.5197] },
      user_id: user._id,
    });

    activity2 = await Activity.create({
      title: "Another Activity",
      location: "Geneva",
      coordinates: { type: "Point", coordinates: [6.1432, 46.2044] },
      user_id: user._id,
    });
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ✅ GET /lists
  describe("GET /lists", () => {
    test("should list user's lists when authenticated", async () => {
      // Créer quelques entrées de liste
      await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });
      await UserActivityList.create({
        user_id: user._id,
        activity_id: activity2._id,
        list_type: "history",
      });

      const res = await request(app)
        .get("/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveLength(2);
    });

    test("should return empty array for user without lists", async () => {
      const res = await request(app)
        .get("/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    test("should reject unauthenticated access", async () => {
      await request(app)
        .get("/lists")
        .expect(401);
    });

    test("should only return current user's lists", async () => {
      // Créer une liste pour alice
      await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });
      // Créer une liste pour bob
      await UserActivityList.create({
        user_id: otherUser._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      const res = await request(app)
        .get("/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  // ✅ POST /lists
  describe("POST /lists", () => {
    test("should add activity to liked list", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          list_type: "liked",
          activity_id: activity._id,
        })
        .expect(201);

      expect(res.body).toHaveProperty("list_type", "liked");
      expect(res.body).toHaveProperty("activity_id");
    });

    test("should add activity to history list", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          list_type: "history",
          activity_id: activity._id,
        })
        .expect(201);

      expect(res.body).toHaveProperty("list_type", "history");
    });

    test("should create custom list with name", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          list_type: "custom",
          custom_name: "My Favorites",
          activity_id: activity._id,
        })
        .expect(201);

      expect(res.body).toHaveProperty("list_type", "custom");
      expect(res.body).toHaveProperty("custom_name", "My Favorites");
    });

    test("should reject custom list without name", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          list_type: "custom",
          activity_id: activity._id,
        })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    test("should reject request without list_type", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          activity_id: activity._id,
        })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    test("should reject non-custom list without activity_id", async () => {
      const res = await request(app)
        .post("/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({
          list_type: "liked",
        })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    test("should reject unauthenticated request", async () => {
      await request(app)
        .post("/lists")
        .send({
          list_type: "liked",
          activity_id: activity._id,
        })
        .expect(401);
    });
  });

  // ✅ GET /lists/:listId
  describe("GET /lists/:listId", () => {
    test("should get a specific list entry", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      const res = await request(app)
        .get(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("list_type", "liked");
    });

    test("should reject access to other user's list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      const res = await request(app)
        .get(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    test("should return 404 for non-existent list", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/lists/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ PATCH /lists/:listId
  describe("PATCH /lists/:listId", () => {
    test("should update list name", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "custom",
        custom_name: "Original Name",
      });

      const res = await request(app)
        .patch(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" })
        .expect(200);

      expect(res.body).toHaveProperty("custom_name", "New Name");
    });

    test("should reject updating other user's list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "custom",
        custom_name: "Alice's List",
      });

      const res = await request(app)
        .patch(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Hacked!" })
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    test("should return 404 for non-existent list", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/lists/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Update" })
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ DELETE /lists/:listId
  describe("DELETE /lists/:listId", () => {
    test("should delete own list entry", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      await request(app)
        .delete(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const deleted = await UserActivityList.findById(list._id);
      expect(deleted).toBeNull();
    });

    test("should reject deleting other user's list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      const res = await request(app)
        .delete(`/lists/${list._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body).toHaveProperty("message");

      // Verify not deleted
      const still = await UserActivityList.findById(list._id);
      expect(still).not.toBeNull();
    });

    test("should return 404 for non-existent list", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/lists/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ POST /lists/:listId/activities
  describe("POST /lists/:listId/activities", () => {
    test("should add activity to existing custom list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "custom",
        custom_name: "My Collection",
      });

      const res = await request(app)
        .post(`/lists/${list._id}/activities`)
        .set("Authorization", `Bearer ${token}`)
        .send({ activity_id: activity2._id })
        .expect(201);

      expect(res.body).toHaveProperty("activity_id");
      expect(res.body).toHaveProperty("custom_name", "My Collection");
    });

    test("should reject adding to non-custom list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "liked",
      });

      const res = await request(app)
        .post(`/lists/${list._id}/activities`)
        .set("Authorization", `Bearer ${token}`)
        .send({ activity_id: activity2._id })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    test("should reject adding to other user's list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "custom",
        custom_name: "Alice's List",
      });

      const res = await request(app)
        .post(`/lists/${list._id}/activities`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ activity_id: activity2._id })
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ DELETE /lists/:listId/activities/:activityId
  describe("DELETE /lists/:listId/activities/:activityId", () => {
    test("should remove activity from list", async () => {
      const list = await UserActivityList.create({
        user_id: user._id,
        activity_id: activity._id,
        list_type: "custom",
        custom_name: "My Collection",
      });

      await request(app)
        .delete(`/lists/${list._id}/activities/${activity._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const deleted = await UserActivityList.findById(list._id);
      expect(deleted).toBeNull();
    });

    test("should return 404 for non-existent entry", async () => {
      const fakeListId = new mongoose.Types.ObjectId();
      const fakeActivityId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/lists/${fakeListId}/activities/${fakeActivityId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });
});
