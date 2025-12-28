import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Activity from "../src/models/Activity.js";
import { cleanUpDatabase, disconnectDb, generateTokenFor } from "./utils.js";

describe("Activity routes", () => {
  jest.setTimeout(30000);
  let mongoServer;
  let user;
  let token;
  let otherUser;
  let otherToken;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ✅ GET /activities
  describe("GET /activities", () => {
    test("should list all activities with pagination", async () => {
      // Créer 15 activités
      for (let i = 0; i < 15; i++) {
        await Activity.create({
          title: `Activity ${i}`,
          location: "Lausanne",
          mood: i % 2 === 0 ? "calm" : "social",
          price_range: i % 2,
          user_id: user._id,
        });
      }

      const res = await request(app)
        .get("/activities")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.items).toHaveLength(10); // Default limit
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBe(15);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    test("should support custom page and limit", async () => {
      for (let i = 0; i < 15; i++) {
        await Activity.create({
          title: `Activity ${i}`,
          location: "Lausanne",
          user_id: user._id,
        });
      }

      const res = await request(app)
        .get("/activities?page=2&limit=5")
        .expect(200);

      expect(res.body.items).toHaveLength(5);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });

    test("should filter by mood", async () => {
      await Activity.create({
        title: "Yoga",
        location: "Lausanne",
        mood: "calm",
        user_id: user._id,
      });
      await Activity.create({
        title: "Party",
        location: "Lausanne",
        mood: "social",
        user_id: user._id,
      });

      const res = await request(app)
        .get("/activities?mood=calm")
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].mood).toBe("calm");
      expect(res.body.pagination.total).toBe(1);
    });

    test("should filter by price_range", async () => {
      await Activity.create({
        title: "Free Activity",
        location: "Lausanne",
        price_range: 0,
        user_id: user._id,
      });
      await Activity.create({
        title: "Expensive Activity",
        location: "Lausanne",
        price_range: 3,
        user_id: user._id,
      });

      const res = await request(app)
        .get("/activities?price_range=1")
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].price_range).toBe(0);
    });

    test("should filter with multiple parameters", async () => {
      await Activity.create({
        title: "Calm Free",
        location: "Lausanne",
        mood: "calm",
        price_range: 0,
        user_id: user._id,
      });
      await Activity.create({
        title: "Calm Expensive",
        location: "Lausanne",
        mood: "calm",
        price_range: 3,
        user_id: user._id,
      });

      const res = await request(app)
        .get("/activities?mood=calm&price_range=1")
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].title).toBe("Calm Free");
    });

    test("should return empty list when no matches", async () => {
      await Activity.create({
        title: "Activity",
        location: "Lausanne",
        mood: "calm",
        user_id: user._id,
      });

      const res = await request(app)
        .get("/activities?mood=energetic")
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  // ✅ POST /activities
  describe("POST /activities", () => {
    test("should create an activity when authenticated", async () => {
      const res = await request(app)
        .post("/activities")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Yoga Class",
          location: "Lausanne",
          mood: "calm",
          price_range: 1,
        })
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe("Yoga Class");
      expect(res.body.user_id).toBe(user._id.toString());
      expect(res.body.source).toBe("user");

      const created = await Activity.findById(res.body._id);
      expect(created).not.toBeNull();
    });

    test("should reject when not authenticated", async () => {
      await request(app)
        .post("/activities")
        .send({
          title: "Yoga Class",
          location: "Lausanne",
        })
        .expect(401);
    });

    test("should reject when title is missing", async () => {
      const res = await request(app)
        .post("/activities")
        .set("Authorization", `Bearer ${token}`)
        .send({
          location: "Lausanne",
        })
        .expect(422);

      expect(res.body).toHaveProperty("errors");
    });

    test("should reject when location is missing", async () => {
      const res = await request(app)
        .post("/activities")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Yoga Class",
        })
        .expect(422);

      expect(res.body).toHaveProperty("errors");
    });
  });

  // ✅ GET /activities/:id
  describe("GET /activities/:id", () => {
    test("should return a single activity", async () => {
      const activity = await Activity.create({
        title: "Yoga",
        location: "Lausanne",
        user_id: user._id,
      });

      const res = await request(app)
        .get(`/activities/${activity._id}`)
        .expect(200);

      expect(res.body.title).toBe("Yoga");
      expect(res.body._id).toBe(activity._id.toString());
    });

    test("should return 404 when activity not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/activities/${fakeId}`)
        .expect(404);
    });

    test("should return 400 with invalid ID format", async () => {
      await request(app)
        .get("/activities/invalid-id")
        .expect(400);
    });
  });

  // ✅ PATCH /activities/:id
  describe("PATCH /activities/:id", () => {
    test("should update own activity", async () => {
      const activity = await Activity.create({
        title: "Old Title",
        location: "Lausanne",
        user_id: user._id,
      });

      const res = await request(app)
        .patch(`/activities/${activity._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New Title",
        })
        .expect(200);

      expect(res.body.title).toBe("New Title");
      expect(res.body.location).toBe("Lausanne"); // Unchanged
    });

    test("should reject update of other user's activity", async () => {
      const activity = await Activity.create({
        title: "Alice's Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .patch(`/activities/${activity._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          title: "Hacked Title",
        })
        .expect(403);
    });

    test("should reject when not authenticated", async () => {
      const activity = await Activity.create({
        title: "Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .patch(`/activities/${activity._id}`)
        .send({
          title: "New Title",
        })
        .expect(401);
    });

    test("should return 404 when activity not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .patch(`/activities/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New Title",
        })
        .expect(404);
    });
  });

  // ✅ DELETE /activities/:id
  describe("DELETE /activities/:id", () => {
    test("should delete own activity", async () => {
      const activity = await Activity.create({
        title: "Activity to Delete",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .delete(`/activities/${activity._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const deleted = await Activity.findById(activity._id);
      expect(deleted).toBeNull();
    });

    test("should reject delete of other user's activity", async () => {
      const activity = await Activity.create({
        title: "Alice's Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .delete(`/activities/${activity._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      // Activity should still exist
      const still = await Activity.findById(activity._id);
      expect(still).not.toBeNull();
    });

    test("should reject when not authenticated", async () => {
      const activity = await Activity.create({
        title: "Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .delete(`/activities/${activity._id}`)
        .expect(401);
    });

    test("should return 404 when activity not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .delete(`/activities/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });

  // ✅ POST /activities/:id/like
  describe("POST /activities/:id/like", () => {
    test("should toggle like on activity", async () => {
      const activity = await Activity.create({
        title: "Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      // Like
      let res = await request(app)
        .post(`/activities/${activity._id}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.liked).toBe(true);

      // Unlike
      res = await request(app)
        .post(`/activities/${activity._id}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.liked).toBe(false);
    });

    test("should reject like when not authenticated", async () => {
      const activity = await Activity.create({
        title: "Activity",
        location: "Lausanne",
        user_id: user._id,
      });

      await request(app)
        .post(`/activities/${activity._id}/like`)
        .expect(401);
    });

    test("should return 404 when activity not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(`/activities/${fakeId}/like`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });
});
