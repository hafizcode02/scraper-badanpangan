const axios = require('axios');
const fs = require('fs'); // Module for file system operations

// Function to format a JavaScript date object into 'd/m/y' format string
const formatDate = (date) => {
  const day = ('0' + date.getDate()).slice(-2); // Leading zero for single-digit days
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Leading zero for single-digit months
  const year = date.getFullYear(); // Four-digit year
  return `${day}/${month}/${year}`; // Format as 'd/m/y'
};

// Fetch data for a specific date and commodity, returning the geomean value for a specific province_id
const fetchGeomean = async (date, provinceId, commodityId = 30) => {
  const formattedDate = formatDate(date); // Get formatted date for the URL
  const url = `https://panelharga.badanpangan.go.id/data/harga-provinsi/${formattedDate.replace(/\//g, '-')}/3/${commodityId}`; // Convert date to 'd-m-y' for URL

  try {
    const response = await axios.get(url); // Fetch the data
    const data = response.data;

    if (data && data.data) {
      const provinceData = data.data.find((entry) => entry.province_id === provinceId); // Find the specific province

      if (provinceData) {
        return { date: formattedDate, geomean: provinceData.geomean }; // Return formatted date and geomean value
      } else {
        console.log(`No data found for province_id ${provinceId} on ${formattedDate}`);
        return { date: formattedDate, geomean: null }; // If no data, return null
      }
    } else {
      console.log(`No data available for ${formattedDate}`);
      return { date: formattedDate, geomean: null }; // If no data, return null
    }
  } catch (error) {
    console.error(`Error fetching data for ${formattedDate}:`, error.message);
    return { date: formattedDate, geomean: null }; // Handle errors
  }
};

// Define the range of dates to fetch data for
const startDate = new Date(2022, 3, 1); // 1 April 2022
const endDate = new Date(2024, 3, 1); // 1 April 2024

// Initialize an array to store the fetched results
const geomeanResults = [];

// Fetch geomean values for each date in the specified range, but only for province_id 12
const fetchDataForDateRange = async () => {
  for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const result = await fetchGeomean(new Date(currentDate), 12); // Get geomean for 'province_id = 12'
    geomeanResults.push(result); // Store the result
  }

  // Sort the results by the date key
  geomeanResults.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number); // Parse formatted dates
    const [dayB, monthB, yearB] = b.date.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA); // Convert to Date object
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB; // Sort by date
  });

  // Prepare the CSV content with the updated date format
  const csvHeader = 'Tanggal,Bawang Merah\n'; // CSV header
  const csvContent = geomeanResults
    .map((result) => `${result.date},${result.geomean ?? ''}`) // Format CSV lines
    .join('\n'); // Join all lines with newline separator

  const csvFullContent = csvHeader + csvContent; // Complete CSV content

  // Write the CSV content to a file
  fs.writeFileSync('geomean_results.csv', csvFullContent); // Write to file

  console.log('CSV file "geomean_results.csv" has been created successfully.');
};

// Call the function to fetch, sort, and export the data
fetchDataForDateRange(); // Run the main function
