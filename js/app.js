const $ = id => document.getElementById(id);
const get = (k, d) => JSON.parse(localStorage.getItem(k)) || d;
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const today = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// navbar, written once here instead of in every html file
const page = location.pathname.split("/").pop() || "index.html";
$("nav").innerHTML = ["index:Intake", "gym:Gym", "rules:Rules", "notes:Notes", "weight:Weight"].map(p => {
  const [f, name] = p.split(":");
  return `<a href="${f}.html" class="${page == f + ".html" ? "active" : ""}">${name}</a>`;
}).join("");

// ---------- INTAKE ----------
const fields = { cal: "Calories", pro: "Protein", carb: "Carbs", fat: "Fats" };
const defaults = { cal: 1700, pro: 170, carb: 160, fat: 50 };
const read = p => Object.fromEntries(Object.keys(fields).map(f => [f, Number($(p + f).value) || 0]));

function saveTargets() { set("targets", read("t-")); showRemaining(); }
function saveAte() { set("ate-" + today(), read("a-")); showRemaining(); }

function resetTargets() {
  if (!confirm("Reset targets to defaults?")) return;
  set("targets", defaults);
  for (let f in fields) $("t-" + f).value = defaults[f];
  showRemaining();
}

function showRemaining() {
  const t = get("targets", defaults), a = get("ate-" + today(), {});
  $("remaining").innerHTML = "<h2>Remaining today</h2>" +
    Object.keys(fields).map(f => `${fields[f]}: ${t[f] - (a[f] || 0)}`).join("<br>");
}

if ($("remaining")) {
  const t = get("targets", defaults), a = get("ate-" + today(), {});
  for (let f in fields) { $("t-" + f).value = t[f]; $("a-" + f).value = a[f] || 0; }
  showRemaining();
}

// ---------- GYM + RULES (same code, different data) ----------
// each box is {title, body}, body has one line per item
const defaultCards = {
  plan: [
    { title: "Workout Plan", body: "5 day split: 2 Push, 2 Pull, 1 Legs\nCardio: 30 min per session\n10 min warm-up cardio\nWeight training\n20 min post-workout cardio" },
    { title: "Monday - Push A (Chest)", body: "Bench Press 4 x 8-12\nDumbbell Press 3 x 10-12\nCable Fly 3 x 12-15\nDumbbell Shoulder Press 3 x 8-12\nLateral Raises 3 x 12-15\nRope Overhead Extension 3 x 10-12\nRope Pulldown + V-Bar Pushdown 3 x 12-15\nAbs Machine 3-4 x 15-25" },
    { title: "Tuesday - Pull A (Back)", body: "Lat Pulldown (wide) 4 x 8-12\nLat Pulldown (close grip) 3 x 10-12\nSeated Cable Row 4 x 8-12\nDeadlift 3-4 x 6-10\nFace Pulls 3 x 12-15\nBarbell Curls 3 x 10-12\nDumbbell Curls 3 x 12-15\nAbs Machine 3-4 x 15-25" },
    { title: "Wednesday - Legs + Abs", body: "Back Squats 4 x 8-12\nLeg Press 4 x 10-12\nLeg Extensions 3 x 12-15\nHamstring Curls 3 x 12-15\nCalf Raises 4 x 15-20\nAbs Machine 6-7 x 20-30" },
    { title: "Thursday - Push B (Shoulders + Triceps)", body: "Chest Press Machine 4 x 8-12\nCable Fly 3 x 12-15\nDumbbell Shoulder Press 4 x 8-12\nLateral Raises 4 x 12-15\nLight Bench Press 3 x 10-12\nV-Bar Pushdown 3 x 10-12\nRope Overhead + Rope Pulldown 3 x 12-15" },
    { title: "Friday - Pull B (Biceps + Rear Delts)", body: "Lat Pulldown (different grip) 3 x 10-12\nSeated Cable Row 3 x 10-12\nRomanian Deadlift 3 x 8-10\nFace Pulls 4 x 12-15\nPreacher Curls 3 x 10-12\nSeated Dumbbell Curls 3 x 12-15\nBarbell Curls 3 x 12-15" },
    { title: "Saturday - Rest", body: "Light walk" },
    { title: "Sunday - Rest", body: "Light walk" }
  ],
  rules: [
    { title: "My Rules", body: "Drink only water\n0% sugar food\n4-5L water every day\nDo not skip meals\nDo not skip training days\nDo not overeat on weekends" }
  ]
};

