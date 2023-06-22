const token = localStorage.getItem('gitlabToken');
const project = localStorage.getItem('projectId');

createMenuFromGitLab(token, project, parentPath = '', document.getElementById('menuContainer'));

// Adiciona um manipulador de eventos 'click' ao botão de redefinição
document.getElementById('resetButton').addEventListener('click', () => {
  removeChildElements(document.getElementById('menuContainer'));
  createMenuFromGitLab(token, project, parentPath = '', document.getElementById('menuContainer'));
});

document.getElementById('searchForm').addEventListener('submit', submitSearch);

async function getGitLabPaths(token, projectId, path = '', page = 1) {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/tree${path ? `?path=${path}` : '?path='}&per_page=100&page=${page}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const paths = data.map(item => item.path);

      // Verifica se há mais páginas e realiza chamadas recursivas
      if (response.headers.get('X-Next-Page')) {
        const nextPage = parseInt(response.headers.get('X-Next-Page'));
        const nextPaths = await getGitLabPaths(token, projectId, path, nextPage);
        return paths.concat(nextPaths);
      } else {
        return paths;
      }
    } else {
      janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter os resultados da busca no GitLab. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
      console.error(`Erro ao buscar caminhos do GitLab: ${response.status}`);
      return [];
    }
  } catch (error) {
    janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter os resultados da busca no GitLab. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
    console.error(error);
  }
}

