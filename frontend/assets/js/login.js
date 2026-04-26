const API_BASE = "http://localhost:3001";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao fazer login.");
    }

    localStorage.setItem("adminToken", result.token);

    window.location.href = "./painel.html";
  } catch (error) {
    alert(error.message || "Usuário ou senha inválidos.");
  }
});