const box = $("plan") || $("rules");
const key = box && box.id;

function showCards() {
  box.innerHTML = get(key, defaultCards[key]).map((c, i) => `<div class="card">
    <h2>${esc(c.title)}</h2>
    <ul>${c.body.split("\n").filter(l => l.trim()).map(l => "<li>" + esc(l) + "</li>").join("")}</ul>
    <button onclick="editCard(${i})">Edit</button></div>`).join("");
}

function editCard(i) {
  const c = get(key, defaultCards[key])[i];
  box.children[i].innerHTML = `<input class="t"><textarea class="b"></textarea>
    <button onclick="saveCard(${i})">Save</button><button class="grey" onclick="showCards()">Cancel</button>`;
  box.children[i].querySelector(".t").value = c.title;
  box.children[i].querySelector(".b").value = c.body;
}

function saveCard(i) {
  const cards = get(key, defaultCards[key]);
  cards[i] = { title: box.children[i].querySelector(".t").value, body: box.children[i].querySelector(".b").value };
  set(key, cards);
  showCards();
}

function resetCards() {
  if (confirm("Throw away your edits and go back to the original?")) { localStorage.removeItem(key); showCards(); }
}

if (box) showCards();

// ---------- NOTES ----------
function saveNote() {
  if (!$("note").value.trim()) return;
  set("notes", [...get("notes", []), { text: $("note").value, date: new Date().toLocaleString() }]);
  $("note").value = "";
  showNotes();
}

function deleteNote(i) {
  if (!confirm("Delete this note?")) return;
  const notes = get("notes", []);
  notes.splice(i, 1);
  set("notes", notes);
  showNotes();
}

function showNotes() {
  const notes = get("notes", []);
  $("list").innerHTML = "<h2>Saved notes</h2>" + (notes.length ? "" : "<p>No notes yet.</p>") +
    notes.map((n, i) => `<p><b>${n.date}</b><br>${esc(n.text)}<br>
      <button class="red" onclick="deleteNote(${i})">Delete</button></p><hr>`).join("");
}

if ($("list")) showNotes();

// ---------- WEIGHT ----------
function saveWeight() {
  if (!$("date").value || !$("weight").value) return alert("Enter a date and weight");
  const w = get("weights", []).filter(e => e.date != $("date").value); // same day gets overwritten
  w.push({ date: $("date").value, weight: Number($("weight").value) });
  set("weights", w.sort((a, b) => a.date.localeCompare(b.date)));
  if ($("target").value) set("target", Number($("target").value));
  showWeights();
}

function deleteWeight(date) {
  set("weights", get("weights", []).filter(e => e.date != date));
  showWeights();
}

function showWeights() {
  const w = get("weights", []), t = get("target", 0);
  const diff = w.length ? w[w.length - 1].weight - t : 0;
  $("log").innerHTML = "<h2>Saved weights</h2>" +
    (w.length && t ? `<p>Latest is ${Math.abs(diff).toFixed(1)} kg ${diff > 0 ? "above" : "below"} your target</p>` : "") +
    w.slice().reverse().map(e => `<p>${e.date}: ${e.weight} kg
      <button class="red" onclick="deleteWeight('${e.date}')">Delete</button></p>`).join("");
}

if ($("log")) {
  $("date").value = today();
  $("target").value = get("target", "");
  showWeights();
}
