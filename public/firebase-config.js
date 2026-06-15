// Configuration Firebase
// ⚠️ IMPORTANT : Remplacez ces valeurs par vos propres clés Firebase
// Vous pouvez les trouver dans Firebase Console > Paramètres du projet > Vos applications web

const firebaseConfig = {
  apiKey: "AIzaSyBUDgMzFRlTfeccyqYYPbRUac2QEzuPq8g",
  authDomain: "contrak-234f7.firebaseapp.com",
  projectId: "contrak-234f7",
  storageBucket: "contrak-234f7.appspot.com",
  messagingSenderId: "50221737878",
  appId: "1:50221737878:web:4b577d45b3e63c98bc9fb7",
  measurementId: "G-9QC5WHMQ5C"
};

// Initialiser Firebase si les scripts sont chargés
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