async function searchGitLab(token, projectId, searchTerm, timeout = 60000) {
  const results = [];
  let currentPage = 1;
  const perPage = 100;
  const startTime = Date.now();

  while (true) {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= timeout) {
      console.warn("Tempo limite de pesquisa atingido");
      break;
    }
    try {
      const url = `https://gitlab.com/api/v4/projects/${projectId}/search?scope=blobs&search=${encodeURIComponent(searchTerm)}&page=${currentPage}&per_page=${perPage}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        let data = await response.json();
        data = data.map(item => item.path);
        const pattern = new RegExp(`\\b${searchTerm}\\b`, 'i');
        const filteredPath = data.filter(string => (pattern.test(string)) && !(string.includes('/.')) && !(string.includes('README.md')) && !(string === 'IMAGES') && !(string.includes('IMAGES/')));
        // Adiciona os resultados desta página aos resultados totais
        results.push(...filteredPath);

        // Verifica se há mais páginas de resultados
        const totalPages = parseInt(response.headers.get('X-Total-Pages'));
        if (currentPage < totalPages) {
          currentPage++;
        } else {
          break;
        }
      } else {
        janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter os resultados da busca no Gitlab. Por favor, verifique se possui permissão para obtê-los ou se há algum problema na sua conexão com a internet.');
        console.error(`Erro ao buscar resultados do GitLab: ${response.status}`);
        break;
      }
    } catch(error) {
      janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter os resultados da busca no Gitlab. Por favor, verifique se possui permissão para obtê-los ou se há algum problema na sua conexão com a internet.');
      console.error(error);
    }
  }
  return results;
}

function createWorkflowInfoContainer(token, project, fullPath) {
  getTags(token, project, fullPath, async function(error, tags, fullPath) {
    if (error) {
      console.error('Erro ao buscar tags:', error);
    } else {
      tags = sortedTags(tags);
      document.getElementById("file-infos").innerHTML = "";
      const fileInfos = document.getElementById("file-infos");
      fileInfos.style.opacity = 1;
      createLoadingElement(fileInfos);
      const loader = fileInfos.querySelector('.imagem-degrade');
      const loadingTitle = fileInfos.querySelector('.loadingTitle');
      loadingTitle.style.display = 'block';
      loader.style.display = 'block';
      const div_title = await displayWorkflowTitle(fullPath);
      const div_select_version =  await displayVersionsTitle('Selecione uma versão');
      const ul = await displayVersions(token, project, tags, fullPath);
      setTimeout(() => {
        loadingTitle.style.display = 'none';
        loader.style.display = 'none';
        createContainer('contents', document.getElementById("file-infos"));
        createContainer('versions', document.getElementById("contents"));
        document.getElementById("file-infos").insertBefore(div_title, document.getElementById("contents"));
        document.getElementById("versions").appendChild(div_select_version);
        document.getElementById("versions").appendChild(ul);
        window.scrollBy({
          top: 200,
          behavior: 'smooth'
        });
      }, 1000);
    }
  }); 
}

function createLoadingElement(parentElement) {
  const loading = document.createElement('div');
  loading.className = 'loading';
  const imageDegrade = document.createElement('div');
  imageDegrade.className = 'imagem-degrade';
  imageDegrade.style.display = 'none';
  loading.appendChild(imageDegrade);
  const loadingTitle = document.createElement('div');
  loadingTitle.className = 'loadingTitle';
  loadingTitle.style.display = 'none';
  loading.appendChild(loadingTitle);
  const loadingText = document.createElement('span');
  loadingText.className = 'carregando-texto';
  loadingText.textContent = 'Loading';
  loadingTitle.appendChild(loadingText);
  const points = document.createElement('span');
  points.className = 'pontos';
  loadingTitle.appendChild(points);
  let point = document.createElement('span');
  point.className = 'ponto';
  point.textContent = '.';
  points.appendChild(point);
  point = document.createElement('span');
  point.className = 'ponto';
  point.textContent = '.';
  points.appendChild(point);
  point = document.createElement('span');
  point.className = 'ponto';
  point.textContent = '.';
  points.appendChild(point);
  parentElement.appendChild(loading);
}

function toggleMenu(element) {
  var hasUlChild = false;
  for (var i = 0; i < element.children.length; i++) {
    var child = element.children[i];
    if (child.tagName === 'UL') {
      hasUlChild = true;
      break;
    }
  }
  return hasUlChild;
}

function removeFirstUl(element) {
  for (var i = 0; i < element.children.length; i++) {
    var child = element.children[i];
    if (child.tagName === 'UL') {
      const table = document.querySelector('#menuContainer ul');
      const liElements = child.querySelectorAll("li");
      const liCount = liElements.length;
      const firstUlElement = document.getElementById("menuContainer").firstElementChild;
      
      if (child === firstUlElement) {
        child.style.maxHeight = child.style.maxHeight === `350px` ? '0px' : `350px`;
      } else {
        const ancestrorsUl = getAllparentUl(child);
        if (child.style.maxHeight === `${liCount * 40}px`) {
          child.style.maxHeight = '0px';
          ancestrorsUl.forEach((elementoUl) => {
            elementoUl.style.maxHeight = (Number(elementoUl.style.maxHeight.split('px')[0]) - (liCount * 40)).toString + 'px';
          });
        } else {
          child.style.maxHeight = `${liCount * 40}px`;
          ancestrorsUl.forEach((elementoUl) => {
            elementoUl.style.maxHeight = (Number(elementoUl.style.maxHeight.split('px')[0]) + (liCount * 40)).toString + 'px';
          });
        }
      }
      
      setTimeout(() => {
        child.remove();
      }, 500);
      break;
    }
  }
}

async function createMenuFromGitLab(token, projectId, parentPath = '', parentContainer, paddingLabel) {
  const parentLoader = document.getElementById('menuContainer');
  const loader = parentLoader.querySelector('.imagem-degrade');
  const loadingTitle = parentLoader.querySelector('.loadingTitle');
  if (parentPath === '') {
    loadingTitle.style.display = 'block';
    loader.style.display = 'block';
  }
  let paths = await getGitLabPaths(token, projectId, parentPath);
  results = sortPaths(paths);
  paths = paths.filter(item => {return !(item.includes('/.')) && !(item.includes('README.md')) && !(item === 'IMAGES') && !(item.includes('IMAGES/'));});
  const menu = createMenu(paths, Number(parentContainer.className) + 1, token, projectId, paddingLabel);
  if (parentPath === '') {
    loadingTitle.style.display = 'none';
    loader.style.display = 'none';
  }
  parentContainer.appendChild(menu);
  const liElements = menu.querySelectorAll("li");
  const liCount = liElements.length;
  const firstUlElement = document.getElementById("menuContainer").firstElementChild;
  setTimeout(() => {
    menu.classList.add("visible");
    if (menu === firstUlElement) {
      menu.style.maxHeight = "350px";
    } else {
      menu.style.maxHeight = `${liCount * 40}px`;
      const ancestrorsUl = getAllparentUl(menu);
      ancestrorsUl.forEach((elementoUl) => {
        elementoUl.style.maxHeight = (Number(elementoUl.style.maxHeight.split('px')[0]) + (liCount * 40)) + 'px';
      });
    }
  },500);
  setTimeout(() => {
    const table = document.querySelector('#menuContainer ul');
    table.style.overflow = 'auto';
  },500);
}

function getAllparentUl(currentUlElement) {
  let ancestral = currentUlElement.parentElement;
  const ancestrorsUl = [];

  while (ancestral && ancestral.tagName !== 'DIV') {
    if (ancestral.tagName === 'UL') {
      ancestrorsUl.push(ancestral);
    }
    ancestral = ancestral.parentNode;
  }
  // Remova o último elemento da lista (o "mais pai")
  ancestrorsUl.pop();
  return ancestrorsUl;
}

function createMenu(tree, level, token, project, paddingLabel) {
  const ul = document.createElement('ul');
  ul.classList.add(level);
  if (level === 1) {
    ul.style.display = 'grid';
  } else {
    ul.style.display = 'block';
  }
  ul.classList.add('nested-ul');
  const stringToSearch = "ulmenu";
  const elements = document.querySelectorAll(`[id*="${stringToSearch}"]`);
  let maxNumber = 0;
  elements.forEach(element => {
      const id = element.id;
      const number = parseInt(id.replace(stringToSearch + "-", ""));
      if (number > maxNumber) {
          maxNumber = number;
      }
  });
  ul.id = `ulmenu-${maxNumber + 1}`;
  let index = 1;
  for (const key in tree) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const span = document.createElement('span');
    a.href = '#';
    const id = `${level}_${index}`;
    li.id = id;
    a.id = id;				
    li.classList.add(index);
    a.className = index;
    a.classList.add('left-list');
    const label = document.createElement('label');
    label.style.paddingLeft = `${paddingLabel}px`;
    newPath = tree[key];
    li.setAttribute('data-path', newPath);
    a.setAttribute('data-path', newPath);
    if (newPath.includes(".xaml") || newPath.includes(".zip")) {
      insertSvgIcon(label, 'file', a, 12, 14);
    } else {
      insertSvgIcon(label, 'arrow', a, 12, 12);
      insertSvgIcon(label, 'closed-folder', a, 12, 12);
    }
    a.appendChild(span);
    li.appendChild(a);
    ul.appendChild(li);
    span.textContent = tree[key].split("/")[tree[key].split("/").length - 1];
    a.onclick = async function(e) {
      let currentElement = e.target;
      if (e.target.tagName !== 'a') {
        while (currentElement && currentElement.tagName !== 'A') {
          currentElement = currentElement.parentElement;
        }
      } else {
        currentElement = e.target;
      }
      e.preventDefault();
      const path = currentElement.getAttribute('data-path');
      if (!(path.includes(".xaml") || path.includes(".zip"))) {
        currentElement.style.backgroundColor = currentElement.style.backgroundColor === 'rgb(76, 5, 5)' ? 'rgb(34, 31, 31)' : 'rgb(76, 5, 5)';
        let arrowElement = currentElement.querySelector("#arrow");
        arrowElement.classList.toggle("arrow-down");
        toggleSvgIconOnLink('closed-folder', 'open-folder', currentElement);
      }
      const hasUlChild = toggleMenu(currentElement.parentNode);
      if (hasUlChild) {
        removeFirstUl(currentElement.parentNode);
      } else {
        if (path.includes(".xaml") || path.includes(".zip")) {
          const fullPath = this.getAttribute('data-path');
          const fileInfos = document.getElementById("file-infos");
          fileInfos.style.opacity = 0;
          document.getElementById("file-infos").innerHTML = "";
          createWorkflowInfoContainer(token, project, fullPath);
        } else {
          let currentLabel = currentElement.querySelector("label");
          paddingLabel = Number(window.getComputedStyle(currentLabel).getPropertyValue('padding-left').split('px')[0]) + 16;
          await createMenuFromGitLab(token, project, path, currentElement.parentNode, paddingLabel);
        }
      }
    };
    index++;
  }
  return ul;
}

function insertSvgIcon(label, idIcone, elementLink, width, height) {
  const svgIconsContainer = document.getElementById('svg-icons');

  const icone = svgIconsContainer.querySelector(`#${idIcone}`);
  if (!icone) {
    console.error(`Ícone "${idIcone}" não encontrado no arquivo SVG`);
    return;
  }

  // Remover a transformação original e ajustar a posição do ícone
  icone.removeAttribute('transform');
  const iconeClone = icone.cloneNode(true);
  iconeClone.setAttribute('transform', 'translate(0, 0)');

  // Criar um novo elemento SVG e definir seus atributos
  const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newSvg.setAttribute('width', `${width}`);
  newSvg.setAttribute('height', `${height}`);
  newSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  newSvg.style.paddingRight = '5px';
  newSvg.appendChild(iconeClone);
  label.appendChild(newSvg);
  label.style.paddingRight = '5px';

  // Inserir o ícone SVG dentro do elemento <a>
  elementLink.appendChild(label);
}

function toggleSvgIconOnLink(iconId1, iconId2, linkElement) {
  const svgIconsContainer = document.getElementById('svg-icons');

  // Get the existing label element inside the <a> element
  const existingLabel = linkElement.querySelector('label');

  let idList = [];

  for (var i = 0; i < existingLabel.children.length; i++) {
    var child = existingLabel.children[i];
    if (child.tagName === 'svg') {
      idList.push(child.firstChild.id);
    }
  }

  const newIconId = idList.includes(iconId1) ? iconId2 : iconId1;
  const currentIconId = idList.includes(iconId1) ? iconId1 : iconId2;

  const newIcon = svgIconsContainer.querySelector(`#${newIconId}`);
  if (!newIcon) {
    console.error(`Icon "${newIconId}" not found in the SVG file`);
    return;
  }
  // Remove the original transformation and adjust the position of the new icon
  newIcon.removeAttribute('transform');
  const newIconClone = newIcon.cloneNode(true);
  newIconClone.setAttribute('transform', 'translate(0, 0)');

  for (var i = 0; i < existingLabel.children.length; i++) {
    var child = existingLabel.children[i];
    if (child.tagName === 'svg' && child.firstChild.id === currentIconId) {
      existingLabel.removeChild(child);
    }
  }

  const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newSvg.setAttribute('width', '12');
  newSvg.setAttribute('height', '12');
  newSvg.setAttribute('viewBox', '0 0 12 12');
  newSvg.style.paddingRight = '5px';
  newSvg.appendChild(newIconClone);

  existingLabel.appendChild(newSvg);
}

function displayArguments(arguments, container) {
  const content = document.createElement('div');
  content.id = 'arguments-field';
  const div_title = document.createElement('div');
  div_title.className = 'eight';
  const title = document.createElement('h1');
  title.id = 'description';
  title.textContent = 'Arguments';
  var container_table = document.createElement('div');
  container_table.id = 'container-table';
  var table = document.createElement("table");
  var column = document.createElement("colgroup");
  var thead = document.createElement("thead");
  var head = document.createElement("tr");
  var count = 0;
  for (var prop in arguments[0]) {
    var col = document.createElement("col");
    if (count === 3) {
      col.style.minWidth = '200px';
    }
    column.appendChild(col);
    count++;
  }
  table.appendChild(column);
  var line = document.createElement("tr");
  count = 0;
  for (var prop in arguments[0]) {
    var th = document.createElement("th");
    th.textContent = prop.toUpperCase();
    line.appendChild(th);
    count++;
  }
  table.appendChild(line);
  for (var i = 0; i < arguments.length; i++) {
    line = document.createElement("tr");
    count = 0;
    for (var prop in arguments[i]) {
      var td = document.createElement("td");
      td.textContent = arguments[i][prop];
      line.appendChild(td);
      count++;
    }
    table.appendChild(line);
  }
  div_title.appendChild(title);
  content.appendChild(div_title);
  container_table.appendChild(table);
  content.appendChild(container_table);
  container.appendChild(content);
}

function displayDescription(description, container) {
  const content = document.createElement('div');
  content.id = 'description-field';
  const div_title = document.createElement('div');
  div_title.className = 'eight';
  const title = document.createElement('h1');
  title.id = 'description';
  title.textContent = 'Description';
  const textArea = document.createElement('p');
  textArea.id = 'textDescription';
  textArea.textContent = description;
  div_title.appendChild(title);
  content.appendChild(div_title);
  content.appendChild(textArea);
  container.appendChild(content);
}

function createContainer(divId, container) {
  const content = document.createElement('div');
  content.id = divId;
  container.appendChild(content);
}

async function displayWorkflowTitle(fullPath) {
  const fullName = fullPath.split('/')[fullPath.split('/').length - 1];
  const div_title = document.createElement("div");
  div_title.className = 'seven';
  const h1_title = document.createElement("h1");
  h1_title.textContent = fullName;
  h1_title.id = 'workflow-name';
  div_title.appendChild(h1_title);
  return div_title;
}

async function displayVersionsTitle(title) {
  const div_select_version = document.createElement("div");
  div_select_version.className = 'twelve';
  const h1_select_version = document.createElement("h1");
  h1_select_version.textContent = title;
  div_select_version.appendChild(h1_select_version);
  return div_select_version;
}

async function displayVersions(token, project, tags, fullPath) {
  const ul = document.createElement("ul");
  ul.id = 'list-tags';
  for (const tag of tags) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = '#';
    a.textContent = `Versão: ${tag.name}`;
    li.id = 'tags-name';
    li.setAttribute("target-number", tag.target);
    a.setAttribute("target-number", tag.target);
    li.setAttribute("tag-name", fullPath);
    a.setAttribute("tag-name", `${fullPath}-${tag.name}`);
    li.appendChild(a);
    ul.appendChild(li);
    a.onclick = function(event) {
      if (document.getElementById("description-args")) {
        document.getElementById("contents").removeChild(document.getElementById("description-args"));
      }
      createContainer('description-args', document.getElementById("contents"));
      document.getElementById('description-args').style.width = '80%';
      createLoadingElement(document.getElementById('description-args'));
      const parentLoader = document.getElementById('description-args');
      const loader = parentLoader.querySelector('.imagem-degrade');
      const loadingTitle = parentLoader.querySelector('.loadingTitle');
      loadingTitle.style.display = 'block';
      loader.style.display = 'block';
      if (document.getElementById('selected')) {
        let selectedItem = document.getElementById('selected');
        selectedItem.removeAttribute('id');
      }
      let selectedItem = event.target;
      selectedItem.id = 'selected';
      event.preventDefault();
      const targetNumber = this.getAttribute('target-number');
      const tagName = this.getAttribute('tag-name');
      getWorkflowDescription(token, project, targetNumber, tagName, function(error, description) {
        if (error) {
          console.error('Erro ao buscar a descrição:', error);
        } else {
          loadingTitle.style.display = 'none';
          loader.style.display = 'none';
          let parts = description.split(/Descrição:|Argumentos:|%IMAGES%:/).map(part => part.trim());
          let annotation = parts[1];
          let text_arguments = parts[2].split(/\r?\n/);
          text_arguments = text_arguments.filter(function (item) {
            return item.trim() !== "";
          });
          let images = parts[3];
          const arguments = new Array();
          for (const argument of text_arguments) {
            const argument_name = argument.split('-')[0];
            const argument_direction = argument.split('-')[1];
            const argument_type = argument.split('-')[2];
            const argument_description = argument.split('-')[3];
            arguments.push({Name: argument_name, Type: argument_type, direction: argument_direction, description: argument_description});
          }
          const contents = document.getElementById("contents"); 
          contents.style.justifyContent = 'space-between';
          document.getElementById("description-args").style.display = 'none';
          createContainer('div-infos', document.getElementById("description-args"));
          createContainer('info-version', document.getElementById("div-infos"));
          displayDescription(annotation, document.getElementById("info-version"));
          createContainer('info-table', document.getElementById("div-infos"));
          displayArguments(arguments, document.getElementById("info-table"));
          createContainer('info-images', document.getElementById("description-args"));
          displayImages(images, document.getElementById('info-images'));
          createContainer('div-download', document.getElementById("description-args"));
          const content = document.createElement('button');
          content.id = 'download-button';
          content.textContent = 'Download';
          document.getElementById("div-download").appendChild(content);
          document.getElementById("description-args").style.display = 'flex';
		      const downloadButton = document.getElementById('download-button');
		      downloadButton.onclick = () => downloadFile(project, fullPath, targetNumber, token);
          window.scrollBy({
            top: 200,
            behavior: 'smooth'
          });
        }
      });
    };
  }
  return ul;
}

