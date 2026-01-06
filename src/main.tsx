import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/dbAccess"; // Expose database to window for console access

createRoot(document.getElementById("root")!).render(<App />);
