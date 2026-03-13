import dotenv from "dotenv";
import { createApp } from "./app.ts";
import { startWorker } from "../worker/scheduler.ts";
import { createServer } from "http";
import { initSocket } from "./services/socketService.ts";

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  console.log("Starting server initialization...");
  try {
    const app = await createApp();
    const server = createServer(app);
    const PORT = 3000;
    
    // Initialize Socket.io
    initSocket(server);
    
    console.log(`Attempting to listen on port ${PORT}...`);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server successfully running on http://localhost:${PORT}`);
      
      console.log("Initializing Background Worker...");
      // Initialize Background Worker
      startWorker();
    });
  } catch (err) {
    console.error("FATAL: Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

