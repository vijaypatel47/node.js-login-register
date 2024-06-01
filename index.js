const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "user.db");

const app = express();

app.use(express.json());

let db = null;

const intilializeData = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running on http://localhost:3000")
    );
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

intilializeData();

app.get("/", async (request, response) => {
  const queryData = `
    SELECT 
    *
    FROM
    player
    `;
  const responseData = await db.all(queryData);
  response.send(responseData);
});

app.post("/register", async (request, response) => {
  const { username, password, address } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUsername = `
    select
    * 
    from 
    player 
    where username='${username}';
    `;
  const dbUser = await db.get(getUsername);
  if (dbUser === undefined) {
    const createUser = `
        INSERT INTO player(username,password,address)
        VALUES('${username}','${hashedPassword}','${address}')
        `;
    const sendData = db.run(createUser);
    response.send("user Created Successfully");
  } else {
    response.status(400);
    response.send("Already user Register");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUsername = `
    select
    * 
    from 
    player 
    where username='${username}';
    `;
  const dbUser = await db.get(getUsername);

  if (dbUser === undefined) {
    response.status(400);
    response.send("please register first username not find");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login Successfully");
    } else {
      response.status(401);
      response.send("Invalid USername or Password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM player WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
          UPDATE
            player
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

      const user = await db.run(updatePasswordQuery);

      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
