var express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
var router = express.Router();
var User = require("../models/User");
var Tip = require("../models/Tip");
var Challenge = require("../models/Challenge");
var Blog = require("../models/Blog");
var Community = require("../models/Community");

/* GET home page. */
// Configure multer for file uploads with persistent storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/data/uploads/";
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data");
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `lifestyle_data_${timestamp}.csv`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// In-memory storage for datasets and mining results
let sustainabilityData = [];
let datasetInfo = {};
let predictionResults = [];
let miningResults = {};
let storedDatasets = [];

// Sample lifestyle sustainability data structure
const sampleSustainabilityData = [
  {
    ParticipantID: 1,
    Age: 35,
    Location: "Urban",
    DietType: "Mostly Plant-Based",
    LocalFoodFrequency: "Often",
    TransportationMode: "Bike",
    EnergySource: "Renewable",
    HomeType: "Apartment",
    HomeSize: 800,
    ClothingFrequency: "Rarely",
    SustainableBrands: true,
    EnvironmentalAwareness: 5,
    CommunityInvolvement: "High",
    MonthlyElectricityConsumption: 100,
    MonthlyWaterConsumption: 1500,
    Gender: "Female",
    UsingPlasticProducts: "Rarely",
    DisposalMethods: "Composting",
    PhysicalActivities: "High",
    Rating: 5,
  },
  {
    ParticipantID: 2,
    Age: 28,
    Location: "Suburban",
    DietType: "Balanced",
    LocalFoodFrequency: "Sometimes",
    TransportationMode: "Public Transit",
    EnergySource: "Mixed",
    HomeType: "House",
    HomeSize: 1500,
    ClothingFrequency: "Sometimes",
    SustainableBrands: true,
    EnvironmentalAwareness: 4,
    CommunityInvolvement: "Moderate",
    MonthlyElectricityConsumption: 250,
    MonthlyWaterConsumption: 3000,
    Gender: "Male",
    UsingPlasticProducts: "Sometimes",
    DisposalMethods: "Recycling",
    PhysicalActivities: "Moderate",
    Rating: 4,
  },
  {
    ParticipantID: 3,
    Age: 65,
    Location: "Rural",
    DietType: "Mostly Animal-Based",
    LocalFoodFrequency: "Rarely",
    TransportationMode: "Car",
    EnergySource: "Non-Renewable",
    HomeType: "House",
    HomeSize: 2500,
    ClothingFrequency: "Often",
    SustainableBrands: false,
    EnvironmentalAwareness: 2,
    CommunityInvolvement: "Low",
    MonthlyElectricityConsumption: 400,
    MonthlyWaterConsumption: 4500,
    Gender: "Male",
    UsingPlasticProducts: "Often",
    DisposalMethods: "Landfill",
    PhysicalActivities: "Low",
    Rating: 1,
  },
];

// Load stored datasets on startup
function loadStoredDatasets() {
  const uploadsDir = "public/data/uploads/";
  if (fs.existsSync(uploadsDir)) {
    const files = fs
      .readdirSync(uploadsDir)
      .filter((file) => file.endsWith(".csv"));
    storedDatasets = files.map((file) => ({
      filename: file,
      path: path.join(uploadsDir, file),
      uploadDate: fs.statSync(path.join(uploadsDir, file)).mtime,
      size: fs.statSync(path.join(uploadsDir, file)).size,
    }));
  }
}

// Initialize stored datasets

router.get("/register", (req, res, next) => {
  res.render("register", { __: res.__ });
});

router.post("/register", async (req, res, next) => {
  try {
    const exitingUser = await User.findOne({ email: req.body.email });
    if (exitingUser) {
      res.json({ status: false, message: "Exit user with this email" });
      return;
    }
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    await user.save();
    res.json({ status: "true", message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.json({ status: false, message: "Registration failed" });
  }
});

router.get("/login", (req, res, next) => {
  res.render("login", { __: res.__ });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user != null && User.compare(req.body.password, user.password)) {
    console.log(user);
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      bookmarkList: user.bookmarkList,
      challengeList: user.challengeList,
    };
    res.json({ status: true, message: "Login successful" });
  } else {
    res.json({
      status: false,
      message: "Email not found or password not match",
    });
  }
});

router.get("/adminLogin", (req, res) => {
  res.render("adminLogin", {
    error: req.query.error ? req.query.error : null,
    __: res.__,
  });
});

router.post("/adminLogin", (req, res) => {
  console.log(req.body);
  if (
    req.body.email === "slg@admin.com" &&
    req.body.password === "slgadmin2025"
  ) {
    req.session.admin = {
      email: req.body.email,
    };
    res.redirect("/admin");
  } else {
    res.redirect("/adminLogin?error=Invalid credentials");
  }
});

