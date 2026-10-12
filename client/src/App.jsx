
import { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ViewProjects from "./components/ViewProjects";
import ManageMembers from "./components/ManageMembers";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  return (
    <main className="app">
      <div className="auth-container">

        <div className="header">
          <h1>Project Management App</h1>
          <p>ICSI 418Y - Programming Assignment 3</p>
        </div>

        {/* Navigation */}
        <nav style={{ marginBottom: "20px" }}>
          <button onClick={() => setPage("home")}>
            Signup / Login
          </button>

          <button onClick={() => setPage("create")}>
            Create Project
          </button>

          <button onClick={() => setPage("projects")}>
            View Projects
          </button>

          <button onClick={() => setPage("members")}>
            Manage Members
          </button>
        </nav>

        {/* Signup and Login */}
        {page === "home" && (
          <div className="forms">
            <Signup />
            <Login />
          </div>
        )}

        {/* Create Project */}
        {page === "create" && <CreateProject />}

        {/* View Projects */}
        {page === "projects" && <ViewProjects />}

        {/* Manage Members */}
        {page === "members" && <ManageMembers />}

      </div>
    </main>
  );
}

export default App;