function displayImages(images, container) {
  const div_title = document.createElement('div');
  div_title.className = 'eight';
  const title = document.createElement('h1');
  title.id = 'description';
  title.textContent = 'Images';
  div_title.appendChild(title);
  container.appendChild(div_title);
  container.innerHTML += '<div class="loading"><div class="imagem-degrade" style="display: none;"></div><div class="loadingTitle" style="display: none;"><span class="carregando-texto">Loading</span><span class="pontos"><span class="ponto">.</span><span class="ponto">.</span><span class="ponto">.</span></span></div></div>';
  const loader = container.querySelector('.imagem-degrade');
  const loadingTitle = container.querySelector('.loadingTitle');
  loadingTitle.style.display = 'block';
  loader.style.display = 'block';
  getFilesWithContent(project, images, token)
  .then(files => {
    files.forEach(file => {
      console.log(file.name);
    });
    files = files.filter(item => item.name !== 'README.md');
    console.log(files);
    container.innerHTML += '<div class="viewImage"></div>';
    const viewImageDiv = document.querySelector('.viewImage');
    document.querySelector('.viewImage').innerHTML = '';
    if (files.length > 0) {
      let count = 0;
      files.forEach(file => {
        const currentFileName = file.name;
        let img = document.createElement('img');
        img.src = file.content;  
        const imgDiv = document.createElement('div');
        imgDiv.classList.add('imgDiv');
        imgDiv.id = `imgDiv-${count}`;
        const imgTooltip = document.createElement('div');
        imgTooltip.id = `imgTooltipDiv-${count}`;
        imgTooltip.style.position = 'relative';
        img.classList.add('thumbnail', 'zoomable');
        img.addEventListener('mouseover', function(event) {
          const zoomedImage = document.createElement('img');
          zoomedImage.src = this.src;
          zoomedImage.classList.add('zoomed');
          const divTooltip = event.target.previousElementSibling;
          divTooltip.appendChild(zoomedImage);
          zoomedImage.style.display = 'block';
        });
  
        img.addEventListener('mouseout', function(event) {
          const divTooltip = event.target.previousElementSibling;
          const zoomedImage =divTooltip.querySelector('.zoomed');
          divTooltip.removeChild(zoomedImage);
        });
        img.addEventListener('click', () => displayImage(file.content));
  
        const labelImg = document.createElement('p');
        labelImg.textContent = currentFileName;
        labelImg.classList.add('labelImg');
  
        imgDiv.appendChild(imgTooltip);
        imgDiv.appendChild(img);
        imgDiv.appendChild(labelImg);
        
        viewImageDiv.appendChild(imgDiv);
        count++;
      });
    } else {
      const noImage = document.createElement('p');
      noImage.textContent = 'Sem imagens';
      viewImageDiv.style.justifyContent = 'center';
      viewImageDiv.appendChild(noImage);
    }
    const loader = container.querySelector('.imagem-degrade');
    const loadingTitle = container.querySelector('.loadingTitle');
    loadingTitle.style.display = 'none';
    loader.style.display = 'none';
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function displayImage(url) {
  // Crie o fundo escuro
  const background = document.createElement('div');
  background.classList.add('background');

  // Crie o elemento de imagem para exibir a imagem em tamanho maior
  const img = document.createElement('img');
  img.src = url;
  img.classList.add('displayImage');

  // Crie o botão para fechar a imagem
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.classList.add('closeButton');

  // Função para remover o fundo, a imagem e o botão de fechar
  const removeElements = () => {
    document.body.removeChild(background);
    document.body.removeChild(img);
    document.body.removeChild(closeButton);
  };
  // Adicione ouvintes de evento de clique ao fundo e ao botão de fechar
  background.addEventListener('click', removeElements);
  closeButton.addEventListener('click', removeElements);

  // Adicione o fundo, a imagem e o botão de fechar ao body
  document.body.appendChild(background);
  document.body.appendChild(img);
  document.body.appendChild(closeButton);
  window.scrollTo(0, 0);
}

function getRepositoryFiles(projectId, path, privateToken) {
  let url = `https://gitlab.com/api/v4/projects/${projectId}/repository/tree`;

  if (path) {
    url += `?path=${path}`;
  }

  return fetch(url, {
    method: 'GET',
    headers: {
      'PRIVATE-TOKEN': privateToken,
      'Content-Type': 'application/json'
    },
  })
  .then(response => {
    if (!response.ok) {
      console.error('HTTP error', response.status);
      throw new Error('HTTP error ' + response.status);
    }
    return response.json();
  })
  .then(data => data.filter(item => item.type === 'blob'))  // Filtra os resultados para incluir apenas arquivos
  .catch((error) => {
    console.error('Error:', error);
    return null;  // Retorna nulo se houver um erro
  });
}

function getFilesWithContent(projectId, path, privateToken) {
  return getRepositoryFiles(projectId, path, privateToken)
    .then(files => {
      let fileRequests = files.map(file => {
        let url = `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(file.path)}/raw?ref=main`;

        return fetch(url, {
          method: 'GET',
          headers: {
            'PRIVATE-TOKEN': privateToken
          }
        })
        .then(response => {
          if (!response.ok) {
            console.error('HTTP error', response.status);
            throw new Error('HTTP error ' + response.status);
          }
          return response.blob();  // Obtenha o conteúdo do arquivo como Blob
        })
        .then(blob => {
          return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onloadend = () => resolve({
              id: file.id,
              name: file.name,
              type: file.type,
              path: file.path,
              content: reader.result  // DataURL do conteúdo do arquivo
            });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
      });

      return Promise.all(fileRequests);
    })
    .catch(error => {
      console.error('Error:', error);
      return null;  // Retorna nulo se houver um erro
    });
}

function downloadFile(projectId, filePath, commit, token) {
  try {
    const encodedFilePath = encodeURIComponent(filePath).replace('.', '%2E');
    const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodedFilePath}/raw?ref=${commit}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      if (xhr.status === 200) {
      const blob = new Blob([xhr.response], {type: 'application/octet-stream'});
      const fileName = filePath.split('/').pop();
      const tempLink = document.createElement('a');
      tempLink.href = window.URL.createObjectURL(blob);
      tempLink.download = fileName;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => {
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blob);
          }, 100);
      } else {
        janelaPopUp.abre('Erro', 'Ocorreu um erro no download do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
        console.error('Erro ao fazer a requisição:', xhr.status);
      }
    };
    xhr.send();
  } catch(error) {
    janelaPopUp.abre('Erro', 'Ocorreu um erro no download do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
    console.error(error);
  }
}

function getWorkflowDescription(accessToken, project, targetNumber, tagName, callback) {
  try {
    const url = `https://gitlab.com/api/v4/projects/${project}/repository/tags?search=^${tagName}`;
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          callback(null, response[0].message);
        } else {
          janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter a descrição do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
          console.error('Erro ao buscar tags: ', xhr.statusText);
          callback(xhr.statusText, null);
        }
      }
    };
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(null);
  } catch(error) {
    janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter a descrição do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
    console.error(error);
  }
  
}