router.get("/", async (req, res, next) => {
  const featuredTips = await Tip.find({ isFeatured: true, isDeleted: false });
  const featuredChallenges = await Challenge.find({
    isFeatured: true,
    isDeleted: false,
  });
  res.render("index", {
    featuredTips: featuredTips,
    featuredChallenges: featuredChallenges,
    __: res.__,
  });
});

router.get("/tips", async (req, res, next) => {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.category) {
    filterValue = req.query.category;
    query = { category: filterValue, isDeleted: false };
  }
  const tips = await Tip.find(query).sort({
    created: -1,
    isFeatured: -1,
  });
  res.render("tips", { title: "Sustainable Tips", tips: tips, __: res.__ });
});

router.get("/tips/:id", async function (req, res) {
  const tip = await Tip.findById(req.params.id);
  res.render("tipDetail", {
    title: "Sustainable Tip Detail",
    tip: tip,
    __: res.__,
  });
});

router.get("/challenges", async (req, res, next) => {
  const challenges = await Challenge.find({ isDeleted: false }).sort({
    created: -1,
    isFeatured: 1,
  });
  res.render("challenges", {
    title: "Eco Challenges",
    challenges: challenges,
    __: res.__,
  });
});

router.get("/challenges/:id", async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  console.log(challenge.updated_startDate);
  res.render("challengeDetail", {
    title: "Eco Challenges",
    challenge: challenge,
    __: res.__,
  });
});

router.get("/calculator", (req, res, next) => {
  loadStoredDatasets();
  const features = [
    "Age",
    "Location",
    "DietType",
    "LocalFoodFrequency",
    "TransportationMode",
    "EnergySource",
    "HomeType",
    "HomeSize",
    "ClothingFrequency",
    "SustainableBrands",
    "EnvironmentalAwareness",
    "CommunityInvolvement",
    "MonthlyElectricityConsumption",
    "MonthlyWaterConsumption",
    "Gender",
    "UsingPlasticProducts",
    "DisposalMethods",
    "PhysicalActivities",
  ];
  res.render("calculator", {
    title: "Eco Calculator",
    __: res.__,
    features,
    storedDatasets,
    miningResults,
    datasetLoaded: sustainabilityData.length > 0,
  });
});

router.post("/upload", upload.single("dataset"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      // Clean and validate data
      const cleanedData = {};
      Object.keys(data).forEach((key) => {
        const cleanKey = key.trim();
        const value = data[key].trim();
        cleanedData[cleanKey] = isNaN(value) ? value : parseFloat(value);
      });
      results.push(cleanedData);
    })
    .on("end", () => {
      sustainabilityData = results;
      datasetInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadDate: new Date(),
        recordCount: results.length,
        features: Object.keys(results[0] || {}),
        filePath: filePath,
        fileSize: req.file.size,
      };

      // Update stored datasets list
      loadStoredDatasets();

      // Perform data mining analysis
      miningResults = performDataMining(results);

      res.json({
        success: true,
        message: `Successfully loaded and analyzed ${results.length} records`,
        info: datasetInfo,
        mining: miningResults,
      });
    })
    .on("error", (error) => {
      res
        .status(500)
        .json({ error: "Failed to process CSV file: " + error.message });
    });
});

// Load existing dataset
router.post("/load-dataset", (req, res) => {
  const { filename } = req.body;
  const filePath = path.join("public/data/uploads/", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Dataset not found" });
  }

  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const cleanedData = {};
      Object.keys(data).forEach((key) => {
        const cleanKey = key.trim();
        const value = data[key].trim();
        cleanedData[cleanKey] = isNaN(value) ? value : parseFloat(value);
      });
      results.push(cleanedData);
    })
    .on("end", () => {
      sustainabilityData = results;
      const stats = fs.statSync(filePath);
      datasetInfo = {
        filename: filename,
        uploadDate: stats.mtime,
        recordCount: results.length,
        features: Object.keys(results[0] || {}),
        filePath: filePath,
        fileSize: stats.size,
      };

      miningResults = performDataMining(results);

      res.json({
        success: true,
        message: `Loaded ${results.length} records from ${filename}`,
        info: datasetInfo,
        mining: miningResults,
      });
    })
    .on("error", (error) => {
      res
        .status(500)
        .json({ error: "Failed to load dataset: " + error.message });
    });
});

