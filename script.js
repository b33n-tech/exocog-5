// --- Tâches + commentaires ---
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksContainer = document.getElementById("tasksContainer");
const clearBtn = document.getElementById("clearBtn");
const archiveBtn = document.getElementById("archiveBtn");
const llmSelect = document.getElementById("llmSelect");
const promptsContainer = document.getElementById("promptsContainer");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function formatDate(iso){ const d = new Date(iso); return d.toLocaleString(); }

function renderTasks(){
  tasksContainer.innerHTML="";
  tasks.forEach((task,i)=>{
    const li=document.createElement("li");
    li.className="task-item";

    // Texte tâche
    const taskText=document.createElement("div");
    taskText.textContent = task.text + " ("+formatDate(task.date)+")";
    taskText.style.cursor="pointer";

    // Bloc commentaire
    const commentBlock=document.createElement("div");
    commentBlock.className="comment-section";
    commentBlock.style.display="none";

    const commentList=document.createElement("ul");
    commentList.className="comment-list";
    if(task.comments?.length){
      task.comments.forEach(c=>{
        const cLi=document.createElement("li");
        cLi.textContent=`[${formatDate(c.date)}] ${c.text}`;
        commentList.appendChild(cLi);
      });
    }
    commentBlock.appendChild(commentList);

    const commentInputDiv=document.createElement("div");
    commentInputDiv.className="comment-input";
    const commentInput=document.createElement("input");
    commentInput.placeholder="Ajouter un commentaire…";
    const commentBtn=document.createElement("button");
    commentBtn.textContent="+";

    commentBtn.addEventListener("click", (e)=>{
      e.stopPropagation(); // <-- IMPORTANT pour ne pas fermer le bloc
      const val=commentInput.value.trim();
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

    taskText.addEventListener("click", ()=>{
      commentBlock.style.display = commentBlock.style.display==="none"?"flex":"none";
    });

    li.appendChild(taskText);
    li.appendChild(commentBlock);
    tasksContainer.appendChild(li);
  });
}

// --- Ajouter tâche ---
addBtn.addEventListener("click", ()=>{
  const text=taskInput.value.trim();
  if(text!==""){
    tasks.push({text,date:new Date().toISOString(),comments:[]});
    localStorage.setItem("tasks",JSON.stringify(tasks));
    taskInput.value="";
    renderTasks();
  }
});

// --- Nettoyer / Archiver ---
clearBtn.addEventListener("click", ()=>{
  if(confirm("Es-tu sûr ? Cette action est irréversible !")){
    tasks=[]; localStorage.removeItem("tasks"); renderTasks();
  }
});

archiveBtn.addEventListener("click", ()=>{
  if(tasks.length===0){ alert("Aucune tâche !"); return; }
  const blob = new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url;
  a.download=`taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

// --- Section prompts ---
const promptList=[
  {id:"planifier",label:"Plan",text:"Transforme ces tâches en plan structuré étape par étape :"},
  {id:"prioriser",label:"Priorité",text:"Classe ces tâches par ordre de priorité et urgence :"},
  {id:"categoriser",label:"Catégories",text:"Range ces tâches dans des catégories logiques :"}
];

promptsContainer.innerHTML=""; // Reset
promptList.forEach(p=>{
  const btn=document.createElement("button");
  btn.textContent=p.label;
  btn.addEventListener("click", ()=>{
    let combined=p.text + "\n\n" + tasks.map(t=>{
      let str="- "+t.text;
      if(t.comments?.length){
        str+="\n  Commentaires :\n"+t.comments.map(c=>`    - [${formatDate(c.date)}] ${c.text}`).join("\n");
      }
      return str;
    }).join("\n");
    navigator.clipboard.writeText(combined).then(()=>{
      window.open(llmSelect.value,"_blank");
      alert("✅ Prompt + tâches copiés, LLM ouvert !");
    });
  });
  promptsContainer.appendChild(btn);
});

// --- Initial render ---
renderTasks();
