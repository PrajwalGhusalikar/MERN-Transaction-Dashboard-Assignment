const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb://127.0.0.1:27017/mern-assignment",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const transactionSchema = new mongoose.Schema({
  title: String,
  dscription: String,
  price: Number,
  dateOfSale: Date,
  category: String,
  sold: String,
  image: String,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

app.get("/initialize", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const transactions = response.data.map((item) => ({
      title: item.title,
      description: item.description,
      price: item.price,
      dateOfSale: new Date(item.dateOfSale),
      category: item.category,
      sold: item.sold,
      image: item.image,
    }));

    await Transaction.deleteMany();
    await Transaction.insertMany(transactions);
    res.status(200).send({ message: "Database initialized successfully." });
  } catch (error) {
    res.status(500).send({ message: "Error initializing database", error });
  }
});

app.get("/transactions", async (req, res) => {
  const { page = 1, perPage = 10, search = "", month = "" } = req.query;

  const monthIndex =
    [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].indexOf(month.toLowerCase()) + 1;

  if (monthIndex === 0) {
    return res.status(400).send({ message: "Invalid month" });
  }

  const query = {
    $and: [
      { $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] } },
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      },
    ],
  };

  if (!isNaN(search) && search.trim() !== "") {
    query.$and[1].$or.push({ price: parseFloat(search) });
  }

  try {
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    const total = await Transaction.countDocuments(query);

    res.status(200).send({
      transactions,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    res.status(500).send({ message: "Error fetching transactions", error });
  }
});

app.get("/statistics/:month", async (req, res) => {
  const month = req.params.month.toLowerCase();
  const monthIndex =
    [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].indexOf(month) + 1;

  if (monthIndex === 0)
    return res.status(400).send({ message: "Invalid month" });

  try {
    const totalSales = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$price" },
          totalItems: { $sum: 1 },
        },
      },
    ]);

    const soldItems = await Transaction.countDocuments({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
      sold: true,
    });

    const notSoldItems = await Transaction.countDocuments({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
      sold: false,
    });

    res.status(200).send({
      totalSales: totalSales[0]?.totalAmount || 0,
      totalItemsSold: soldItems,
      totalItemsNotSold: notSoldItems,
    });
  } catch (error) {
    res.status(500).send({ message: "Error fetching statistics", error });
  }
});

app.get("/bar-chart/:month", async (req, res) => {
  const month = req.params.month.toLowerCase();
  const monthIndex =
    [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].indexOf(month) + 1;

  if (monthIndex === 0)
    return res.status(400).send({ message: "Invalid month" });

  const priceRanges = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: Infinity },
  ];

  try {
    const results = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await Transaction.countDocuments({
          price: { $gte: range.min, $lte: range.max },
          $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
        });
        return {
          range: `${range.min}-${range.max === Infinity ? "above" : range.max}`,
          count,
        };
      })
    );

    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({ message: "Error fetching bar chart data", error });
  }
});

app.get("/pie-chart/:month", async (req, res) => {
  const month = req.params.month.toLowerCase();
  const monthIndex =
    [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].indexOf(month) + 1;

  if (monthIndex === 0)
    return res.status(400).send({ message: "Invalid month" });

  try {
    const categories = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const result = categories.map((cat) => ({
      category: cat._id,
      count: cat.count,
    }));

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching pie chart data", error });
  }
});

app.get("/combined/:month", async (req, res) => {
  const month = req.params.month.toLowerCase();

  try {
    const statistics = await axios.get(
      `${req.protocol}://${req.get("host")}/statistics/${month}`
    );
    const barChart = await axios.get(
      `${req.protocol}://${req.get("host")}/bar-chart/${month}`
    );
    const pieChart = await axios.get(
      `${req.protocol}://${req.get("host")}/pie-chart/${month}`
    );

    res.status(200).send({
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data,
    });
  } catch (error) {
    res.status(500).send({ message: "Error fetching combined data", error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
