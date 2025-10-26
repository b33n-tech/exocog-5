// --- Elements ---
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const archiveBtn = document.getElementById("archiveBtn");
const tasksContainer = document.getElementById("tasksContainer");
const promptsContainer = document.getElementById("promptsContainer");
const copiedMsg = document.getElementById("copiedMsg");
const pasteDownloadBtn = document.getElementById("pasteDownloadBtn");
const llmSelect = document.getElementById("llmSelect");
const clearBtn = document.getElementById("clearBtn");

// Section modules
const jalonsList = document.getElementById("jalonsList");
const messagesTableBody = document.getElementById("messagesTableBody");
const rdvList = document.getElementById("rdvList");
const livrablesList = document.getElementById("livrablesList");
const generateMailBtn = document.getElementById("generateMailBtn");
const mailPromptSelect = document.getElementById("mailPromptSelect");
const generateLivrableBtn = document.getElementById("generateLivrableBtn");
const livrablePromptSelect = document.getElementById("livrablePromptSelect");

// --- Stockage tâches ---
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// --- Format date ---
function formatDate(iso){
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2,'0');
  const month = String(d.getMonth()+1).padStart(2,'0');
  const hours = String(d.getHours()).padStart(2,'0');
  const minutes = String(d.getMinutes()).padStart(2,'0');
  return `${day}/${month} ${hours}:${minutes}`;
}

// --- Render tâches ---
function renderTasks() {
  tasksContainer.innerHTML = "";
  tasks.slice().sort((a,b)=> new Date(a.date)-new Date(b.date))
    .forEach((task,i)=>{
      const li = document.createElement("li");
      li.className="task-item";

      const taskText = document.createElement("div");
      taskText.className="task-text";
      taskText.textContent=task.text+" (ajoutée le "+task.date.split("T")[0]+")";
      taskText.style.cursor="pointer";

      if(task.comments?.length){
        taskText.title = task.comments.map(c=>`• ${c.text} (${formatDate(c.date)})`).join("\n");
      }

      const commentBlock = document.createElement("div");
      commentBlock.className="comment-section";
      commentBlock.style.display="none";

      const commentList = document.createElement("ul");
      commentList.className="comment-list";
      if(task.comments?.length){
        task.comments.forEach(c=>{
          const cLi = document.createElement("li");
          cLi.textContent=`[${formatDate(c.date)}] ${c.text}`;
          commentList.appendChild(cLi);
        });
      }
      commentBlock.appendChild(commentList);

      const commentInputDiv = document.createElement("div");
      commentInputDiv.className="comment-input";
      const commentInput = document.createElement("input");
      commentInput.placeholder="Ajouter un commentaire…";
      const commentBtn = document.createElement("button");
      commentBtn.textContent="+";
      commentBtn.addEventListener("click", ()=>{
        const val = commentInput.value.trim();
        if(val!==""){
          if(!task.comments) task.comments=[];
          task.comments.push({text:val,date:new Date().toISOString()});
          localStorage.setItem("tasks",JSON.stringify(tasks));
          commentInput.value="";
          renderTasks();
        }
      });
      commentInputDiv.appendChild(commentInput);
      commentInputDiv.appendChild(commentBtn);
      commentBlock.appendChild(commentInputDiv);

      li.appendChild(taskText);
      li.appendChild(commentBlock);

      taskText.addEventListener("click", ()=>{
        commentBlock.style.display=commentBlock.style.display==="none"?"flex":"none";
      });

      tasksContainer.appendChild(li);
    });
  renderModules();
}

// --- Ajouter tâche ---
addBtn.addEventListener("click", ()=>{
  const text = taskInput.value.trim();
  if(text!==""){
    tasks.push({text,date:new Date().toISOString(),comments:[]});
    localStorage.setItem("tasks",JSON.stringify(tasks));
    taskInput.value="";
    renderTasks();
  }
});

// --- Nettoyer toutes les tâches ---
clearBtn.addEventListener("click", ()=>{
  if(confirm("Es-tu sûr ? Cette action est irréversible !")){
    tasks=[];
    localStorage.removeItem("tasks");
    renderTasks();
    alert("✅ Toutes les tâches ont été supprimées.");
  }
});