function getTags(accessToken, project, fullPath, callback, page = 1) {
  try {
    const url = `https://gitlab.com/api/v4/projects/${project}/repository/tags?search=^${fullPath}&per_page=100&page=${page}`;
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          const tags = JSON.parse(xhr.responseText);

          if (tags.length === 100) {
            getTags(accessToken, project, fullPath, (err, nextPageTags) => {
              if (err) {
                callback(err, null);
              } else {
                callback(null, tags.concat(nextPageTags), fullPath);
              }
            }, page + 1);
          } else {
            callback(null, tags, fullPath);
          }
        } else {
          janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter as versões do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
          console.error('Erro ao buscar tags: ', xhr.statusText);
          callback(xhr.statusText, null);
        }
      }
    };

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(null);
  } catch (error) {
    janelaPopUp.abre('Erro', 'Ocorreu um erro ao obter as versões do arquivo. Por favor, verifique se possui permissão para obtê-lo ou se há algum problema na sua conexão com a internet.');
    console.error(error);
  }
}

function sortedTags(tags) {
  const newList = tags.map(item => {
    return {
      name: item.name.split('-')[1],
      target: item.target
    };
  });
  const sortedList = newList.sort((item1, item2) => {
    return compareVersions(item2.name, item1.name);
  });
  return sortedList;
}

