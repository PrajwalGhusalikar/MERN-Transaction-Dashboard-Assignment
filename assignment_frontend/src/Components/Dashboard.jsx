import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import Pagination from "./Pagination";

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [month, setMonth] = useState("march");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [totalItems, setTotalItems] = useState(0);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/transactions?search=${search}&month=${month}&page=${page}`
      );
      setTransactions(response.data.transactions);
      setTotalItems(response.data.transactions.length);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/statistics/${month}`
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchBarData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/bar-chart/${month}`
      );
      setBarData(response.data);
    } catch (error) {
      console.error("Error fetching bar chart data:", error);
    }
  };

  const fetchPieData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/pie-chart/${month}`
      );
      setPieData(response.data);
    } catch (error) {
      console.error("Error fetching pie chart data:", error);
    }
  };

  const initializeDB = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/initialize`);
    } catch (error) {
      console.error("Error fetching pie chart data:", error);
    }
  };

  useEffect(() => {
    initializeDB();
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarData();
    fetchPieData();
  }, [month, search, page]);

  return (
    <div className="container mx-auto p-6 m-2 bg-gray-100 min-h-screen">
      <div className="mb-2 bg-gray-200 flex justify-center items-center h-10 text-center text-2xl">
        TRANSACTION DASHBOARD
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="p-2 mb-4 md:mb-0 border rounded bg-white shadow focus:outline-none"
        >
          {[
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
          ].map((m) => (
            <option value={m} key={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions"
          className="p-2 border rounded bg-white shadow focus:outline-none"
        />
      </div>

      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-md rounded border">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Price</th>
                <th className="p-4">Date of Sale</th>
                <th className="p-4">Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-100">
                  <td className="p-4 border-b">{transaction.title}</td>
                  <td className="p-4 border-b">
                    ${transaction.price.toFixed(2)}
                  </td>
                  <td className="p-4 border-b">
                    {new Date(transaction.dateOfSale).toLocaleDateString()}
                  </td>
                  <td className="p-4 border-b">{transaction.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-600">
          There is not enough data to display.
        </div>
      )}

      <Pagination
        currentPage={page}
        onPageChange={setPage}
        totalItems={totalItems}
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4 text-center">
          <h3 className="text-lg font-semibold">Total Sales</h3>
          <p className="text-blue-600">${statistics.totalSales}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <h3 className="text-lg font-semibold">Items Sold</h3>
          <p className="text-green-600">{statistics.totalItemsSold}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <h3 className="text-lg font-semibold">Items Not Sold</h3>
          <p className="text-red-600">{statistics.totalItemsNotSold}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-around mt-8 space-y-6 md:space-y-0">
        <div className="w-full md:w-1/2 h-80 bg-white shadow rounded p-4">
          <Bar
            data={{
              labels: barData.map((data) => data.range),
              datasets: [
                {
                  label: "Number of Items",
                  data: barData.map((data) => data.count),
                  backgroundColor: "rgba(75, 192, 192, 0.6)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
        <div className="w-full md:w-1/2 h-80 bg-white shadow rounded p-4">
          <Pie
            data={{
              labels: pieData.map((data) => data.category),
              datasets: [
                {
                  label: "Category Distribution",
                  data: pieData.map((data) => data.count),
                  backgroundColor: ["#ff6384", "#36a2eb", "#cc65fe", "#ffce56"],
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
