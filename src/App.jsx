import { useState, useEffect } from "react";

const API_URL = "https://mern-backend-course.vercel.app/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"

  // Auth form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("mujeeb@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  // Task states
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  // Edit task states
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = authMode === "login" ? "login" : "register";
    const payload =
      authMode === "login" ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch {
      setError("Could not connect to server. Make sure backend is running.");
    }
  };

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setTasks(data.data);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, priority }),
    });

    if (res.ok) {
      setTitle("");
      setPriority("medium");
      fetchTasks();
    }
  };

  const handleToggleComplete = async (task) => {
    const res = await fetch(`${API_URL}/tasks/${task._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !task.completed }),
    });

    if (res.ok) {
      fetchTasks();
    }
  };

  const startEditing = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditPriority(task.priority || "medium");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return;

    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: editTitle, priority: editPriority }),
    });

    if (res.ok) {
      setEditingId(null);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      fetchTasks();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setEditingId(null);
  };

  // Auth Screen (Login + Register Tabs)
  if (!token) {
    return (
      <div className="card">
        <div className="header">
          <div>
            <h2>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p className="subtitle">
              {authMode === "login"
                ? "Sign in to manage your private tasks"
                : "Register a new account to start tracking tasks"}
            </p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === "register" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleAuthSubmit} className="form-stack">
          {authMode === "register" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            required
          />
          <button type="submit" className="btn-primary">
            {authMode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Tasks Dashboard
  return (
    <div className="card">
      <div className="header">
        <div>
          <h2>My Private Tasks</h2>
          <p className="subtitle">Synced with MongoDB Atlas</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      {/* Live Stats */}
      <div className="stats">
        <div className="stat-pill">
          <span>{tasks.length}</span>
          <small>Total</small>
        </div>
        <div className="stat-pill">
          <span>{pendingCount}</span>
          <small>Pending</small>
        </div>
        <div className="stat-pill">
          <span>{completedCount}</span>
          <small>Done</small>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="task-form">
        <input
          type="text"
          className="task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks yet. Add your first task above!</p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task._id} className="task-item">
              {editingId === task._id ? (
                <div className="edit-row">
                  <input
                    type="text"
                    className="edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <select
                    className="edit-select"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={() => handleSaveEdit(task._id)}
                    className="btn-save"
                  >
                    Save
                  </button>
                  <button onClick={cancelEditing} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="task-left">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                    />
                    <span
                      className={`task-title ${task.completed ? "completed" : ""}`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span className={`badge badge-${task.priority || "medium"}`}>
                    {task.priority || "medium"}
                  </span>

                  <div className="task-actions">
                    <button
                      onClick={() => startEditing(task)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}