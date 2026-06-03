import { createRoot } from "react-dom/client";
import App from "./App";

import "primereact/resources/themes/lara-light-teal/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "@/styles/globals.css";

import "@/styles/theme.scss";
import "@/styles/components.scss";

createRoot(document.getElementById("root")!).render(<App />);