function compareVersions(version1, version2) {
  const parts1 = version1.split('.');
  const parts2 = version2.split('.');
  for (let i = 0; i < parts1.length; i++) {
    const num1 = parseInt(parts1[i], 10);
    const num2 = parseInt(parts2[i], 10);
    if (num1 < num2) {
      return -1;
    } else if (num1 > num2) {
      return 1;
    }
  }
  return 0;
}

// Função para calcular a cor com base no nível e no número total de níveis
function calculateColor(level) {
  if(level % 2 == 0) {
    return `rgb(42,42,42)`;
  } else {
    return `rgba(42,42,42,0.7)`;
  }
}

function sortPaths(paths) {
  return paths.sort((a, b) => {
      // Split the paths into their components
      const partsA = a.split("/");
      const partsB = b.split("/");

      // Compare the parts one by one
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
          // Extract the numbers from the parts
          const numberA = parseInt(partsA[i].match(/\d+/g));
          const numberB = parseInt(partsB[i].match(/\d+/g));

          // Compare the numbers
          if (numberA < numberB) return -1;
          if (numberA > numberB) return 1;

          // If the numbers are equal, compare the strings
          const stringCompare = partsA[i].localeCompare(partsB[i]);
          if (stringCompare !== 0) return stringCompare;
      }

      // If all parts are equal, the shorter path comes first
      return partsA.length - partsB.length;
  });
}

