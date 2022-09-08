const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const intitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
intitializeDBAndServer();

//API GET-Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getAllStateInfoQuery = `
    SELECT state_id as stateId,
    state_name as stateName,
    population as population from state ORDER BY state_id;`;

  const allStateInfoArray = await db.all(getAllStateInfoQuery);
  response.send(allStateInfoArray);
});

//API GET-Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateInfoQuery = `
    SELECT 
    state_id as stateId,
    state_name as stateName,
    population FROM state WHERE 
    state_id=${stateId};`;

  const stateInfo = await db.get(getStateInfoQuery);
  response.send(stateInfo);
});

//API POST Create a district in the district table

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createDistrictQuery = `
    INSERT INTO district 
    (district_name,state_id,cases,
        cured,active,deaths) 
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
            );`;

  const dbResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API - GET Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictInfoQuery = `
      SELECT district_id as districtId,
district_name as districtName,
state_id as stateId,
cases,cured,active,deaths 
FROM district WHERE
district_id=${districtId};`;

  const districtResponse = await db.get(getDistrictInfoQuery);
  response.send(districtResponse);
});

//API DELETE-Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  //console.log(districtId);
  const deleteDistrictQuery = `
    DELETE FROM 
    district 
    WHERE district_id= ${districtId};`;

  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API -PUT Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
    UPDATE 
       district 
    SET  
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} 
    WHERE 
    district_id= ${districtId};`;
  const updateDistResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//API-GET Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateSpecificDetailsQuery = `
  SELECT  
    sum(cases) as totalCases, 
    sum(cured) as totalCured,
    sum(active) as totalActive, 
    sum(deaths) as totalDeaths 
    FROM
    district
    WHERE state_id = ${stateId};`;

  const stateDetailsResponse = await db.get(getStateSpecificDetailsQuery);
  response.send(stateDetailsResponse);
});

//API GET-Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
      SELECT state_name as stateName FROM 
      state WHERE state_id = (select state_id 
        from district where district_id= ${districtId});`;
  const stateNameResponse = await db.get(getStateNameQuery);
  //console.log(stateNameResponse);
  response.send(stateNameResponse);
});

module.exports = app;
