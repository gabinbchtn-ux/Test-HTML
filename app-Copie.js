<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Morse Chat - Firebase</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Écran d'authentification -->
    <div id="authScreen" class="screen active">
        <div class="auth-container">
            <h1>🔐 Accès Morse Chat</h1>
            <p>Entrez votre code d'accès :</p>
            <input type="text" id="authCode" placeholder="Code d'accès" maxlength="20">
            <button id="authBtn">Entrer</button>
            <p id="authError" class="error"></p>
            
            <div class="codes-info">
                <h3>Codes disponibles :</h3>
                <ul>
                    <li><strong>89735786637893486</strong> - 👑 Admin</li>
                    <li><strong>MOD020</strong> - 🛡️ Modérateur</li>
                    <li><strong>USER843</strong> - 👤 Visiteur</li>
                    <li><strong>0000</strong> - Testeur</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Écran de chat -->
    <div id="chatScreen" class="screen hidden">
        <div class="chat-container">
            <!-- Header -->
            <div class="chat-header">
                <div class="user-info">
                    <span id="userNameDisplay"></span>
                    <span id="userRoleBadge" class="role-badge"></span>
                </div>
                <button id="logoutBtn" class="logout-btn">Déconnexion</button>
            </div>

            <!-- Zone de chat -->
            <div id="chatWindow" class="chat-window">
                <!-- Messages s'afficheront ici -->
            </div>

            <!-- Zone de morse -->
            <div class="morse-section">
                <div class="morse-display" id="morseDisplay"></div>
                <div class="message-preview" id="messagePreview">Message: ... --- ...</div>
                
                <button class="morse-btn" id="morseBtn">
                    TAP<br>LONG<br>PRESS
                </button>
                
                <div class="morse-controls">
                    <button class="control-btn clear-btn" id="clearBtn">Effacer</button>
                    <button class="control-btn send-btn" id="sendBtn">Envoyer</button>
                </div>
            </div>

            <!-- Chat input classique -->
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Tapez un message...">
                <button id="sendBtn2" class="send-btn">Envoyer</button>
            </div>
        </div>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
    <script src="script.js"></script>
</body>
</html>