// Make prediction
router.post("/predict", (req, res) => {
  const inputData = req.body;

  // Use data mining insights for prediction if available
  const prediction = calculateSustainabilityScore(inputData, miningResults);

  const result = {
    id: Date.now(),
    timestamp: new Date(),
    input: inputData,
    prediction: prediction,
    confidence: calculateConfidence(inputData, miningResults),
    insights: generateInsights(inputData, miningResults),
  };

  predictionResults.push(result);

  res.json(result);
});

router.get("/blogs", async (req, res, next) => {
  const blogs = await Blog.find({ isDeleted: false }).sort({
    created: -1,
    isFeatured: 1,
  });
  res.render("blogs", { title: "Blog", blogs: blogs, __: res.__ });
});

router.get("/blogs/:id", async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.render("blogDetail", { title: "Blog", blog: blog, __: res.__ });
});

router.get("/community", async (req, res, next) => {
  const communities = await Community.find({
    isDeleted: false,
    status: "active",
  })
    .populate("createdBy", "name")
    .sort({ created: -1 });
  res.render("community", {
    title: "Community",
    communities: communities,
    __: res.__,
  });
});

router.get("/community/:id", async (req, res) => {
  const community = await Community.findById(req.params.id).populate(
    "createdBy",
    "name"
  );
  console.log(community);
  res.render("communityDetail", { community: community, __: res.__ });
});

router.get("/aboutus", (req, res, next) => {
  res.render("aboutus", { title: "About Us", __: res.__ });
});

function calculateAverageScore() {
  const currentData =
    sustainabilityData.length > 0
      ? sustainabilityData
      : sampleSustainabilityData;
  const scores = currentData.map((d) => d.Rating || 0);
  return scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
    : 0;
}

function getTopParticipants() {
  const currentData =
    sustainabilityData.length > 0
      ? sustainabilityData
      : sampleSustainabilityData;
  return currentData
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0))
    .slice(0, 5)
    .map((d) => ({
      name: `Participant ${d.ParticipantID || "Unknown"}`,
      score: d.Rating || 0,
      location: d.Location || "Unknown",
    }));
}

// Data mining functions
function performDataMining(data) {
  if (!data || data.length === 0) return {};

  const insights = {
    summary: generateSummaryStats(data),
    correlations: findCorrelations(data),
    patterns: discoverPatterns(data),
    clusters: identifyClusters(data),
    anomalies: detectAnomalies(data),
    predictions: generatePredictionRules(data),
  };

  return insights;
}
function generateSummaryStats(data) {
  const numericFields = [
    "Age",
    "HomeSize",
    "EnvironmentalAwareness",
    "MonthlyElectricityConsumption",
    "MonthlyWaterConsumption",
    "Rating",
  ];
  const categoricalFields = [
    "Location",
    "DietType",
    "TransportationMode",
    "EnergySource",
  ];

  const stats = {
    totalRecords: data.length,
    numeric: {},
    categorical: {},
  };

  // Numeric statistics
  numericFields.forEach((field) => {
    const values = data
      .map((d) => d[field])
      .filter((v) => v != null && !isNaN(v));
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      stats.numeric[field] = {
        mean: mean,
        min: Math.min(...values),
        max: Math.max(...values),
        std: Math.sqrt(
          values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length
        ),
      };
    }
  });

  // Categorical distributions
  categoricalFields.forEach((field) => {
    const counts = {};
    data.forEach((d) => {
      const value = d[field] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });
    stats.categorical[field] = counts;
  });

  return stats;
}

function findCorrelations(data) {
  const correlations = {};

  // Rating correlations
  const ratingCorr = {};
  const ratings = data.map((d) => d.Rating || 0);

  [
    "Age",
    "EnvironmentalAwareness",
    "MonthlyElectricityConsumption",
    "MonthlyWaterConsumption",
  ].forEach((field) => {
    const values = data.map((d) => d[field] || 0);
    ratingCorr[field] = calculateCorrelation(ratings, values);
  });

  correlations.withRating = ratingCorr;

  return correlations;
}

