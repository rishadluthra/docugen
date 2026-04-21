import app from "./app.js";
import { port } from "./config/env.js";

// Start the server and listen on the configured port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});