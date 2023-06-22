function resetFields() {
    document.getElementById('projectId').value = '';
    document.getElementById('projectSearch').value = '';
}

async function searchProjects() {
    const token = localStorage.getItem('gitlabToken');
    const projectName = document.getElementById('projectSearch').value;
    if (!projectName) {
        janelaPopUp.abre('Erro', 'Nome do projeto não fornecido!');
    } else {
        document.getElementById('search').style.display = 'none';
        document.querySelector('.loadingio-spinner-3').style.display = 'inline-block';
        try {
            const projects = await fetchAllProjects(token, projectName);
            displayProjects(projects);
            document.getElementById('search').style.display = 'inline-block';
            document.querySelector('.loadingio-spinner-3').style.display = 'none';
        } catch (error) {
            document.getElementById('search').style.display = 'inline-block';
            document.querySelector('.loadingio-spinner-3').style.display = 'none';
            console.error('Erro ao pesquisar projetos:', error);
        }
    }

}

async function fetchAllProjects(token, projectName, page = 1, allProjects = []) {
    const response = await fetch(`https://gitlab.com/api/v4/projects?search=${encodeURIComponent(projectName)}&min_access_level=30&per_page=100&page=${page}`, {
        headers: {
            'PRIVATE-TOKEN': token
        }
    });

    if (response.ok) {
        const projects = await response.json();
        if (projects.length === 0) {
            return allProjects;
        } else {
            allProjects = allProjects.concat(projects);
            return fetchAllProjects(token, projectName, page + 1, allProjects);
        }
    } else {
        document.getElementById('search').style.display = 'inline-block';
        document.querySelector('.loadingio-spinner-3').style.display = 'none';
        throw new Error('Erro ao buscar projetos!');
    }
}

