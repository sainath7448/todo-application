const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Test case 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q } = request.query;
  let query = "SELECT * FROM todo WHERE 1";

  if (status) {
    query += ` AND status = '${status}'`;
  }

  if (priority) {
    query += ` AND priority = '${priority}'`;
  }

  if (search_q) {
    query += ` AND todo LIKE '%${search_q}%'`;
  }

  const todos = await db.all(query);
  response.send(todos);
});

// Test case 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// Test case 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const insertTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES ('${id}', '${todo}', '${priority}', '${status}')`;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

// Test case 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
        SELECT
           *
        FROM
          todo 
        WHERE 
           id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
       UPDATE
         todo
       SET 
         todo='${todo}',
         priority = '${priority}',
         status = '${status}'
       WHERE 
         id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// Test case 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
