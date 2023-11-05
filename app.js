// app.js
const cardsContainer = document.getElementById("cardsContainer");
const addCardButton = document.getElementById("addCardButton");
const client = mqtt.connect("ws://broker.emqx.io:8083/mqtt", {
  clientId: "javascript",
});

// Code for MQTT connections and message handling
client.on("connect", function () {
  console.log("Tersambung ke broker!");
  client.subscribe("koalawan/iot/temperature");
  client.subscribe("koalawan/iot/humidity");
});

// Function to add a card with topic and name
function addCard(cardName, cardTopic) {
  // Buat card baru
  const cardDiv = document.createElement("div");
  cardDiv.className = "bg-white p-4 rounded-lg shadow-md mb-4";

  const cardTitle = document.createElement("h2");
  cardTitle.className = "text-lg font-semibold mb-2";
  cardTitle.textContent = cardName;

  const cardTopicText = document.createElement("p");
  cardTopicText.className = "card-topic"; // Tambahkan kelas untuk card-topic
  cardTopicText.textContent = `Topic: ${cardTopic}`;

  const switchOnButton = document.createElement("button");
  switchOnButton.textContent = "Switch On";
  switchOnButton.className = "bg-green-500 text-white px-3 py-2 rounded-md switch-on"; // Tambahkan kelas untuk switch-on
  switchOnButton.addEventListener("click", () => {
    // Kirim pesan MQTT saat "Switch On" ditekan
    client.publish(cardTopic, "1");
  });

  const switchOffButton = document.createElement("button");
  switchOffButton.textContent = "Switch Off";
  switchOffButton.className = "bg-red-500 text-white px-3 py-2 rounded-md switch-off"; // Tambahkan kelas untuk switch-off
  switchOffButton.addEventListener("click", () => {
    // Kirim pesan MQTT saat "Switch Off" ditekan
    client.publish(cardTopic, "0");
  });

  cardDiv.appendChild(cardTitle);
  cardDiv.appendChild(cardTopicText);
  cardDiv.appendChild(switchOnButton);
  cardDiv.appendChild(switchOffButton);

  cardsContainer.appendChild(cardDiv);

  // Buat tombol untuk menghapus card
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Hapus";
  deleteButton.className = "bg-gray-500 text-white px-3 py-2 rounded-md delete-card";
  deleteButton.addEventListener("click", () => {
    // Panggil fungsi untuk menghapus card saat tombol "Hapus" ditekan
    removeCard(cardDiv, cardTopic);
  });

  cardDiv.appendChild(deleteButton);

  // Subscribe to the user-provided topic
  client.subscribe(cardTopic);
}

// Function to remove a card from UI and local storage
function removeCard(cardElement, cardTopic) {
  // Hapus card dari UI
  cardsContainer.removeChild(cardElement);

  // Hapus card dari local storage
  const cardsData = JSON.parse(localStorage.getItem("cards")) || [];
  const updatedCardsData = cardsData.filter((card) => card.topic !== cardTopic);
  localStorage.setItem("cards", JSON.stringify(updatedCardsData));
}

// Function to save card data to local storage
function saveCardData(cardName, cardTopic) {
  const cardsData = JSON.parse(localStorage.getItem("cards")) || [];
  cardsData.push({ name: cardName, topic: cardTopic });
  localStorage.setItem("cards", JSON.stringify(cardsData));
}

// Function to load cards from local storage
function loadCardsFromStorage() {
  const cardsData = JSON.parse(localStorage.getItem("cards")) || [];
  cardsData.forEach((card) => {
    addCard(card.name, card.topic);
  });
}

// Load existing cards from local storage when the page loads
loadCardsFromStorage();

addCardButton.addEventListener("click", () => {
  Swal.fire({
    title: "Tambah Card",
    html: '<input id="cardName" class="swal2-input" placeholder="Nama">' + '<input id="cardTopic" class="swal2-input" placeholder="Topic">',
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      const cardName = document.getElementById("cardName").value;
      const cardTopic = document.getElementById("cardTopic").value;
      if (!cardName || !cardTopic) {
        Swal.showValidationMessage("Nama dan Topic harus diisi");
      }
      return { name: cardName, topic: cardTopic };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const cardName = result.value.name;
      const cardTopic = result.value.topic;

      addCard(cardName, cardTopic); // Tambahkan card ke UI
      saveCardData(cardName, cardTopic); // Simpan data card ke local storage
    }
  });
});

client.on("message", function (topic, message) {
  console.log(topic + ": " + message.toString());

  // Iterasi melalui semua card yang ada di dalam cardsContainer
  cardsContainer.childNodes.forEach((card) => {
    const cardTopicText = card.querySelector(".card-topic");
    const switchOnButton = card.querySelector(".switch-on");
    const switchOffButton = card.querySelector(".switch-off");

    if (cardTopicText.textContent === `Topic: ${topic}`) {
      // Jika pesan diterima sesuai dengan topik card, tampilkan status
      if (message.toString() === "1") {
        switchOnButton.textContent = "ON";
        switchOffButton.textContent = "Switch Off";
        switchOnButton.classList.remove("bg-green-500");
        switchOnButton.classList.add("bg-green-600");
        switchOffButton.classList.remove("bg-red-600");
        switchOffButton.classList.add("bg-red-500");
      } else {
        switchOnButton.textContent = "Switch On";
        switchOffButton.textContent = "OFF";
        switchOnButton.classList.remove("bg-green-600");
        switchOnButton.classList.add("bg-green-500");
        switchOffButton.classList.remove("bg-red-500");
        switchOffButton.classList.add("bg-red-600");
      }

      // Tampilkan pesan sukses atau error
      if (message.toString() === "1") {
        Swal.fire({
          title: `Card dengan Topik: ${topic}`,
          text: "ON",
          icon: "success",
        });
      } else {
        Swal.fire({
          title: `Card dengan Topik: ${topic}`,
          text: "OFF",
          icon: "error",
        });
      }
    }
  });
});