async function search(token, projectId) {
  const searchTerm = document.getElementById("searchInput").value;
  const searchResults = document.getElementById("searchResults");
  const ulElement = searchResults.querySelector('ul');
  if (ulElement) {
      ulElement.remove();
  }
  const parenteLoader = document.getElementById('searchResults');
  const loader = parenteLoader.querySelector('.imagem-degrade');
  const loadingTitle = parenteLoader.querySelector('.loadingTitle');
  const noResult = document.getElementById("noResult");
  noResult.style.display = 'none';
  loadingTitle.style.display = 'block';
  loader.style.display = 'block';
  let results = await searchGitLab(token, projectId, searchTerm);
  results = sortPaths(results);
  const resultsList = await processResults(results);
  loadingTitle.style.display = 'none';
  loader.style.display = 'none';
  searchResults.appendChild(resultsList);
}

async function processResults(results) {
  const noResult = document.getElementById("noResult");
  setTimeout(() => {noResult.style.display = results.length === 0 ? 'block' : 'none';}, 1000);
  const resultsList = document.createElement("ul");
  resultsList.style.display = 'grid';
  results.forEach(path => {
    const listItem = document.createElement("li");
    const breadcrumb = createBreadcrumb(path);
    listItem.appendChild(breadcrumb);
    listItem.setAttribute("data-path", path);
    listItem.addEventListener('click', function(event) {
      const fullPath = listItem.getAttribute('data-path');
      const fileInfos = document.getElementById("file-infos");
      fileInfos.style.opacity = 0;
      document.getElementById("file-infos").innerHTML = "";
      if (event.target.textContent.includes(".xaml") || event.target.textContent.includes(".zip")) {
        createWorkflowInfoContainer(token, project, fullPath);
      } else {
        simulateClickPath(listItem.getAttribute('data-path'), event.target.textContent);
      }
    }); 
    resultsList.appendChild(listItem);
  }); 
  const itens = resultsList.getElementsByTagName('li');
  for (const item of itens) {
    item.addEventListener('click', function(event) {
      for (const anotherItem of itens) {
        anotherItem.classList.remove('selectedUl');
        const listA = anotherItem.querySelectorAll('a');
        if (listA) {
          for (const currentA of listA) {
            currentA.classList.remove('selectedUl');
            currentA.classList.remove('active');
          }
        }
      }
      item.classList.add('selectedUl');
      const listA = item.querySelectorAll('a');
      if (listA) {
        for (const currentA of listA) {
          currentA.classList.add('selectedUl');
          currentA.classList.add('active');
          if (!(event.target.textContent.includes(".xaml")) && !(event.target.textContent.includes(".zip"))) {
            if (currentA.textContent === event.target.textContent) {
              break;
            }
          }
        }
      }
    });
  }
  return resultsList;
}