async function verifyProjectId() {
    const token = localStorage.getItem('gitlabToken');
    const projectId = document.getElementById('projectId').value;
    if (!projectId) {
        janelaPopUp.abre('Erro', 'ID do projeto não fornecido!');
    } else {
        document.getElementById('verifyProjectId').style.display = 'none';
        document.querySelector('.loadingio-spinner-2').style.display = 'inline-block';
        try {
            const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}`, {
                headers: {
                    'PRIVATE-TOKEN': token
                }
            });
    
            if (response.ok) {
                const project = await response.json();
                document.getElementById('verifyProjectId').style.display = 'inline-block';
                document.querySelector('.loadingio-spinner-2').style.display = 'none';
                if (project.permissions.group_access.access_level >= 0) {
                    localStorage.setItem('projectId', project.id); // Salvar o ID do projeto no armazenamento local para uso posterior
                    window.location.href = 'PesquisarWorkflow.html';
                } else {
                    janelaPopUp.abre('Erro', 'Você não tem a permissão necessária para acessar este projeto!');
                }
            } else {
                document.getElementById('verifyProjectId').style.display = 'inline-block';
                document.querySelector('.loadingio-spinner-2').style.display = 'none';
                janelaPopUp.abre('Erro', 'Nenhum projeto encontrado com o ID fornecido!');
            }
        } catch (error) {
            document.getElementById('verifyProjectId').style.display = 'inline-block';
            document.querySelector('.loadingio-spinner-2').style.display = 'none';
            console.error('Erro ao verificar o ID do projeto:', error);
        }
    }
}

function displayProjects(projects) {
    const projectResults = document.getElementById('projectResults');
    projectResults.innerHTML = '';
    projectResults.style.display = 'block';
    if (projects.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum resultado encontrado';
        li.classList.add('no-results');
        projectResults.appendChild(li);
    } else {
        document.getElementById('results').style.display = 'block';
        projects.forEach(project => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = `${project.name} (ID: ${project.id})`;
            li.addEventListener('click', () => {
				localStorage.setItem('projectId', project.id); // Salvar o ID do projeto no armazenamento local para uso posterior
				window.location.href = 'PesquisarWorkflow.html';
            });
            li.appendChild(span);
            projectResults.appendChild(li);
        });
    }

    // Após a criação dos elementos 'li', calcular a largura máxima.
    let maxWidth = 0;
    let listItems = projectResults.querySelectorAll('span');
    listItems.forEach(item => {
        const width = item.getBoundingClientRect().width;
        if (width > maxWidth) {
            maxWidth = width;
        }
    });

    if (maxWidth < document.getElementById('projectResults').getBoundingClientRect().width) {
        if (document.getElementById('projectResults').getBoundingClientRect().width < 400){
            maxWidth = 400;
        } else {
            maxWidth = document.getElementById('projectResults').getBoundingClientRect().width;
        }
    }

    // Aplicar a largura máxima a todos os elementos 'li'.
    listItems = projectResults.querySelectorAll('li');
    listItems.forEach(item => {
        item.style.width = `${maxWidth}px`;
    });
}

function hideTitle() {
  document.querySelector('h1').classList.add('hidden');
}

function buttonActionComplete() {
    document.querySelector('.loadingio-spinner-1').style.display = 'none';
    document.getElementById('authenticate').style.display = 'inline-block';
    const button = document.getElementById('authenticate');
    button.innerHTML = 'Authenticate';
}

function removeItemsFromLocalStorage(keysToKeep) {
    for (let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        }
    }
}
  
function localStorageContainsImg(keysToKeep) {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (!keysToKeep.includes(key)) {
            return true;
        }
    }
    return false;
}

document.addEventListener('DOMContentLoaded', function() {

    // Lista das chaves que você quer manter
    let keysToKeep = ["authenticated", "gitlabToken"];

    while (localStorageContainsImg(keysToKeep)) {
        removeItemsFromLocalStorage(keysToKeep);
    }


    const radioIdProjeto = document.getElementById('radioIdProjeto');
    const radioPesquisarProjeto = document.getElementById('radioPesquisarProjeto');
    const idProjetoDiv = document.getElementById('idProjeto');
    const pesquisarProjetoDiv = document.getElementById('pesquisarProjeto');

    function updateDivs() {
        if (radioIdProjeto.checked) {
        idProjetoDiv.classList.remove('hidden');
        pesquisarProjetoDiv.classList.add('hidden');
        } else if (radioPesquisarProjeto.checked) {
        idProjetoDiv.classList.add('hidden');
        pesquisarProjetoDiv.classList.remove('hidden');
        }
    }

    radioIdProjeto.addEventListener('change', updateDivs);
    radioPesquisarProjeto.addEventListener('change', updateDivs);

    updateDivs();
});

document.getElementById('logoutButton').onclick = function(event) {
    localStorage.clear();
    location.reload();
    window.location.href = '../index.html';
}

document.getElementById('search').addEventListener('click', searchProjects);

document.getElementById('verifyProjectId').addEventListener('click', verifyProjectId);

resetFields();

var janelaPopUp = new Object();
janelaPopUp.abre = function(titulo, textoEnviar){
  id = "errorPopup";
  var popFundo = '<div id="popFundo_errorPopup" class="popUpFundo red red red red "></div>'
  var janela = '<div id="errorPopup" class="popUp p red   "><h1>'+titulo+'</h1><div><span>'+textoEnviar+'</span></div><button class="puCancelar alert " id="errorPopup_cancelar" data-parent=errorPopup>OK</button></div>';
  $("body").append(popFundo);
  $("body").append(janela);
  $("body").append(popFundo);
  $("#popFundo_" + id).fadeIn("fast");
  $("#" + id).addClass("popUpEntrada");
  $("#" + id + '_cancelar').on("click", function(){
    janelaPopUp.fecha(id);
  });
};

janelaPopUp.fecha = function(id){
    if(id !== undefined){
      $("#" + id).removeClass("popUpEntrada").addClass("popUpSaida"); 
      $("#popFundo_" + id).fadeOut(1000, function(){
          $("#popFundo_" + id).remove();
          $("#" + $(this).attr("id") + ", #" + id).remove();
          if (!($(".popUp")[0])){
              $("window, body").css('overflow', 'auto');
          }
      });
    }
    else{
      $(".popUp").removeClass("popUpEntrada").addClass("popUpSaida"); 
      $(".popUpFundo").fadeOut(1000, function(){
          $(".popUpFundo").remove();
          $(".popUp").remove();
          $("window, body").css('overflow', 'auto');
      });
    }
}