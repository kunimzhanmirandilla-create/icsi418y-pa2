import Signup from "./components/Signup";
import Login from "./components/Login";
import "./App.css";

function App() {
  return (
    <main className="app">
      <div className="auth-container">
        <div className="header">
          <h1>Welcome</h1>
          <p>Create an account or log in to continue</p>
        </div>

        <div className="forms">
          <Signup />
          <Login />
        </div>
      </div>
    </main>
  );
}

export default App;