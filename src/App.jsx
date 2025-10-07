import "./App.css";
import Globe from "./Globe";
import { AdminApp } from "./components/AdminApp";
import { isAdminUrl } from "./lib/email-service";

export default function App() {
  // Check if current URL is admin URL
  const isAdmin = isAdminUrl();

  return (
    <div className="App">
      {isAdmin ? (
        <AdminApp />
      ) : (
        <div>
          <Globe />
        </div>
      )}
    </div>
  );
}
