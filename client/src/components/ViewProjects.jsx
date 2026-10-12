
import { useEffect, useState } from "react";

function ViewProjects() {
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchProjects() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("http://localhost:9000/projects");

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="projects-container">
      <h2>All Projects</h2>

      <button onClick={fetchProjects}>
        Refresh Projects
      </button>

      {loading && <p>Loading projects...</p>}
      {message && <p role="alert">{message}</p>}

      {!loading && projects.length === 0 && !message && (
        <p>No projects found. Create your first project!</p>
      )}

      {!loading && projects.map((project) => (
        <div
          key={project._id}
          className="project-card"
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            marginTop: "15px"
          }}
        >
          <h3>{project.name}</h3>
          <p><strong>Description:</strong> {project.description}</p>
          <p><strong>Status:</strong> {project.status}</p>
          <p>
            <strong>Project Lead:</strong>{" "}
            {project.lead_name || project.lead_username || "Unknown"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ViewProjects;
