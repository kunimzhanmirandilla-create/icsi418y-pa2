
import { useEffect, useState } from "react";

function ManageMembers() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load projects and registered users
  useEffect(() => {
    async function loadData() {
      try {
        const [projectsResponse, usersResponse] = await Promise.all([
          fetch("http://localhost:9000/projects"),
          fetch("http://localhost:9000/users")
        ]);

        if (!projectsResponse.ok || !usersResponse.ok) {
          throw new Error("Could not load projects or users");
        }

        setProjects(await projectsResponse.json());
        setUsers(await usersResponse.json());
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadData();
  }, []);

  // Load members when a project is selected
  useEffect(() => {
    if (!selectedProject) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:9000/projects/${selectedProject}/members`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load members");
        }

        if (!cancelled) {
          setMembers(data);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message);
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  // Refresh membership list
  async function refreshMembers() {
    const response = await fetch(
      `http://localhost:9000/projects/${selectedProject}/members`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not refresh members");
    }

    setMembers(data);
  }

  // Add a member
  async function addMember() {
    if (!selectedProject || !selectedUser) {
      setMessage("Please select a project and a user");
      return;
    }

    try {
      setMessage("");

      const response = await fetch(
        `http://localhost:9000/projects/${selectedProject}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: selectedUser
          })
        }
      );

      const data = await response.json();

      setMessage(data.message || "Request completed");

      if (response.ok) {
        setSelectedUser("");
        await refreshMembers();
      }
    } catch (error) {
      setMessage(error.message || "Could not add member");
    }
  }

  // Remove a member
  async function removeMember(userId) {
    try {
      setMessage("");

      const response = await fetch(
        `http://localhost:9000/projects/${selectedProject}/members/${userId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      setMessage(data.message || "Request completed");

      if (response.ok) {
        await refreshMembers();
      }
    } catch (error) {
      setMessage(error.message || "Could not remove member");
    }
  }

  return (
    <div className="members-container">
      <h2>Manage Project Members</h2>

      <h3>Select Project</h3>
      <select
        value={selectedProject}
        onChange={(e) => {
          setSelectedProject(e.target.value);
          setSelectedUser("");
          setMessage("");
          setMembers([]);
        }}
      >
        <option value="">Choose a project</option>

        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>

      {selectedProject && (
        <>
          <h3>Current Members</h3>

          {loading && <p>Loading members...</p>}

          {!loading && members.length === 0 && (
            <p>No members found.</p>
          )}

          {!loading && members.map((member) => (
            <div
              key={member._id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                margin: "10px 0",
                borderRadius: "8px"
              }}
            >
              <p>
                {member.f_name} {member.l_name}
                {" "}({member.username})
              </p>

              {member.isLead ? (
                <strong>Project Lead</strong>
              ) : (
                <button
                  onClick={() => removeMember(member.user_id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <h3>Add Member</h3>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select a registered user</option>

            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.f_name} {user.l_name} ({user.username})
              </option>
            ))}
          </select>

          <button onClick={addMember}>
            Add Member
          </button>
        </>
      )}

      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default ManageMembers;
