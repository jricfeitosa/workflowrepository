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

function createContainer(divId, container) {
    const content = document.createElement('div');
    content.id = divId;
    container.appendChild(content);
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
        const div_select_version =  await displayVersionsTitle();
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

function displayArguments(args, container) {
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
    for (var prop in args[0]) {
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
    for (var prop in args[0]) {
      var th = document.createElement("th");
      if (count === 0) {
        th.style.position = 'sticky';
        th.style.left = '0';
        th.style.zIndex = '1';
      }
      th.textContent = prop.toUpperCase();
      line.appendChild(th);
      count++;
    }
    table.appendChild(line);
    for (var i = 0; i < args.length; i++) {
      line = document.createElement("tr");
      count = 0;
      for (var prop in args[i]) {
        var td = document.createElement("td");
        td.textContent = args[i][prop];
        if (count === 0) {
          td.style.position = 'sticky';
          td.style.left = '0';
          td.style.zIndex = '2';
          td.style.backgroundColor = 'rgb(12,235,162)';
        }
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
  }

 async function displayVersionsTitle(title) {
    const div_select_version = document.createElement("div");
    div_select_version.className = 'twelve';
    const h1_select_version = document.createElement("h1");
    h1_select_version.textContent = title;
    div_select_version.appendChild(h1_select_version);
    return div_select_version;
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

 function localStorageContainsImg(keysToKeep) {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (!keysToKeep.includes(key)) {
            return true;
        }
    }
    return false;
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

 function removeItemsFromLocalStorage(keysToKeep) {
    for (let i = 0; i < localStorage.length; i++){
      let key = localStorage.key(i);
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
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

 function simulateClick(element) {
    const eventClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(eventClick);
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

function submitSearch(event) {
    event.preventDefault(); 
    search(token, project);
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