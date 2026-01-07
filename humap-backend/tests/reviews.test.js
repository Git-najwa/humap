import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Activity from "../src/models/Activity.js";
import Review from "../src/models/Review.js";
import { cleanUpDatabase, disconnectDb, generateTokenFor } from "./utils.js";

describe("Review routes", () => {
  jest.setTimeout(30000);
  let mongoServer;
  let user;
  let token;
  let otherUser;
  let otherToken;
  let activity;

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

    // Créer une activité pour les reviews
    activity = await Activity.create({
      title: "Test Activity",
      location: "Lausanne",
      coordinates: { type: "Point", coordinates: [6.6323, 46.5197] },
      user_id: user._id,
    });
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ✅ GET /activities/:activityId/reviews
  describe("GET /activities/:activityId/reviews", () => {
    test("should list reviews for an activity", async () => {
      // Créer quelques reviews
      await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Great activity!",
        ranking: 5,
      });
      await Review.create({
        activity_id: activity._id,
        user_id: otherUser._id,
        comment: "Nice one",
        ranking: 4,
      });

      const res = await request(app)
        .get(`/activities/${activity._id}/reviews`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("items");
      expect(res.body.items).toHaveLength(2);
      expect(res.body).toHaveProperty("total", 2);
    });

    test("should return empty array for activity without reviews", async () => {
      const res = await request(app)
        .get(`/activities/${activity._id}/reviews`)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    test("should support pagination", async () => {
      // Créer 15 reviews
      for (let i = 0; i < 15; i++) {
        await Review.create({
          activity_id: activity._id,
          user_id: user._id,
          comment: `Review ${i}`,
          ranking: (i % 5) + 1,
        });
      }

      const res = await request(app)
        .get(`/activities/${activity._id}/reviews?page=2&limit=5`)
        .expect(200);

      expect(res.body.items).toHaveLength(5);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(5);
      expect(res.body.total).toBe(15);
    });

    test("should populate user info in reviews", async () => {
      await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Great!",
        ranking: 5,
      });

      const res = await request(app)
        .get(`/activities/${activity._id}/reviews`)
        .expect(200);

      expect(res.body.items[0]).toHaveProperty("user");
      expect(res.body.items[0].user).toHaveProperty("username", "alice");
    });
  });

  // ✅ GET /activities/:activityId/reviews/:id
  describe("GET /activities/:activityId/reviews/:id", () => {
    test("should get a single review by ID", async () => {
      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Amazing activity!",
        ranking: 5,
      });

      const res = await request(app)
        .get(`/activities/${activity._id}/reviews/${review._id}`)
        .expect(200);

      expect(res.body).toHaveProperty("comment", "Amazing activity!");
      expect(res.body).toHaveProperty("ranking", 5);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("username", "alice");
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/activities/${activity._id}/reviews/${fakeId}`)
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ POST /activities/:activityId/reviews
  describe("POST /activities/:activityId/reviews", () => {
    test("should create a review when authenticated", async () => {
      const res = await request(app)
        .post(`/activities/${activity._id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Loved it!",
          ranking: 5,
        })
        .expect(201);

      expect(res.body).toHaveProperty("comment", "Loved it!");
      expect(res.body).toHaveProperty("ranking", 5);
      expect(res.body).toHaveProperty("user");
    });

    test("should reject review creation without authentication", async () => {
      await request(app)
        .post(`/activities/${activity._id}/reviews`)
        .send({
          comment: "Nice!",
          ranking: 4,
        })
        .expect(401);
    });

    test("should reject review without ranking", async () => {
      const res = await request(app)
        .post(`/activities/${activity._id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Missing ranking",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message");
    });

    test("should reject ranking outside 1-5 range", async () => {
      const res = await request(app)
        .post(`/activities/${activity._id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Bad ranking",
          ranking: 6,
        })
        .expect(422);

      expect(res.body).toHaveProperty("message");
    });

    test("should increment user nb_reviews counter", async () => {
      const initialUser = await User.findById(user._id);
      const initialCount = initialUser.nb_reviews || 0;

      await request(app)
        .post(`/activities/${activity._id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Great!",
          ranking: 5,
        })
        .expect(201);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.nb_reviews).toBe(initialCount + 1);
    });
  });

  // ✅ PUT /activities/:activityId/reviews/:id
  describe("PUT /activities/:activityId/reviews/:id", () => {
    test("should update own review", async () => {
      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Original comment",
        ranking: 3,
      });

      const res = await request(app)
        .put(`/activities/${activity._id}/reviews/${review._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Updated comment",
          ranking: 5,
        })
        .expect(200);

      expect(res.body).toHaveProperty("comment", "Updated comment");
      expect(res.body).toHaveProperty("ranking", 5);
    });

    test("should reject updating other user's review", async () => {
      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Alice's review",
        ranking: 4,
      });

      const res = await request(app)
        .put(`/activities/${activity._id}/reviews/${review._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          comment: "Hacked!",
          ranking: 1,
        })
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/activities/${activity._id}/reviews/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          comment: "Update",
          ranking: 4,
        })
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });

  // ✅ DELETE /activities/:activityId/reviews/:id
  describe("DELETE /activities/:activityId/reviews/:id", () => {
    test("should delete own review", async () => {
      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "To be deleted",
        ranking: 3,
      });

      await request(app)
        .delete(`/activities/${activity._id}/reviews/${review._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const deleted = await Review.findById(review._id);
      expect(deleted).toBeNull();
    });

    test("should reject deleting other user's review", async () => {
      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Alice's review",
        ranking: 4,
      });

      const res = await request(app)
        .delete(`/activities/${activity._id}/reviews/${review._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body).toHaveProperty("message");

      // Verify not deleted
      const still = await Review.findById(review._id);
      expect(still).not.toBeNull();
    });

    test("should decrement user nb_reviews counter on delete", async () => {
      // First create a review to have a count
      await User.findByIdAndUpdate(user._id, { nb_reviews: 5 });

      const review = await Review.create({
        activity_id: activity._id,
        user_id: user._id,
        comment: "Will be deleted",
        ranking: 4,
      });

      await request(app)
        .delete(`/activities/${activity._id}/reviews/${review._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.nb_reviews).toBe(4);
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/activities/${activity._id}/reviews/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty("message");
    });
  });
});