function discoverPatterns(data) {
  const patterns = {
    highRatingProfiles: [],
    lowRatingProfiles: [],
    consumptionPatterns: {},
  };

  // High rating patterns
  const highRaters = data.filter((d) => (d.Rating || 0) >= 4);
  if (highRaters.length > 0) {
    patterns.highRatingProfiles = [
      `${Math.round(
        (highRaters.filter((d) => d.DietType === "Mostly Plant-Based").length /
          highRaters.length) *
          100
      )}% prefer plant-based diet`,
      `${Math.round(
        (highRaters.filter(
          (d) =>
            d.TransportationMode === "Bike" || d.TransportationMode === "Walk"
        ).length /
          highRaters.length) *
          100
      )}% use sustainable transport`,
      `${Math.round(
        (highRaters.filter((d) => d.EnergySource === "Renewable").length /
          highRaters.length) *
          100
      )}% use renewable energy`,
    ];
  }

  // Low rating patterns
  const lowRaters = data.filter((d) => (d.Rating || 0) <= 2);
  if (lowRaters.length > 0) {
    patterns.lowRatingProfiles = [
      `${Math.round(
        (lowRaters.filter((d) => d.DietType === "Mostly Animal-Based").length /
          lowRaters.length) *
          100
      )}% have animal-based diet`,
      `${Math.round(
        (lowRaters.filter((d) => d.TransportationMode === "Car").length /
          lowRaters.length) *
          100
      )}% primarily use cars`,
      `${Math.round(
        (lowRaters.filter((d) => d.EnergySource === "Non-Renewable").length /
          lowRaters.length) *
          100
      )}% use non-renewable energy`,
    ];
  }

  return patterns;
}

function identifyClusters(data) {
  // Simple clustering based on consumption patterns
  const clusters = {
    lowConsumption: data.filter(
      (d) =>
        (d.MonthlyElectricityConsumption || 0) < 200 &&
        (d.MonthlyWaterConsumption || 0) < 2500
    ).length,
    mediumConsumption: data.filter(
      (d) =>
        (d.MonthlyElectricityConsumption || 0) >= 200 &&
        (d.MonthlyElectricityConsumption || 0) < 350 &&
        (d.MonthlyWaterConsumption || 0) >= 2500 &&
        (d.MonthlyWaterConsumption || 0) < 4000
    ).length,
    highConsumption: data.filter(
      (d) =>
        (d.MonthlyElectricityConsumption || 0) >= 350 ||
        (d.MonthlyWaterConsumption || 0) >= 4000
    ).length,
  };

  return clusters;
}

function detectAnomalies(data) {
  const anomalies = [];

  // Detect unusual consumption patterns
  data.forEach((record, index) => {
    const electricity = record.MonthlyElectricityConsumption || 0;
    const water = record.MonthlyWaterConsumption || 0;
    const rating = record.Rating || 0;

    if (electricity > 500 || water > 6000) {
      anomalies.push({
        participantId: record.ParticipantID,
        type: "High Consumption",
        description: `Unusually high resource consumption (E: ${electricity}, W: ${water})`,
      });
    }

    if (rating >= 4 && electricity > 400) {
      anomalies.push({
        participantId: record.ParticipantID,
        type: "Rating-Consumption Mismatch",
        description:
          "High sustainability rating but high electricity consumption",
      });
    }
  });

  return anomalies.slice(0, 10); // Limit to 10 anomalies
}

function generatePredictionRules(data) {
  const rules = [];

  // Generate simple decision rules
  rules.push({
    condition:
      "DietType === 'Mostly Plant-Based' && TransportationMode === 'Bike'",
    prediction: "Rating likely 4-5",
    confidence: 0.85,
  });

  rules.push({
    condition: "EnergySource === 'Renewable' && EnvironmentalAwareness >= 4",
    prediction: "Rating likely 4-5",
    confidence: 0.78,
  });

  rules.push({
    condition:
      "MonthlyElectricityConsumption > 350 && DisposalMethods === 'Landfill'",
    prediction: "Rating likely 1-2",
    confidence: 0.72,
  });

  return rules;
}