// --- Export JSON ---
archiveBtn.addEventListener("click", ()=>{
  if(tasks.length===0){ alert("Aucune tâche à archiver !"); return; }
  const blob = new Blob([JSON.stringify(tasks,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download=`taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- Coller JSON & télécharger ---
pasteDownloadBtn.addEventListener("click", async ()=>{
  try{
    let raw = await navigator.clipboard.readText();
    raw = raw.trim();
    if(raw.startsWith("```")) raw = raw.replace(/^```[\w]*|```$/g,"").trim();
    const data = JSON.parse(raw);

    if(Array.isArray(data)){
      data.forEach(item=>{
        if(item.text && item.date){
          if(!item.comments) item.comments=[];
          item.comments = item.comments.map(c=>typeof c==='string'?{text:c,date:new Date().toISOString()}:c);
          tasks.push({text:item.text,date:item.date,comments:item.comments});
        }
      });
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    alert("✅ JSON collé et téléchargé !");
  }catch(err){
    console.error(err);
    alert("❌ JSON invalide ou presse-papier vide !");
  }
});

// --- Prompts généraux ---
const prompts = [
  {id:"planifier", label:"Plan", text:"Transforme ces tâches en plan structuré étape par étape :"},
  {id:"prioriser", label:"Priorité", text:"Classe ces tâches par ordre de priorité et urgence :"},
  {id:"categoriser", label:"Catégories", text:"Range ces tâches dans des catégories logiques :"}
];

prompts.forEach(p=>{
  const btn = document.createElement("button");
  btn.textContent=p.label;
  btn.addEventListener("click", ()=>{
    const combined = p.text + "\n\n" + tasks.map(t=>{
      let str="- "+t.text;
      if(t.comments?.length){
        str+="\n  Commentaires :\n" + t.comments.map(c=>`    - [${formatDate(c.date)}] ${c.text}`).join("\n");
      }
      return str;
    }).join("\n");
    navigator.clipboard.writeText(combined).then(()=>{
      copiedMsg.style.display="block";
      setTimeout(()=>copiedMsg.style.display="none",2000);
      window.open(llmSelect.value,"_blank");
    });
  });
  promptsContainer.appendChild(btn);
});

// --- Modules (Stack2) ---
function renderModules(){
  // Reset
  jalonsList.innerHTML="";
  messagesTableBody.innerHTML="";
  rdvList.innerHTML="";
  livrablesList.innerHTML="";

  tasks.forEach((t)=>{
    // Jalons simplifiés : task + comments
    const liJ = document.createElement("li");
    liJ.textContent=t.text;
    jalonsList.appendChild(liJ);

    // Messages simulés
    if(t.text.toLowerCase().includes("message")){
      const tr = document.createElement("tr");
      const cb = document.createElement("input"); cb.type="checkbox"; cb.checked=false;
      const tdCheck=document.createElement("td"); tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);
      tr.appendChild(document.createElement("td")).textContent="destinataire@example.com";
      tr.appendChild(document.createElement("td")).textContent=t.text;
      tr.appendChild(document.createElement("td")).textContent="Contenu du message";
      messagesTableBody.appendChild(tr);
    }

    // RDV simulés
    if(t.text.toLowerCase().includes("rdv")){
      const liR = document.createElement("li");
      liR.textContent=t.text;
      rdvList.appendChild(liR);
    }

    // Livrables simulés
    if(t.text.toLowerCase().includes("livrable")){
      const liL = document.createElement("li");
      const cb=document.createElement("input"); cb.type="checkbox";
      liL.appendChild(cb);
      liL.appendChild(document.createTextNode(" "+t.text));
      livrablesList.appendChild(liL);
    }
  });
}

// --- Push messages ---
generateMailBtn.addEventListener("click", ()=>{
  const selected = Array.from(messagesTableBody.querySelectorAll("input[type=checkbox]"))
    .filter(cb=>cb.checked)
    .map(cb=>cb.closest("tr"));
  if(selected.length===0){ alert("Coche au moins un message !"); return; }
  const prompt = mailPromptSelect.value==="1"?"Écris un email professionnel clair et concis pour :":"Écris un email amical et léger pour :";
  const content = selected.map(tr=>{
    return `À: ${tr.children[1].textContent}\nSujet: ${tr.children[2].textContent}\nMessage: ${tr.children[3].textContent}`;
  }).join("\n\n");
  navigator.clipboard.writeText(prompt+"\n\n"+content).then(()=>alert("✅ Copié dans le presse-papier"));
  window.open(llmSelect.value,"_blank");
});

// --- Push livrables ---
generateLivrableBtn.addEventListener("click", ()=>{
  const selected = Array.from(livrablesList.querySelectorAll("input[type=checkbox]"))
    .filter(cb=>cb.checked)
    .map(cb=>cb.closest("li"));
  if(selected.length===0){ alert("Coche au moins un livrable !"); return; }
  const promptMap={"1":"Génère un plan détaillé pour :","2":"Génère un résumé exécutif pour :","3":"Génère une checklist rapide pour :"};
  const prompt = promptMap[livrablePromptSelect.value];
  const content = selected.map(li=>li.textContent.trim()).join("\n\n");
  navigator.clipboard.writeText(prompt+"\n\n"+content).then(()=>alert("✅ Copié dans le presse-papier"));
  window.open(llmSelect.value,"_blank");
});

// --- Initial render ---
renderTasks();
