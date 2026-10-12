
import { useEffect, useState } from "react";

function CreateProject() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [projectLead, setProjectLead] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  // Load registered users from MongoDB
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("http://localhost:9000/users");

        if (!response.ok) {
          throw new Error("Could not load users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setMessage(error.message);
      }
    }

    fetchUsers();
  }, []);

  // Submit new project
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:9000/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          status,
          project_lead_id: projectLead
        })
      });

      const data = await response.json();
      setMessage(data.message || "Request completed");

      if (response.ok) {
        setName("");
        setDescription("");
        setStatus("Planning");
        setProjectLead("");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  }

  return (
    <div className="project-form">
      <h2>Create Project</h2>

      <form onSubmit={handleSubmit}>
        <label>Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <label>Project Lead</label>
        <select
          value={projectLead}
          onChange={(e) => setProjectLead(e.target.value)}
          required
        >
          <option value="">Select Project Lead</option>

          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.f_name} {user.l_name} ({user.username})
            </option>
          ))}
        </select>

        <button type="submit">Create Project</button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default CreateProject;