async function simulateClickPath(path, item) {
  const listPath = path.split('/');
  const resetButton = document.getElementById('resetButton');
  let currentId = 1;
  simulateClick(resetButton);
  let fullCurrentPath = "";
  for (currentPath of listPath) {
    fullCurrentPath = `${fullCurrentPath}${currentPath}`;
    const currentUl = await waitForElementVisible(`ulmenu-${currentId}`);
    const currentLi = encontrarLiComDataPath(currentUl, fullCurrentPath);
    simulateClick(currentLi.querySelector('a'));
    if (currentPath === item) {
      break;
    }
    fullCurrentPath = `${fullCurrentPath}/`;
    currentId++;
  }
}

function waitForElementVisible(id) {
  return new Promise(resolve => {
      const intervalId = setInterval(() => {
          const element = document.querySelector(`#${id}`);
          if (element) {
            clearInterval(intervalId);
            setTimeout(() => {
              resolve(element);
            }, 1000);
          }
      }, 100);
  });
}

async function clickAllTabs(currentUl, currentPath) {
  let nextUl = encontrarLiComDataPath(currentUl, currentPath);
  simulateClick(nextUl.querySelector('a'));
  setTimeout(() => {
    nextUl = nextUl.querySelector('ul');
  }, 1500);
  return nextUl;
}