function calculateCorrelation(arr1, arr2) {
  if (arr1.length !== arr2.length) return 0;

  const mean1 = arr1.reduce((a, b) => a + b, 0) / arr1.length;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / arr2.length;

  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0; i < arr1.length; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateSustainabilityScore(data, miningInsights = {}) {
  // Enhanced scoring using mining insights
  let score = 0;

  // Diet scoring (20% weight)
  const dietScore = getDietScore(data.DietType);
  score += dietScore * 0.2;

  // Transportation scoring (20% weight)
  const transportScore = getTransportScore(data.TransportationMode);
  score += transportScore * 0.2;

  // Energy source scoring (15% weight)
  const energyScore = getEnergyScore(data.EnergySource);
  score += energyScore * 0.15;

  // Consumption scoring (15% weight) - enhanced with mining insights
  const consumptionScore = getConsumptionScore(
    parseInt(data.MonthlyElectricityConsumption) || 0,
    parseInt(data.MonthlyWaterConsumption) || 0,
    parseInt(data.HomeSize) || 0,
    miningInsights
  );
  score += consumptionScore * 0.15;

  // Waste management scoring (15% weight)
  const wasteScore = getWasteScore(
    data.DisposalMethods,
    data.UsingPlasticProducts
  );
  score += wasteScore * 0.15;

  // Awareness and behavior scoring (15% weight)
  const behaviorScore = getBehaviorScore(
    parseInt(data.EnvironmentalAwareness) || 0,
    data.SustainableBrands,
    data.CommunityInvolvement,
    data.ClothingFrequency
  );
  score += behaviorScore * 0.15;

  // Normalize to 1-5 scale to match Rating
  return Math.max(1, Math.min(5, Math.round(score * 5)));
}

function calculateConfidence(data, miningInsights = {}) {
  let confidence = 0.7; // Base confidence

  // Increase confidence based on data completeness
  const completeness =
    Object.values(data).filter((v) => v !== null && v !== "").length /
    Object.keys(data).length;
  confidence += completeness * 0.2;

  // Use mining insights to adjust confidence
  if (miningInsights.correlations) {
    confidence += 0.1;
  }

  return Math.min(0.95, confidence);
}

function generateInsights(data, miningInsights = {}) {
  const insights = [];

  if (miningInsights.patterns && miningInsights.patterns.highRatingProfiles) {
    const diet = data.DietType;
    const transport = data.TransportationMode;

    if (diet === "Mostly Plant-Based") {
      insights.push(
        "Your plant-based diet aligns with high-rating sustainability profiles"
      );
    }

    if (transport === "Bike" || transport === "Walk") {
      insights.push(
        "Your sustainable transportation choice is a strong positive factor"
      );
    }
  }

  return insights;
}

function getDietScore(dietType) {
  const scores = {
    "Mostly Plant-Based": 1.0,
    Vegetarian: 0.9,
    Balanced: 0.6,
    "Mostly Animal-Based": 0.3,
  };
  return scores[dietType] || 0.5;
}

function getTransportScore(transport) {
  const scores = {
    Walk: 1.0,
    Bike: 1.0,
    "Public Transit": 0.8,
    "Electric Car": 0.7,
    Car: 0.3,
    Motorcycle: 0.4,
  };
  return scores[transport] || 0.5;
}

function getEnergyScore(energy) {
  const scores = {
    Renewable: 1.0,
    Mixed: 0.6,
    "Non-Renewable": 0.2,
  };
  return scores[energy] || 0.5;
}

function getConsumptionScore(
  electricity,
  water,
  homeSize,
  miningInsights = {}
) {
  let score = 1.0;

  // Use mining insights for dynamic thresholds if available
  const electricityThreshold =
    miningInsights.summary &&
    miningInsights.summary.numeric &&
    miningInsights.summary.numeric.MonthlyElectricityConsumption
      ? miningInsights.summary.numeric.MonthlyElectricityConsumption.mean
      : 250;
  const waterThreshold =
    miningInsights.summary &&
    miningInsights.summary.numeric &&
    miningInsights.summary.numeric.MonthlyWaterConsumption
      ? miningInsights.summary.numeric.MonthlyWaterConsumption.mean
      : 3000;

  // Electricity (lower is better)
  if (electricity > electricityThreshold * 1.5) score -= 0.3;
  else if (electricity > electricityThreshold) score -= 0.2;
  else if (electricity < electricityThreshold * 0.7) score += 0.1;

  // Water (lower is better)
  if (water > waterThreshold * 1.5) score -= 0.3;
  else if (water > waterThreshold) score -= 0.2;
  else if (water < waterThreshold * 0.7) score += 0.1;

  // Adjust for home size
  if (homeSize > 2000) score -= 0.2;
  else if (homeSize > 1500) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

function getWasteScore(disposal, plastic) {
  let score = 0;

  const disposalScores = {
    Composting: 1.0,
    Recycling: 0.8,
    Landfill: 0.2,
  };
  score += (disposalScores[disposal] || 0.5) * 0.6;

  const plasticScores = {
    Rarely: 1.0,
    Sometimes: 0.6,
    Often: 0.2,
  };
  score += (plasticScores[plastic] || 0.5) * 0.4;

  return score;
}

function getBehaviorScore(awareness, sustainable, involvement, clothing) {
  let score = 0;

  score += (awareness / 5) * 0.3;
  score += sustainable === true || sustainable === "true" ? 0.25 : 0;

  const involvementScores = {
    High: 1.0,
    Moderate: 0.6,
    Low: 0.2,
  };
  score += (involvementScores[involvement] || 0.4) * 0.25;

  const clothingScores = {
    Rarely: 1.0,
    Sometimes: 0.6,
    Often: 0.2,
  };
  score += (clothingScores[clothing] || 0.5) * 0.2;

  return score;
}

module.exports = router;
