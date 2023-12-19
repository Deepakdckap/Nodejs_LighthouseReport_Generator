const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const mysql = require("mysql");
const path = require("path");

const app = express();
const port = 3000;
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
// Create connection pool for MySQL
const db = mysql.createPool({
  connectionLimit: 10,
  host: "127.0.0.1",
  user: "dckap",
  password: "Dckap2023Ecommerce",
  database: "lighthouse",
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/generateReport", (req, res) => {
  const projectName = req.body.project_name;
  const siteURL = req.body.url;

  // Sanitize project name for file system safety
  const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9]/g, "_");
  const currentDateTimeIndia = new Date()
    .toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/[\/ ,:]/g, "_");

  const projectNameWithTime = `${sanitizedProjectName}_${currentDateTimeIndia}`;
  const uploadsDir = `reports/${projectNameWithTime}.html`;

  const command = `lighthouse ${siteURL} --quiet --chrome-flags="--headless" --output=html --output-path=${uploadsDir}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // console.error(`Lighthouse Error: ${error.message}`);
      res.status(500).send("Error generating Lighthouse report");
      return;
    }
    if (stderr) {
      // console.error(`Lighthouse stderr: ${stderr}`);
      res.status(500).send("Error in Lighthouse command execution");
      return;
    }

    // Insert into MySQL database
    const insertQuery = `INSERT INTO qa_lighthouse(projectNameWithTime, hidden_p_n, siteURL, filePath, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`;
    const values = [projectNameWithTime, projectName, siteURL, uploadsDir];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        // console.error(`MySQL Error: ${err.message}`);
        res.status(500).send("Error in database operation");
        return;
      }

      // console.log("Generated successfully");
      res.redirect("/");
    });
  });
});
app.get("/getTableData", (req, res) => {
  const fetchQuery = `SELECT * FROM qa_lighthouse`;

  db.query(fetchQuery, (err, result) => {
    if (err) {
      // console.error(`MySQL Error: ${err.message}`);
      res.status(500).send("Error in database operation");
      return;
    }

    return res.status(200).json(result);
  });
});

app.get("/serveFile/*", (req, res) => {
  const filePath = `/home/dckap/Node JS/lighthouse_node_js/${req.params[0]}`;
  
  // Send the file
  res.sendFile(path.resolve(filePath), (err) => {
    if (err) {
      // console.error("Error sending file:", err);
      res.status(err.status).end();
    } else {
      // console.log("File sent successfully");
    }
  });
});

app.get("/downloadFile/*", (req, res) => {
  const filePath = "/home/dckap/Node JS/lighthouse_node_js/reports"; // Path to the directory containing the files

  // Extract the filename from the URL parameter
  const fileName = req.params[0].split("/")[1]; // Assuming the URL has the filename after '/downloadFile/'
  // console.log(fileName);

  // Construct the full path to the file
  const fullPath = `${filePath}/${fileName}`;

  // Send the file for download
  res.download(fullPath, fileName, (err) => {
    if (err) {
      // console.error("Error downloading file:", err);
      res.status(err.status).end();
    } else {
      // console.log("File sent successfully");
    }
  });
});

app.delete("/delete", (req, res) => {
  const deleteReportId = req.body.id;
  const deleteQuery = `delete from qa_lighthouse where id = ${deleteReportId}`;

  db.query(deleteQuery, (err, result) => {
    if (err) {
      // console.error(`MySQL Error: ${err.message}`);
      res.status(500).send("Error in database operation");
      return;
    }

    // console.log("Deleted successfully");
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