function simulateClick(element) {
  const eventClick = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  element.dispatchEvent(eventClick);
}

function encontrarLiComDataPath(lista, valor) {
  const items = lista.getElementsByTagName('li');
  for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const dataPath = item.getAttribute('data-path');

      if (dataPath === valor) {
          return item;
      }
  }
  return null;
}

function createBreadcrumb(path) {
  const pathParts = path.split('/');
  const breadcrumb = document.createElement('div');
  breadcrumb.classList.add('breadcrumb', 'flat');

  pathParts.forEach((part, index) => {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = part;
    breadcrumb.appendChild(link);
  });
  return breadcrumb;
}

function hasVerticalScroll() {
  return document.documentElement.scrollHeight > window.innerHeight;
}

function adjustMarginTop(elementTarget, container) {
  const title = document.querySelector(elementTarget);
  const style = window.getComputedStyle(title);
  const content = document.querySelector(container);
  const titleHeight = parseInt(style.marginTop.split('px')[0]) + parseInt(style.height.split('px')[0]) + parseInt(style.marginBottom.split('px')[0]);
  content.style.marginTop = titleHeight + 'px';
}

function removeChildElements(element) {
  const div = document.getElementById('menuContainer');

  // Seleciona todos os elementos filhos da div
  const children = div.children;

  // Itera sobre os elementos filhos e remove aqueles que não possuem a classe 'loading'
  for (let i = children.length - 1; i >= 0; i--) {
    if (!children[i].classList.contains('loading')) {
      div.removeChild(children[i]);
    }
  }
}

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

function submitSearch(event) {
  event.preventDefault(); 
  search(token, project);
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

document.addEventListener('DOMContentLoaded', (event) => {
  // Lista das chaves que você quer manter
  let keysToKeep = ["authenticated", "gitlabToken", "projectId"];

  while (localStorageContainsImg(keysToKeep)) {
    removeItemsFromLocalStorage(keysToKeep);
  }
});