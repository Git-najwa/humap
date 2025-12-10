import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Activity from "../src/models/Activity.js";
import Review from "../src/models/Review.js";
import UserActivityList from "../src/models/UserActivityList.js";

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost/humap");
    console.log("🌱 Seed en cours...");

    // Nettoyer
    await User.deleteMany();
    await Activity.deleteMany();
    await Review.deleteMany();
    await UserActivityList.deleteMany();

    // 5 utilisateurs
    const users = await User.create([
      { username: "alice", email: "alice@example.com", password: "Alice123!" },
      { username: "bob", email: "bob@example.com", password: "Bob123!" },
      { username: "charlie", email: "charlie@example.com", password: "Charlie123!" },
      { username: "diana", email: "diana@example.com", password: "Diana123!" },
      { username: "eve", email: "eve@example.com", password: "Eve123!" },
    ]);
    console.log("✅ 5 utilisateurs créés");

    // 10 activités variées
    const activities = await Activity.create([
      {
        title: "Pique-nique au lac",
        description: "Moment détente en pleine nature avec vue sur le lac",
        location: "Lausanne",
        coordinates: { type: "Point", coordinates: [6.629, 46.529] },
        mood: "calm",
        price_range: 0,
        nb_people: 2,
        user_id: users[0]._id,
      },
      {
        title: "Randonnée montagne",
        description: "Randonnée sportive avec vue panoramique",
        location: "Alpes",
        coordinates: { type: "Point", coordinates: [8.226, 46.627] },
        mood: "energetic",
        price_range: 0,
        nb_people: 4,
        user_id: users[1]._id,
      },
      {
        title: "Yoga sunset",
        description: "Séance de yoga relaxante avec ambiance zen",
        location: "Plage Ouchy",
        coordinates: { type: "Point", coordinates: [6.624, 46.509] },
        mood: "calm",
        price_range: 1,
        nb_people: 6,
        user_id: users[2]._id,
      },
      {
        title: "Soirée cinéma en plein air",
        description: "Film en plein air avec pop-corn et ambiance festive",
        location: "Parc de Milan",
        coordinates: { type: "Point", coordinates: [6.638, 46.540] },
        mood: "social",
        price_range: 1,
        nb_people: 10,
        user_id: users[3]._id,
      },
      {
        title: "VTT en forêt",
        description: "Parcours VTT intermédiaire avec passages techniques",
        location: "Forêt Mont-Tendre",
        coordinates: { type: "Point", coordinates: [6.468, 46.649] },
        mood: "energetic",
        price_range: 0,
        nb_people: 3,
        user_id: users[4]._id,
      },
      {
        title: "Brunch convivial",
        description: "Brunch gourmand dans un café sympa",
        location: "Flon, Lausanne",
        coordinates: { type: "Point", coordinates: [6.639, 46.524] },
        mood: "social",
        price_range: 2,
        nb_people: 4,
        user_id: users[0]._id,
      },
      {
        title: "Méditation au parc",
        description: "Séance de méditation guidée au calme",
        location: "Parc Sauvabelin",
        coordinates: { type: "Point", coordinates: [6.629, 46.535] },
        mood: "calm",
        price_range: 0,
        nb_people: 8,
        user_id: users[1]._id,
      },
      {
        title: "Escalade en salle",
        description: "Escalade indoor avec instructeur",
        location: "Climbing gym Lausanne",
        coordinates: { type: "Point", coordinates: [6.635, 46.520] },
        mood: "energetic",
        price_range: 2,
        nb_people: 5,
        user_id: users[2]._id,
      },
      {
        title: "Balade à vélo",
        description: "Balade facile le long du lac",
        location: "Quai Ouchy",
        coordinates: { type: "Point", coordinates: [6.620, 46.500] },
        mood: "calm",
        price_range: 0,
        nb_people: 3,
        user_id: users[3]._id,
      },
      {
        title: "Soirée jeux de société",
        description: "Soirée jeux avec des copains",
        location: "Café des Alpes",
        coordinates: { type: "Point", coordinates: [6.645, 46.530] },
        mood: "social",
        price_range: 1,
        nb_people: 6,
        user_id: users[4]._id,
      },
    ]);
    console.log("✅ 10 activités créées");

    // 15 reviews
    await Review.create([
      { activity_id: activities[0]._id, user_id: users[1]._id, ranking: 5, comment: "Super moment!" },
      { activity_id: activities[0]._id, user_id: users[2]._id, ranking: 4, comment: "Beau mais loin" },
      { activity_id: activities[1]._id, user_id: users[0]._id, ranking: 5, comment: "Magnifique!" },
      { activity_id: activities[2]._id, user_id: users[0]._id, ranking: 4, comment: "Très relaxant" },
      { activity_id: activities[3]._id, user_id: users[1]._id, ranking: 5, comment: "Ambiance super!" },
      { activity_id: activities[4]._id, user_id: users[2]._id, ranking: 4, comment: "Bon niveau" },
      { activity_id: activities[5]._id, user_id: users[3]._id, ranking: 5, comment: "Excellent brunch!" },
      { activity_id: activities[6]._id, user_id: users[4]._id, ranking: 5, comment: "Parfait pour se détendre" },
      { activity_id: activities[7]._id, user_id: users[0]._id, ranking: 4, comment: "Bon pour les défis" },
      { activity_id: activities[8]._id, user_id: users[1]._id, ranking: 5, comment: "Très agréable" },
      { activity_id: activities[9]._id, user_id: users[2]._id, ranking: 4, comment: "Bonne ambiance" },
      { activity_id: activities[0]._id, user_id: users[3]._id, ranking: 3, comment: "Okay" },
      { activity_id: activities[2]._id, user_id: users[1]._id, ranking: 5, comment: "À refaire!" },
      { activity_id: activities[5]._id, user_id: users[2]._id, ranking: 4, comment: "Bon service" },
      { activity_id: activities[7]._id, user_id: users[3]._id, ranking: 5, comment: "Instructeur sympa" },
    ]);
    console.log("✅ 15 reviews créées");

    // 12 listes (favoris, historique, custom)
    await UserActivityList.create([
      { user_id: users[0]._id, activity_id: activities[1]._id, list_type: "liked" },
      { user_id: users[0]._id, activity_id: activities[3]._id, list_type: "history" },
      { user_id: users[0]._id, activity_id: activities[5]._id, list_type: "custom", custom_name: "Favoris gourmands" },
      { user_id: users[1]._id, activity_id: activities[0]._id, list_type: "liked" },
      { user_id: users[1]._id, activity_id: activities[2]._id, list_type: "custom", custom_name: "Activités zen" },
      { user_id: users[1]._id, activity_id: activities[4]._id, list_type: "history" },
      { user_id: users[2]._id, activity_id: activities[7]._id, list_type: "liked" },
      { user_id: users[2]._id, activity_id: activities[9]._id, list_type: "custom", custom_name: "Soirées sympas" },
      { user_id: users[3]._id, activity_id: activities[6]._id, list_type: "liked" },
      { user_id: users[3]._id, activity_id: activities[8]._id, list_type: "history" },
      { user_id: users[4]._id, activity_id: activities[1]._id, list_type: "custom", custom_name: "À faire" },
      { user_id: users[4]._id, activity_id: activities[4]._id, list_type: "liked" },
    ]);
    console.log("✅ 12 listes créées");

    console.log("\n🎉 Seed complet!");
    console.log("  - 5 utilisateurs");
    console.log("  - 10 activités");
    console.log("  - 15 reviews");
    console.log("  - 12 listes (favoris, historique, custom)");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

seed();
